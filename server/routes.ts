import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage_multer });

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));

  // Get all messages
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Create a new message (text only)
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  // Create a new message with file upload
  app.post("/api/messages/upload", upload.single('file'), async (req, res) => {
    try {
      const { content, messageType } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const messageData = {
        content: content || "",
        messageType: messageType as "image" | "video",
        mediaUrl: `/uploads/${req.file.filename}`,
        mediaFilename: req.file.originalname
      };

      const validatedData = insertMessageSchema.parse(messageData);
      const message = await storage.createMessage(validatedData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data or file upload failed" });
    }
  });

  // Increment view count for a message
  app.post("/api/messages/:id/view", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementViewCount(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to increment view count" });
    }
  });

  // Toggle pin status for a message
  app.post("/api/messages/:id/pin", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.togglePin(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle pin status" });
    }
  });

  // Toggle reaction to a message
  app.post("/api/messages/:id/reaction", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.body.userId || "anonymous";
      const emoji = req.body.emoji || "❤️";
      await storage.toggleReaction(id, userId, emoji);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle reaction" });
    }
  });

  // Delete a message
  app.delete("/api/messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMessage(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // Search messages
  app.get("/api/messages/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Search query is required" });
      }
      const messages = await storage.searchMessages(q);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to search messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
