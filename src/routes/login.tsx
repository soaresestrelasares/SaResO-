import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { SaResoLogoIcon, SaResoWordmark } from "@/components/SaResoLogo";

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
      navigate({ to: "/" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 max-w-[480px] mx-auto">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10 flex flex-col items-center gap-3">
          <SaResoLogoIcon size={72} />
          <h1 className="text-4xl font-black">
            <SaResoWordmark />
          </h1>
          <p className="text-gray-400 text-sm">Log in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3.5 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-600 transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3.5 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-600 transition-colors"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold py-3.5 rounded-lg disabled:opacity-60 transition-opacity text-base"
            style={{ background: "linear-gradient(135deg, #1E90FF 0%, #0047AB 100%)" }}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-400 font-semibold">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-xs">Demo: alex@example.com / password123</p>
        </div>

        <div className="mt-10 text-center">
          <p className="text-gray-700 text-xs">
            © {new Date().getFullYear()} SaResO. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
