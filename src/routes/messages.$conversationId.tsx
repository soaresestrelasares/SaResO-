import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getSocket } from "@/lib/socket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Phone, Video } from "lucide-react";
import type { Message } from "@/lib/api-types";
import { CallModal } from "@/components/CallModal";

export const Route = createFileRoute("/messages/$conversationId")({
  component: ChatPage,
});

function ChatPage() {
  const { conversationId } = Route.useParams();
  const convId = parseInt(conversationId as string);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [rtMessages, setRtMessages] = useState<Message[]>([]);
  const [callTarget, setCallTarget] = useState<{
    userId: number;
    displayName: string;
    callType: "video" | "audio";
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: api.getConversations,
    enabled: !!user,
  });
  const conv = conversations.find((c) => c.id === convId);

  const { data: history = [] } = useQuery({
    queryKey: ["messages", convId],
    queryFn: () => api.getMessages(convId),
    enabled: !!user,
  });

  const allMessages = [...history];
  rtMessages.forEach((m) => {
    if (!allMessages.find((x) => x.id === m.id)) allMessages.push(m);
  });
  allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socket.emit("chat:join", convId);
    socket.on("chat:receive", (msg: Message) => {
      if (msg.conversationId === convId) {
        setRtMessages((prev) => [...prev.filter((m) => m.id !== msg.id), msg]);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    });
    socket.on("chat:error", ({ error }: { error: string }) => alert(error));
    return () => {
      socket.emit("chat:leave", convId);
      socket.off("chat:receive");
      socket.off("chat:error");
    };
  }, [convId, user, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    const socket = getSocket();
    socket.emit("chat:send", { conversationId: convId, content: text });
    setText("");
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-screen bg-black text-white max-w-[480px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-black flex-shrink-0 pt-safe">
        <button onClick={() => navigate({ to: "/messages" })}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        {conv ? (
          <>
            <Avatar className="w-9 h-9">
              <AvatarImage src={conv.other.avatarUrl || undefined} />
              <AvatarFallback className="bg-gray-700 text-white text-sm">
                {conv.other.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm flex-1 truncate">{conv.other.displayName}</span>
            <button
              onClick={() =>
                setCallTarget({
                  userId: conv.other.id,
                  displayName: conv.other.displayName,
                  callType: "audio",
                })
              }
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() =>
                setCallTarget({
                  userId: conv.other.id,
                  displayName: conv.other.displayName,
                  callType: "video",
                })
              }
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Video className="w-5 h-5" />
            </button>
          </>
        ) : (
          <span className="text-gray-400 text-sm">Conversa</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {allMessages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[76%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? "rounded-br-sm" : "bg-gray-800 rounded-bl-sm"}`}
                style={isMe ? { background: "linear-gradient(135deg,#1E90FF,#0047AB)" } : {}}
              >
                <p className="leading-relaxed">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-gray-500"}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-800 bg-black flex-shrink-0">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escreve uma mensagem..."
          className="flex-1 bg-gray-900 text-white rounded-full px-4 py-2.5 text-sm outline-none placeholder-gray-500 border border-gray-800 focus:border-blue-700"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#1E90FF,#0047AB)" }}
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>

      {callTarget && (
        <CallModal
          targetUserId={callTarget.userId}
          targetDisplayName={callTarget.displayName}
          callType={callTarget.callType}
          onClose={() => setCallTarget(null)}
        />
      )}
    </div>
  );
}
