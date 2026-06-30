import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { Search } from "lucide-react";

export const Route = createFileRoute("/search")({
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
  return (
    <div className="min-h-screen bg-black text-white max-w-[480px] mx-auto pb-20">
      <div className="p-4">
        <div className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3 border border-gray-800">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            className="flex-1 bg-transparent text-white outline-none placeholder-gray-500 text-sm"
          />
        </div>
      </div>
      <div className="px-4">
        <h2 className="text-base font-bold mb-3">Trending</h2>
        <div className="grid grid-cols-2 gap-3">
          {TRENDING.map((t) => (
            <div key={t.tag} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-white font-bold text-sm">{t.tag}</p>
              <p className="text-gray-500 text-xs mt-1">{t.views} views</p>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
