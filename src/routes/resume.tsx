import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Save, Plus, Trash2, FileText, Globe, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ResumeExperience, ResumeEducation } from "@/lib/api-types";

export const Route = createFileRoute("/resume")({
  component: ResumePage,
});

function ResumePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: resume, isLoading } = useQuery({
    queryKey: ["resume"],
    queryFn: () => api.getMyResume(),
    enabled: !!user,
  });

  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");
  const [desiredRole, setDesiredRole] = useState("");
  const [desiredLocation, setDesiredLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [cvUrl, setCvUrl] = useState("");
  const [experience, setExperience] = useState<ResumeExperience[]>([]);
  const [education, setEducation] = useState<ResumeEducation[]>([]);

  useState(() => {
    if (resume) {
      setSummary(resume.summary || "");
      setSkills(Array.isArray(resume.skills) ? resume.skills.join(", ") : "");
      setDesiredRole(resume.desiredRole || "");
      setDesiredLocation(resume.desiredLocation || "");
      setRemote(resume.remote);
      setIsPublic(resume.isPublic);
      setCvUrl(resume.cvUrl || "");
      setExperience((resume.experience as ResumeExperience[]) || []);
      setEducation((resume.education as ResumeEducation[]) || []);
    }
  });

  // Apply data when loaded
  const loadedRef = useState(false);
  if (resume && !loadedRef[0]) {
    setSummary(resume.summary || "");
    setSkills(Array.isArray(resume.skills) ? resume.skills.join(", ") : "");
    setDesiredRole(resume.desiredRole || "");
    setDesiredLocation(resume.desiredLocation || "");
    setRemote(resume.remote);
    setIsPublic(resume.isPublic);
    setCvUrl(resume.cvUrl || "");
    setExperience((resume.experience as ResumeExperience[]) || []);
    setEducation((resume.education as ResumeEducation[]) || []);
    loadedRef[1](true);
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      api.updateResume({
        summary,
        skills: skills.split(",").map((s) => s.trim()),
        experience,
        education,
        desiredRole,
        desiredLocation,
        remote,
        cvUrl,
        isPublic,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume"] });
      toast.success("Currículo guardado!");
    },
    onError: (err) => toast.error(err.message),
  });

  const addExperience = () => {
    setExperience((prev) => [
      ...prev,
      { role: "", company: "", location: "", start: "", current: false, description: "" },
    ]);
  };

  const updateExperience = (idx: number, field: keyof ResumeExperience, value: unknown) => {
    setExperience((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  };

  const removeExperience = (idx: number) => {
    setExperience((prev) => prev.filter((_, i) => i !== idx));
  };

  const addEducation = () => {
    setEducation((prev) => [...prev, { institution: "", degree: "", field: "", start: "" }]);
  };

  const updateEducation = (idx: number, field: keyof ResumeEducation, value: unknown) => {
    setEducation((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  };

  const removeEducation = (idx: number) => {
    setEducation((prev) => prev.filter((_, i) => i !== idx));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-white">
        <p>Inicia sessão para gerir o teu currículo.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white max-w-[480px] mx-auto pb-24">
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <button onClick={() => navigate({ to: "/" })} style={{ color: "white" }}>
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </button>
        <h1 className="text-xl font-bold flex-1">O meu currículo</h1>
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="bg-[#22C55E] hover:bg-[#16A34A] text-white h-9"
        >
          <Save className="w-4 h-4 mr-1" /> Guardar
        </Button>
      </div>

      <div className="p-4 space-y-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" /> Sobre mim
          </h2>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Resumo profissional"
            rows={3}
            className="w-full bg-[#111827] text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 text-sm resize-none"
          />
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Competências separadas por vírgula"
            className="w-full bg-[#111827] text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 text-sm"
          />
          <input
            type="url"
            value={cvUrl}
            onChange={(e) => setCvUrl(e.target.value)}
            placeholder="Link para CV em PDF (opcional)"
            className="w-full bg-[#111827] text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 text-sm"
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Pretensões
          </h2>
          <input
            type="text"
            value={desiredRole}
            onChange={(e) => setDesiredRole(e.target.value)}
            placeholder="Cargo pretendido"
            className="w-full bg-[#111827] text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 text-sm"
          />
          <input
            type="text"
            value={desiredLocation}
            onChange={(e) => setDesiredLocation(e.target.value)}
            placeholder="Localização pretendida"
            className="w-full bg-[#111827] text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 text-sm"
          />
          <div className="flex items-center justify-between bg-[#111827] rounded-xl px-4 py-3 border border-gray-800">
            <p className="text-sm text-white">Aceito remote/trabalho remoto</p>
            <button
              type="button"
              onClick={() => setRemote((v) => !v)}
              className={`w-12 h-7 rounded-full transition-colors relative ${remote ? "bg-blue-500" : "bg-gray-600"}`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${remote ? "left-6" : "left-1"}`}
              />
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Experiência
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addExperience}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
          {experience.map((exp, idx) => (
            <div key={idx} className="bg-[#111827] rounded-xl p-3 border border-gray-800 space-y-2">
              <input
                type="text"
                value={exp.role}
                onChange={(e) => updateExperience(idx, "role", e.target.value)}
                placeholder="Cargo"
                className="w-full bg-black text-white rounded-lg px-3 py-2 outline-none placeholder-gray-500 border border-gray-800 text-sm"
              />
              <input
                type="text"
                value={exp.company}
                onChange={(e) => updateExperience(idx, "company", e.target.value)}
                placeholder="Empresa"
                className="w-full bg-black text-white rounded-lg px-3 py-2 outline-none placeholder-gray-500 border border-gray-800 text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={exp.start}
                  onChange={(e) => updateExperience(idx, "start", e.target.value)}
                  placeholder="Início"
                  className="flex-1 bg-black text-white rounded-lg px-3 py-2 outline-none placeholder-gray-500 border border-gray-800 text-sm"
                />
                <input
                  type="text"
                  value={exp.end || ""}
                  onChange={(e) => updateExperience(idx, "end", e.target.value)}
                  placeholder="Fim"
                  className="flex-1 bg-black text-white rounded-lg px-3 py-2 outline-none placeholder-gray-500 border border-gray-800 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => updateExperience(idx, "current", e.target.checked)}
                  className="rounded"
                />
                Atual
              </label>
              <textarea
                value={exp.description || ""}
                onChange={(e) => updateExperience(idx, "description", e.target.value)}
                placeholder="Descrição"
                rows={2}
                className="w-full bg-black text-white rounded-lg px-3 py-2 outline-none placeholder-gray-500 border border-gray-800 text-sm resize-none"
              />
              <button
                type="button"
                onClick={() => removeExperience(idx)}
                className="text-red-400 text-xs flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Remover
              </button>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Educação
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addEducation}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </div>
          {education.map((edu, idx) => (
            <div key={idx} className="bg-[#111827] rounded-xl p-3 border border-gray-800 space-y-2">
              <input
                type="text"
                value={edu.institution}
                onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                placeholder="Instituição"
                className="w-full bg-black text-white rounded-lg px-3 py-2 outline-none placeholder-gray-500 border border-gray-800 text-sm"
              />
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                placeholder="Curso/grau"
                className="w-full bg-black text-white rounded-lg px-3 py-2 outline-none placeholder-gray-500 border border-gray-800 text-sm"
              />
              <input
                type="text"
                value={edu.field || ""}
                onChange={(e) => updateEducation(idx, "field", e.target.value)}
                placeholder="Área de estudo"
                className="w-full bg-black text-white rounded-lg px-3 py-2 outline-none placeholder-gray-500 border border-gray-800 text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={edu.start}
                  onChange={(e) => updateEducation(idx, "start", e.target.value)}
                  placeholder="Início"
                  className="flex-1 bg-black text-white rounded-lg px-3 py-2 outline-none placeholder-gray-500 border border-gray-800 text-sm"
                />
                <input
                  type="text"
                  value={edu.end || ""}
                  onChange={(e) => updateEducation(idx, "end", e.target.value)}
                  placeholder="Fim"
                  className="flex-1 bg-black text-white rounded-lg px-3 py-2 outline-none placeholder-gray-500 border border-gray-800 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => removeEducation(idx)}
                className="text-red-400 text-xs flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Remover
              </button>
            </div>
          ))}
        </section>

        <div className="flex items-center justify-between bg-[#111827] rounded-xl px-4 py-3 border border-gray-800">
          <div>
            <p className="text-sm text-white">Currículo público</p>
            <p className="text-xs text-gray-500">Empresas podem encontrar-te nas pesquisas.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic((v) => !v)}
            className={`w-12 h-7 rounded-full transition-colors relative ${isPublic ? "bg-blue-500" : "bg-gray-600"}`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isPublic ? "left-6" : "left-1"}`}
            />
          </button>
        </div>

        <Link
          to="/resumes/search"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-600 text-white font-semibold text-sm hover:border-blue-500"
        >
          <Globe className="w-4 h-4" /> Pesquisar candidatos
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
