"use client";

import { supabaseAdapter } from "./supabase-adapter";
import type { DataAdapter } from "./adapter";

let currentAdapter: DataAdapter = supabaseAdapter;
let dexieAdapter: DataAdapter | null = null;

async function loadDexieAdapter() {
  if (!dexieAdapter) {
    const module = await import("./dexie-adapter");
    dexieAdapter = module.dexieAdapter;
  }
  return dexieAdapter;
}

if (typeof window !== "undefined") {
  const storageMode = localStorage.getItem("storage_mode") || "supabase";
  if (storageMode === "dexie") {
    loadDexieAdapter().then(adapter => {
      currentAdapter = adapter;
    });
  }
}

export async function setStorageMode(mode: "supabase" | "dexie") {
  if (typeof window !== "undefined") {
    localStorage.setItem("storage_mode", mode);
    if (mode === "dexie") {
      currentAdapter = await loadDexieAdapter();
    } else {
      currentAdapter = supabaseAdapter;
    }
  }
}

export function getStorageMode(): "supabase" | "dexie" {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("storage_mode") as "supabase" | "dexie") || "supabase";
  }
  return "supabase";
}

export const dataService = {
  get vendors() {
    return currentAdapter.vendors;
  },
  get products() {
    return currentAdapter.products;
  },
  get pocs() {
    return currentAdapter.pocs;
  },
  get media() {
    return currentAdapter.media;
  },
  get notes() {
    return currentAdapter.notes;
  },
  get followUps() {
    return currentAdapter.followUps;
  },
  get tags() {
    return currentAdapter.tags;
  },
  get links() {
    return currentAdapter.links;
  },
  get meetings() {
    return currentAdapter.meetings;
  },
  get quickCaptures() {
    return currentAdapter.quickCaptures;
  },
};