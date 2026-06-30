import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Upload } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
});

function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", videoUrl: "", thumbnailUrl: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <p className="text-gray-400 mb-4">You need to log in to upload videos</p>
        <Link to="/login" className="bg-[#FE2C55] text-white px-6 py-3 rounded-lg font-semibold">
          Log in
        </Link>
        <BottomNav />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.videoUrl) {
      setError("Video URL is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.createVideo(form);
      setSuccess(true);
      setTimeout(() => navigate({ to: "/" }), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-black text-white max-w-[480px] mx-auto pb-20">
      <div className="flex items-center gap-4 p-4 border-b border-gray-800">
        <Link to="/">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold">Post a video</h1>
      </div>

      {success ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-white font-semibold">Video posted successfully!</p>
          <p className="text-gray-400 text-sm">Redirecting to feed...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Preview area */}
          <div className="w-full aspect-[9/16] max-h-64 bg-gray-900 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-700">
            {form.videoUrl ? (
              <video
                src={form.videoUrl}
                className="w-full h-full object-cover rounded-xl"
                muted
                poster={form.thumbnailUrl || undefined}
              />
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-500 mb-2" />
                <p className="text-gray-500 text-sm text-center">
                  Paste a video URL below
                  <br />
                  to preview
                </p>
              </>
            )}
          </div>

          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">
              Video URL *
            </label>
            <input
              type="url"
              value={form.videoUrl}
              onChange={set("videoUrl")}
              placeholder="https://..."
              required
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-gray-600 text-sm"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">
              Thumbnail URL
            </label>
            <input
              type="url"
              value={form.thumbnailUrl}
              onChange={set("thumbnailUrl")}
              placeholder="https://..."
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-gray-600 text-sm"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={set("title")}
              placeholder="Describe your video..."
              required
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-gray-600 text-sm"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="Add hashtags, mentions..."
              rows={3}
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-gray-600 text-sm resize-none"
            />
          </div>
          {error && <p className="text-[#FE2C55] text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FE2C55] text-white font-bold py-3.5 rounded-lg disabled:opacity-60 text-base"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </form>
      )}

      <BottomNav />
    </div>
  );
}
