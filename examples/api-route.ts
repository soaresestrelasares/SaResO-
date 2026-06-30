import { Router } from "express";
import { z } from "zod";

import { getDb } from "../server/db.js";
import { asyncHandler } from "../server/http.js";
import { exampleRecords } from "./schema.js";

// Move shared request schemas to server/validation.ts in product code.
const createExampleRecordSchema = z.object({
  name: z.string().trim().min(1).max(255),
});

export const exampleRecordsRouter = Router();

exampleRecordsRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    response.json({ records: await getDb().select().from(exampleRecords) });
  }),
);

exampleRecordsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const body = createExampleRecordSchema.parse(request.body);
    const [record] = await getDb().insert(exampleRecords).values(body).$returningId();

    response.status(201).json({ record });
  }),
);
