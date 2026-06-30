import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export function initCloudinary() {
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("[cloudinary] Credenciais não configuradas. Upload de ficheiros não disponível.");
    return false;
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return true;
}

export function isCloudinaryReady() {
  return Boolean(cloudName && apiKey && apiSecret);
}

export { cloudinary };
