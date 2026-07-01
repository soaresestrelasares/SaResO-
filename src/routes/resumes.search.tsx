import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Search, MapPin, Briefcase, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/resumes/search")({
  component: ResumeSearchPage,
});

function ResumeSearchPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["resumes", q, location, remote],
    queryFn: () => api.searchResumes({ q, location, remote }),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-white">
        <p>Inicia sessão para pesquisar candidatos.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white max-w-[480px] mx-auto pb-24">
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <Link to="/resume">
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </Link>
        <h1 className="text-xl font-bold flex-1">Pesquisar candidatos</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Competências, cargo, nome..."
              className="w-full bg-[#111827] text-white rounded-xl pl-10 pr-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Localização"
              className="w-full bg-[#111827] text-white rounded-xl pl-10 pr-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={remote}
              onChange={(e) => setRemote(e.target.checked)}
              className="rounded"
            />
            Apenas remoto
          </label>
        </div>

        {isLoading && <p className="text-gray-500 text-sm">A pesquisar...</p>}

        <div className="space-y-3">
          {results.map((r) => (
            <div key={r.id} className="bg-[#111827] rounded-2xl p-4 border border-gray-800">
              <div className="flex items-start gap-3">
                <img
                  src={r.avatarUrl || "/default-avatar.png"}
                  alt={r.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{r.displayName || r.username}</p>
                  <p className="text-gray-500 text-xs truncate">@{r.username}</p>
                  {r.desiredRole && (
                    <p className="text-sm text-blue-400 mt-1 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> {r.desiredRole}
                    </p>
                  )}
                  {r.desiredLocation && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {r.desiredLocation}
                      {r.remote && <span className="text-green-400"> · Remoto</span>}
                    </p>
                  )}
                  {r.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.skills.slice(0, 6).map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] bg-gray-800 px-2 py-0.5 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.cvUrl && (
                    <a
                      href={r.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 mt-2"
                    >
                      <FileText className="w-3 h-3" /> Ver CV
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!isLoading && results.length === 0 && (q || location || remote) && (
            <p className="text-gray-500 text-sm text-center py-8">Nenhum candidato encontrado.</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
