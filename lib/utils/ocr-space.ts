/**
 * OCR.space API integration for business card text extraction
 */

async function compressImageForOCR(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // OPTIMIZED: Balance between size and readability
      // Keep decent resolution for text recognition
      const maxDimension = 1280; // Increased from 1024 for better text clarity
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Increase quality for better text recognition (0.8 is a good balance)
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

export async function extractTextFromImage(imageDataUrl: string): Promise<string> {
  try {
    // Check if image is already compressed (small enough)
    // If dataURL is > 1.5MB, compress it first
    const needsCompression = imageDataUrl.length > 1500000;
    const imageToSend = needsCompression ? await compressImageForOCR(imageDataUrl) : imageDataUrl;
    
    const sizeKB = Math.round(imageToSend.length / 1024);
    console.log(`Sending to OCR: ${sizeKB} KB (compressed: ${needsCompression})`);
    
    // Use base64 string directly to avoid file type detection issues
    const formData = new FormData();
    formData.append("base64Image", imageToSend);
    formData.append("apikey", process.env.NEXT_PUBLIC_OCR_SPACE_API_KEY || "K83480352388957");
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("OCREngine", "1"); // Engine 1 - Faster and more reliable

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
      const errorMessage = result.ErrorMessage?.[0] || result.ErrorMessage || "OCR processing failed";
      throw new Error(errorMessage);
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

