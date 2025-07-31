
import { type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  
  // Message operations
  getAllMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  incrementViewCount(messageId: string): Promise<void>;
  togglePin(messageId: string): Promise<void>;
  toggleReaction(messageId: string, userId: string, emoji?: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
  searchMessages(query: string): Promise<Message[]>;
}

export class FileStorage implements IStorage {
  private dataDir: string;
  private usersFile: string;
  private messagesFile: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.messagesFile = path.join(this.dataDir, 'messages.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Initialize files if they don't exist
    if (!fs.existsSync(this.usersFile)) {
      fs.writeFileSync(this.usersFile, JSON.stringify({}));
    }
    
    if (!fs.existsSync(this.messagesFile)) {
      fs.writeFileSync(this.messagesFile, JSON.stringify({}));
    }
  }

  private readUsers(): Map<string, any> {
    try {
      const data = fs.readFileSync(this.usersFile, 'utf8');
      const obj = JSON.parse(data);
      return new Map(Object.entries(obj));
    } catch {
      return new Map();
    }
  }

  private writeUsers(users: Map<string, any>): void {
    const obj = Object.fromEntries(users);
    fs.writeFileSync(this.usersFile, JSON.stringify(obj, null, 2));
  }

  private readMessages(): Map<string, Message> {
    try {
      const data = fs.readFileSync(this.messagesFile, 'utf8');
      const obj = JSON.parse(data);
      const messages = new Map<string, Message>();
      
      Object.entries(obj).forEach(([id, message]: [string, any]) => {
        messages.set(id, {
          ...message,
          createdAt: new Date(message.createdAt)
        });
      });
      
      return messages;
    } catch {
      return new Map();
    }
  }

  private writeMessages(messages: Map<string, Message>): void {
    const obj = Object.fromEntries(messages);
    fs.writeFileSync(this.messagesFile, JSON.stringify(obj, null, 2));
  }

  async getUser(id: string): Promise<any | undefined> {
    const users = this.readUsers();
    return users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    const users = this.readUsers();
    return Array.from(users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const users = this.readUsers();
    const id = randomUUID();
    const user: any = { ...insertUser, id };
    users.set(id, user);
    this.writeUsers(users);
    return user;
  }

  async getAllMessages(): Promise<Message[]> {
    const messages = this.readMessages();
    const allMessages = Array.from(messages.values());
    return allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const messages = this.readMessages();
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
      userReactions: "[]",
      reactions: "{}",
      createdAt: new Date(),
    };
    messages.set(id, message);
    this.writeMessages(messages);
    return message;
  }

  async incrementViewCount(messageId: string): Promise<void> {
    const messages = this.readMessages();
    const message = messages.get(messageId);
    if (message) {
      message.viewCount += 1;
      messages.set(messageId, message);
      this.writeMessages(messages);
    }
  }

  async togglePin(messageId: string): Promise<void> {
    const messages = this.readMessages();
    const message = messages.get(messageId);
    if (message) {
      message.isPinned = message.isPinned ? 0 : 1;
      messages.set(messageId, message);
      this.writeMessages(messages);
    }
  }

  async toggleReaction(messageId: string, userId: string = "anonymous", emoji: string = "❤️"): Promise<void> {
    const messages = this.readMessages();
    const message = messages.get(messageId);
    if (message) {
      const reactions = JSON.parse(message.reactions || "{}");
      
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      
      const userIndex = reactions[emoji].indexOf(userId);
      
      if (userIndex > -1) {
        // Remove reaction
        reactions[emoji].splice(userIndex, 1);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      } else {
        // Add reaction
        reactions[emoji].push(userId);
      }
      
      // Calculate total reaction count
      message.reactionCount = Object.values(reactions).reduce((total: number, users: any) => total + users.length, 0);
      message.reactions = JSON.stringify(reactions);
      messages.set(messageId, message);
      this.writeMessages(messages);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    const messages = this.readMessages();
    messages.delete(messageId);
    this.writeMessages(messages);
  }

  async searchMessages(query: string): Promise<Message[]> {
    const messages = this.readMessages();
    const allMessages = Array.from(messages.values());
    const filtered = allMessages.filter(message => 
      message.content.toLowerCase().includes(query.toLowerCase()) ||
      (message.mediaFilename && message.mediaFilename.toLowerCase().includes(query.toLowerCase()))
    );
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new FileStorage();
