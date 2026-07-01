import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Send, Flag } from "lucide-react";
import { parseText } from "@/lib/parse-text";

interface Props {
  videoId: number;
  onClose: () => void;
}

export function CommentDrawer({ videoId, onClose }: Props) {
  const [text, setText] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", videoId],
    queryFn: () => api.getComments(videoId),
  });

  const mutation = useMutation({
    mutationFn: () => api.addComment(videoId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
      setText("");
    },
  });

  const [reportCommentId, setReportCommentId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);

  const handleReportComment = async () => {
    if (!user || !reportCommentId || !reportReason.trim()) return;
    await api.reportContent("comment", reportCommentId, reportReason);
    setReportSent(true);
    setTimeout(() => {
      setReportCommentId(null);
      setReportReason("");
      setReportSent(false);
    }, 2000);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] rounded-t-2xl max-h-[70%] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-white font-bold text-base">{comments.length} comments</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No comments yet. Be the first!</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={c.avatarUrl || undefined} />
                <AvatarFallback className="bg-gray-700 text-white text-xs">
                  {c.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-white font-semibold text-sm">@{c.username}</span>
                  <span className="text-gray-500 text-xs">{formatTime(c.createdAt)}</span>
                </div>
                <p className="text-gray-200 text-sm mt-0.5">{parseText(c.content)}</p>
              </div>
              <button
                onClick={() => setReportCommentId(c.id)}
                className="text-gray-500 hover:text-red-400"
                title="Denunciar comentário"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700 flex items-center gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={user?.avatarUrl || undefined} />
            <AvatarFallback className="bg-gray-700 text-white text-xs">
              {user?.displayName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={user ? "Add comment..." : "Login to comment"}
            disabled={!user}
            className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 text-sm outline-none placeholder-gray-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && text.trim()) mutation.mutate();
            }}
          />
          {text.trim() && (
            <button onClick={() => mutation.mutate()} className="text-[#FE2C55]">
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Report comment modal */}
      {reportCommentId && (
        <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-6">
          <div className="bg-[#1a1a1a] rounded-2xl p-5 w-full max-w-sm space-y-4 border border-gray-700">
            <h3 className="text-white font-bold text-lg">Denunciar comentário</h3>
            {reportSent ? (
              <p className="text-green-400 text-sm">Denúncia enviada. Obrigado.</p>
            ) : (
              <>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Qual é o motivo da denúncia?"
                  rows={3}
                  className="w-full bg-black text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-500 border border-gray-800"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleReportComment}
                    disabled={!reportReason.trim()}
                    className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    Enviar
                  </button>
                  <button
                    onClick={() => setReportCommentId(null)}
                    className="flex-1 bg-gray-800 text-white rounded-lg py-2 text-sm font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
