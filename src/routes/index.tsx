import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { VideoCard } from "@/components/VideoCard";
import { BottomNav } from "@/components/BottomNav";
import { SaResoLogoIcon } from "@/components/SaResoLogo";
import { StoryBar, StoryViewer } from "@/components/StoryBar";
import type { Video, Story } from "@/lib/api-types";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"following" | "for-you">("for-you");
  const [viewingStories, setViewingStories] = useState<{
    stories: Story[];
    startIndex: number;
  } | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam = 0 }) => api.getFeed(pageParam as number),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 10 ? allPages.length : undefined,
    initialPageParam: 0,
  });

  const videos: Video[] = data?.pages.flat() ?? [];

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const idx = Math.round(container.scrollTop / container.clientHeight);
    setActiveIndex(idx);
    if (idx >= videos.length - 2 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [videos.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="relative w-full h-screen bg-black flex flex-col max-w-[480px] mx-auto">
      {/* Top header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-4 pb-2 bg-gradient-to-b from-black/70 to-transparent">
        <SaResoLogoIcon size={32} />
        <div className="flex items-center gap-6">
          <button
            onClick={() => setTab("following")}
            className={`text-base font-semibold transition-all ${tab === "following" ? "text-white" : "text-gray-400"}`}
          >
            Following
          </button>
          <button
            onClick={() => setTab("for-you")}
            className={`text-base font-semibold transition-all relative ${tab === "for-you" ? "text-white" : "text-gray-400"}`}
          >
            For You
            {tab === "for-you" && (
              <span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                style={{ background: "linear-gradient(90deg,#1E90FF,#00BFFF)" }}
              />
            )}
          </button>
        </div>
        <div className="w-8" />
      </div>

      {/* Video scroll container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <StoryBar
          onOpenStory={(stories, startIndex) => setViewingStories({ stories, startIndex })}
        />
        {videos.length === 0 && (
          <div className="h-screen flex flex-col items-center justify-center text-white gap-4">
            <p className="text-gray-400 text-center">
              No videos yet.
              <br />
              Loading demo content...
            </p>
          </div>
        )}
        {videos.map((video, i) => (
          <div key={video.id} className="w-full h-screen snap-start snap-always flex-shrink-0">
            <VideoCard video={video} isActive={i === activeIndex} />
          </div>
        ))}
        {isFetchingNextPage && (
          <div className="h-16 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <BottomNav />
      {viewingStories && (
        <StoryViewer
          stories={viewingStories.stories}
          startIndex={viewingStories.startIndex}
          onClose={() => setViewingStories(null)}
        />
      )}
    </div>
  );
}
