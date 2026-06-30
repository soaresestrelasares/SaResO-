import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { SaResoLogoIcon, SaResoWordmark } from "@/components/SaResoLogo";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const [form, setForm] = useState({ username: "", displayName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.register(form);
      login(res.token, res.user);
      navigate({ to: "/" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 max-w-[480px] mx-auto">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10 flex flex-col items-center gap-3">
          <SaResoLogoIcon size={72} />
          <h1 className="text-4xl font-black">
            <SaResoWordmark />
          </h1>
          <p className="text-gray-400 text-sm">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={form.username}
            onChange={set("username")}
            placeholder="Username"
            required
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-3.5 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-600 transition-colors"
          />
          <input
            type="text"
            value={form.displayName}
            onChange={set("displayName")}
            placeholder="Display Name"
            required
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-3.5 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-600 transition-colors"
          />
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="Email"
            required
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-3.5 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-600 transition-colors"
          />
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            placeholder="Password"
            required
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-3.5 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-600 transition-colors"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold py-3.5 rounded-lg disabled:opacity-60 text-base"
            style={{ background: "linear-gradient(135deg, #1E90FF 0%, #0047AB 100%)" }}
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 font-semibold">
              Log in
            </Link>
          </p>
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
