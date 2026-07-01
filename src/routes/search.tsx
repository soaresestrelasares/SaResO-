import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Video } from "@/lib/api-types";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  component: SearchPage,
});

const TRENDING = [
  { tag: "#nature", views: "2.4B" },
  { tag: "#dance", views: "1.8B" },
  { tag: "#cooking", views: "956M" },
  { tag: "#travel", views: "732M" },
  { tag: "#fitness", views: "621M" },
  { tag: "#comedy", views: "1.2B" },
  { tag: "#fashion", views: "891M" },
  { tag: "#music", views: "3.1B" },
];

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [inputValue, setInputValue] = useState(q ?? "");

  // Normalize: if q starts with #, strip it for the keyword search
  const keyword = q ? (q.startsWith("#") ? q.slice(1) : q) : "";

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ["search", keyword],
    queryFn: () => api.getFeed(0),
    enabled: keyword.length > 0,
    select: (data) =>
      data.filter(
        (v) =>
          v.title.toLowerCase().includes(keyword.toLowerCase()) ||
          (v.description ?? "").toLowerCase().includes(keyword.toLowerCase()),
      ),
  });

  const handleSearch = (value: string) => {
    setInputValue(value);
    if (value.trim()) {
      navigate({ search: { q: value.trim() } });
    } else {
      navigate({ search: {} });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white max-w-[480px] mx-auto pb-20">
      <div className="p-4">
        <div className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3 border border-gray-800">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            value={inputValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-white outline-none placeholder-gray-500 text-sm"
          />
        </div>
      </div>

      {keyword ? (
        <div className="px-4">
          <h2 className="text-base font-bold mb-3">Results for &ldquo;{q}&rdquo;</h2>
          {isLoading && <p className="text-gray-500 text-sm text-center py-8">Searching...</p>}
          {!isLoading && videos.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No videos found.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {videos.map((v) => (
              <a
                key={v.id}
                href={`/?v=${v.id}`}
                className="relative aspect-[9/16] bg-gray-900 rounded-xl overflow-hidden block"
              >
                {v.thumbnailUrl ? (
                  <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-600 text-xs text-center px-2">{v.title}</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs font-semibold line-clamp-2">{v.title}</p>
                  <p className="text-gray-300 text-xs">@{v.username}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4">
          <h2 className="text-base font-bold mb-3">Trending</h2>
          <div className="grid grid-cols-2 gap-3">
            {TRENDING.map((t) => (
              <button
                key={t.tag}
                onClick={() => handleSearch(t.tag)}
                className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-left"
              >
                <p className="text-white font-bold text-sm">{t.tag}</p>
                <p className="text-gray-500 text-xs mt-1">{t.views} views</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
