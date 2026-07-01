import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api.js";
import { useAuth } from "@/lib/auth-context.js";
import { Button } from "@/components/ui/button.js";
import { Card } from "@/components/ui/card.js";
import { Badge } from "@/components/ui/badge.js";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  Globe,
  Calendar,
  Crown,
  AlertCircle,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/company/$id")({
  component: RouteComponent,
});

function formatDate(date: string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("pt-PT");
}

function daysLeft(date: string | null) {
  if (!date) return 0;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function RouteComponent() {
  const { id } = Route.useParams();
  const companyId = parseInt(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => api.getCompany(companyId),
  });

  const checkout = useMutation({
    mutationFn: (plan: "company_month" | "company_annual") =>
      api.createCheckout(plan, undefined, companyId),
    onSuccess: (data) => {
      if (data.demo) {
        toast.info("Pagamentos em demonstração. Stripe ainda não configurado.");
      } else if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const verify = useMutation({
    mutationFn: () =>
      api.verifyCompany(companyId, { legalDocUrl, taxId: company?.taxId || undefined }),
    onSuccess: () => {
      toast.success("Documentos submetidos para verificação.");
      setShowVerify(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const [showVerify, setShowVerify] = useState(false);
  const [legalDocUrl, setLegalDocUrl] = useState("");

  const isOwner = user?.id === company?.ownerId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        A carregar...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Empresa não encontrada
      </div>
    );
  }

  const statusConfig = {
    trial: {
      label: "Período experimental",
      color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    },
    active: {
      label: "Subscrição ativa",
      color: "bg-green-500/20 text-green-300 border-green-500/40",
    },
    expired: {
      label: "Subscrição expirada",
      color: "bg-red-500/20 text-red-300 border-red-500/40",
    },
  };

  const cfg = statusConfig[company.subscriptionStatus];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/90 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/jobs" })}
          className="p-2 -ml-2 hover:bg-gray-900 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold truncate">{company.name}</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Card principal */}
        <Card className="bg-gray-900 border-gray-800 p-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-2xl font-black shrink-0">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                company.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{company.name}</h2>
              {company.industry && (
                <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                  <Building2 className="w-3.5 h-3.5" /> {company.industry}
                </p>
              )}
              {company.location && (
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {company.location}
                </p>
              )}
            </div>
          </div>

          <Badge className={`${cfg.color} border`}>{cfg.label}</Badge>
          {company.verificationStatus === "verified" && (
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verificada
            </Badge>
          )}
          {company.verificationStatus === "pending" && (
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 flex items-center gap-1">
              <FileCheck className="w-3 h-3" /> Verificação pendente
            </Badge>
          )}
          {company.verificationStatus === "rejected" && (
            <Badge className="bg-red-500/20 text-red-300 border-red-500/40 flex items-center gap-1">
              Verificação rejeitada
            </Badge>
          )}

          {company.description && (
            <p className="text-sm text-gray-300 leading-relaxed">{company.description}</p>
          )}

          {company.website && (
            <a
              href={
                company.website.startsWith("http") ? company.website : `https://${company.website}`
              }
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-400 flex items-center gap-1 hover:underline"
            >
              <Globe className="w-3.5 h-3.5" /> {company.website}
            </a>
          )}

          <div className="pt-2 border-t border-gray-800 flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            Criada em {formatDate(company.createdAt)}
          </div>
        </Card>

        {/* Estado da subscrição */}
        <Card className="bg-gray-900 border-gray-800 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold">Subscrição da empresa</h3>
          </div>

          {company.subscriptionStatus === "trial" && (
            <>
              <p className="text-sm text-gray-300">
                Ainda estás no período experimental de 3 meses.
              </p>
              <div className="text-2xl font-bold text-yellow-400">
                {daysLeft(company.trialEndsAt)} dias restantes
              </div>
              <p className="text-xs text-gray-400">Termina a {formatDate(company.trialEndsAt)}</p>
            </>
          )}

          {company.subscriptionStatus === "active" && (
            <>
              <p className="text-sm text-gray-300">
                Plano ativo:{" "}
                <span className="font-semibold text-white capitalize">
                  {company.subscriptionPlan}
                </span>
              </p>
              <p className="text-sm text-gray-400">
                Renova a {formatDate(company.subscriptionEndsAt)}
              </p>
            </>
          )}

          {company.subscriptionStatus === "expired" && (
            <div className="flex items-start gap-2 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>A subscrição expirou. As vagas publicadas deixaram de ser visíveis.</span>
            </div>
          )}

          {isOwner && company.subscriptionStatus !== "active" && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={() => checkout.mutate("company_month")}
                disabled={checkout.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                10,99€/mês
              </Button>
              <Button
                onClick={() => checkout.mutate("company_annual")}
                disabled={checkout.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                89€/ano
              </Button>
            </div>
          )}

          {isOwner && company.subscriptionStatus === "active" && (
            <p className="text-sm text-green-400">✓ Empresa ativa — podes publicar vagas.</p>
          )}
        </Card>

        {/* Verificação legal */}
        {isOwner && company.verificationStatus !== "verified" && (
          <Card className="bg-gray-900 border-gray-800 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold">Verificação legal</h3>
            </div>
            <p className="text-sm text-gray-300">
              Envia um documento legal (certidão permanente, registo comercial) para validarmos a
              tua empresa.
            </p>
            {!showVerify ? (
              <Button
                onClick={() => setShowVerify(true)}
                variant="outline"
                className="w-full border-blue-500 text-blue-400 hover:bg-blue-500/10"
              >
                Submeter documentos
              </Button>
            ) : (
              <div className="space-y-3">
                <input
                  type="url"
                  value={legalDocUrl}
                  onChange={(e) => setLegalDocUrl(e.target.value)}
                  placeholder="Link do documento legal (PDF/imagem)"
                  className="w-full bg-black text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => verify.mutate()}
                    disabled={verify.isPending || !legalDocUrl}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Submeter
                  </Button>
                  <Button
                    onClick={() => setShowVerify(false)}
                    variant="outline"
                    className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Vagas publicadas */}
        <Card className="bg-gray-900 border-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold">Vagas</h3>
            </div>
            {isOwner && company.isActive && (
              <Link to="/jobs/post" search={{ companyId: company.id.toString() }}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  + Nova
                </Button>
              </Link>
            )}
          </div>

          {company.jobs && company.jobs.length > 0 ? (
            <div className="space-y-3">
              {company.jobs.map((job) => (
                <Link key={job.id} to="/jobs/$id" params={{ id: String(job.id) }}>
                  <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 hover:border-blue-500/50 transition">
                    <h4 className="font-semibold text-sm">{job.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{job.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{job.type}</span>
                      {job.location && <span>• {job.location}</span>}
                      <span>• {job.applicationsCount} candidaturas</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Ainda não há vagas publicadas.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
