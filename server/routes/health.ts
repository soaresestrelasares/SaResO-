import { Router } from "express";

import { serverConfig } from "../config.js";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.json({
    ok: true,
    service: serverConfig.serviceName,
    version: "2.0.0",
    started: new Date().toISOString(),
  });
});
