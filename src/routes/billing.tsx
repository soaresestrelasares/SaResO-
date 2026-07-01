import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { Crown, Star, ArrowLeft, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
});

function BillingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: status } = useQuery({
    queryKey: ["billingStatus"],
    queryFn: () => api.getBillingStatus(),
    enabled: !!user,
  });

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) => api.createCheckout(plan),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
      else if (data.demo)
        alert("Pagamentos em modo de demonstração — Stripe não está configurado ainda.");
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center text-white p-6">
        <p className="mb-4">Precisas de ter sessão iniciada.</p>
        <button
          onClick={() => navigate({ to: "/login" })}
          className="bg-blue-600 px-6 py-2 rounded-xl"
        >
          Entrar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <button
          onClick={() => navigate({ to: "/settings" })}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Planos SaResO</h1>
      </div>

      <div className="p-5 space-y-4 max-w-md mx-auto">
        {/* Plano Premium Criador — 6,99€ */}
        <div className="rounded-2xl border-2 border-orange-500 bg-gradient-to-br from-orange-950/40 to-gray-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-6 h-6 text-orange-400" fill="currentColor" />
            <h2 className="text-lg font-bold text-orange-400">Premium Criador</h2>
          </div>
          <p className="text-3xl font-black text-white mb-1">
            6,99€<span className="text-base font-normal text-gray-400">/mês</span>
          </p>
          <ul className="space-y-2 mt-4 mb-5 text-sm text-gray-300">
            {[
              "Badge laranja ★ em todo o perfil e vídeos",
              "Subscritores fiéis na tua página",
              "Candidaturas em destaque no topo",
              "Vídeos até 5 minutos",
              "Estatísticas avançadas do perfil",
              "Mensagens prioritárias na caixa",
              "Perfil em primeiro nos resultados de pesquisa",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
          {status?.isPremiumCreator ? (
            <div className="w-full bg-orange-900/40 border border-orange-500 rounded-xl py-3 text-center text-orange-400 font-semibold text-sm">
              ✓ Plano ativo até{" "}
              {status.expiresAt ? new Date(status.expiresAt).toLocaleDateString("pt-PT") : "—"}
            </div>
          ) : (
            <button
              onClick={() => checkoutMutation.mutate("premium_creator")}
              disabled={checkoutMutation.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {checkoutMutation.isPending ? "A redirecionar..." : "Tornar-me Premium →"}
            </button>
          )}
        </div>

        {/* Plano Subscritor — 2,99€ */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900/60 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-blue-400">Subscritor de Criador</h2>
          </div>
          <p className="text-3xl font-black text-white mb-1">
            2,99€<span className="text-base font-normal text-gray-400">/mês</span>
          </p>
          <ul className="space-y-2 mt-4 mb-5 text-sm text-gray-300">
            {[
              "Apoia diretamente o criador que escolhes",
              "Apareces na lista de subscritores do perfil",
              "Notificações de todos os vídeos novos",
              "Apoia a plataforma SaResO",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 text-center">
            Este plano é ativado ao clicar "Subscrever" no perfil de um criador Premium.
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 pt-2">
          Pagamento seguro via Stripe · Cancela quando quiseres
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
