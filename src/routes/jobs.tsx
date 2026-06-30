import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth-context";
import { SaResoLogoIconLight } from "@/components/SaResoLogo";
import { Briefcase, MapPin, Search, Plus, Building2, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/jobs")({
  component: JobsPage,
});

const JOB_TYPES = ["", "full-time", "part-time", "remote", "internship"];
const JOB_TYPE_LABELS: Record<string, string> = {
  "": "Todos",
  "full-time": "Full-time",
  "part-time": "Part-time",
  remote: "Remoto",
  internship: "Estágio",
};
const TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-blue-100 text-blue-700",
  "part-time": "bg-purple-100 text-purple-700",
  remote: "bg-green-100 text-green-700",
  internship: "bg-orange-100 text-orange-700",
};

function JobsPage() {
  const { user } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState({ keyword: "", location: "", type: "" });

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs", search],
    queryFn: () =>
      api.getJobs({
        keyword: search.keyword || undefined,
        location: search.location || undefined,
        type: search.type || undefined,
      }),
  });

  const formatDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 86400000) return "Hoje";
    if (diff < 172800000) return "Ontem";
    return `${Math.floor(diff / 86400000)}d atrás`;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 max-w-[480px] mx-auto pb-20">
      <div className="bg-white border-b border-slate-200 px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SaResoLogoIconLight size={32} className="rounded-lg" />
            <h1 className="text-xl font-bold text-slate-900">Emprego SaResO</h1>
          </div>
          {user && (
            <Link
              to="/company/new"
              className="flex items-center gap-1.5 text-blue-600 text-sm font-medium"
            >
              <Building2 className="w-4 h-4" /> Criar empresa
            </Link>
          )}
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cargo, palavra-chave..."
              className="w-full bg-slate-50 text-slate-900 rounded-xl pl-9 pr-3 py-2.5 outline-none border border-slate-200 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Localização"
                className="w-full bg-slate-50 text-slate-900 rounded-xl pl-9 pr-3 py-2.5 outline-none border border-slate-200 focus:border-blue-500 text-sm"
              />
            </div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 outline-none border border-slate-200 focus:border-blue-500 text-sm"
            >
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {JOB_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setSearch({ keyword, location, type })}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 font-semibold text-sm transition"
          >
            Pesquisar
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Vagas disponíveis</h2>
          {user && (
            <Link
              to="/jobs/post"
              className="flex items-center gap-1 text-blue-600 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Publicar
            </Link>
          )}
        </div>

        {isLoading ? (
          <p className="text-slate-500 text-sm">A carregar...</p>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhuma vaga encontrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link key={job.id} to="/jobs/$id" params={{ id: String(job.id) }}>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-400 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">{job.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{job.companyName}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.location}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[job.type]}`}
                        >
                          {JOB_TYPE_LABELS[job.type] || job.type}
                        </span>
                        <span>{formatDate(job.createdAt)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
