import { createWorker, type Worker } from "tesseract.js";

let worker: Worker | null = null;

export async function initOCRWorker() {
  if (worker) return worker;

  worker = await createWorker("eng+chi_sim", 1, {
    logger: (m) => console.log("OCR:", m),
  });

  return worker;
}

export async function performOCR(imageData: string | Blob): Promise<string> {
  const ocrWorker = await initOCRWorker();
  const result = await ocrWorker.recognize(imageData);
  return result.data.text;
}

export interface ParsedBusinessCard {
  companyName?: string;
  contactName?: string;
  designation?: string;
  email?: string;
  phone?: string[];
  website?: string;
  address?: string;
  wechatId?: string;
  whatsapp?: string;
}

export function parseBusinessCard(ocrText: string): ParsedBusinessCard {
  const lines = ocrText.split("\n").map((line) => line.trim()).filter(Boolean);
  const result: ParsedBusinessCard = {
    phone: [],
  };

  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/gi;
  const phoneRegex = /[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}/g;
  const websiteRegex = /(https?:\/\/)?(www\.)?[\w-]+\.(com|net|org|cn|co|io|ai)/gi;
  const wechatRegex = /(?:wechat|微信)[:\s]*([a-zA-Z0-9_-]+)/gi;
  const whatsappRegex = /(?:whatsapp|wa)[:\s]*([\+\d\s-]+)/gi;

  let firstLine = lines[0] || "";
  if (firstLine.length > 3 && firstLine.length < 50 && !phoneRegex.test(firstLine) && !emailRegex.test(firstLine)) {
    result.companyName = firstLine;
  }

  const emailMatches = ocrText.match(emailRegex);
  if (emailMatches && emailMatches.length > 0) {
    result.email = emailMatches[0];
  }

  const phoneMatches = ocrText.match(phoneRegex);
  if (phoneMatches) {
    result.phone = phoneMatches
      .filter((p) => p.length >= 7)
      .slice(0, 3);
  }

  const websiteMatches = ocrText.match(websiteRegex);
  if (websiteMatches && websiteMatches.length > 0) {
    result.website = websiteMatches[0];
    if (!result.website.startsWith("http")) {
      result.website = "https://" + result.website;
    }
  }

  const wechatMatches = wechatRegex.exec(ocrText);
  if (wechatMatches && wechatMatches[1]) {
    result.wechatId = wechatMatches[1];
  }

  const whatsappMatches = whatsappRegex.exec(ocrText);
  if (whatsappMatches && whatsappMatches[1]) {
    result.whatsapp = whatsappMatches[1].trim();
  }

  const possibleNames = lines.filter((line) => {
    return (
      line.length > 2 &&
      line.length < 30 &&
      !phoneRegex.test(line) &&
      !emailRegex.test(line) &&
      !websiteRegex.test(line) &&
      !/^\d+$/.test(line) &&
      line !== result.companyName
    );
  });

  if (possibleNames.length > 0) {
    result.contactName = possibleNames[0];
  }
  if (possibleNames.length > 1) {
    result.designation = possibleNames[1];
  }

  const addressLines = lines.filter((line) => {
    return (
      line.length > 15 &&
      !phoneRegex.test(line) &&
      !emailRegex.test(line) &&
      !websiteRegex.test(line) &&
      line !== result.companyName &&
      line !== result.contactName &&
      line !== result.designation
    );
  });

  if (addressLines.length > 0) {
    result.address = addressLines.join(", ");
  }

  return result;
}

export async function terminateOCRWorker() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}
