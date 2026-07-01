import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import type { Story } from "@/lib/api-types";

interface StoryBarProps {
  onOpenStory: (userStories: Story[], startIndex: number) => void;
}

function groupStoriesByUser(stories: Story[]): Map<number, Story[]> {
  const map = new Map<number, Story[]>();
  for (const s of stories) {
    if (!map.has(s.userId)) map.set(s.userId, []);
    map.get(s.userId)!.push(s);
  }
  return map;
}

export function StoryBar({ onOpenStory }: StoryBarProps) {
  const { data: stories = [] } = useQuery({
    queryKey: ["stories"],
    queryFn: api.getStories,
    refetchInterval: 30000,
  });
  const grouped = groupStoriesByUser(stories);

  return (
    <div
      className="w-full overflow-x-auto"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <div className="flex items-center gap-3 px-3 py-2 min-w-max">
        <button className="flex flex-col items-center gap-1">
          <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-blue-400 to-emerald-400 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center">
              <span className="text-white text-2xl">+</span>
            </div>
          </div>
          <span className="text-[10px] text-gray-300 truncate max-w-[4rem]">Add</span>
        </button>
        {Array.from(grouped.entries()).map(([userId, items]) => {
          const user = items[0];
          return (
            <button
              key={userId}
              onClick={() => onOpenStory(items, 0)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-blue-500 to-emerald-400">
                <img
                  src={user.avatarUrl || "/default-avatar.png"}
                  alt={user.username}
                  className="w-full h-full rounded-full object-cover border-2 border-black"
                />
              </div>
              <span className="text-[10px] text-gray-200 truncate max-w-[4rem]">
                {user.username}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface StoryViewerProps {
  stories: Story[];
  startIndex: number;
  onClose: () => void;
}

export function StoryViewer({ stories, startIndex, onClose }: StoryViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const current = stories[index];
  const progressRef = useRef<HTMLDivElement>(null);
  const viewMutation = useMutation({
    mutationFn: (id: number) => api.viewStory(id),
  });

  useEffect(() => {
    if (current) viewMutation.mutate(current.id);
  }, [current?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (index < stories.length - 1) setIndex(index + 1);
      else onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [index, stories.length, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") {
        if (index < stories.length - 1) setIndex(index + 1);
        else onClose();
      }
      if (e.key === "ArrowLeft" && index > 0) setIndex(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onClose, stories.length]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* progress bars */}
      <div className="flex gap-1 px-2 pt-12">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
              style={{
                width: i < index ? "100%" : i === index ? "100%" : "0%",
                animation: i === index ? "progress 5s linear forwards" : "none",
              }}
            />
          </div>
        ))}
      </div>

      {/* header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <img
            src={current?.avatarUrl || "/default-avatar.png"}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="text-white text-sm font-semibold">{current?.username}</span>
          <span className="text-gray-300 text-xs">
            {current
              ? new Date(current.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </span>
        </div>
        <button onClick={onClose} className="text-white text-2xl px-2">
          ×
        </button>
      </div>

      {/* media */}
      <div
        className="flex-1 relative flex items-center justify-center"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 2) {
            if (index > 0) setIndex(index - 1);
          } else if (index < stories.length - 1) {
            setIndex(index + 1);
          } else {
            onClose();
          }
        }}
      >
        {current?.mediaType === "video" ? (
          <video
            src={current.mediaUrl}
            autoPlay
            muted
            playsInline
            className="max-h-full max-w-full object-contain"
            onEnded={() => {
              if (index < stories.length - 1) setIndex(index + 1);
              else onClose();
            }}
          />
        ) : (
          <img
            src={current?.mediaUrl}
            alt="story"
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      <style>{`@keyframes progress { from { width: 0%; } to { width: 100%; } }`}</style>
    </div>
  );
}
