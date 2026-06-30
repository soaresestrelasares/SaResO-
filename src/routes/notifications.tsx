import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div className="min-h-screen bg-black text-white max-w-[480px] mx-auto pb-20">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">Notifications</h1>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Bell className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">No notifications yet</p>
      </div>
      <BottomNav />
    </div>
  );
}
