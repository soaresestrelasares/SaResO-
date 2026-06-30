import { useRef, useState, useEffect, useCallback } from "react";
import { Heart, MessageCircle, Share2, Music, BookmarkIcon } from "lucide-react";
import type { Video } from "@/lib/api-types";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@tanstack/react-router";
import { CommentDrawer } from "./CommentDrawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { parseText } from "@/lib/parse-text";
import { UserBadge } from "./UserBadge";

interface VideoCardProps {
  video: Video;
  isActive: boolean;
}

export function VideoCard({ video, isActive }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(video.liked);
  const [likesCount, setLikesCount] = useState(video.likesCount);
  const [saved, setSaved] = useState(video.saved ?? false);
  const [showComments, setShowComments] = useState(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [shareToast, setShareToast] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive && !paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [isActive, paused]);

  const togglePlay = () => {
    setPaused((p) => !p);
  };

  const handleLike = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setLiked((l) => !l);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    try {
      await api.likeVideo(video.id);
    } catch {
      setLiked((l) => !l);
      setLikesCount((c) => (liked ? c + 1 : c - 1));
    }
  };

  const handleSave = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const prev = saved;
    setSaved(!prev);
    try {
      await api.saveVideo(video.id);
    } catch {
      setSaved(prev);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?v=${video.id}`;
    const shareData = {
      title: video.title,
      text: `Vê este vídeo de @${video.username} no SaResO!`,
      url,
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setShareToast("Partilhado!");
      } else {
        await navigator.clipboard.writeText(url);
        setShareToast("Link copiado!");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareToast("Link copiado!");
      } catch {
        setShareToast("Não foi possível partilhar.");
      }
    }
    setTimeout(() => setShareToast(""), 2500);
  };

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        className="w-full h-full object-cover"
        loop
        muted={muted}
        playsInline
        onClick={togglePlay}
        poster={video.thumbnailUrl || undefined}
      />

      {/* Pause overlay */}
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 rounded-full p-4">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          </div>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

      {/* Share toast */}
      {shareToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs font-semibold px-4 py-2 rounded-full z-50 pointer-events-none">
          {shareToast}
        </div>
      )}

      {/* Right side actions */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
        {/* Avatar */}
        <div className="relative mb-2">
          <Link to="/profile/$username" params={{ username: video.username }}>
            <Avatar className="w-12 h-12 border-2 border-white">
              <AvatarImage src={video.avatarUrl || undefined} />
              <AvatarFallback className="bg-gray-700 text-white text-sm">
                {video.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#FE2C55] rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">+</span>
          </div>
        </div>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className={`p-2 rounded-full ${liked ? "text-[#FE2C55]" : "text-white"}`}>
            <Heart className="w-7 h-7" fill={liked ? "#FE2C55" : "none"} strokeWidth={1.5} />
          </div>
          <span className="text-white text-xs font-semibold">{formatCount(likesCount)}</span>
        </button>

        {/* Comment */}
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
          <div className="p-2 rounded-full text-white">
            <MessageCircle className="w-7 h-7" strokeWidth={1.5} />
          </div>
          <span className="text-white text-xs font-semibold">
            {formatCount(video.commentsCount)}
          </span>
        </button>

        {/* Bookmark */}
        <button onClick={handleSave} className="flex flex-col items-center gap-1">
          <div className={`p-2 rounded-full ${saved ? "text-green-400" : "text-white"}`}>
            <BookmarkIcon
              className="w-7 h-7"
              fill={saved ? "currentColor" : "none"}
              strokeWidth={1.5}
            />
          </div>
          <span className="text-white text-xs font-semibold">{saved ? "Guardado" : "Guardar"}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="p-2 rounded-full text-blue-400">
            <Share2 className="w-7 h-7" strokeWidth={1.5} />
          </div>
          <span className="text-white text-xs font-semibold">Partilhar</span>
        </button>

        {/* Music disc */}
        <div
          className="w-10 h-10 bg-gray-800 rounded-full border-2 border-white flex items-center justify-center animate-spin"
          style={{ animationDuration: "4s" }}
        >
          <Music className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute left-3 bottom-24 right-20 pointer-events-none">
        <Link
          to="/profile/$username"
          params={{ username: video.username }}
          className="pointer-events-auto"
        >
          <p className="text-white font-bold text-base mb-1 flex items-center gap-1">
            @{video.username}
            <UserBadge isPremium={video.isPremium} isVerified={video.isVerified} />
          </p>
        </Link>
        <p className="text-white text-sm mb-2 line-clamp-2 pointer-events-auto">
          {parseText(video.title)}
        </p>
        {video.description && (
          <p className="text-gray-200 text-xs line-clamp-1 pointer-events-auto">
            {parseText(video.description)}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1">
          <Music className="w-3 h-3 text-white" />
          <p className="text-white text-xs">{video.displayName} · Original sound</p>
        </div>
      </div>

      {/* Mute button */}
      <button
        onClick={() => setMuted((m) => !m)}
        className="absolute top-12 right-3 p-2 bg-black/40 rounded-full text-white"
      >
        {muted ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0017.73 19L19 20.27 20.27 19 5.27 4 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>

      {/* Comments drawer */}
      {showComments && <CommentDrawer videoId={video.id} onClose={() => setShowComments(false)} />}
    </div>
  );
}
