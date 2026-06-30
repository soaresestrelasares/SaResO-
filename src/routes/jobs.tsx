import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth-context";
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
  "full-time": "bg-blue-900/60 text-blue-300",
  "part-time": "bg-purple-900/60 text-purple-300",
  remote: "bg-green-900/60 text-green-300",
  internship: "bg-orange-900/60 text-orange-300",
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
    <div className="min-h-screen bg-black text-white max-w-[480px] mx-auto pb-20">
      <div className="bg-gray-950 border-b border-gray-800 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Emprego</h1>
          {user && (
            <Link
              to="/company/new"
              className="flex items-center gap-1.5 text-blue-400 text-sm font-medium"
            >
              <Building2 className="w-4 h-4" />
              Empresa
            </Link>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch({ keyword, location, type });
          }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 bg-gray-900 rounded-xl px-3 py-2.5 border border-gray-800">
            <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cargo, empresa, palavra-chave..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-900 rounded-xl px-3 py-2.5 border border-gray-800">
            <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Localização (Lisboa, Remoto...)"
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {JOB_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${type === t ? "border-blue-500 bg-blue-900/50 text-blue-300" : "border-gray-700 text-gray-400"}`}
              >
                {JOB_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg,#1E90FF,#0047AB)" }}
          >
            Pesquisar
          </button>
        </form>
      </div>

      <div className="p-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Briefcase className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm text-center">
              Nenhuma vaga encontrada.
              <br />
              Tente outros termos ou{" "}
              {user && (
                <Link to="/jobs/post" className="text-blue-400 underline">
                  publica uma vaga
                </Link>
              )}
            </p>
          </div>
        )}
        {jobs.map((job) => (
          <Link key={job.id} to="/jobs/$id" params={{ id: String(job.id) }}>
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 hover:border-blue-800 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {job.companyLogo ? (
                    <img
                      src={job.companyLogo}
                      alt={job.companyName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm leading-tight truncate">
                    {job.title}
                  </h3>
                  <p className="text-blue-400 text-xs mt-0.5">{job.companyName}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {job.location && (
                      <span className="flex items-center gap-1 text-gray-400 text-xs">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[job.type] || "bg-gray-800 text-gray-400"}`}
                    >
                      {JOB_TYPE_LABELS[job.type] || job.type}
                    </span>
                  </div>
                  {job.salary && (
                    <p className="text-green-400 text-xs mt-1 font-medium">{job.salary}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-500 text-xs">{formatDate(job.createdAt)}</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-800 flex items-center gap-1 text-gray-500 text-xs">
                <Briefcase className="w-3 h-3" />
                <span>{job.applicationsCount} candidaturas</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {user && (
        <Link
          to="/jobs/post"
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-40"
          style={{ background: "linear-gradient(135deg,#1E90FF,#0047AB)" }}
        >
          <Plus className="w-6 h-6 text-white" />
        </Link>
      )}
      <BottomNav />
    </div>
  );
}
