import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { SaResoLogoIcon } from "@/components/SaResoLogo";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.login({ email, password });
      login(res.token, res.user);
      void navigate({ to: "/" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Email ou password incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center gap-2">
          <SaResoLogoIcon size={64} />
          <h1 className="text-3xl font-black text-white tracking-tight">SaResO</h1>
          <p className="text-gray-400 text-sm">Bem-vindo de volta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-[#111827] text-white rounded-xl px-4 py-3.5 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 transition-colors text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete="current-password"
            className="w-full bg-[#111827] text-white rounded-xl px-4 py-3.5 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 transition-colors text-sm"
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold py-3.5 rounded-xl disabled:opacity-50 text-sm mt-1"
            style={{ background: "linear-gradient(135deg,#1E90FF 0%,#0047AB 100%)" }}
          >
            {loading ? "A entrar…" : "Entrar"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Ainda não tens conta?{" "}
          <Link to="/register" className="text-blue-400 font-semibold">
            Registar
          </Link>
        </p>

        <p className="text-center text-gray-700 text-xs mt-8">
          © {new Date().getFullYear()} SaResO. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
