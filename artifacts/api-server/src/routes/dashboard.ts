import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { GetDashboardSummaryHeader, GetDashboardSummaryResponse } from "@workspace/api-zod";
import { cropAdvisories, db, diseaseScans, users } from "@workspace/db";

const router: IRouter = Router();

async function getUserId(deviceId: string) {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.deviceId, deviceId)).limit(1);
  if (existing[0]) return existing[0].id;
  const created = await db.insert(users).values({ deviceId }).returning({ id: users.id });
  return created[0].id;
}

router.get("/dashboard/summary", async (req, res) => {
  const header = GetDashboardSummaryHeader.safeParse({ "x-device-id": req.get("x-device-id") ?? undefined });
  if (!header.success) return res.status(400).json({ error: "Invalid device id" });
  try {
    const userId = await getUserId(header.data["x-device-id"] || "anonymous-device");
    const [advisories, scans] = await Promise.all([
      db.select().from(cropAdvisories).where(eq(cropAdvisories.userId, userId)).orderBy(desc(cropAdvisories.createdAt)),
      db.select().from(diseaseScans).where(eq(diseaseScans.userId, userId)).orderBy(desc(diseaseScans.createdAt)),
    ]);
    const latestAdvisory = advisories[0];
    const latestScan = scans[0];
    const payload = {
      advisoryCount: advisories.length,
      scanCount: scans.length,
      latestAdvisory: latestAdvisory ? { id: latestAdvisory.id, inputData: latestAdvisory.inputData, recommendation: latestAdvisory.aiRecommendation, createdAt: latestAdvisory.createdAt.toISOString() } : null,
      latestScan: latestScan ? { id: latestScan.id, imageUrl: latestScan.imageUrl || "", diagnosis: latestScan.aiDiagnosis, createdAt: latestScan.createdAt.toISOString() } : null,
      recentActivity: [
        ...advisories.map((row) => {
          const recommendation = row.aiRecommendation as { crops?: Array<{ name?: string }>; summary?: string };
          return { id: row.id, type: "advisory" as const, title: recommendation.crops?.[0]?.name || "Crop advisory", subtitle: recommendation.summary || "A new crop plan is ready", createdAt: row.createdAt.toISOString() };
        }),
        ...scans.map((row) => {
          const diagnosis = row.aiDiagnosis as { condition?: string; plant?: string };
          return { id: row.id, type: "scan" as const, title: diagnosis.condition || "Leaf scan", subtitle: diagnosis.plant || "Plant diagnosis", createdAt: row.createdAt.toISOString() };
        }),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12),
    };
    return res.json(GetDashboardSummaryResponse.parse(payload));
  } catch (error) {
    req.log.error({ err: error }, "Failed to load dashboard summary");
    return res.status(500).json({ error: "Failed to load dashboard summary" });
  }
});

export default router;