import { GoogleGenAI } from "@google/genai";

const models = ["gemini-3.8-flash", "gemini-3-flash-preview"];

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenAI({ apiKey });
}

function parseJson(text: string) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned) as unknown;
}

async function generate(contents: Parameters<GoogleGenAI["models"]["generateContent"]>[0]["contents"]) {
  let lastError: unknown;
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await client().models.generateContent({
          model,
          contents,
          config: { responseMimeType: "application/json", maxOutputTokens: 8192 },
        });
      } catch (error) {
        lastError = error;
        const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 0;
        if (status !== 429 && status !== 503) throw error;
        await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export async function generateAdvisory(input: Record<string, unknown>) {
  const response = await generate(`You are an experienced agricultural advisor. Analyze this field data and return only valid JSON matching this shape:
{
  "summary": "one concise practical summary",
  "crops": [{"name":"string","category":"string","fitScore":0,"reason":"string","plantingWindow":"string"}],
  "fertilizerSchedule": [{"stage":"string","timing":"string","recommendation":"string"}],
  "cautions": ["string"]
}
Return exactly 3 crops, 2 to 4 fertilizer steps, and practical safety-aware guidance. Do not invent certainty. Field data: ${JSON.stringify(input)}`,
  );
  return parseJson(response.text ?? "");
}

export async function generateDiagnosis(
  imageData: string,
  region?: string,
) {
  const match = imageData.match(/^data:([^;,]+);base64,(.+)$/s);
  if (!match) throw new Error("Invalid image data");
  const [, mimeType, data] = match;
  const response = await generate([{
      role: "user",
      parts: [
        {
          text: `You are a careful plant pathologist. Inspect this leaf image${region ? ` from ${region}` : ""} and return only valid JSON matching this shape:
{
  "plant":"string",
  "condition":"string",
  "confidence":0,
  "severity":"Low|Moderate|High|Unknown",
  "explanation":"string",
  "treatment":["string"],
  "prevention":["string"]
}
Give a likely diagnosis, not false certainty. If the image is unclear, use condition "Unable to determine" and severity "Unknown".`,
        },
        { inlineData: { mimeType, data } },
      ],
    }]);
  return parseJson(response.text ?? "");
}