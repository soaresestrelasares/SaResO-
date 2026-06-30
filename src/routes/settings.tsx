import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, login, token } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-white">
        <p>Inicia sessão para aceder às definições.</p>
      </div>
    );
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const updated = await api.updateProfile({ displayName, bio, username });
      // Update auth context with new user data
      if (token) {
        login(token, { ...user, ...updated });
      }
      setProfileSuccess("Perfil atualizado com sucesso!");
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Erro ao atualizar perfil.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwError("");
    setPwSuccess("");
    if (!currentPassword || !newPassword) {
      setPwError("Preenche ambos os campos de password.");
      setPwLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setPwError("A nova password deve ter pelo menos 6 caracteres.");
      setPwLoading(false);
      return;
    }
    try {
      // Use forgot-password flow: generate code then reset
      // Since we have the user's email, use reset-password via forgot flow
      const forgotRes = await api.forgotPassword(user.email);
      if (forgotRes.code) {
        await api.resetPassword({
          email: user.email,
          code: forgotRes.code,
          newPassword,
        });
        setPwSuccess("Password alterada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPwError("Não foi possível gerar o código de recuperação.");
      }
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Erro ao alterar password.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white max-w-[480px] mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <button onClick={() => navigate({ to: "/profile/$username", params: { username: user.username } })}>
          <ArrowLeft className="w-6 h-6 text-gray-400" />
        </button>
        <h1 className="text-xl font-bold">Definições</h1>
      </div>

      <div className="p-4 space-y-8">
        {/* Edit Profile Section */}
        <section>
          <h2 className="text-base font-semibold text-gray-200 mb-4">Editar Perfil</h2>
          <form onSubmit={handleProfileSave} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Nome de exibição</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="O teu nome"
                maxLength={100}
                className="w-full bg-[#111827] text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="username"
                maxLength={50}
                className="w-full bg-[#111827] text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 transition-colors text-sm"
              />
              <p className="text-xs text-gray-600 mt-1">Apenas letras minúsculas, números, _ e .</p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Fala um pouco sobre ti..."
                maxLength={500}
                rows={3}
                className="w-full bg-[#111827] text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 transition-colors text-sm resize-none"
              />
              <p className="text-xs text-gray-600 mt-1 text-right">{bio.length}/500</p>
            </div>

            {profileError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{profileError}</p>
              </div>
            )}
            {profileSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                <p className="text-green-400 text-sm">{profileSuccess}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl disabled:opacity-50 text-sm"
              style={{ background: "linear-gradient(135deg,#1E90FF 0%,#0047AB 100%)" }}
            >
              <Save className="w-4 h-4" />
              {profileLoading ? "A guardar…" : "Guardar Perfil"}
            </button>
          </form>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-800" />

        {/* Change Password Section */}
        <section>
          <h2 className="text-base font-semibold text-gray-200 mb-4">Alterar Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Password atual</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Password atual"
                  autoComplete="current-password"
                  className="w-full bg-[#111827] text-white rounded-xl px-4 py-3 pr-11 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Nova password</label>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova password (mín. 6 caracteres)"
                  autoComplete="new-password"
                  className="w-full bg-[#111827] text-white rounded-xl px-4 py-3 pr-11 outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-500 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {pwError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{pwError}</p>
              </div>
            )}
            {pwSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                <p className="text-green-400 text-sm">{pwSuccess}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full text-white font-bold py-3.5 rounded-xl disabled:opacity-50 text-sm border border-gray-600 hover:border-blue-500 transition-colors"
            >
              {pwLoading ? "A alterar…" : "Alterar Password"}
            </button>
          </form>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
