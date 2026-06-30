import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Building2 } from "lucide-react";

export const Route = createFileRoute("/jobs/post")({
  component: PostJobPage,
});

function PostJobPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyId: 0,
    title: "",
    description: "",
    location: "",
    type: "full-time",
    salary: "",
    requirements: "",
  });
  const [error, setError] = useState("");

  const { data: companies = [] } = useQuery({
    queryKey: ["myCompanies"],
    queryFn: api.getMyCompanies,
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.createJob({ ...form, companyId: form.companyId || (companies[0]?.id ?? 0) }),
    onSuccess: (data) => navigate({ to: "/jobs/$id", params: { id: String(data.id) } }),
    onError: (e: Error) => setError(e.message),
  });

  if (!user)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Link to="/login" className="text-blue-400">
          Inicia sessão
        </Link>
      </div>
    );

  const set =
    (f: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [f]: e.target.value }));

  return (
    <div className="min-h-screen bg-black text-white max-w-[480px] mx-auto pb-24">
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <button onClick={() => navigate({ to: "/jobs" })}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold">Publicar Vaga</h1>
      </div>

      <div className="p-4 space-y-4">
        {companies.length === 0 ? (
          <div className="text-center py-10">
            <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-4">Precisas de criar uma empresa primeiro</p>
            <Link
              to="/company/new"
              className="px-6 py-3 rounded-xl font-bold text-white inline-block"
              style={{ background: "linear-gradient(135deg,#1E90FF,#0047AB)" }}
            >
              Criar empresa
            </Link>
          </div>
        ) : (
          <>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">
                Empresa *
              </label>
              <select
                value={form.companyId}
                onChange={(e) => setForm((p) => ({ ...p, companyId: parseInt(e.target.value) }))}
                className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 outline-none border border-gray-800 focus:border-blue-600 text-sm"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">
                Título do cargo *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={set("title")}
                placeholder="Ex: Desenvolvedor Frontend React"
                className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-600 text-sm"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">
                Tipo
              </label>
              <select
                value={form.type}
                onChange={set("type")}
                className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 outline-none border border-gray-800 focus:border-blue-600 text-sm"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="remote">Remoto</option>
                <option value="internship">Estágio</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">
                Localização
              </label>
              <input
                type="text"
                value={form.location}
                onChange={set("location")}
                placeholder="Lisboa, Porto, Remoto..."
                className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-600 text-sm"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">
                Salário / Remuneração
              </label>
              <input
                type="text"
                value={form.salary}
                onChange={set("salary")}
                placeholder="Ex: 1.500-2.000€/mês"
                className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-600 text-sm"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">
                Descrição da Vaga *
              </label>
              <textarea
                value={form.description}
                onChange={set("description")}
                placeholder="Descreve a posição e responsabilidades..."
                rows={5}
                className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-600 text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">
                Requisitos
              </label>
              <textarea
                value={form.requirements}
                onChange={set("requirements")}
                placeholder="Formação, experiência, competências técnicas..."
                rows={4}
                className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-600 text-sm resize-none"
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm p-3 bg-red-900/20 rounded-xl border border-red-800/60">
                {error}
              </p>
            )}
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.title || !form.description}
              className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#1E90FF,#0047AB)" }}
            >
              {mutation.isPending ? "A publicar..." : "Publicar Vaga"}
            </button>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
