import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  CreateAdvisoryBody,
  CreateAdvisoryResponse,
  ListAdvisoriesHeader,
  ListAdvisoriesResponse,
  ExportAdvisoryHeader,
  ExportAdvisoryParams,
} from "@workspace/api-zod";
import { cropAdvisories, db, users } from "@workspace/db";
import { generateAdvisory } from "../lib/gemini";

const router: IRouter = Router();

async function getUserId(deviceId: string) {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.deviceId, deviceId)).limit(1);
  if (existing[0]) return existing[0].id;
  const created = await db.insert(users).values({ deviceId }).returning({ id: users.id });
  return created[0].id;
}

router.get("/advisories", async (req, res) => {
  const header = ListAdvisoriesHeader.safeParse({ "x-device-id": req.get("x-device-id") ?? undefined });
  if (!header.success) return res.status(400).json({ error: "Invalid device id" });
  try {
    const rows = await db.select().from(cropAdvisories).where(eq(cropAdvisories.userId, await getUserId(header.data["x-device-id"] || "anonymous-device"))).orderBy(desc(cropAdvisories.createdAt));
    const payload = rows.map((row) => ({ id: row.id, inputData: row.inputData, recommendation: row.aiRecommendation, createdAt: row.createdAt.toISOString() }));
    return res.json(ListAdvisoriesResponse.parse(payload));
  } catch (error) {
    req.log.error({ err: error }, "Failed to list advisories");
    return res.status(500).json({ error: "Failed to load advisories" });
  }
});

router.post("/advisories", async (req, res) => {
  const parsed = CreateAdvisoryBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid advisory fields" });
  try {
    const recommendation = await generateAdvisory(parsed.data);
    const userId = await getUserId(req.get("x-device-id") || "anonymous-device");
    const [row] = await db.insert(cropAdvisories).values({ userId, inputData: parsed.data, aiRecommendation: recommendation }).returning();
    return res.status(201).json(CreateAdvisoryResponse.parse({ id: row.id, inputData: row.inputData, recommendation: row.aiRecommendation, createdAt: row.createdAt.toISOString() }));
  } catch (error) {
    req.log.error({ err: error }, "Failed to generate advisory");
    return res.status(502).json({ error: "The advisory service is temporarily unavailable" });
  }
});

router.get("/advisories/:id/export", async (req, res) => {
  const params = ExportAdvisoryParams.safeParse({ id: Number(req.params.id) });
  const header = ExportAdvisoryHeader.safeParse({ "x-device-id": req.get("x-device-id") ?? undefined });
  if (!params.success || !header.success) return res.status(400).json({ error: "Invalid advisory id" });
  try {
    const [row] = await db.select().from(cropAdvisories).where(and(eq(cropAdvisories.id, params.data.id), eq(cropAdvisories.userId, await getUserId(header.data["x-device-id"] || "anonymous-device")))).limit(1);
    if (!row) return res.status(404).json({ error: "Advisory not found" });
    const input = row.inputData as Record<string, unknown>;
    const recommendation = row.aiRecommendation as { summary: string; crops: Array<{ name: string; category: string; fitScore: number; reason: string; plantingWindow: string }>; fertilizerSchedule: Array<{ stage: string; timing: string; recommendation: string }>; cautions: string[] };
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Crop advisory</title><style>body{font-family:Arial,sans-serif;max-width:780px;margin:40px auto;color:#172321;line-height:1.5}h1{color:#b85b25}section{border-top:1px solid #ddd;padding:18px 0}li{margin:7px 0}</style></head><body><h1>Crop advisory report</h1><p><strong>Region:</strong> ${String(input.region)} · <strong>Created:</strong> ${row.createdAt.toLocaleString()}</p><section><h2>${recommendation.summary}</h2><h3>Recommended crops</h3><ul>${recommendation.crops.map((crop) => `<li><strong>${crop.name}</strong> (${crop.fitScore}% fit) — ${crop.reason}. Planting window: ${crop.plantingWindow}.</li>`).join("")}</ul></section><section><h3>Fertilizer schedule</h3><ul>${recommendation.fertilizerSchedule.map((step) => `<li><strong>${step.stage}</strong> · ${step.timing}: ${step.recommendation}</li>`).join("")}</ul></section><section><h3>Cautions</h3><ul>${recommendation.cautions.map((item) => `<li>${item}</li>`).join("")}</ul></section></body></html>`;
    return res.type("html").send(html);
  } catch (error) {
    req.log.error({ err: error }, "Failed to export advisory");
    return res.status(500).json({ error: "Failed to export advisory" });
  }
});

export default router;