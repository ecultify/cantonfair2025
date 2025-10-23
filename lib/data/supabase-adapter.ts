import { supabase } from "../supabase/client";
import type { DataAdapter, VendorFilters, ProductFilters } from "./adapter";
import type { Vendor, Product, POC, Media, Note, FollowUp, Tag, Link, Meeting } from "../db/dexie";

function transformVendorFromDB(row: any): Vendor {
  return {
    id: row.id,
    companyName: row.company_name,
    brandName: row.brand_name,
    country: row.country,
    website: row.website,
    email: row.email,
    phone: row.phone,
    wechatId: row.wechat_id,
    whatsapp: row.whatsapp,
    address: row.address,
    phase: row.phase,
    hall: row.hall,
    stall: row.stall,
    aisle: row.aisle,
    mapLink: row.map_link,
    source: row.source || "CantonFair",
    tags: Array.isArray(row.tags) ? row.tags : [],
    userId: row.user_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function transformProductFromDB(row: any): Product {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    description: row.description,
    moq: row.moq,
    unitPrice: row.unit_price ? parseFloat(row.unit_price) : undefined,
    currency: row.currency || "CNY",
    leadTime: row.lead_time,
    hsCode: row.hs_code,
    certifications: row.certifications,
    samplesAvailable: row.samples_available || false,
    warranty: row.warranty,
    rating: row.rating || 3,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export const supabaseAdapter: DataAdapter = {
  vendors: {
    async findAll(userId: string, filters?: VendorFilters) {
      // @ts-ignore
      let query = supabase
        .from("vendors")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (filters?.phase) {
        query = query.eq("phase", filters.phase);
      }
      if (filters?.hall) {
        query = query.eq("hall", filters.hall);
      }
      if (filters?.country) {
        query = query.eq("country", filters.country);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = (data || []).map(transformVendorFromDB);

      if (filters?.tags && filters.tags.length > 0) {
        results = results.filter(v =>
          filters.tags!.some(tag => v.tags.includes(tag))
        );
      }

      return results;
    },

    async findById(id: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data ? transformVendorFromDB(data) : null;
    },

    async create(vendor) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // @ts-ignore
      const { data, error } = await supabase
        .from("vendors")
        .insert([{
          company_name: vendor.companyName,
          brand_name: vendor.brandName,
          country: vendor.country,
          website: vendor.website,
          email: vendor.email,
          phone: vendor.phone,
          wechat_id: vendor.wechatId,
          whatsapp: vendor.whatsapp,
          address: vendor.address,
          phase: vendor.phase,
          hall: vendor.hall,
          stall: vendor.stall,
          aisle: vendor.aisle,
          map_link: vendor.mapLink,
          source: vendor.source,
          tags: vendor.tags,
          user_id: user.id,
        }] as any)
        .select()
        .single();

      if (error) throw error;
      return transformVendorFromDB(data);
    },

    async update(id: string, vendor) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("vendors")
        // @ts-ignore
        .update({
          company_name: vendor.companyName,
          brand_name: vendor.brandName,
          country: vendor.country,
          website: vendor.website,
          email: vendor.email,
          phone: vendor.phone,
          wechat_id: vendor.wechatId,
          whatsapp: vendor.whatsapp,
          address: vendor.address,
          phase: vendor.phase,
          hall: vendor.hall,
          stall: vendor.stall,
          aisle: vendor.aisle,
          map_link: vendor.mapLink,
          tags: vendor.tags,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return transformVendorFromDB(data);
    },

    async delete(id: string) {
      // @ts-ignore
      const { error } = await supabase.from("vendors").delete().eq("id", id);
      if (error) throw error;
    },

    async search(userId: string, query: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", userId)
        .or(`company_name.ilike.%${query}%,brand_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);

      if (error) throw error;
      return (data || []).map(transformVendorFromDB);
    },
  },

  products: {
    async findAll(userId: string, filters?: ProductFilters) {
      // @ts-ignore
      const { data: vendors } = await supabase
        .from("vendors")
        .select("id")
        .eq("user_id", userId);

      const vendorIds = vendors?.map((v: any) => v.id) || [];
      if (vendorIds.length === 0) return [];

      // @ts-ignore
      let query = supabase
        .from("products")
        .select("*")
        .in("vendor_id", vendorIds)
        .order("created_at", { ascending: false });

      if (filters?.vendorId) {
        query = query.eq("vendor_id", filters.vendorId);
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.minPrice !== undefined) {
        query = query.gte("unit_price", filters.minPrice);
      }
      if (filters?.maxPrice !== undefined) {
        query = query.lte("unit_price", filters.maxPrice);
      }
      if (filters?.rating !== undefined) {
        query = query.gte("rating", filters.rating);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(transformProductFromDB);
    },

    async findByVendorId(vendorId: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", vendorId);

      if (error) throw error;
      return (data || []).map(transformProductFromDB);
    },

    async findById(id: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data ? transformProductFromDB(data) : null;
    },

    async create(product) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("products")
        .insert([{
          vendor_id: product.vendorId,
          name: product.name,
          category: product.category,
          subcategory: product.subcategory,
          description: product.description,
          moq: product.moq,
          unit_price: product.unitPrice,
          currency: product.currency,
          lead_time: product.leadTime,
          hs_code: product.hsCode,
          certifications: product.certifications,
          samples_available: product.samplesAvailable,
          warranty: product.warranty,
          rating: product.rating,
        }] as any)
        .select()
        .single();

      if (error) throw error;
      return transformProductFromDB(data);
    },

    async update(id: string, product) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("products")
        // @ts-ignore
        .update({
          name: product.name,
          category: product.category,
          subcategory: product.subcategory,
          description: product.description,
          moq: product.moq,
          unit_price: product.unitPrice,
          currency: product.currency,
          lead_time: product.leadTime,
          hs_code: product.hsCode,
          certifications: product.certifications,
          samples_available: product.samplesAvailable,
          warranty: product.warranty,
          rating: product.rating,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return transformProductFromDB(data);
    },

    async delete(id: string) {
      // @ts-ignore
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
  },

  pocs: {
    async findByVendorId(vendorId: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("pocs")
        .select("*")
        .eq("vendor_id", vendorId);

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        vendorId: row.vendor_id,
        name: row.name,
        designation: row.designation,
        email: row.email,
        phone: row.phone,
        wechatId: row.wechat_id,
        whatsapp: row.whatsapp,
        notes: row.notes,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    },

    async create(poc) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("pocs")
        .insert([{
          vendor_id: poc.vendorId,
          name: poc.name,
          designation: poc.designation,
          email: poc.email,
          phone: poc.phone,
          wechat_id: poc.wechatId,
          whatsapp: poc.whatsapp,
          notes: poc.notes,
        }] as any)
        .select()
        .single();

      if (error) throw error;
      const row = data as any;
      return {
        id: row.id,
        vendorId: row.vendor_id,
        name: row.name,
        designation: row.designation,
        email: row.email,
        phone: row.phone,
        wechatId: row.wechat_id,
        whatsapp: row.whatsapp,
        notes: row.notes,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    },

    async update(id: string, poc) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("pocs")
        // @ts-ignore
        .update({
          name: poc.name,
          designation: poc.designation,
          email: poc.email,
          phone: poc.phone,
          wechat_id: poc.wechatId,
          whatsapp: poc.whatsapp,
          notes: poc.notes,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return {
        id: (data as any).id,
        vendorId: (data as any).vendor_id,
        name: (data as any).name,
        designation: (data as any).designation,
        email: (data as any).email,
        phone: (data as any).phone,
        wechatId: (data as any).wechat_id,
        whatsapp: (data as any).whatsapp,
        notes: (data as any).notes,
        createdAt: new Date((data as any).created_at),
        updatedAt: new Date((data as any).updated_at),
      };
    },

    async delete(id: string) {
      // @ts-ignore
      const { error } = await supabase.from("pocs").delete().eq("id", id);
      if (error) throw error;
    },
  },

  media: {
    async findAll(userId: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        vendorId: row.vendor_id,
        productId: row.product_id,
        type: row.type,
        fileUrl: row.file_url,
        localPath: row.local_path,
        thumbUrl: row.thumb_url,
        ocrJson: row.ocr_json,
        notes: row.notes,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
      }));
    },

    async findByVendorId(vendorId: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("vendor_id", vendorId);

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        vendorId: row.vendor_id,
        productId: row.product_id,
        type: row.type,
        fileUrl: row.file_url,
        localPath: row.local_path,
        thumbUrl: row.thumb_url,
        ocrJson: row.ocr_json,
        notes: row.notes,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
      }));
    },

    async findByProductId(productId: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("product_id", productId);

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        vendorId: row.vendor_id,
        productId: row.product_id,
        type: row.type,
        fileUrl: row.file_url,
        localPath: row.local_path,
        thumbUrl: row.thumb_url,
        ocrJson: row.ocr_json,
        notes: row.notes,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
      }));
    },

    async create(media) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // @ts-ignore
      const { data, error } = await supabase
        .from("media")
        .insert([{
          vendor_id: media.vendorId,
          product_id: media.productId,
          type: media.type,
          file_url: media.fileUrl,
          local_path: media.localPath,
          thumb_url: media.thumbUrl,
          ocr_json: media.ocrJson,
          notes: media.notes,
          user_id: user.id,
        }] as any)
        .select()
        .single();

      if (error) throw error;
      return {
        id: (data as any).id,
        vendorId: (data as any).vendor_id,
        productId: (data as any).product_id,
        type: (data as any).type,
        fileUrl: (data as any).file_url,
        localPath: (data as any).local_path,
        thumbUrl: (data as any).thumb_url,
        ocrJson: (data as any).ocr_json,
        notes: (data as any).notes,
        userId: (data as any).user_id,
        createdAt: new Date((data as any).created_at),
      };
    },

    async delete(id: string) {
      // @ts-ignore
      const { error } = await supabase.from("media").delete().eq("id", id);
      if (error) throw error;
    },
  },

  notes: {
    async findAll(userId: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        vendorId: row.vendor_id,
        productId: row.product_id,
        text: row.text,
        sentiment: row.sentiment,
        nextSteps: row.next_steps,
        bookmarked: row.bookmarked,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    },

    async findByVendorId(vendorId: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("vendor_id", vendorId);

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        vendorId: row.vendor_id,
        productId: row.product_id,
        text: row.text,
        sentiment: row.sentiment,
        nextSteps: row.next_steps,
        bookmarked: row.bookmarked,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    },

    async create(note) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // @ts-ignore
      const { data, error } = await supabase
        .from("notes")
        .insert([{
          vendor_id: note.vendorId,
          product_id: note.productId,
          text: note.text,
          sentiment: note.sentiment,
          next_steps: note.nextSteps,
          bookmarked: note.bookmarked,
          user_id: user.id,
        }] as any)
        .select()
        .single();

      if (error) throw error;
      return {
        id: (data as any).id,
        vendorId: (data as any).vendor_id,
        productId: (data as any).product_id,
        text: (data as any).text,
        sentiment: (data as any).sentiment,
        nextSteps: (data as any).next_steps,
        bookmarked: (data as any).bookmarked,
        userId: (data as any).user_id,
        createdAt: new Date((data as any).created_at),
        updatedAt: new Date((data as any).updated_at),
      };
    },

    async update(id: string, note) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("notes")
        // @ts-ignore
        .update({
          text: note.text,
          sentiment: note.sentiment,
          next_steps: note.nextSteps,
          bookmarked: note.bookmarked,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return {
        id: (data as any).id,
        vendorId: (data as any).vendor_id,
        productId: (data as any).product_id,
        text: (data as any).text,
        sentiment: (data as any).sentiment,
        nextSteps: (data as any).next_steps,
        bookmarked: (data as any).bookmarked,
        userId: (data as any).user_id,
        createdAt: new Date((data as any).created_at),
        updatedAt: new Date((data as any).updated_at),
      };
    },

    async delete(id: string) {
      // @ts-ignore
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
  },

  followUps: {
    async findAll(userId: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("follow_ups")
        .select("*")
        .eq("user_id", userId)
        .order("due_at", { ascending: true });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        vendorId: row.vendor_id,
        status: row.status,
        dueAt: row.due_at ? new Date(row.due_at) : undefined,
        remind: row.remind,
        assignee: row.assignee,
        notes: row.notes,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    },

    async findByVendorId(vendorId: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("follow_ups")
        .select("*")
        .eq("vendor_id", vendorId);

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        vendorId: row.vendor_id,
        status: row.status,
        dueAt: row.due_at ? new Date(row.due_at) : undefined,
        remind: row.remind,
        assignee: row.assignee,
        notes: row.notes,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    },

    async findUpcoming(userId: string, days: number) {
      const now = new Date();
      const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      // @ts-ignore
      const { data, error } = await supabase
        .from("follow_ups")
        .select("*")
        .eq("user_id", userId)
        .gte("due_at", now.toISOString())
        .lte("due_at", future.toISOString());

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        vendorId: row.vendor_id,
        status: row.status,
        dueAt: row.due_at ? new Date(row.due_at) : undefined,
        remind: row.remind,
        assignee: row.assignee,
        notes: row.notes,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    },

    async create(followUp) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // @ts-ignore
      const { data, error } = await supabase
        .from("follow_ups")
        .insert([{
          vendor_id: followUp.vendorId,
          status: followUp.status,
          due_at: followUp.dueAt?.toISOString(),
          remind: followUp.remind,
          assignee: followUp.assignee,
          notes: followUp.notes,
          user_id: user.id,
        }] as any)
        .select()
        .single();

      if (error) throw error;
      return {
        id: (data as any).id,
        vendorId: (data as any).vendor_id,
        status: (data as any).status,
        dueAt: (data as any).due_at ? new Date((data as any).due_at) : undefined,
        remind: (data as any).remind,
        assignee: (data as any).assignee,
        notes: (data as any).notes,
        userId: (data as any).user_id,
        createdAt: new Date((data as any).created_at),
        updatedAt: new Date((data as any).updated_at),
      };
    },

    async update(id: string, followUp) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("follow_ups")
        // @ts-ignore
        .update({
          status: followUp.status,
          due_at: followUp.dueAt?.toISOString(),
          remind: followUp.remind,
          assignee: followUp.assignee,
          notes: followUp.notes,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return {
        id: (data as any).id,
        vendorId: (data as any).vendor_id,
        status: (data as any).status,
        dueAt: (data as any).due_at ? new Date((data as any).due_at) : undefined,
        remind: (data as any).remind,
        assignee: (data as any).assignee,
        notes: (data as any).notes,
        userId: (data as any).user_id,
        createdAt: new Date((data as any).created_at),
        updatedAt: new Date((data as any).updated_at),
      };
    },

    async delete(id: string) {
      // @ts-ignore
      const { error } = await supabase.from("follow_ups").delete().eq("id", id);
      if (error) throw error;
    },
  },

  tags: {
    async findAll(userId: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        label: row.label,
        color: row.color,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
      }));
    },

    async create(tag) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // @ts-ignore
      const { data, error } = await supabase
        .from("tags")
        .insert([{
          label: tag.label,
          color: tag.color,
          user_id: user.id,
        }] as any)
        .select()
        .single();

      if (error) throw error;
      return {
        id: (data as any).id,
        label: (data as any).label,
        color: (data as any).color,
        userId: (data as any).user_id,
        createdAt: new Date((data as any).created_at),
      };
    },

    async delete(id: string) {
      // @ts-ignore
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
  },

  links: {
    async findByVendorId(vendorId: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("vendor_id", vendorId);

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        vendorId: row.vendor_id,
        type: row.type,
        url: row.url,
        title: row.title,
        createdAt: new Date(row.created_at),
      }));
    },

    async create(link) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("links")
        .insert([{
          vendor_id: link.vendorId,
          type: link.type,
          url: link.url,
          title: link.title,
        }] as any)
        .select()
        .single();

      if (error) throw error;
      return {
        id: (data as any).id,
        vendorId: (data as any).vendor_id,
        type: (data as any).type,
        url: (data as any).url,
        title: (data as any).title,
        createdAt: new Date((data as any).created_at),
      };
    },

    async delete(id: string) {
      // @ts-ignore
      const { error } = await supabase.from("links").delete().eq("id", id);
      if (error) throw error;
    },
  },

  meetings: {
    async findByVendorId(vendorId: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("vendor_id", vendorId);

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        vendorId: row.vendor_id,
        meetingAt: new Date(row.meeting_at),
        location: row.location,
        attendees: row.attendees,
        summary: row.summary,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    },

    async create(meeting) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // @ts-ignore
      const { data, error } = await supabase
        .from("meetings")
        .insert([{
          vendor_id: meeting.vendorId,
          meeting_at: meeting.meetingAt.toISOString(),
          location: meeting.location,
          attendees: meeting.attendees,
          summary: meeting.summary,
          user_id: user.id,
        }] as any)
        .select()
        .single();

      if (error) throw error;
      return {
        id: (data as any).id,
        vendorId: (data as any).vendor_id,
        meetingAt: new Date((data as any).meeting_at),
        location: (data as any).location,
        attendees: (data as any).attendees,
        summary: (data as any).summary,
        userId: (data as any).user_id,
        createdAt: new Date((data as any).created_at),
        updatedAt: new Date((data as any).updated_at),
      };
    },

    async update(id: string, meeting) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("meetings")
        // @ts-ignore
        .update({
          meeting_at: meeting.meetingAt?.toISOString(),
          location: meeting.location,
          attendees: meeting.attendees,
          summary: meeting.summary,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return {
        id: (data as any).id,
        vendorId: (data as any).vendor_id,
        meetingAt: new Date((data as any).meeting_at),
        location: (data as any).location,
        attendees: (data as any).attendees,
        summary: (data as any).summary,
        userId: (data as any).user_id,
        createdAt: new Date((data as any).created_at),
        updatedAt: new Date((data as any).updated_at),
      };
    },

    async delete(id: string) {
      // @ts-ignore
      const { error } = await supabase.from("meetings").delete().eq("id", id);
      if (error) throw error;
    },
  },

  quickCaptures: {
    async findAll(userId: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("quick_captures")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        mediaType: row.media_type,
        mediaUrl: row.media_url,
        mediaThumbUrl: row.media_thumb_url,
        productName: row.product_name,
        remarks: row.remarks,
        visitingCardUrl: row.visiting_card_url,
        cardOcrJson: row.card_ocr_json,
        pocName: row.poc_name,
        pocCompany: row.poc_company,
        pocCity: row.poc_city,
        pocLink: row.poc_link,
        userId: row.user_id,
        vendorId: row.vendor_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    },

    async findById(id: string) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("quick_captures")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: (data as any).id,
        mediaType: (data as any).media_type,
        mediaUrl: (data as any).media_url,
        mediaThumbUrl: (data as any).media_thumb_url,
        productName: (data as any).product_name,
        remarks: (data as any).remarks,
        visitingCardUrl: (data as any).visiting_card_url,
        cardOcrJson: (data as any).card_ocr_json,
        pocName: (data as any).poc_name,
        pocCompany: (data as any).poc_company,
        pocCity: (data as any).poc_city,
        pocLink: (data as any).poc_link,
        userId: (data as any).user_id,
        vendorId: (data as any).vendor_id,
        createdAt: new Date((data as any).created_at),
        updatedAt: new Date((data as any).updated_at),
      };
    },

    async create(capture: any) {
      // @ts-ignore
      const { data, error } = await supabase
        .from("quick_captures")
        .insert({
          media_type: capture.mediaType,
          media_url: capture.mediaUrl,
          media_thumb_url: capture.mediaThumbUrl,
          product_name: capture.productName,
          remarks: capture.remarks,
          visiting_card_url: capture.visitingCardUrl,
          card_ocr_json: capture.cardOcrJson,
          poc_name: capture.pocName,
          poc_company: capture.pocCompany,
          poc_city: capture.pocCity,
          poc_link: capture.pocLink,
          user_id: capture.userId,
          vendor_id: capture.vendorId,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return {
        id: (data as any).id,
        mediaType: (data as any).media_type,
        mediaUrl: (data as any).media_url,
        mediaThumbUrl: (data as any).media_thumb_url,
        productName: (data as any).product_name,
        remarks: (data as any).remarks,
        visitingCardUrl: (data as any).visiting_card_url,
        cardOcrJson: (data as any).card_ocr_json,
        pocName: (data as any).poc_name,
        pocCompany: (data as any).poc_company,
        pocCity: (data as any).poc_city,
        pocLink: (data as any).poc_link,
        userId: (data as any).user_id,
        vendorId: (data as any).vendor_id,
        createdAt: new Date((data as any).created_at),
        updatedAt: new Date((data as any).updated_at),
      };
    },

    async update(id: string, capture: any) {
      const updateData: any = {};
      if (capture.mediaType !== undefined) updateData.media_type = capture.mediaType;
      if (capture.mediaUrl !== undefined) updateData.media_url = capture.mediaUrl;
      if (capture.mediaThumbUrl !== undefined) updateData.media_thumb_url = capture.mediaThumbUrl;
      if (capture.productName !== undefined) updateData.product_name = capture.productName;
      if (capture.remarks !== undefined) updateData.remarks = capture.remarks;
      if (capture.visitingCardUrl !== undefined) updateData.visiting_card_url = capture.visitingCardUrl;
      if (capture.cardOcrJson !== undefined) updateData.card_ocr_json = capture.cardOcrJson;
      if (capture.pocName !== undefined) updateData.poc_name = capture.pocName;
      if (capture.pocCompany !== undefined) updateData.poc_company = capture.pocCompany;
      if (capture.pocCity !== undefined) updateData.poc_city = capture.pocCity;
      if (capture.pocLink !== undefined) updateData.poc_link = capture.pocLink;
      if (capture.vendorId !== undefined) updateData.vendor_id = capture.vendorId;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await (supabase as any)
        .from("quick_captures")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return {
        id: (data as any).id,
        mediaType: (data as any).media_type,
        mediaUrl: (data as any).media_url,
        mediaThumbUrl: (data as any).media_thumb_url,
        productName: (data as any).product_name,
        remarks: (data as any).remarks,
        visitingCardUrl: (data as any).visiting_card_url,
        cardOcrJson: (data as any).card_ocr_json,
        pocName: (data as any).poc_name,
        pocCompany: (data as any).poc_company,
        pocCity: (data as any).poc_city,
        pocLink: (data as any).poc_link,
        userId: (data as any).user_id,
        vendorId: (data as any).vendor_id,
        createdAt: new Date((data as any).created_at),
        updatedAt: new Date((data as any).updated_at),
      };
    },

    async delete(id: string) {
      // @ts-ignore
      const { error } = await supabase.from("quick_captures").delete().eq("id", id);
      if (error) throw error;
    },
  },
};
