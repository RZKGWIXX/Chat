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
}

export const storage = new MemStorage();
