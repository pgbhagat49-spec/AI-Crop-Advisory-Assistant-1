import { randomUUID } from "node:crypto";
import { Storage, type File } from "@google-cloud/storage";

const SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${SIDECAR_ENDPOINT}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function parseObjectPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const [, bucketName, ...objectParts] = normalized.split("/");
  if (!bucketName || objectParts.length === 0) throw new Error("Invalid object path");
  return { bucketName, objectName: objectParts.join("/") };
}

function privateDir() {
  const dir = process.env.PRIVATE_OBJECT_DIR;
  if (!dir) throw new Error("PRIVATE_OBJECT_DIR is not configured");
  return dir.replace(/\/$/, "");
}

export class ObjectStorageService {
  async saveDataUrl(dataUrl: string, contentType: string) {
    const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/s);
    if (!match) throw new Error("Invalid image data");
    const [, detectedType, encoded] = match;
    const objectPath = `${privateDir()}/uploads/${randomUUID()}`;
    const { bucketName, objectName } = parseObjectPath(objectPath);
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    await file.save(Buffer.from(encoded, "base64"), {
      resumable: false,
      metadata: { contentType: detectedType || contentType, cacheControl: "private, max-age=3600" },
    });
    return `/api/storage/objects/${objectName.replace(/^\.private\//, "")}`;
  }

  async getFile(objectName: string): Promise<File> {
    const { bucketName, objectName: parsedName } = parseObjectPath(`${privateDir()}/${objectName}`);
    const file = objectStorageClient.bucket(bucketName).file(parsedName);
    const [exists] = await file.exists();
    if (!exists) throw new Error("Object not found");
    return file;
  }
}