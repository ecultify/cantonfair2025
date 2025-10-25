import type { Vendor, Product, POC, Media, Note, FollowUp, Tag, Link, Meeting } from "../db/dexie";
import type { QuickCapture, CreateQuickCaptureInput, User } from "../db/types";

export interface DataAdapter {
  vendors: {
    findAll: (userId: string, filters?: VendorFilters) => Promise<Vendor[]>;
    findById: (id: string) => Promise<Vendor | null>;
    create: (vendor: Omit<Vendor, "id" | "createdAt" | "updatedAt">) => Promise<Vendor>;
    update: (id: string, vendor: Partial<Vendor>) => Promise<Vendor>;
    delete: (id: string) => Promise<void>;
    search: (userId: string, query: string) => Promise<Vendor[]>;
  };
  products: {
    findAll: (userId: string, filters?: ProductFilters) => Promise<Product[]>;
    findByVendorId: (vendorId: string) => Promise<Product[]>;
    findById: (id: string) => Promise<Product | null>;
    create: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<Product>;
    update: (id: string, product: Partial<Product>) => Promise<Product>;
    delete: (id: string) => Promise<void>;
  };
  pocs: {
    findByVendorId: (vendorId: string) => Promise<POC[]>;
    create: (poc: Omit<POC, "id" | "createdAt" | "updatedAt">) => Promise<POC>;
    update: (id: string, poc: Partial<POC>) => Promise<POC>;
    delete: (id: string) => Promise<void>;
  };
  media: {
    findAll: (userId: string) => Promise<Media[]>;
    findByVendorId: (vendorId: string) => Promise<Media[]>;
    findByProductId: (productId: string) => Promise<Media[]>;
    create: (media: Omit<Media, "id" | "createdAt">) => Promise<Media>;
    delete: (id: string) => Promise<void>;
  };
  notes: {
    findAll: (userId: string) => Promise<Note[]>;
    findByVendorId: (vendorId: string) => Promise<Note[]>;
    create: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => Promise<Note>;
    update: (id: string, note: Partial<Note>) => Promise<Note>;
    delete: (id: string) => Promise<void>;
  };
  followUps: {
    findAll: (userId: string) => Promise<FollowUp[]>;
    findByVendorId: (vendorId: string) => Promise<FollowUp[]>;
    findUpcoming: (userId: string, days: number) => Promise<FollowUp[]>;
    create: (followUp: Omit<FollowUp, "id" | "createdAt" | "updatedAt">) => Promise<FollowUp>;
    update: (id: string, followUp: Partial<FollowUp>) => Promise<FollowUp>;
    delete: (id: string) => Promise<void>;
  };
  tags: {
    findAll: (userId: string) => Promise<Tag[]>;
    create: (tag: Omit<Tag, "id" | "createdAt">) => Promise<Tag>;
    delete: (id: string) => Promise<void>;
  };
  links: {
    findByVendorId: (vendorId: string) => Promise<Link[]>;
    create: (link: Omit<Link, "id" | "createdAt">) => Promise<Link>;
    delete: (id: string) => Promise<void>;
  };
  meetings: {
    findByVendorId: (vendorId: string) => Promise<Meeting[]>;
    create: (meeting: Omit<Meeting, "id" | "createdAt" | "updatedAt">) => Promise<Meeting>;
    update: (id: string, meeting: Partial<Meeting>) => Promise<Meeting>;
    delete: (id: string) => Promise<void>;
  };
  quickCaptures: {
    findAll: (userId: string, limit?: number, offset?: number) => Promise<QuickCapture[]>;
    findById: (id: string) => Promise<QuickCapture | null>;
    create: (capture: CreateQuickCaptureInput) => Promise<QuickCapture>;
    update: (id: string, capture: Partial<QuickCapture>) => Promise<QuickCapture>;
    delete: (id: string) => Promise<void>;
  };
  admin: {
    isAdmin: (userId: string) => Promise<boolean>;
    getAllUsers: () => Promise<User[]>;
    deleteUser: (userId: string) => Promise<void>;
  };
}

export interface VendorFilters {
  phase?: string;
  hall?: string;
  category?: string;
  tags?: string[];
  country?: string;
}

export interface ProductFilters {
  vendorId?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minMoq?: number;
  maxMoq?: number;
  rating?: number;
}
