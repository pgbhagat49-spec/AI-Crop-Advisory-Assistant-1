import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { CreateScanBody, CreateScanResponse, ListScansHeader, ListScansResponse } from "@workspace/api-zod";
import { db, diseaseScans, users } from "@workspace/db";
import { generateDiagnosis } from "../lib/gemini";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const storage = new ObjectStorageService();

async function getUserId(deviceId: string) {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.deviceId, deviceId)).limit(1);
  if (existing[0]) return existing[0].id;
  const created = await db.insert(users).values({ deviceId }).returning({ id: users.id });
  return created[0].id;
}

router.get("/scans", async (req, res) => {
  const header = ListScansHeader.safeParse({ "x-device-id": req.get("x-device-id") ?? undefined });
  if (!header.success) return res.status(400).json({ error: "Invalid device id" });
  try {
    const rows = await db.select().from(diseaseScans).where(eq(diseaseScans.userId, await getUserId(header.data["x-device-id"] || "anonymous-device"))).orderBy(desc(diseaseScans.createdAt));
    const payload = rows.map((row) => ({ id: row.id, imageUrl: row.imageUrl || "", diagnosis: row.aiDiagnosis, createdAt: row.createdAt.toISOString() }));
    return res.json(ListScansResponse.parse(payload));
  } catch (error) {
    req.log.error({ err: error }, "Failed to list scans");
    return res.status(500).json({ error: "Failed to load scans" });
  }
});

router.post("/scans", async (req, res) => {
  const parsed = CreateScanBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid scan image" });
  try {
    const diagnosis = await generateDiagnosis(parsed.data.imageData, parsed.data.region);
    const imageUrl = await storage.saveDataUrl(parsed.data.imageData, "image/jpeg");
    const userId = await getUserId(req.get("x-device-id") || "anonymous-device");
    const [row] = await db.insert(diseaseScans).values({ userId, imageUrl, aiDiagnosis: diagnosis }).returning();
    return res.status(201).json(CreateScanResponse.parse({ id: row.id, imageUrl, diagnosis: row.aiDiagnosis, createdAt: row.createdAt.toISOString() }));
  } catch (error) {
    req.log.error({ err: error }, "Failed to generate scan");
    return res.status(502).json({ error: "The scan service is temporarily unavailable" });
  }
});

export default router;