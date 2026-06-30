import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import net from "net";

const RESERVED_PORTS = new Set([3000]);

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const srv = net.createServer();
      srv.unref();
      srv.on("error", reject);
      srv.listen(0, "0.0.0.0", () => {
        const addr = srv.address();
        const port = typeof addr === "object" && addr ? addr.port : 0;
        srv.close(() => {
          if (!port || RESERVED_PORTS.has(port)) {
            tryOnce();
          } else {
            resolve(port);
          }
        });
      });
    };
    tryOnce();
  });
}

const CONTAINER = process.env.VERDENT_CONTAINER_NAME;
const PREVIEW_DOMAIN = process.env.VERDENT_DEV_PREVIEW_DOMAIN;
const API_PORT = Number(process.env.API_PORT) || 4001;

const envPort = Number(process.env.PORT);
const PORT = envPort && envPort !== 3000 ? envPort : await getFreePort();
process.env.PORT = String(PORT);

if (CONTAINER && PREVIEW_DOMAIN) {
  console.log(`\n  ➜  Preview URL:  https://${CONTAINER}-${PORT}.${PREVIEW_DOMAIN}\n`);
}

export default defineConfig({
  base: "./",
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    host: "0.0.0.0",
    port: PORT,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: true,
      },
    },
    hmr:
      CONTAINER && PREVIEW_DOMAIN
        ? {
            host: `${CONTAINER}-${PORT}.${PREVIEW_DOMAIN}`,
            protocol: "wss",
            clientPort: 443,
          }
        : undefined,
  },
});
