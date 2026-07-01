import { Router } from "express";
import Stripe from "stripe";
import { getDb } from "../db.js";
import {
  users,
  payments,
  subscriptions,
  creatorSubscribers,
  notifications,
  companies,
} from "../schema.js";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const billingRouter = Router();

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL || "https://sareso.onrender.com";

// Preços em cêntimos
const PLANS = {
  premium_creator: { amount: 699, label: "SaResO Premium Criador", interval: "month" },
  creator_subscriber: { amount: 299, label: "Subscrição de Criador", interval: "month" },
  company_month: { amount: 1099, label: "SaResO Empresa Mensal", interval: "month" },
  company_annual: { amount: 8900, label: "SaResO Empresa Anual", interval: "year" },
};

function getStripe(): Stripe {
  if (!STRIPE_SECRET) throw new Error("STRIPE_SECRET_KEY não configurado.");
  return new Stripe(STRIPE_SECRET);
}

// POST /api/billing/checkout — criar sessão de pagamento Stripe
billingRouter.post("/checkout", authMiddleware, async (req: AuthRequest, res) => {
  const { plan, creatorId, companyId } = req.body as {
    plan: string;
    creatorId?: number;
    companyId?: number;
  };

  const validPlans = ["premium_creator", "creator_subscriber", "company_month", "company_annual"];
  if (!validPlans.includes(plan)) {
    res.status(400).json({ error: "Plano inválido." });
    return;
  }
  if (plan === "creator_subscriber" && !creatorId) {
    res.status(400).json({ error: "creatorId obrigatório para subscrição de criador." });
    return;
  }
  if ((plan === "company_month" || plan === "company_annual") && !companyId) {
    res.status(400).json({ error: "companyId obrigatório para subscrição de empresa." });
    return;
  }

  if (!STRIPE_SECRET) {
    // Modo demonstração — sem Stripe configurado
    res.status(503).json({
      error: "Pagamentos não estão ativos ainda. Aguarda a ativação do Stripe.",
      demo: true,
    });
    return;
  }

  const db = getDb();
  const stripe = getStripe();
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
  if (!user) {
    res.status(404).json({ error: "Utilizador não encontrado." });
    return;
  }

  // Se for empresa, verificar se o utilizador é o dono
  if (companyId) {
    const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
    if (!company || Number(company.ownerId) !== req.userId!) {
      res.status(403).json({ error: "Sem permissão para gerir esta empresa." });
      return;
    }
  }

  const planInfo = PLANS[plan as keyof typeof PLANS];

  // Criar produto/preço no Stripe dinamicamente
  const price = await stripe.prices.create({
    currency: "eur",
    unit_amount: planInfo.amount,
    recurring: { interval: planInfo.interval as Stripe.PriceCreateParams.Recurring.Interval },
    product_data: { name: planInfo.label },
  });

  const metadata: Record<string, string> = {
    userId: String(req.userId!),
    plan,
  };
  if (creatorId) metadata["creatorId"] = String(creatorId);
  if (companyId) metadata["companyId"] = String(companyId);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: user.email,
    line_items: [{ price: price.id, quantity: 1 }],
    metadata,
    success_url: `${APP_URL}/#/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/#/billing/cancel`,
  });

  // Registar pagamento pendente
  await db.insert(payments).values({
    userId: req.userId!,
    plan,
    targetCreatorId: creatorId ?? null,
    targetCompanyId: companyId ?? null,
    amount: planInfo.amount,
    status: "pending",
  });

  res.json({ url: session.url, sessionId: session.id });
});

// POST /api/billing/webhook — eventos Stripe (subscription created/deleted)
billingRouter.post(
  "/webhook",
  // Raw body necessário para verificar assinatura Stripe
  async (req, res) => {
    if (!STRIPE_SECRET || !STRIPE_WEBHOOK_SECRET) {
      res.json({ received: true });
      return;
    }
    const stripe = getStripe();
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, STRIPE_WEBHOOK_SECRET);
    } catch {
      res.status(400).json({ error: "Webhook signature invalid" });
      return;
    }

    const db = getDb();
    const now = new Date();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata ?? {};
      const userId = parseInt(meta["userId"] ?? "0");
      const plan = meta["plan"] ?? "";
      const creatorId = meta["creatorId"] ? parseInt(meta["creatorId"]) : null;
      const companyId = meta["companyId"] ? parseInt(meta["companyId"]) : null;
      const subId = typeof session.subscription === "string" ? session.subscription : null;
      const periodEnd = subId
        ? stripe.subscriptions.retrieve(subId).then((s) => {
            const items = (s as unknown as { items?: { data?: { current_period_end?: number }[] } })
              .items;
            const ts = items?.data?.[0]?.current_period_end;
            return ts ? new Date(ts * 1000) : null;
          })
        : Promise.resolve(null);
      const resolvedPeriodEnd = await periodEnd;
      const now = new Date();

      if (plan === "premium_creator") {
        const expiresAt = resolvedPeriodEnd ?? new Date(now.getTime() + 30 * 86400000);
        await db
          .insert(subscriptions)
          .values({ userId, expiresAt, active: 1 })
          .onDuplicateKeyUpdate({ set: { expiresAt, active: 1 } });
      } else if (plan === "creator_subscriber" && creatorId) {
        const [existing] = await db
          .select()
          .from(creatorSubscribers)
          .where(sql`subscriber_id = ${userId} AND creator_id = ${creatorId}`)
          .limit(1);
        if (!existing) {
          await db.insert(creatorSubscribers).values({ subscriberId: userId, creatorId });
          await db.insert(notifications).values({
            userId: creatorId,
            actorId: userId,
            type: "subscribe",
            entityId: userId,
          });
        }
      } else if ((plan === "company_month" || plan === "company_annual") && companyId) {
        const planDuration = plan === "company_annual" ? 365 : 30;
        const subscriptionEndsAt =
          resolvedPeriodEnd ?? new Date(now.getTime() + planDuration * 86400000);
        await db
          .update(companies)
          .set({
            subscriptionStatus: "active",
            subscriptionPlan: plan === "company_annual" ? "annual" : "month",
            subscriptionEndsAt,
            stripeSubscriptionId: subId ?? "",
          })
          .where(eq(companies.id, companyId));
      }

      // Atualizar registo de pagamento
      await db
        .update(payments)
        .set({
          stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
          stripeSubscriptionId: subId,
          status: "active",
          currentPeriodEnd: resolvedPeriodEnd,
        })
        .where(sql`user_id = ${userId} AND plan = ${plan} AND status = 'pending'`);
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const meta = sub.metadata ?? {};
      const userId = parseInt(meta["userId"] ?? "0");
      const plan = meta["plan"] ?? "";
      const creatorId = meta["creatorId"] ? parseInt(meta["creatorId"]) : null;
      const companyId = meta["companyId"] ? parseInt(meta["companyId"]) : null;

      if (plan === "premium_creator") {
        await db.update(subscriptions).set({ active: 0 }).where(eq(subscriptions.userId, userId));
      } else if (plan === "creator_subscriber" && creatorId) {
        await db
          .delete(creatorSubscribers)
          .where(sql`subscriber_id = ${userId} AND creator_id = ${creatorId}`);
      } else if ((plan === "company_month" || plan === "company_annual") && companyId) {
        await db
          .update(companies)
          .set({ subscriptionStatus: "expired" })
          .where(eq(companies.id, companyId));
      }
      await db
        .update(payments)
        .set({ status: "cancelled" })
        .where(sql`stripe_subscription_id = ${sub.id}`);
    }

    res.json({ received: true });
  },
);

// GET /api/billing/status — estado atual do plano do utilizador
billingRouter.get("/status", authMiddleware, async (req: AuthRequest, res) => {
  const db = getDb();
  const now = new Date();
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, req.userId!))
    .limit(1);
  const isPremiumCreator = !!(sub && sub.active && new Date(sub.expiresAt) > now);
  const [payment] = await db
    .select()
    .from(payments)
    .where(sql`user_id = ${req.userId!} AND status = 'active'`)
    .limit(1);
  res.json({
    isPremiumCreator,
    expiresAt: sub?.expiresAt ?? null,
    stripeManaged: !!payment?.stripeSubscriptionId,
  });
});
