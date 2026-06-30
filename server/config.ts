import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";
const serviceName = "fullstack-starter";

export const serverConfig = {
  clientDistDir: path.resolve(serverDir, "../client"),
  host: isProduction ? "0.0.0.0" : "127.0.0.1",
  indexHtmlPath: path.resolve(serverDir, "../client/index.html"),
  isProduction,
  serviceName,
  port:
    Number(isProduction ? process.env.PORT : process.env.API_PORT) || (isProduction ? 3000 : 4001),
};
