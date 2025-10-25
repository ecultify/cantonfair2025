"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Upload, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function TestOCRPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrEngine, setOcrEngine] = useState<"1" | "2">("1");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Reset results
      setExtractedText("");
      setParsedData(null);
    }
  };

  const compressImage = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
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
  };

  const extractTextWithOCRSpace = async () => {
    if (!imageFile || !imagePreview) {
      toast.error("Please select an image first");
      return;
    }

    try {
      setProcessing(true);
      toast.info("Compressing image...");

      // Compress image to reduce size and processing time
      const compressedImage = await compressImage(imagePreview);
      const sizeKB = Math.round(compressedImage.length / 1024);
      
      toast.info(`Extracting text with Engine ${ocrEngine} (${sizeKB} KB)...`);

      // Use base64Image parameter to avoid file type detection issues
      const formData = new FormData();
      formData.append("base64Image", compressedImage);
      // HARDCODED API KEY FOR TESTING
      formData.append("apikey", "K83480352388957");
      formData.append("language", "eng");
      formData.append("isOverlayRequired", "false");
      formData.append("detectOrientation", "true");
      formData.append("scale", "true");
      formData.append("OCREngine", ocrEngine);

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formData,
      });

      console.log('OCR API Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OCR API Error Response:', errorText);
        throw new Error(`API returned ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('OCR API Result:', result);

      if (result.IsErroredOnProcessing) {
        const errorMsg = result.ErrorMessage?.[0] || result.ErrorMessage || "OCR processing failed";
        console.error('OCR Processing Error:', errorMsg);
        console.error('Full Error Details:', result);
        throw new Error(errorMsg);
      }

      const text = result.ParsedResults?.[0]?.ParsedText || "";
      setExtractedText(text);

      if (!text || text.trim().length === 0) {
        toast.warning("⚠️ No text detected in image. Try a clearer photo with better lighting.");
        console.warn("No text detected. Image may be too blurry, dark, or doesn't contain text.");
        return;
      }

      // Parse the extracted text
      const parsed = parseBusinessCard(text);
      setParsedData(parsed);

      const processingTime = result.ProcessingTimeInMilliseconds || 0;
      toast.success(`✅ Engine ${ocrEngine}: ${text.length} characters extracted in ${processingTime}ms`);
    } catch (error: any) {
      console.error("OCR error:", error);
      toast.error(error.message || "Failed to extract text");
    } finally {
      setProcessing(false);
    }
  };

  const parseBusinessCard = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim()).map(l => l.trim());
    
    // Extract email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const emails = text.match(emailRegex);
    const email = emails ? emails[0].toLowerCase() : "";
    
    // Extract phone numbers
    const phoneRegex = /(?:\+?86)?[\s-]?1[3-9]\d{9}|(?:\+?86)?[\s-]?\d{3,4}[\s-]?\d{7,8}|[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{4,}/g;
    const phones = text.match(phoneRegex)?.filter(p => {
      const digits = p.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    });
    const phone = phones ? phones[0].trim() : "";
    
    // Extract URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|io|co|cn|edu|gov)[^\s]*)/gi;
    const urls = text.match(urlRegex);
    let website = "";
    if (urls && urls.length > 0) {
      website = urls[0].toLowerCase();
      if (!website.startsWith('http')) {
        website = 'https://' + website;
      }
      website = website.replace(/[,;.]$/, '');
    }
    
    // Extract name (first line that's not too long)
    const name = lines.find(line => line.length > 0 && line.length < 50 && !emailRegex.test(line) && !urlRegex.test(line)) || (lines[0] || "");
    
    // Extract company
    const companyKeywords = /ltd|limited|inc|corp|corporation|company|co\.|group|enterprise|trading|international/i;
    const company = lines.find(line => companyKeywords.test(line)) || (lines.length > 1 ? lines[1] : "");
    
    // Extract city
    const cityPattern = /\b(city|City|CITY|Province|州|市|区|district)\b/i;
    const cityLine = lines.find(line => cityPattern.test(line)) || 
                     lines.find(line => line.length > 2 && line.length < 30 && !emailRegex.test(line) && !phoneRegex.test(line)) ||
                     (lines.length > 2 ? lines[2] : "");
    const city = cityLine.replace(/\b(city|City|CITY|Province|州|市|区|district)\b/gi, '').trim();
    
    return {
      name,
      company,
      email,
      phone,
      website,
      city,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">OCR Test Page</h1>
            <p className="text-sm text-slate-600">Test OCR.space API with business card images</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Business Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 hover:border-blue-500 transition-colors text-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Business card preview"
                        className="max-h-64 mx-auto rounded"
                      />
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 mx-auto text-slate-400" />
                        <p className="text-sm text-slate-600">Click to upload image</p>
                        <p className="text-xs text-slate-400">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </Label>
              </div>

              {/* OCR Engine Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">OCR Engine</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ocrEngine"
                      value="1"
                      checked={ocrEngine === "1"}
                      onChange={(e) => setOcrEngine(e.target.value as "1" | "2")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">
                      Engine 1 <span className="text-xs text-slate-500">(Faster)</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ocrEngine"
                      value="2"
                      checked={ocrEngine === "2"}
                      onChange={(e) => setOcrEngine(e.target.value as "1" | "2")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">
                      Engine 2 <span className="text-xs text-slate-500">(More Accurate)</span>
                    </span>
                  </label>
                </div>
              </div>

              <Button
                onClick={extractTextWithOCRSpace}
                disabled={!imageFile || processing}
                className="w-full"
                size="lg"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Extract Text with Engine {ocrEngine}
                  </>
                )}
              </Button>

              {imageFile && (
                <div className="text-sm text-slate-600">
                  <p>File: {imageFile.name}</p>
                  <p>Size: {(imageFile.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Raw OCR Text */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Raw OCR Text</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={extractedText}
                  readOnly
                  placeholder="Extracted text will appear here..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            {/* Parsed Data */}
            {parsedData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Parsed Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {parsedData.name && (
                      <div>
                        <Label className="text-xs text-slate-600">Name</Label>
                        <Input value={parsedData.name} readOnly className="mt-1" />
                      </div>
                    )}
                    {parsedData.company && (
                      <div>
                        <Label className="text-xs text-slate-600">Company</Label>
                        <Input value={parsedData.company} readOnly className="mt-1" />
                      </div>
                    )}
                    {parsedData.email && (
                      <div>
                        <Label className="text-xs text-slate-600">Email</Label>
                        <Input value={parsedData.email} readOnly className="mt-1" />
                      </div>
                    )}
                    {parsedData.phone && (
                      <div>
                        <Label className="text-xs text-slate-600">Phone</Label>
                        <Input value={parsedData.phone} readOnly className="mt-1" />
                      </div>
                    )}
                    {parsedData.website && (
                      <div>
                        <Label className="text-xs text-slate-600">Website</Label>
                        <Input value={parsedData.website} readOnly className="mt-1" />
                      </div>
                    )}
                    {parsedData.city && (
                      <div>
                        <Label className="text-xs text-slate-600">City</Label>
                        <Input value={parsedData.city} readOnly className="mt-1" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">How to Test:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Upload a business card image using the upload area</li>
              <li>Click "Extract Text" to process with OCR.space API</li>
              <li>Review the raw OCR text output</li>
              <li>Check the parsed information fields</li>
              <li>Compare accuracy with the actual business card</li>
            </ol>
            <p className="mt-3 text-xs text-blue-700">
              API: OCR.space Engine 2 (Free Tier: 25,000 requests/month)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

