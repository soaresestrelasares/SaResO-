import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { isCloudinaryReady } from "../cloudinary.js";

export const uploadRouter = Router();

// Custom type for Cloudinary file result (eager thumbnail added by multer-storage-cloudinary)
interface CloudinaryMulterFile extends Express.Multer.File {
  eager?: { secure_url: string }[];
}

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: (_req: Request, file: Express.Multer.File) => {
    const isVideo = file.mimetype.startsWith("video/");
    return {
      folder: isVideo ? "sareso/videos" : "sareso/images",
      resource_type: isVideo ? "video" : "image",
      allowed_formats: isVideo
        ? ["mp4", "mov", "avi", "mkv", "webm"]
        : ["jpg", "jpeg", "png", "webp", "gif"],
      // Auto-generate thumbnail for videos
      eager: isVideo ? [{ width: 640, height: 360, crop: "pad", format: "jpg" }] : undefined,
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = file.mimetype.startsWith("video/") || file.mimetype.startsWith("image/");
    if (!allowed) {
      cb(new Error("Tipo de ficheiro não suportado. Usa vídeo ou imagem."));
      return;
    }
    cb(null, true);
  },
});

uploadRouter.post(
  "/",
  authMiddleware,
  upload.array("files"),
  async (req: AuthRequest, res: Response) => {
    if (!isCloudinaryReady()) {
      res.status(503).json({ error: "Upload não configurado." });
      return;
    }

    const files = req.files as CloudinaryMulterFile[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ error: "Nenhum ficheiro enviado." });
      return;
    }

    const results = files.map((file) => ({
      url: file.path,
      publicId: file.filename,
      resourceType: file.mimetype.startsWith("video/") ? "video" : "image",
      thumbnailUrl:
        file.mimetype.startsWith("video/") && file.eager?.[0]?.secure_url
          ? file.eager[0].secure_url
          : file.path,
    }));

    res.json({ files: results });
  },
);

// Error handler for multer errors
uploadRouter.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[upload] error:", err);
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "Ficheiro demasiado grande. Máximo 100MB." });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: err?.message || "Erro no upload." });
});
