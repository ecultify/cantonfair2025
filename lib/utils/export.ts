import * as XLSX from "xlsx";
import JSZip from "jszip";
import type { Vendor, Product, Note } from "../db/dexie";

export async function exportToCSV(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

export async function exportToXLSX(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportVendorsToCSV(vendors: Vendor[]) {
  const data = vendors.map((v) => ({
    "Company Name": v.companyName,
    "Brand Name": v.brandName || "",
    Country: v.country || "",
    Email: v.email || "",
    Phone: v.phone || "",
    WeChat: v.wechatId || "",
    WhatsApp: v.whatsapp || "",
    Phase: v.phase || "",
    Hall: v.hall || "",
    Stall: v.stall || "",
    Website: v.website || "",
    Address: v.address || "",
    Tags: v.tags.join(", "),
    "Created At": v.createdAt.toISOString(),
  }));

  await exportToCSV(data, `vendors_${Date.now()}`);
}

export async function exportProductsToCSV(products: Product[]) {
  const data = products.map((p) => ({
    Name: p.name,
    Category: p.category || "",
    Subcategory: p.subcategory || "",
    Description: p.description || "",
    MOQ: p.moq || "",
    "Unit Price": p.unitPrice || "",
    Currency: p.currency,
    "Lead Time": p.leadTime || "",
    "HS Code": p.hsCode || "",
    Certifications: p.certifications || "",
    "Samples Available": p.samplesAvailable ? "Yes" : "No",
    Warranty: p.warranty || "",
    Rating: p.rating,
    "Created At": p.createdAt.toISOString(),
  }));

  await exportToCSV(data, `products_${Date.now()}`);
}

export async function exportNotesToCSV(notes: Note[]) {
  const data = notes.map((n) => ({
    Text: n.text,
    Sentiment: n.sentiment,
    "Next Steps": n.nextSteps || "",
    Bookmarked: n.bookmarked ? "Yes" : "No",
    "Created At": n.createdAt.toISOString(),
  }));

  await exportToCSV(data, `notes_${Date.now()}`);
}

export async function exportMediaAsZip(
  mediaFiles: { name: string; data: Blob | string }[]
) {
  const zip = new JSZip();

  for (const file of mediaFiles) {
    if (typeof file.data === "string") {
      const response = await fetch(file.data);
      const blob = await response.blob();
      zip.file(file.name, blob);
    } else {
      zip.file(file.name, file.data);
    }
  }

  const content = await zip.generateAsync({ type: "blob" });
  downloadBlob(content, `media_export_${Date.now()}.zip`);
}

export async function exportFullDataAsJSON(data: {
  vendors?: Vendor[];
  products?: Product[];
  notes?: Note[];
}) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  downloadBlob(blob, `canton_fair_backup_${Date.now()}.json`);
}
