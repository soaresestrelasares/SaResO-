import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Building2, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/company/new")({
  component: NewCompanyPage,
});

const INDUSTRIES = [
  "",
  "Tecnologia",
  "Saúde",
  "Educação",
  "Finanças",
  "Marketing",
  "Retalho",
  "Construção",
  "Turismo",
  "Media",
  "Outro",
];

function NewCompanyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    logoUrl: "",
    description: "",
    website: "",
    industry: "",
    location: "",
    taxId: "",
    legalDocUrl: "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => api.createCompany(form),
    onSuccess: (data) => navigate({ to: "/company/$id", params: { id: String(data.id) } }),
    onError: (e: Error) => setError(e.message),
  });

  if (!user)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Link to="/login" className="text-blue-600 font-semibold">
          Inicia sessão
        </Link>
      </div>
    );

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  return (
    <div className="min-h-screen bg-white text-slate-900 max-w-[480px] mx-auto pb-24">
      <div className="flex items-center gap-3 p-4 border-b border-slate-200">
        <button onClick={() => navigate({ to: "/jobs" })} className="text-slate-700">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-lg">Criar Empresa</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex justify-center py-2">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-slate-400" />
            )}
          </div>
        </div>
        <div>
          <label className="text-slate-500 text-xs uppercase tracking-wide mb-1 block">
            Nome da Empresa *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            placeholder="Nome da empresa"
            className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 outline-none placeholder-slate-400 border border-slate-200 focus:border-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="text-slate-500 text-xs uppercase tracking-wide mb-1 block">
            NIF / NIPC *
          </label>
          <input
            type="text"
            value={form.taxId}
            onChange={set("taxId")}
            placeholder="Número de identificação fiscal da empresa"
            className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 outline-none placeholder-slate-400 border border-slate-200 focus:border-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="text-slate-500 text-xs uppercase tracking-wide mb-1 block flex items-center gap-1">
            <FileCheck className="w-3 h-3" /> Documento legal (certidão permanente, registo
            comercial)
          </label>
          <input
            type="url"
            value={form.legalDocUrl}
            onChange={set("legalDocUrl")}
            placeholder="https://... (PDF ou imagem do documento)"
            className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 outline-none placeholder-slate-400 border border-slate-200 focus:border-blue-500 text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">
            A empresa só será verificada após revisão dos documentos pela equipa SaResO.
          </p>
        </div>
        <div>
          <label className="text-slate-500 text-xs uppercase tracking-wide mb-1 block">
            URL do Logótipo
          </label>
          <input
            type="url"
            value={form.logoUrl}
            onChange={set("logoUrl")}
            placeholder="https://..."
            className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 outline-none placeholder-slate-400 border border-slate-200 focus:border-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="text-slate-500 text-xs uppercase tracking-wide mb-1 block">
            Setor / Indústria
          </label>
          <select
            value={form.industry}
            onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
            className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 outline-none border border-slate-200 focus:border-blue-500 text-sm"
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i || "Selecionar..."}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-slate-500 text-xs uppercase tracking-wide mb-1 block">
            Localização
          </label>
          <input
            type="text"
            value={form.location}
            onChange={set("location")}
            placeholder="Lisboa, Portugal"
            className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 outline-none placeholder-slate-400 border border-slate-200 focus:border-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="text-slate-500 text-xs uppercase tracking-wide mb-1 block">
            Website
          </label>
          <input
            type="url"
            value={form.website}
            onChange={set("website")}
            placeholder="https://..."
            className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 outline-none placeholder-slate-400 border border-slate-200 focus:border-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="text-slate-500 text-xs uppercase tracking-wide mb-1 block">
            Descrição
          </label>
          <textarea
            value={form.description}
            onChange={set("description")}
            placeholder="Descreve a empresa, missão e cultura..."
            rows={4}
            className="w-full bg-slate-50 text-slate-900 rounded-xl px-4 py-3 outline-none placeholder-slate-400 border border-slate-200 focus:border-blue-500 text-sm resize-none"
          />
        </div>
        {error && (
          <p className="text-red-600 text-sm p-3 bg-red-50 rounded-xl border border-red-200">
            {error}
          </p>
        )}
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !form.name || !form.taxId}
          className="w-full py-6 rounded-xl font-bold text-white disabled:opacity-60 bg-slate-900 hover:bg-slate-800"
        >
          {mutation.isPending ? "A criar..." : "Criar Empresa"}
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}
