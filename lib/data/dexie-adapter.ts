import { getDB } from "../db/dexie";
import type { DataAdapter, VendorFilters, ProductFilters } from "./adapter";
import type { Vendor, Product, POC, Media, Note, FollowUp, Tag, Link, Meeting, QuickCapture, CreateQuickCaptureInput } from "../db/dexie";

const getDb = () => {
  const db = getDB();
  if (!db) {
    throw new Error("Dexie database is not available on the server side");
  }
  return db;
};

export const dexieAdapter: DataAdapter = {
  vendors: {
    async findAll(userId: string, filters?: VendorFilters) {
      const db = getDb();
      let query = getDb().vendors.where("userId").equals(userId);

      let results = await query.toArray();

      if (filters) {
        if (filters.phase) {
          results = results.filter(v => v.phase === filters.phase);
        }
        if (filters.hall) {
          results = results.filter(v => v.hall === filters.hall);
        }
        if (filters.tags && filters.tags.length > 0) {
          results = results.filter(v =>
            filters.tags!.some(tag => v.tags.includes(tag))
          );
        }
        if (filters.country) {
          results = results.filter(v => v.country === filters.country);
        }
      }

      return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    async findById(id: string) {
      return (await getDb().vendors.get(id)) || null;
    },

    async create(vendor) {
      const id = crypto.randomUUID();
      const newVendor: Vendor = {
        ...vendor,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await getDb().vendors.add(newVendor);
      return newVendor;
    },

    async update(id: string, vendor) {
      const existing = await getDb().vendors.get(id);
      if (!existing) throw new Error("Vendor not found");

      const updated = {
        ...existing,
        ...vendor,
        updatedAt: new Date(),
      };
      await getDb().vendors.put(updated);
      return updated;
    },

    async delete(id: string) {
      await getDb().vendors.delete(id);
    },

    async search(userId: string, query: string) {
      const lowerQuery = query.toLowerCase();
      const vendors = await getDb().vendors.where("userId").equals(userId).toArray();
      return vendors.filter(v =>
        v.companyName.toLowerCase().includes(lowerQuery) ||
        v.brandName?.toLowerCase().includes(lowerQuery) ||
        v.phone?.includes(query) ||
        v.email?.toLowerCase().includes(lowerQuery)
      );
    },
  },

  products: {
    async findAll(userId: string, filters?: ProductFilters) {
      const vendors = await getDb().vendors.where("userId").equals(userId).toArray();
      const vendorIds = vendors.map(v => v.id);

      let products = await getDb().products
        .where("vendorId")
        .anyOf(vendorIds)
        .toArray();

      if (filters) {
        if (filters.vendorId) {
          products = products.filter(p => p.vendorId === filters.vendorId);
        }
        if (filters.category) {
          products = products.filter(p => p.category === filters.category);
        }
        if (filters.minPrice !== undefined) {
          products = products.filter(p => p.unitPrice && p.unitPrice >= filters.minPrice!);
        }
        if (filters.maxPrice !== undefined) {
          products = products.filter(p => p.unitPrice && p.unitPrice <= filters.maxPrice!);
        }
        if (filters.minMoq !== undefined) {
          products = products.filter(p => p.moq && p.moq >= filters.minMoq!);
        }
        if (filters.maxMoq !== undefined) {
          products = products.filter(p => p.moq && p.moq <= filters.maxMoq!);
        }
        if (filters.rating !== undefined) {
          products = products.filter(p => p.rating >= filters.rating!);
        }
      }

      return products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    async findByVendorId(vendorId: string) {
      return await getDb().products.where("vendorId").equals(vendorId).toArray();
    },

    async findById(id: string) {
      return (await getDb().products.get(id)) || null;
    },

    async create(product) {
      const id = crypto.randomUUID();
      const newProduct: Product = {
        ...product,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await getDb().products.add(newProduct);
      return newProduct;
    },

    async update(id: string, product) {
      const existing = await getDb().products.get(id);
      if (!existing) throw new Error("Product not found");

      const updated = {
        ...existing,
        ...product,
        updatedAt: new Date(),
      };
      await getDb().products.put(updated);
      return updated;
    },

    async delete(id: string) {
      await getDb().products.delete(id);
    },
  },

  pocs: {
    async findByVendorId(vendorId: string) {
      return await getDb().pocs.where("vendorId").equals(vendorId).toArray();
    },

    async create(poc) {
      const id = crypto.randomUUID();
      const newPOC: POC = {
        ...poc,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await getDb().pocs.add(newPOC);
      return newPOC;
    },

    async update(id: string, poc) {
      const existing = await getDb().pocs.get(id);
      if (!existing) throw new Error("POC not found");

      const updated = {
        ...existing,
        ...poc,
        updatedAt: new Date(),
      };
      await getDb().pocs.put(updated);
      return updated;
    },

    async delete(id: string) {
      await getDb().pocs.delete(id);
    },
  },

  media: {
    async findAll(userId: string) {
      return await getDb().media.where("userId").equals(userId).toArray();
    },

    async findByVendorId(vendorId: string) {
      return await getDb().media.where("vendorId").equals(vendorId).toArray();
    },

    async findByProductId(productId: string) {
      return await getDb().media.where("productId").equals(productId).toArray();
    },

    async create(media) {
      const id = crypto.randomUUID();
      const newMedia: Media = {
        ...media,
        id,
        createdAt: new Date(),
      };
      await getDb().media.add(newMedia);
      return newMedia;
    },

    async delete(id: string) {
      await getDb().media.delete(id);
    },
  },

  notes: {
    async findAll(userId: string) {
      return await getDb().notes.where("userId").equals(userId).toArray();
    },

    async findByVendorId(vendorId: string) {
      return await getDb().notes.where("vendorId").equals(vendorId).toArray();
    },

    async create(note) {
      const id = crypto.randomUUID();
      const newNote: Note = {
        ...note,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await getDb().notes.add(newNote);
      return newNote;
    },

    async update(id: string, note) {
      const existing = await getDb().notes.get(id);
      if (!existing) throw new Error("Note not found");

      const updated = {
        ...existing,
        ...note,
        updatedAt: new Date(),
      };
      await getDb().notes.put(updated);
      return updated;
    },

    async delete(id: string) {
      await getDb().notes.delete(id);
    },
  },

  followUps: {
    async findAll(userId: string) {
      return await getDb().followUps.where("userId").equals(userId).toArray();
    },

    async findByVendorId(vendorId: string) {
      return await getDb().followUps.where("vendorId").equals(vendorId).toArray();
    },

    async findUpcoming(userId: string, days: number) {
      const now = new Date();
      const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const followUps = await getDb().followUps.where("userId").equals(userId).toArray();
      return followUps.filter(f =>
        f.dueAt && f.dueAt >= now && f.dueAt <= future
      );
    },

    async create(followUp) {
      const id = crypto.randomUUID();
      const newFollowUp: FollowUp = {
        ...followUp,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await getDb().followUps.add(newFollowUp);
      return newFollowUp;
    },

    async update(id: string, followUp) {
      const existing = await getDb().followUps.get(id);
      if (!existing) throw new Error("FollowUp not found");

      const updated = {
        ...existing,
        ...followUp,
        updatedAt: new Date(),
      };
      await getDb().followUps.put(updated);
      return updated;
    },

    async delete(id: string) {
      await getDb().followUps.delete(id);
    },
  },

  tags: {
    async findAll(userId: string) {
      return await getDb().tags.where("userId").equals(userId).toArray();
    },

    async create(tag) {
      const id = crypto.randomUUID();
      const newTag: Tag = {
        ...tag,
        id,
        createdAt: new Date(),
      };
      await getDb().tags.add(newTag);
      return newTag;
    },

    async delete(id: string) {
      await getDb().tags.delete(id);
    },
  },

  links: {
    async findByVendorId(vendorId: string) {
      return await getDb().links.where("vendorId").equals(vendorId).toArray();
    },

    async create(link) {
      const id = crypto.randomUUID();
      const newLink: Link = {
        ...link,
        id,
        createdAt: new Date(),
      };
      await getDb().links.add(newLink);
      return newLink;
    },

    async delete(id: string) {
      await getDb().links.delete(id);
    },
  },

  meetings: {
    async findByVendorId(vendorId: string) {
      return await getDb().meetings.where("vendorId").equals(vendorId).toArray();
    },

    async create(meeting) {
      const id = crypto.randomUUID();
      const newMeeting: Meeting = {
        ...meeting,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await getDb().meetings.add(newMeeting);
      return newMeeting;
    },

    async update(id: string, meeting) {
      const existing = await getDb().meetings.get(id);
      if (!existing) throw new Error("Meeting not found");

      const updated = {
        ...existing,
        ...meeting,
        updatedAt: new Date(),
      };
      await getDb().meetings.put(updated);
      return updated;
    },

    async delete(id: string) {
      await getDb().meetings.delete(id);
    },
  },

  // NEW: Quick Captures implementation
  quickCaptures: {
    async findAll(userId: string, limit: number = 20, offset: number = 0) {
      const all = await getDb().quickCaptures
        .where('userId')
        .equals(userId)
        .reverse()
        .sortBy('createdAt');
      
      // Apply pagination manually for Dexie
      return all.slice(offset, offset + limit);
    },

    async findById(id: string) {
      return (await getDb().quickCaptures.get(id)) || null;
    },

    async create(capture: CreateQuickCaptureInput) {
      const id = crypto.randomUUID();
      const newCapture: QuickCapture = {
        ...capture,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await getDb().quickCaptures.add(newCapture);
      return newCapture;
    },

    async update(id: string, capture: Partial<QuickCapture>) {
      const existing = await getDb().quickCaptures.get(id);
      if (!existing) throw new Error('Quick capture not found');

      const updated = {
        ...existing,
        ...capture,
        updatedAt: new Date(),
      };
      await getDb().quickCaptures.put(updated);
      return updated;
    },

    async delete(id: string) {
      await getDb().quickCaptures.delete(id);
    },
  },

  // Admin functionality (not supported in Dexie - local storage only)
  admin: {
    async isAdmin(userId: string): Promise<boolean> {
      // For Dexie, we'll just return false since admin functionality requires server-side auth
      return false;
    },

    async getAllUsers(): Promise<any[]> {
      // For Dexie, return empty array since we can't access auth users
      return [];
    },

    async deleteUser(userId: string): Promise<void> {
      throw new Error("User deletion not supported in local storage mode");
    },
  },
};