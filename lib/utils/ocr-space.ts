/**
 * OCR.space API integration for business card text extraction
 */

export async function extractTextFromImage(imageDataUrl: string): Promise<string> {
  try {
    // Convert data URL to blob
    const blob = await fetch(imageDataUrl).then(r => r.blob());
    
    // Create form data
    const formData = new FormData();
    formData.append("file", blob, "business-card.jpg");
    formData.append("apikey", process.env.NEXT_PUBLIC_OCR_SPACE_API_KEY || "K87711251188957");
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("OCREngine", "2"); // Engine 2 for better accuracy

    // Call OCR.space API
    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OCR API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage || "OCR processing failed");
    }

    const extractedText = result.ParsedResults?.[0]?.ParsedText || "";
    
    if (!extractedText) {
      throw new Error("No text found in image");
    }

    return extractedText;
  } catch (error) {
    console.error("OCR.space extraction error:", error);
    throw error;
  }
}

