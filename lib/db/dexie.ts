import Dexie, { type Table } from "dexie";

export interface Vendor {
  id: string;
  companyName: string;
  brandName?: string;
  country?: string;
  website?: string;
  email?: string;
  phone?: string;
  wechatId?: string;
  whatsapp?: string;
  address?: string;
  phase?: string;
  hall?: string;
  stall?: string;
  aisle?: string;
  mapLink?: string;
  source: string;
  tags: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface POC {
  id: string;
  vendorId: string;
  name: string;
  designation?: string;
  email?: string;
  phone?: string;
  wechatId?: string;
  whatsapp?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  category?: string;
  subcategory?: string;
  description?: string;
  moq?: number;
  unitPrice?: number;
  currency: string;
  leadTime?: string;
  hsCode?: string;
  certifications?: string;
  samplesAvailable: boolean;
  warranty?: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Media {
  id: string;
  vendorId?: string;
  productId?: string;
  type: "image" | "video" | "card";
  fileUrl?: string;
  localPath?: string;
  thumbUrl?: string;
  ocrJson?: any;
  notes?: string;
  userId: string;
  createdAt: Date;
}

export interface Note {
  id: string;
  vendorId?: string;
  productId?: string;
  text: string;
  sentiment: "hot" | "neutral" | "cold";
  nextSteps?: string;
  bookmarked: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meeting {
  id: string;
  vendorId: string;
  meetingAt: Date;
  location?: string;
  attendees?: string;
  summary?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FollowUp {
  id: string;
  vendorId: string;
  status: "to-contact" | "quoted" | "sampling" | "ordered" | "on-hold" | "closed";
  dueAt?: Date;
  remind: boolean;
  assignee?: string;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  label: string;
  color: string;
  userId: string;
  createdAt: Date;
}

export interface Link {
  id: string;
  vendorId: string;
  type: "catalog" | "pdf" | "site" | "map";
  url: string;
  title?: string;
  createdAt: Date;
}

export interface SyncQueue {
  id: string;
  entityType: string;
  entityId: string;
  operation: "create" | "update" | "delete";
  payload: any;
  userId: string;
  synced: boolean;
  createdAt: Date;
}

// NEW: QuickCapture interface for unified capture form
export interface QuickCapture {
  id: string;
  
  // Product Media
  mediaType?: 'photo' | 'video';
  mediaUrl?: string;
  mediaThumbUrl?: string;
  
  // Remarks & Product Name
  productName: string;
  remarks?: string;
  
  // Visiting Card
  visitingCardUrl?: string;
  cardOcrJson?: {
    companyName?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    [key: string]: any;
  };
  
  // POC Details
  pocName?: string;
  pocCompany?: string;
  pocCity?: string;
  
  // Metadata
  userId: string;
  vendorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQuickCaptureInput {
  mediaType?: 'photo' | 'video';
  mediaUrl?: string;
  mediaThumbUrl?: string;
  productName: string;
  remarks?: string;
  visitingCardUrl?: string;
  cardOcrJson?: any;
  pocName?: string;
  pocCompany?: string;
  pocCity?: string;
  userId: string;
  vendorId?: string;
}

export class CantonFairDB extends Dexie {
  vendors!: Table<Vendor>;
  pocs!: Table<POC>;
  products!: Table<Product>;
  media!: Table<Media>;
  notes!: Table<Note>;
  meetings!: Table<Meeting>;
  followUps!: Table<FollowUp>;
  tags!: Table<Tag>;
  links!: Table<Link>;
  syncQueue!: Table<SyncQueue>;
  quickCaptures!: Table<QuickCapture>; // NEW

  constructor() {
    super("CantonFairDB");

    // Keep version 1 for backward compatibility
    this.version(1).stores({
      vendors: "id, userId, companyName, phase, hall, stall, createdAt",
      pocs: "id, vendorId, name",
      products: "id, vendorId, name, category, rating",
      media: "id, vendorId, productId, userId, type, createdAt",
      notes: "id, vendorId, productId, userId, sentiment, bookmarked, createdAt",
      meetings: "id, vendorId, userId, meetingAt",
      followUps: "id, vendorId, userId, status, dueAt, createdAt",
      tags: "id, userId, label",
      links: "id, vendorId, type",
      syncQueue: "id, userId, entityType, synced, createdAt",
    });

    // NEW: Version 2 adds quickCaptures table
    this.version(2).stores({
      vendors: "id, userId, companyName, phase, hall, stall, createdAt",
      pocs: "id, vendorId, name",
      products: "id, vendorId, name, category, rating",
      media: "id, vendorId, productId, userId, type, createdAt",
      notes: "id, vendorId, productId, userId, sentiment, bookmarked, createdAt",
      meetings: "id, vendorId, userId, meetingAt",
      followUps: "id, vendorId, userId, status, dueAt, createdAt",
      tags: "id, userId, label",
      links: "id, vendorId, type",
      syncQueue: "id, userId, entityType, synced, createdAt",
      quickCaptures: "id, userId, productName, createdAt", // NEW
    });
  }
}

let dbInstance: CantonFairDB | null = null;

export const getDB = () => {
  if (typeof window === "undefined") {
    return null;
  }
  if (!dbInstance) {
    dbInstance = new CantonFairDB();
  }
  return dbInstance;
};

export const db = typeof window !== "undefined" ? new CantonFairDB() : null as any;