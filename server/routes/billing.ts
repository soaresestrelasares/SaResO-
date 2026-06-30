import { Router } from "express";
import Stripe from "stripe";
import { getDb } from "../db.js";
import { users, payments, subscriptions, creatorSubscribers, notifications } from "../schema.js";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const billingRouter = Router();

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL || "https://sareso.onrender.com";

// Preços em cêntimos
const PLANS = {
  premium_creator: { amount: 699, label: "SaResO Premium Criador" },
  creator_subscriber: { amount: 299, label: "Subscrição de Criador" },
};

function getStripe(): Stripe {
  if (!STRIPE_SECRET) throw new Error("STRIPE_SECRET_KEY não configurado.");
  return new Stripe(STRIPE_SECRET);
}

// POST /api/billing/checkout — criar sessão de pagamento Stripe
billingRouter.post("/checkout", authMiddleware, async (req: AuthRequest, res) => {
  const { plan, creatorId } = req.body as { plan: string; creatorId?: number };

  if (plan !== "premium_creator" && plan !== "creator_subscriber") {
    res.status(400).json({ error: "Plano inválido." });
    return;
  }
  if (plan === "creator_subscriber" && !creatorId) {
    res.status(400).json({ error: "creatorId obrigatório para subscrição de criador." });
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
  if (!user) { res.status(404).json({ error: "Utilizador não encontrado." }); return; }

  const planInfo = PLANS[plan as keyof typeof PLANS];

  // Criar produto/preço no Stripe dinamicamente
  const price = await stripe.prices.create({
    currency: "eur",
    unit_amount: planInfo.amount,
    recurring: { interval: "month" },
    product_data: { name: planInfo.label },
  });

  const metadata: Record<string, string> = {
    userId: String(req.userId!),
    plan,
  };
  if (creatorId) metadata["creatorId"] = String(creatorId);

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
      const subId = typeof session.subscription === "string" ? session.subscription : null;
      const periodEnd = subId
        ? (() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return stripe.subscriptions.retrieve(subId).then((s: any) => new Date(s.current_period_end * 1000));
          })()
        : Promise.resolve(null);
      const resolvedPeriodEnd = await periodEnd;

      if (plan === "premium_creator") {
        // Ativar badge premium
        const expiresAt = resolvedPeriodEnd ?? new Date(now.getTime() + 30 * 86400000);
        await db
          .insert(subscriptions)
          .values({ userId, expiresAt, active: 1 })
          .onDuplicateKeyUpdate({ set: { expiresAt, active: 1 } });
      } else if (plan === "creator_subscriber" && creatorId) {
        // Ativar subscrição de criador
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

      if (plan === "premium_creator") {
        await db.update(subscriptions).set({ active: 0 }).where(eq(subscriptions.userId, userId));
      } else if (plan === "creator_subscriber" && creatorId) {
        await db
          .delete(creatorSubscribers)
          .where(sql`subscriber_id = ${userId} AND creator_id = ${creatorId}`);
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
