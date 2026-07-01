import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { TrendingUp, Hash, Users, Flame, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/discover")({
  component: DiscoverPage,
});

function DiscoverPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");

  const { data: trending = [] } = useQuery({
    queryKey: ["trending"],
    queryFn: () => api.getTrending(),
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ["suggestions"],
    queryFn: () => api.getSuggestions(),
    enabled: !!user,
  });

  const { data: hashtags = [] } = useQuery({
    queryKey: ["hashtags", query],
    queryFn: () => api.searchHashtags(query),
    enabled: query.length > 1,
  });

  const follow = async (userId: number) => {
    try {
      await api.toggleFollow(userId);
      toast.success("A seguir");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white max-w-[480px] mx-auto pb-20">
      <div className="sticky top-0 z-30 bg-black border-b border-gray-800 px-4 pt-12 pb-3">
        <h1 className="text-lg font-bold flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-orange-500" /> Discover
        </h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar hashtags, pessoas..."
          className="w-full bg-gray-900 text-white rounded-xl px-4 py-2.5 outline-none placeholder-gray-500 border border-gray-800 focus:border-gray-600 text-sm"
        />
      </div>

      <div className="p-4 space-y-6">
        {query.length > 1 && hashtags.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <Hash className="w-4 h-4" /> Hashtags
            </h2>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((h) => (
                <Link
                  key={h.tag}
                  to="/search"
                  search={{ q: "#" + h.tag }}
                  className="bg-gray-900 border border-gray-800 rounded-full px-3 py-1.5 text-sm hover:border-blue-500"
                >
                  #{h.tag} · {h.count}
                </Link>
              ))}
            </div>
          </section>
        )}

        {user && suggestions.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Sugestões para seguir
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {suggestions.map((u) => (
                <div
                  key={u.id}
                  className="min-w-[140px] bg-gray-900 border border-gray-800 rounded-2xl p-3 flex flex-col items-center text-center"
                >
                  <Link to="/profile/$username" params={{ username: u.username }}>
                    <img
                      src={u.avatarUrl || "/default-avatar.png"}
                      alt={u.username}
                      className="w-14 h-14 rounded-full object-cover mb-2"
                    />
                    <p className="font-semibold text-sm truncate w-full">@{u.username}</p>
                    <p className="text-gray-500 text-xs truncate w-full mb-2">{u.displayName}</p>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => follow(u.id)}
                    className="bg-[#22C55E] hover:bg-[#16A34A] text-white w-full"
                  >
                    <UserPlus className="w-3 h-3 mr-1" /> Seguir
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Em tendência
          </h2>
          {trending.length === 0 && (
            <p className="text-gray-500 text-sm">Ainda não há conteúdo em tendência.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {trending.slice(0, 6).map((v) => (
              <Link key={v.id} to="/" search={{ v: String(v.id) }}>
                <div className="aspect-[9/16] rounded-xl overflow-hidden bg-gray-900 relative">
                  <img
                    src={v.thumbnailUrl || "/placeholder.png"}
                    alt={v.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs font-semibold truncate">@{v.username}</p>
                    <p className="text-xs text-gray-300">{v.viewsCount} views</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
