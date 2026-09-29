import { integer, jsonb, serial, timestamp, pgTable } from "drizzle-orm/pg-core";
import { users } from "./users";

export const cropAdvisories = pgTable("crop_advisories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  inputData: jsonb("input_data").notNull(),
  aiRecommendation: jsonb("ai_recommendation").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CropAdvisory = typeof cropAdvisories.$inferSelect;