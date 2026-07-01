import { Link, useLocation } from "@tanstack/react-router";
import { Home, Briefcase, MessageCircle, Plus, User, Compass, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications(),
    enabled: !!user,
    refetchInterval: 30000,
  });
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const staticItems = [
    { to: "/" as const, icon: Home, label: "Feed" },
    { to: "/discover" as const, icon: Compass, label: "Discover" },
    { to: "/jobs" as const, icon: Briefcase, label: "Emprego" },
    { to: "/upload" as const, icon: Plus, label: "", special: true },
    { to: "/messages" as const, icon: MessageCircle, label: "Chat" },
    { to: "/notifications" as const, icon: Bell, label: "Notificações" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800 flex items-center justify-around h-16 max-w-[480px] mx-auto">
      {staticItems.map((item) => {
        const active = path === item.to || (item.to !== "/" && path.startsWith(item.to));
        if (item.special) {
          return (
            <Link key={item.to} to={item.to} className="flex items-center justify-center">
              <span
                className="rounded-xl px-3 py-2 flex items-center gap-0.5"
                style={{ background: "linear-gradient(135deg,#0A1628,#0D2657)" }}
              >
                <span
                  className="w-5 h-5 rounded-sm flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#1E90FF,#00BFFF)" }}
                >
                  <item.icon className="w-3 h-3 text-white" />
                </span>
                <span
                  className="w-5 h-5 rounded-sm flex items-center justify-center -ml-1.5"
                  style={{ background: "linear-gradient(135deg,#00BFFF,#0047AB)" }}
                >
                  <item.icon className="w-3 h-3 text-white" />
                </span>
                <span className="w-5 h-5 bg-white rounded-sm flex items-center justify-center -ml-1.5">
                  <item.icon className="w-3 h-3 text-blue-700" />
                </span>
              </span>
            </Link>
          );
        }
        return (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-0.5 py-1 min-w-[48px] relative"
          >
            <item.icon
              className={`w-5 h-5 ${active ? "text-blue-400" : "text-gray-500"}`}
              strokeWidth={active ? 2.5 : 1.5}
            />
            {item.to === "/notifications" && unreadCount > 0 && (
              <span className="absolute top-0 right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            <span
              className={`text-[9px] ${active ? "text-blue-400 font-semibold" : "text-gray-500"}`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}

      {user ? (
        <Link
          to="/profile/$username"
          params={{ username: user.username }}
          className="flex flex-col items-center gap-0.5 py-1"
        >
          <User
            className={`w-6 h-6 ${path.startsWith("/profile/") ? "text-blue-400" : "text-gray-500"}`}
            strokeWidth={path.startsWith("/profile/") ? 2.5 : 1.5}
          />
          <span
            className={`text-[10px] ${path.startsWith("/profile/") ? "text-blue-400 font-semibold" : "text-gray-500"}`}
          >
            Perfil
          </span>
        </Link>
      ) : (
        <Link to="/login" className="flex flex-col items-center gap-0.5 py-1">
          <User
            className={`w-6 h-6 ${path === "/login" ? "text-blue-400" : "text-gray-500"}`}
            strokeWidth={path === "/login" ? 2.5 : 1.5}
          />
          <span
            className={`text-[10px] ${path === "/login" ? "text-blue-400 font-semibold" : "text-gray-500"}`}
          >
            Perfil
          </span>
        </Link>
      )}
    </nav>
  );
}
