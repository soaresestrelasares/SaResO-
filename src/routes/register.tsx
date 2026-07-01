import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { SaResoLogoIcon } from "@/components/SaResoLogo";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const [form, setForm] = useState({ username: "", displayName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.displayName.trim()) e.displayName = "Insere o teu nome";
    if (!form.username.trim()) e.username = "Insere um username";
    else if (form.username.length < 3) e.username = "Mínimo 3 caracteres";
    else if (!/^[a-z0-9_.]+$/.test(form.username))
      e.username = "Só letras minúsculas, números, _ e .";
    if (!form.email.trim()) e.email = "Insere o teu email";
    if (!form.password) e.password = "Insere uma password";
    else if (form.password.length < 6) e.password = "Mínimo 6 caracteres";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const res = await api.register(form);
      login(res.token, res.user);
      void navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar conta";
      if (msg.toLowerCase().includes("email")) setErrors({ email: msg });
      else if (msg.toLowerCase().includes("username")) setErrors({ username: msg });
      else setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "", general: "" }));
  };

  const field = (name: keyof typeof form, placeholder: string, type = "text", hint?: string) => (
    <div className="space-y-1">
      <input
        type={type}
        value={form[name]}
        onChange={set(name)}
        placeholder={placeholder}
        required
        autoComplete={type === "password" ? "new-password" : undefined}
        className={`w-full bg-[#111827] text-white rounded-xl px-4 py-3.5 outline-none placeholder-gray-500 border transition-colors text-sm ${
          errors[name] ? "border-red-500" : "border-gray-800 focus:border-blue-500"
        }`}
      />
      {hint && !errors[name] && <p className="text-gray-600 text-xs px-1">{hint}</p>}
      {errors[name] && <p className="text-red-400 text-xs px-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center gap-2">
          <SaResoLogoIcon size={64} />
          <h1 className="text-3xl font-black text-white tracking-tight">SaResO</h1>
          <p className="text-gray-400 text-sm">Cria a tua conta gratuita</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {field("displayName", "Nome completo")}
          {field("username", "Username", "text", "Apenas letras minúsculas, números, _ e .")}
          {field("email", "Email", "email")}
          {field("password", "Password", "password", "Mínimo 6 caracteres")}

          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold py-3.5 rounded-xl disabled:opacity-50 text-sm mt-2"
            style={{ background: "linear-gradient(135deg,#1E90FF 0%,#0047AB 100%)" }}
          >
            {loading ? "A criar conta…" : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Já tens conta?{" "}
          <Link to="/login" className="text-blue-400 font-semibold">
            Entrar
          </Link>
        </p>

        <p className="text-center text-gray-700 text-xs mt-8">
          © {new Date().getFullYear()} SaResO. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
