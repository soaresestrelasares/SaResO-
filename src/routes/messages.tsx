import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: api.getConversations,
    enabled: !!user,
    refetchInterval: 8000,
  });

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "agora";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  if (!user)
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 pb-20">
        <MessageCircle className="w-14 h-14 text-gray-700" />
        <p className="text-gray-400 text-sm">Inicia sessão para ver as tuas mensagens</p>
        <Link
          to="/login"
          className="px-6 py-3 rounded-xl font-bold text-white text-sm"
          style={{ background: "linear-gradient(135deg,#1E90FF,#0047AB)" }}
        >
          Iniciar sessão
        </Link>
        <BottomNav />
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white max-w-[480px] mx-auto pb-20">
      <div className="px-4 pt-12 pb-3 border-b border-gray-800">
        <h1 className="text-xl font-bold">Mensagens</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Nenhuma conversa ainda</p>
          <p className="text-xs mt-1 text-gray-600 text-center px-8">
            Vai ao perfil de alguém e clica em "Mensagem" para iniciar
          </p>
        </div>
      )}

      <div className="divide-y divide-gray-900">
        {conversations.map((conv) => (
          <Link
            key={conv.id}
            to="/messages/$conversationId"
            params={{ conversationId: String(conv.id) }}
          >
            <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-900/50 transition-colors">
              <Avatar className="w-12 h-12 flex-shrink-0">
                <AvatarImage src={conv.other.avatarUrl || undefined} />
                <AvatarFallback className="bg-gray-700 text-white">
                  {conv.other.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-white font-semibold text-sm truncate">
                    {conv.other.displayName}
                  </p>
                  <span className="text-gray-500 text-xs flex-shrink-0">
                    {formatTime(conv.lastMessageAt)}
                  </span>
                </div>
                <p className="text-gray-400 text-xs truncate mt-0.5">
                  {conv.lastMessage?.content || "Iniciar conversa"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
