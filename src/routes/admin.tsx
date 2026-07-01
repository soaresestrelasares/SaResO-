import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Users, Video, Flag, CheckCircle, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const ADMIN_USERNAME = "soaresestrelasares";

function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isAdmin = user?.username === ADMIN_USERNAME;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.getAdminStats(),
    enabled: isAdmin,
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => api.getAdminReports(),
    enabled: isAdmin,
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => api.resolveReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-white">
        <p>Inicia sessão para continuar.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center text-white gap-4">
        <AlertTriangle className="w-12 h-12 text-yellow-400" />
        <h1 className="text-xl font-bold">Acesso Negado</h1>
        <p className="text-gray-400 text-sm">Não tens permissão para aceder a esta página.</p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="text-blue-400 font-semibold text-sm"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  const pendingReports = reports.filter((r) => !r.resolved);
  const resolvedReports = reports.filter((r) => r.resolved);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white max-w-[480px] mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <button onClick={() => navigate({ to: "/" })}>
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </button>
        <h1 className="text-xl font-bold">Painel de Administração</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Estatísticas
          </h2>
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#111827] rounded-2xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-gray-400">Utilizadores</span>
                </div>
                <p className="text-2xl font-bold">{stats?.userCount ?? 0}</p>
              </div>
              <div className="bg-[#111827] rounded-2xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-gray-400">Vídeos</span>
                </div>
                <p className="text-2xl font-bold">{stats?.videoCount ?? 0}</p>
              </div>
              <div className="bg-[#111827] rounded-2xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Flag className="w-5 h-5 text-red-400" />
                  <span className="text-xs text-gray-400">Denúncias Pendentes</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.pendingReports ?? 0}</p>
              </div>
              <div className="bg-[#111827] rounded-2xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-xs text-gray-400">Total Denúncias</span>
                </div>
                <p className="text-2xl font-bold">{stats?.reportCount ?? 0}</p>
              </div>
            </div>
          )}
        </section>

        {/* Pending Reports */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Denúncias Pendentes ({pendingReports.length})
          </h2>
          {reportsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pendingReports.length === 0 ? (
            <div className="bg-[#111827] rounded-2xl p-6 border border-gray-800 text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Sem denúncias pendentes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-[#111827] rounded-2xl p-4 border border-red-500/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Flag className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-red-400 uppercase">
                          {report.contentType}
                        </span>
                        <span className="text-xs text-gray-500">#{report.contentId}</span>
                      </div>
                      <p className="text-sm text-white mb-1 line-clamp-2">{report.reason}</p>
                      <p className="text-xs text-gray-500">
                        Por @{report.reporterUsername} ·{" "}
                        {new Date(report.createdAt).toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                    <button
                      onClick={() => resolveMutation.mutate(report.id)}
                      disabled={resolveMutation.isPending}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs text-green-400 font-semibold px-3 py-1.5 rounded-lg border border-green-400/30 hover:bg-green-400/10 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Resolver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Resolved Reports */}
        {resolvedReports.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Denúncias Resolvidas ({resolvedReports.length})
            </h2>
            <div className="space-y-2">
              {resolvedReports.slice(0, 5).map((report) => (
                <div
                  key={report.id}
                  className="bg-[#111827] rounded-xl p-3 border border-gray-800 opacity-60"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    <span className="text-xs text-gray-400 uppercase">{report.contentType}</span>
                    <span className="text-xs text-gray-600 flex-1 truncate">{report.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
