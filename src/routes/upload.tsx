import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Upload, Video, Image, X, Check, MapPin, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
});

type UploadFile = {
  file: File;
  preview: string;
  type: "video" | "image";
};

function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <p className="text-gray-400 mb-4">Precisas de iniciar sessão para publicar</p>
        <Link to="/login" className="bg-[#FE2C55] text-white px-6 py-3 rounded-lg font-semibold">
          Entrar
        </Link>
        <BottomNav />
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const newFiles: UploadFile[] = selected.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
    }));

    // Keep at most 1 video + up to 9 images, or just images
    const hasVideo =
      files.some((f) => f.type === "video") || newFiles.some((f) => f.type === "video");
    const totalCount = files.length + newFiles.length;
    if (hasVideo && totalCount > 1) {
      toast.error("Publicação com vídeo só pode ter 1 ficheiro. Escolhe vídeo OU fotos.");
      return;
    }
    if (totalCount > 10) {
      toast.error("Máximo de 10 ficheiros por publicação.");
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setError("");
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const uploadFiles = async (): Promise<{
    videoUrl?: string;
    thumbnailUrl?: string;
    imageUrls?: string[];
  }> => {
    if (files.length === 0) throw new Error("Seleciona pelo menos um ficheiro.");

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f.file));

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Erro ao carregar ficheiros.");
    }
    const data = await res.json();
    const uploaded = data.files as { url: string; thumbnailUrl?: string; resourceType: string }[];

    const video = uploaded.find((u) => u.resourceType === "video");
    const images = uploaded.filter((u) => u.resourceType === "image").map((u) => u.url);

    return {
      videoUrl: video?.url,
      thumbnailUrl: video?.thumbnailUrl || images[0],
      imageUrls: images,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("Seleciona um vídeo ou fotos.");
      return;
    }
    if (!title.trim()) {
      setError("Título obrigatório.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const { videoUrl, thumbnailUrl } = await uploadFiles();
      await api.createVideo({
        title,
        description,
        videoUrl: videoUrl || "",
        thumbnailUrl: thumbnailUrl || "",
        location,
        musicUrl,
        musicTitle,
      });
      setSuccess(true);
      setTimeout(() => navigate({ to: "/" }), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao publicar.");
    } finally {
      setUploading(false);
    }
  };

  const hasVideo = files.some((f) => f.type === "video");

  return (
    <div className="min-h-screen bg-black text-white max-w-[480px] mx-auto pb-20">
      <div className="flex items-center gap-4 p-4 border-b border-gray-800">
        <Link to="/">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold flex-1">Nova publicação</h1>
        <Button
          onClick={handleSubmit}
          disabled={uploading || files.length === 0}
          className="bg-[#FE2C55] hover:bg-[#d92546] text-white px-4 h-9"
        >
          {uploading ? "A publicar..." : "Publicar"}
        </Button>
      </div>

      {success ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-white" />
          </div>
          <p className="text-white font-semibold">Publicado com sucesso!</p>
          <p className="text-gray-400 text-sm">A redirecionar para o feed...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Preview area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full min-h-64 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-700 bg-gray-900 overflow-hidden cursor-pointer hover:border-[#FE2C55]/50 transition"
          >
            {files.length === 0 ? (
              <>
                <div className="flex gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                    <Video className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                    <Image className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
                <p className="text-white font-medium">Toca para adicionar vídeo ou fotos</p>
                <p className="text-gray-500 text-sm text-center px-6 mt-2">
                  Podes carregar 1 vídeo (com som) ou até 10 fotos.
                  <br />
                  Funciona com CapCut, Galeria, etc.
                </p>
              </>
            ) : (
              <div className="w-full p-3">
                <div className={`grid gap-2 ${files.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {files.map((f, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden aspect-[9/16] bg-black"
                    >
                      {f.type === "video" ? (
                        <video
                          src={f.preview}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img src={f.preview} alt="preview" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!hasVideo && files.length > 0 && files.length < 10 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-gray-700 text-white hover:bg-gray-900"
            >
              + Adicionar mais fotos
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descreve o teu vídeo/foto..."
              required
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-gray-600 text-sm"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adiciona hashtags, menções..."
              rows={3}
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-gray-600 text-sm resize-none"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Localização
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Lisboa, Portugal"
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-gray-600 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-1 block flex items-center gap-1">
              <Music className="w-3 h-3" /> Música
            </label>
            <input
              type="text"
              value={musicTitle}
              onChange={(e) => setMusicTitle(e.target.value)}
              placeholder="Título da música"
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-gray-600 text-sm"
            />
            <input
              type="url"
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              placeholder="Link do ficheiro de música (opcional)"
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 outline-none placeholder-gray-500 border border-gray-800 focus:border-gray-600 text-sm"
            />
          </div>

          {error && <p className="text-[#FE2C55] text-sm">{error}</p>}

          <Button
            type="submit"
            disabled={uploading || files.length === 0}
            className="w-full bg-[#FE2C55] hover:bg-[#d92546] text-white py-6 text-base font-semibold disabled:opacity-50"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Upload className="w-5 h-5 animate-bounce" /> A carregar...
              </span>
            ) : (
              "Publicar"
            )}
          </Button>
        </form>
      )}

      <BottomNav />
    </div>
  );
}
