import { type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  
  // Message operations
  getAllMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  incrementViewCount(messageId: string): Promise<void>;
  togglePin(messageId: string): Promise<void>;
  addReaction(messageId: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
  searchMessages(query: string): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, any>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
  }

  async getUser(id: string): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = randomUUID();
    const user: any = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllMessages(): Promise<Message[]> {
    const allMessages = Array.from(this.messages.values());
    return allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      id,
      content: insertMessage.content,
      messageType: insertMessage.messageType || "text",
      mediaUrl: insertMessage.mediaUrl || null,
      mediaFilename: insertMessage.mediaFilename || null,
      viewCount: 0,
      isPinned: 0,
      reactionCount: 0,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async incrementViewCount(messageId: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.viewCount += 1;
      this.messages.set(messageId, message);
    }
  }

  async togglePin(messageId: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.isPinned = message.isPinned ? 0 : 1;
      this.messages.set(messageId, message);
    }
  }

  async addReaction(messageId: string): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.reactionCount += 1;
      this.messages.set(messageId, message);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    this.messages.delete(messageId);
  }

  async searchMessages(query: string): Promise<Message[]> {
    const allMessages = Array.from(this.messages.values());
    const filtered = allMessages.filter(message => 
      message.content.toLowerCase().includes(query.toLowerCase()) ||
      (message.mediaFilename && message.mediaFilename.toLowerCase().includes(query.toLowerCase()))
    );
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();
