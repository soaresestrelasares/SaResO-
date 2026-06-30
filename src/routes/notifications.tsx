import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BottomNav } from "@/components/BottomNav";
import { Bell, Heart, MessageCircle, UserPlus, Briefcase, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Notification } from "@/lib/api-types";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function notificationIcon(type: Notification["type"]) {
  switch (type) {
    case "follow":
      return <UserPlus className="w-4 h-4 text-blue-400" />;
    case "like":
      return <Heart className="w-4 h-4 text-red-400" />;
    case "comment":
      return <MessageCircle className="w-4 h-4 text-green-400" />;
    case "message":
      return <MessageCircle className="w-4 h-4 text-purple-400" />;
    case "job_application":
      return <Briefcase className="w-4 h-4 text-yellow-400" />;
    default:
      return <Bell className="w-4 h-4 text-gray-400" />;
  }
}

function notificationText(n: Notification): string {
  switch (n.type) {
    case "follow":
      return `${n.actorDisplayName} começou a seguir-te.`;
    case "like":
      return `${n.actorDisplayName} gostou do teu vídeo.`;
    case "comment":
      return `${n.actorDisplayName} comentou no teu vídeo.`;
    case "message":
      return `${n.actorDisplayName} enviou-te uma mensagem.`;
    case "job_application":
      return `${n.actorDisplayName} candidatou-se à tua vaga.`;
    default:
      return `${n.actorDisplayName} interagiu contigo.`;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications(),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] text-white max-w-[480px] mx-auto pb-20 flex flex-col items-center justify-center gap-4">
        <Bell className="w-12 h-12 opacity-30" />
        <p className="text-gray-400 text-sm">Inicia sessão para ver as notificações.</p>
        <Link to="/login" className="text-blue-400 font-semibold text-sm">
          Entrar
        </Link>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white max-w-[480px] mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">Notificações</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold px-3 py-1.5 rounded-lg border border-blue-400/30 hover:bg-blue-400/10 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Bell className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Sem notificações ainda</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800/50">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-4 transition-colors ${
                !n.readAt ? "bg-blue-500/5" : ""
              }`}
              onClick={() => {
                if (!n.readAt) markReadMutation.mutate(n.id);
              }}
            >
              {/* Actor avatar */}
              <Link to="/profile/$username" params={{ username: n.actorUsername }}>
                <Avatar className="w-11 h-11 flex-shrink-0">
                  <AvatarImage src={n.actorAvatarUrl || undefined} />
                  <AvatarFallback className="bg-gray-700 text-white text-sm">
                    {n.actorDisplayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {notificationIcon(n.type)}
                  <p className="text-sm text-white leading-snug">{notificationText(n)}</p>
                </div>
                <p className="text-xs text-gray-500">{timeAgo(n.createdAt)}</p>
              </div>

              {/* Unread dot */}
              {!n.readAt && (
                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
