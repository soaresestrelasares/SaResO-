import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Grid3X3, Heart, Settings, Bookmark } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { UserBadge } from "@/components/UserBadge";

export const Route = createFileRoute("/profile/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMe = user?.username === username;
  const [activeTab, setActiveTab] = useState<"videos" | "saved">("videos");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user", username],
    queryFn: () => api.getUser(username),
  });

  const { data: userVideos = [] } = useQuery({
    queryKey: ["userVideos", profile?.id],
    queryFn: () => api.getUserVideos(profile!.id),
    enabled: !!profile?.id,
  });

  const { data: savedVideos = [] } = useQuery({
    queryKey: ["savedVideos"],
    queryFn: () => api.getSavedVideos(),
    enabled: isMe,
  });

  const { data: followStatus, refetch: refetchFollow } = useQuery({
    queryKey: ["followStatus", profile?.id],
    queryFn: () => api.getFollowStatus(profile!.id),
    enabled: !!profile?.id && !!user && !isMe,
  });

  const followMutation = useMutation({
    mutationFn: () => api.toggleFollow(profile!.id),
    onSuccess: () => refetchFollow(),
  });

  const messageMutation = useMutation({
    mutationFn: () => api.startConversation(profile!.id),
    onSuccess: (data) =>
      navigate({ to: "/messages/$conversationId", params: { conversationId: String(data.id) } }),
  });

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        User not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white max-w-[480px] mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate({ to: "/" })}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-base">@{profile.username}</h1>
        {isMe ? (
          <button onClick={logout} title="Logout">
            <Settings className="w-6 h-6 text-gray-400" />
          </button>
        ) : (
          <div className="w-6" />
        )}
      </div>

      {/* Profile info */}
      <div className="flex flex-col items-center px-4 pb-4">
        <Avatar className="w-24 h-24 mb-3">
          <AvatarImage src={profile.avatarUrl || undefined} />
          <AvatarFallback className="bg-gray-700 text-white text-2xl">
            {profile.displayName.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <h2 className="text-xl font-bold flex items-center gap-2">
          {profile.displayName}
          <UserBadge isPremium={profile.isPremium} isVerified={profile.isVerified} size="md" />
        </h2>
        <p className="text-gray-400 text-sm mb-3">@{profile.username}</p>

        {/* Stats */}
        <div className="flex gap-8 mb-4">
          <div className="text-center">
            <p className="text-white font-bold text-lg">
              {formatCount(profile.followingCount ?? 0)}
            </p>
            <p className="text-gray-400 text-xs">Following</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">
              {formatCount(profile.followersCount ?? 0)}
            </p>
            <p className="text-gray-400 text-xs">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">{formatCount(profile.videosCount ?? 0)}</p>
            <p className="text-gray-400 text-xs">Videos</p>
          </div>
        </div>

        {profile.bio && <p className="text-gray-300 text-sm text-center mb-4">{profile.bio}</p>}

        {/* Action buttons */}
        {isMe ? (
          <Link
            to="/upload"
            className="w-full max-w-xs border border-gray-600 text-white font-semibold py-2.5 rounded-xl text-center text-sm"
          >
            Publicar vídeo
          </Link>
        ) : (
          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={() => (user ? followMutation.mutate() : navigate({ to: "/login" }))}
              disabled={followMutation.isPending}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${followStatus?.following ? "border border-gray-600 text-white" : "text-white"}`}
              style={
                followStatus?.following
                  ? {}
                  : { background: "linear-gradient(135deg,#1E90FF,#0047AB)" }
              }
            >
              {followStatus?.following ? "A seguir" : "Seguir"}
            </button>
            <button
              onClick={() => (user ? messageMutation.mutate() : navigate({ to: "/login" }))}
              disabled={messageMutation.isPending}
              className="flex-1 border border-gray-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:border-blue-600 transition-colors"
            >
              Mensagem
            </button>
          </div>
        )}
      </div>

      {/* Videos grid */}
      <div className="border-t border-gray-800">
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab("videos")}
            className={`flex-1 flex items-center justify-center py-3 ${activeTab === "videos" ? "border-b-2 border-white" : "text-gray-500"}`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex-1 flex items-center justify-center py-3 ${activeTab === "saved" ? "border-b-2 border-white" : "text-gray-500"}`}
          >
            <Bookmark className="w-5 h-5" />
          </button>
        </div>

        {activeTab === "videos" && (
          <>
            {userVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Grid3X3 className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Sem vídeos ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-px">
                {userVideos.map((v) => (
                  <div key={v.id} className="aspect-[9/16] bg-gray-900 relative overflow-hidden">
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <video src={v.videoUrl} className="w-full h-full object-cover" muted />
                    )}
                    <div className="absolute bottom-1 left-1 flex items-center gap-0.5 text-white text-xs">
                      <Heart className="w-3 h-3" fill="white" />
                      <span>{formatCount(v.likesCount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "saved" && isMe && (
          <>
            {savedVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Bookmark className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Sem vídeos guardados</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-px">
                {savedVideos.map((v) => (
                  <div key={v.id} className="aspect-[9/16] bg-gray-900 relative overflow-hidden">
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <video src={v.videoUrl} className="w-full h-full object-cover" muted />
                    )}
                    <div className="absolute bottom-1 left-1 flex items-center gap-0.5 text-white text-xs">
                      <Heart className="w-3 h-3" fill="white" />
                      <span>{formatCount(v.likesCount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
