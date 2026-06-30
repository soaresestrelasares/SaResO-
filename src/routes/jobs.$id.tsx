import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, MapPin, Building2, ExternalLink, Users } from "lucide-react";

export const Route = createFileRoute("/jobs/$id")({
  component: JobDetailPage,
});

const JOB_TYPE_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  remote: "Remoto",
  internship: "Estágio",
};

function JobDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coverLetter, setCoverLetter] = useState("");
  const [showApply, setShowApply] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: () => api.getJob(parseInt(id as string)),
  });

  const applyMutation = useMutation({
    mutationFn: () => api.applyToJob(parseInt(id as string), coverLetter),
    onSuccess: () => setSuccess(true),
    onError: (e: Error) => setError(e.message),
  });

  if (isLoading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!job)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Vaga não encontrada
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white max-w-[480px] mx-auto pb-28">
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <button onClick={() => navigate({ to: "/jobs" })}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold truncate">Detalhe da Vaga</h1>
      </div>

      <div className="p-4 space-y-5">
        <div className="flex gap-4 items-start">
          <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.companyName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-8 h-8 text-gray-500" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight">{job.title}</h2>
            <p className="text-blue-400 font-medium mt-0.5">{job.companyName}</p>
            {job.companyLocation && (
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.companyLocation}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs bg-blue-900/50 text-blue-300 border border-blue-800/60">
            {JOB_TYPE_LABELS[job.type] || job.type}
          </span>
          {job.location && (
            <span className="px-3 py-1.5 rounded-full text-xs bg-gray-800 text-gray-300">
              <MapPin className="w-3 h-3 inline mr-1" />
              {job.location}
            </span>
          )}
          {job.salary && (
            <span className="px-3 py-1.5 rounded-full text-xs bg-green-900/50 text-green-300 border border-green-800/60">
              {job.salary}
            </span>
          )}
          <span className="px-3 py-1.5 rounded-full text-xs bg-gray-800 text-gray-400">
            <Users className="w-3 h-3 inline mr-1" />
            {job.applicationsCount} candidatos
          </span>
        </div>

        <div>
          <h3 className="font-semibold text-base mb-2">Descrição</h3>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {job.description}
          </p>
        </div>

        {job.requirements && (
          <div>
            <h3 className="font-semibold text-base mb-2">Requisitos</h3>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {job.requirements}
            </p>
          </div>
        )}

        {job.companyWebsite && (
          <a
            href={job.companyWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Website da empresa
          </a>
        )}

        {!user && (
          <Link
            to="/login"
            className="block w-full text-center py-3.5 rounded-xl font-bold text-white"
            style={{ background: "linear-gradient(135deg,#1E90FF,#0047AB)" }}
          >
            Inicia sessão para te candidatar
          </Link>
        )}

        {user && !job.applied && !success && !showApply && (
          <button
            onClick={() => setShowApply(true)}
            className="w-full py-3.5 rounded-xl font-bold text-white"
            style={{ background: "linear-gradient(135deg,#1E90FF,#0047AB)" }}
          >
            Candidatar-me
          </button>
        )}

        {user && showApply && !success && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold">Carta de Motivação</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Apresenta-te e explica porque és o candidato ideal..."
              rows={6}
              className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-600 text-sm resize-none"
            />
            {error && <p className="text-red-400 text-sm p-3 bg-red-900/20 rounded-xl">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setShowApply(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-gray-400 border border-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
                className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#1E90FF,#0047AB)" }}
              >
                {applyMutation.isPending ? "A enviar..." : "Enviar"}
              </button>
            </div>
          </div>
        )}

        {(job.applied || success) && (
          <div className="p-4 bg-green-900/30 border border-green-800/60 rounded-xl text-center">
            <p className="text-green-400 font-semibold">Candidatura enviada!</p>
            <p className="text-gray-400 text-sm mt-1">A empresa irá contactar-te em breve.</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
