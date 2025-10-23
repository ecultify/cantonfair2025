export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: string
          company_name: string
          brand_name: string | null
          country: string | null
          website: string | null
          email: string | null
          phone: string | null
          wechat_id: string | null
          whatsapp: string | null
          address: string | null
          phase: string | null
          hall: string | null
          stall: string | null
          aisle: string | null
          map_link: string | null
          source: string | null
          tags: Json
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          brand_name?: string | null
          country?: string | null
          website?: string | null
          email?: string | null
          phone?: string | null
          wechat_id?: string | null
          whatsapp?: string | null
          address?: string | null
          phase?: string | null
          hall?: string | null
          stall?: string | null
          aisle?: string | null
          map_link?: string | null
          source?: string | null
          tags?: Json
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          brand_name?: string | null
          country?: string | null
          website?: string | null
          email?: string | null
          phone?: string | null
          wechat_id?: string | null
          whatsapp?: string | null
          address?: string | null
          phase?: string | null
          hall?: string | null
          stall?: string | null
          aisle?: string | null
          map_link?: string | null
          source?: string | null
          tags?: Json
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pocs: {
        Row: {
          id: string
          vendor_id: string
          name: string
          designation: string | null
          email: string | null
          phone: string | null
          wechat_id: string | null
          whatsapp: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          name: string
          designation?: string | null
          email?: string | null
          phone?: string | null
          wechat_id?: string | null
          whatsapp?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          name?: string
          designation?: string | null
          email?: string | null
          phone?: string | null
          wechat_id?: string | null
          whatsapp?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          vendor_id: string
          name: string
          category: string | null
          subcategory: string | null
          description: string | null
          moq: number | null
          unit_price: number | null
          currency: string | null
          lead_time: string | null
          hs_code: string | null
          certifications: string | null
          samples_available: boolean | null
          warranty: string | null
          rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          name: string
          category?: string | null
          subcategory?: string | null
          description?: string | null
          moq?: number | null
          unit_price?: number | null
          currency?: string | null
          lead_time?: string | null
          hs_code?: string | null
          certifications?: string | null
          samples_available?: boolean | null
          warranty?: string | null
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          name?: string
          category?: string | null
          subcategory?: string | null
          description?: string | null
          moq?: number | null
          unit_price?: number | null
          currency?: string | null
          lead_time?: string | null
          hs_code?: string | null
          certifications?: string | null
          samples_available?: boolean | null
          warranty?: string | null
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      media: {
        Row: {
          id: string
          vendor_id: string | null
          product_id: string | null
          type: string
          file_url: string | null
          local_path: string | null
          thumb_url: string | null
          ocr_json: Json | null
          notes: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id?: string | null
          product_id?: string | null
          type: string
          file_url?: string | null
          local_path?: string | null
          thumb_url?: string | null
          ocr_json?: Json | null
          notes?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string | null
          product_id?: string | null
          type?: string
          file_url?: string | null
          local_path?: string | null
          thumb_url?: string | null
          ocr_json?: Json | null
          notes?: string | null
          user_id?: string
          created_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          vendor_id: string | null
          product_id: string | null
          text: string
          sentiment: string | null
          next_steps: string | null
          bookmarked: boolean | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id?: string | null
          product_id?: string | null
          text: string
          sentiment?: string | null
          next_steps?: string | null
          bookmarked?: boolean | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string | null
          product_id?: string | null
          text?: string
          sentiment?: string | null
          next_steps?: string | null
          bookmarked?: boolean | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          vendor_id: string
          meeting_at: string
          location: string | null
          attendees: string | null
          summary: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          meeting_at: string
          location?: string | null
          attendees?: string | null
          summary?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          meeting_at?: string
          location?: string | null
          attendees?: string | null
          summary?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      follow_ups: {
        Row: {
          id: string
          vendor_id: string
          status: string | null
          due_at: string | null
          remind: boolean | null
          assignee: string | null
          notes: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          status?: string | null
          due_at?: string | null
          remind?: boolean | null
          assignee?: string | null
          notes?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          status?: string | null
          due_at?: string | null
          remind?: boolean | null
          assignee?: string | null
          notes?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          label: string
          color: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          color?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          color?: string | null
          user_id?: string
          created_at?: string
        }
      }
      links: {
        Row: {
          id: string
          vendor_id: string
          type: string
          url: string
          title: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          type: string
          url: string
          title?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          type?: string
          url?: string
          title?: string | null
          created_at?: string
        }
      }
      sync_queue: {
        Row: {
          id: string
          entity_type: string
          entity_id: string
          operation: string
          payload: Json
          user_id: string
          synced: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: string
          entity_id: string
          operation: string
          payload: Json
          user_id: string
          synced?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: string
          entity_id?: string
          operation?: string
          payload?: Json
          user_id?: string
          synced?: boolean | null
          created_at?: string
        }
      }
      quick_captures: {
        Row: {
          id: string
          media_type: string | null
          media_url: string | null
          media_thumb_url: string | null
          product_name: string
          remarks: string | null
          visiting_card_url: string | null
          card_ocr_json: Json | null
          poc_name: string | null
          poc_company: string | null
          poc_city: string | null
          user_id: string
          vendor_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          media_type?: string | null
          media_url?: string | null
          media_thumb_url?: string | null
          product_name: string
          remarks?: string | null
          visiting_card_url?: string | null
          card_ocr_json?: Json | null
          poc_name?: string | null
          poc_company?: string | null
          poc_city?: string | null
          user_id: string
          vendor_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          media_type?: string | null
          media_url?: string | null
          media_thumb_url?: string | null
          product_name?: string
          remarks?: string | null
          visiting_card_url?: string | null
          card_ocr_json?: Json | null
          poc_name?: string | null
          poc_company?: string | null
          poc_city?: string | null
          user_id?: string
          vendor_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
