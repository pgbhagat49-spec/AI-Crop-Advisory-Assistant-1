import { Router, type IRouter } from "express";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const storage = new ObjectStorageService();

router.get("/storage/objects/*path", async (req, res) => {
  try {
    const raw = req.params.path;
    const objectName = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await storage.getFile(objectName);
    const [metadata] = await file.getMetadata();
    res.setHeader("Content-Type", metadata.contentType || "application/octet-stream");
    res.setHeader("Cache-Control", "private, max-age=3600");
    file.createReadStream().on("error", () => res.end()).pipe(res);
  } catch (error) {
    req.log.warn({ err: error }, "Object not found");
    res.status(404).json({ error: "Object not found" });
  }
});

export default router;