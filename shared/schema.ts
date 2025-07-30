import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  messageType: varchar("message_type", { enum: ["text", "image", "video", "file"] }).notNull().default("text"),
  mediaUrl: text("media_url"),
  mediaFilename: text("media_filename"),
  viewCount: integer("view_count").notNull().default(0),
  isPinned: integer("is_pinned").notNull().default(0),
  reactionCount: integer("reaction_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  viewCount: true,
  isPinned: true,
  reactionCount: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
