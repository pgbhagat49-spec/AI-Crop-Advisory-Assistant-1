import { integer, jsonb, serial, text, timestamp, pgTable } from "drizzle-orm/pg-core";
import { users } from "./users";

export const diseaseScans = pgTable("disease_scans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  imageUrl: text("image_url"),
  aiDiagnosis: jsonb("ai_diagnosis").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type DiseaseScan = typeof diseaseScans.$inferSelect;