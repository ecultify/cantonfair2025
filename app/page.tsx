"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { dataService } from "@/lib/data";
import { extractTextFromImage } from "@/lib/utils/ocr-space";
import { MediaCapture } from "@/components/media-capture";
import {
  Package,
  Search,
  Settings,
  User,
  Plus,
  Image,
  FileText,
  CreditCard,
  Users,
  Upload,
  LogOut,
  Trash2,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import Link from "next/link";
import type { Vendor } from "@/lib/db/types";

interface QuickCapture {
  id: string;
  mediaType?: 'photo' | 'video';
  mediaUrl?: string;
  mediaThumbUrl?: string;
  productName?: string;
  remarks?: string;
  visitingCardUrl?: string;
  pocName?: string;
  pocCompany?: string;
  pocCity?: string;
  pocPhone?: string;
  pocEmail?: string;
  pocLink?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated, signOut, signIn, signUp, resetPassword } = useAuth();
  const [quickCaptures, setQuickCaptures] = useState<QuickCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);

  // Quick Add Form State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showMediaCapture, setShowMediaCapture] = useState(false);
  const [mediaCaptureMode, setMediaCaptureMode] = useState<'photo' | 'video'>('photo');
  const [processing, setProcessing] = useState(false);
  
  // Detail View State
  const [selectedCapture, setSelectedCapture] = useState<QuickCapture | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  
  // Delete State
  const [captureToDelete, setCaptureToDelete] = useState<QuickCapture | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    // Section 1: Product Media
    productMediaType: null as 'photo' | 'video' | null,
    productMediaUrl: "",
    productMediaThumb: "",
    
    // Section 2: Product Details
    productName: "",
    remarks: "",
    
    // Section 3: Visiting Card
    visitingCardUrl: "",
    
    // Section 4: POC Details
    pocName: "",
    pocCompany: "",
    pocCity: "",
    pocPhone: "",
    pocEmail: "",
    pocLink: "",
  });

  const [currentCaptureTarget, setCurrentCaptureTarget] = useState<'product' | 'card' | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadQuickCaptures();
      checkAdminStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    try {
      const adminStatus = await dataService.admin.isAdmin(user.id);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  const loadQuickCaptures = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await dataService.quickCaptures.findAll(user.id);
      setQuickCaptures(data as QuickCapture[]);
    } catch (error) {
      console.error("Load error:", error);
      toast.error("Failed to load quick captures");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === "signin") {
        await signIn(email, password);
        toast.success("Signed in successfully!");
      } else if (authMode === "signup") {
        await signUp(email, password);
        toast.success("Account created! Please check your email for verification.");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword(email);
      toast.success("Password reset email sent! Check your inbox.");
      setAuthMode("signin");
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to send reset email");
    }
  };

  const resetForm = () => {
    setFormData({
      productMediaType: null,
      productMediaUrl: "",
      productMediaThumb: "",
      productName: "",
      remarks: "",
      visitingCardUrl: "",
      pocName: "",
      pocCompany: "",
      pocCity: "",
      pocPhone: "",
      pocEmail: "",
      pocLink: "",
    });
  };

  const handleMediaCapture = async (dataUrl: string, type: 'photo' | 'video') => {
    if (currentCaptureTarget === 'product') {
      setFormData(prev => ({
        ...prev,
        productMediaType: type,
        productMediaUrl: dataUrl,
        productMediaThumb: type === 'photo' ? dataUrl : "", // For video, you'd generate a thumbnail
      }));
      toast.success(`Product ${type} captured!`);
    } else if (currentCaptureTarget === 'card') {
      setFormData(prev => ({
        ...prev,
        visitingCardUrl: dataUrl,
      }));
      
      // Automatically extract details from visiting card
      toast.success("Visiting card captured! Extracting details...");
      
      // Trigger OCR automatically
      setTimeout(async () => {
        await processVisitingCardOCR(dataUrl);
      }, 500);
    }
    setCurrentCaptureTarget(null);
  };

  const processVisitingCardOCR = async (imageUrl: string) => {
    if (!imageUrl) {
      toast.error("No visiting card to process");
      return;
    }

    try {
      setProcessing(true);
      
      const ocrText = await extractTextFromImage(imageUrl);
      
      // Extract information from OCR text with intelligent detection
      const lines = ocrText.split('\n').filter(line => line.trim()).map(l => l.trim());
      
      // === EMAIL EXTRACTION ===
      // Only accept valid email formats
      const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi;
      const emails = ocrText.match(emailRegex);
      let pocEmail = "";
      if (emails && emails.length > 0) {
        // Validate email has proper domain
        const validEmail = emails.find(e => {
          const parts = e.toLowerCase().split('@');
          return parts.length === 2 && parts[1].includes('.');
        });
        pocEmail = validEmail ? validEmail.toLowerCase() : "";
      }
      
      // === PHONE EXTRACTION ===
      // Match various international and Chinese phone formats
      const phoneRegex = /(?:\+?86[-\s]?)?1[3-9]\d{9}|\+?\d{1,4}[-\s]?\(?\d{1,4}\)?[-\s]?\d{3,4}[-\s]?\d{3,4}/g;
      const phones = ocrText.match(phoneRegex);
      let pocPhone = "";
      if (phones && phones.length > 0) {
        // Validate phone number length (7-15 digits)
        const validPhone = phones.find(p => {
          const digits = p.replace(/\D/g, '');
          return digits.length >= 7 && digits.length <= 15;
        });
        if (validPhone) {
          pocPhone = validPhone.trim();
        }
      }
      
      // === WEBSITE/LINK EXTRACTION ===
      // Detect URLs and domain names intelligently
      const urlRegex = /(https?:\/\/[^\s,;]+)|(\bwww\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s,;]*)|(\b[a-zA-Z0-9-]+\.(com|net|org|io|co|cn|edu|gov|biz|info)[^\s,;]*)/gi;
      const urls = ocrText.match(urlRegex);
      let pocLink = "";
      if (urls && urls.length > 0) {
        let detectedUrl = urls[0].trim();
        
        // Remove common OCR artifacts and trailing punctuation
        detectedUrl = detectedUrl.replace(/[,;.\s]+$/, '');
        
        // Add https:// prefix if not present
        if (!detectedUrl.startsWith('http://') && !detectedUrl.startsWith('https://')) {
          detectedUrl = 'https://' + detectedUrl;
        }
        
        // Validate URL format
        try {
          new URL(detectedUrl);
          pocLink = detectedUrl.toLowerCase();
        } catch {
          // Invalid URL, leave empty
          pocLink = "";
        }
      }
      
      // === NAME EXTRACTION ===
      // First substantial line that's not contact info
      let pocName = "";
      for (const line of lines) {
        if (line.length >= 2 && line.length <= 50 &&
            !emailRegex.test(line) && 
            !urlRegex.test(line) &&
            !phoneRegex.test(line) &&
            !/^\d+$/.test(line)) { // Not just numbers
          pocName = line;
          break;
        }
      }
      
      // === COMPANY EXTRACTION ===
      // Look for lines with company indicators
      const companyKeywords = /\b(ltd|limited|inc|corp|corporation|company|co\.|group|enterprise|trading|international|holdings|tech|technology|solutions|services|industries)\b/i;
      let pocCompany = "";
      for (const line of lines) {
        if (companyKeywords.test(line) && 
            line !== pocName &&
            !emailRegex.test(line) &&
            !phoneRegex.test(line)) {
          pocCompany = line;
          break;
        }
      }
      
      // === CITY/LOCATION EXTRACTION ===
      // Look for location indicators
      const cityPattern = /\b(city|province|state|district|区|市|州|county)\b/i;
      let pocCity = "";
      for (const line of lines) {
        if ((cityPattern.test(line) || 
             (line.length > 2 && line.length < 40 && /[A-Z][a-z]+/.test(line))) &&
            line !== pocName &&
            line !== pocCompany &&
            !emailRegex.test(line) &&
            !phoneRegex.test(line) &&
            !urlRegex.test(line)) {
          // Clean up location keywords
          pocCity = line.replace(/\b(city|province|state|district|区|市|州|county)\b/gi, '').trim();
          if (pocCity.length > 2) {
            break;
          }
        }
      }
      
      // Only update fields that were successfully detected (non-empty)
      const updates: any = {};
      if (pocName) updates.pocName = pocName;
      if (pocCompany) updates.pocCompany = pocCompany;
      if (pocCity) updates.pocCity = pocCity;
      if (pocPhone) updates.pocPhone = pocPhone;
      if (pocEmail) updates.pocEmail = pocEmail;
      if (pocLink) updates.pocLink = pocLink;
      
      setFormData(prev => ({
        ...prev,
        ...updates,
      }));
      
      const detectedCount = Object.keys(updates).length;
      if (detectedCount > 0) {
        toast.success(`✅ Extracted ${detectedCount} field${detectedCount > 1 ? 's' : ''}! Please review and edit as needed.`);
      } else {
        toast.warning("⚠️ Could not detect details clearly. Please fill manually.");
      }
    } catch (error) {
      console.error("OCR processing error:", error);
      toast.error("⚠️ Could not extract details. Please fill manually.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    try {
      setProcessing(true);

      await dataService.quickCaptures.create({
        mediaType: formData.productMediaType || undefined,
        mediaUrl: formData.productMediaUrl || undefined,
        mediaThumbUrl: formData.productMediaThumb || undefined,
        productName: formData.productName,
        remarks: formData.remarks || undefined,
        visitingCardUrl: formData.visitingCardUrl || undefined,
        pocName: formData.pocName || undefined,
        pocCompany: formData.pocCompany || undefined,
        pocCity: formData.pocCity || undefined,
        pocPhone: formData.pocPhone || undefined,
        pocEmail: formData.pocEmail || undefined,
        pocLink: formData.pocLink || undefined,
        userId: user.id,
      });

      toast.success("Quick capture saved successfully!");
      setShowQuickAdd(false);
      resetForm();
      await loadQuickCaptures(); // Refresh the list
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save quick capture");
    } finally {
      setProcessing(false);
    }
  };

  const filteredCaptures = quickCaptures.filter((capture) =>
    capture.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    capture.pocCompany?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    capture.pocName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCaptureClick = (capture: QuickCapture) => {
    setSelectedCapture(capture);
    setShowDetailView(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, capture: QuickCapture) => {
    e.stopPropagation(); // Prevent opening detail view
    setCaptureToDelete(capture);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!captureToDelete) return;
    
    try {
      setProcessing(true);
      await dataService.quickCaptures.delete(captureToDelete.id);
      toast.success("Capture deleted successfully!");
      setShowDeleteDialog(false);
      setCaptureToDelete(null);
      await loadQuickCaptures(); // Refresh the list
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete capture");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Canton Fair Capture</CardTitle>
          </CardHeader>
          <CardContent>
            {authMode === "forgot" ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Reset Password</h3>
                  <p className="text-sm text-gray-600">Enter your email to receive a reset link</p>
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" size="lg">
                  Send Reset Email
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setAuthMode("signin")}
                >
                  Back to Sign In
                </Button>
              </form>
            ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" size="lg">
                {authMode === "signin" ? "Sign In" : "Sign Up"}
              </Button>
                <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
              >
                {authMode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
              </Button>
                  {authMode === "signin" && (
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-sm"
                      onClick={() => setAuthMode("forgot")}
                    >
                      Forgot your password?
                    </Button>
                  )}
                </div>
            </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">CF Capture</h1>
              <p className="text-xs text-slate-500">Canton Fair 2025</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/search">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.email || 'My Account'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <Link href="/admin/users">
                      <DropdownMenuItem className="cursor-pointer">
                        <Shield className="h-4 w-4 mr-2" />
                        User Management
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <Input
            placeholder="Search captures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Today's Captures</h2>
        </div>

        {filteredCaptures.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No captures yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Tap the + button to start capturing
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCaptures.map((capture) => (
              <Card 
                key={capture.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer relative"
                onClick={() => handleCaptureClick(capture)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 z-10"
                  onClick={(e) => handleDeleteClick(e, capture)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CardContent className="p-4 pr-12">
                  <div className="flex gap-4 items-start">
                    {capture.mediaUrl && (
                      <div className="w-20 h-20 flex-shrink-0">
                        {capture.mediaType === 'photo' ? (
                          <img
                            src={capture.mediaThumbUrl || capture.mediaUrl}
                            alt={capture.productName}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={capture.mediaUrl}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-slate-900 truncate">
                        {capture.productName || 'Untitled Capture'}
                        </h3>
                      {capture.remarks && (
                        <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                          {capture.remarks}
                        </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                        {capture.pocCompany && (
                            <Badge variant="outline" className="text-xs">
                            {capture.pocCompany}
                          </Badge>
                        )}
                        {capture.pocName && (
                          <Badge variant="default" className="text-xs">
                            {capture.pocName}
                            </Badge>
                          )}
                        {capture.pocCity && (
                          <Badge variant="secondary" className="text-xs">
                            {capture.pocCity}
                            </Badge>
                        )}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                        {new Date(capture.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            ))}
          </div>
        )}

      </main>

      {/* Quick Add Form Dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 z-50"
          >
            <Plus className="h-8 w-8" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-[95vw] max-h-[90vh] sm:max-h-[95vh] p-0 flex flex-col gap-0">
          <DialogHeader className="px-4 pt-4 pb-3 border-b flex-shrink-0 bg-white">
            <DialogTitle>Quick Capture</DialogTitle>
            <DialogDescription>Fill in the details below</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4" style={{ maxHeight: 'calc(90vh - 140px)' }}>

          <form onSubmit={handleSubmitQuickCapture} className="space-y-6">
            {/* Section 1: Product Photo/Video */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Image className="h-5 w-5 text-blue-600" />
                1. Product Photo/Video
              </Label>
              
              {formData.productMediaUrl ? (
                <div className="relative">
                  {formData.productMediaType === 'photo' ? (
                    <img
                      src={formData.productMediaUrl}
                      alt="Product"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={formData.productMediaUrl}
                      controls
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      productMediaType: null,
                      productMediaUrl: "",
                      productMediaThumb: "",
                    }))}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-24 border-dashed border-2"
                  onClick={() => {
                    setCurrentCaptureTarget('product');
                    setShowMediaCapture(true);
                  }}
                >
                  <Upload className="h-6 w-6 mr-2" />
                  Capture Photo or Video
                </Button>
              )}
            </div>

            {/* Section 2: Product Name & Remarks */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                2. Product Details
              </Label>
              
              <div>
                <Label htmlFor="productName" className="text-sm">
                  Product Name
                </Label>
                <Input
                  id="productName"
                  placeholder="Enter product name (optional)"
                  value={formData.productName}
                  onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="remarks" className="text-sm">Remarks (Long Description)</Label>
                <Textarea
                  id="remarks"
                  placeholder="Enter detailed remarks, specifications, notes..."
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  rows={4}
                  className="mt-1 resize-none"
                />
              </div>
            </div>

            {/* Section 3: Visiting Card */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-600" />
                3. Visiting Card
              </Label>
              
              {formData.visitingCardUrl ? (
                <div className="relative">
                  <img
                    src={formData.visitingCardUrl}
                    alt="Visiting Card"
                    className="w-full h-40 object-contain bg-slate-100 rounded-lg"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 z-10"
                    onClick={() => setFormData(prev => ({ ...prev, visitingCardUrl: "" }))}
                  >
                    Remove
                  </Button>
                  {processing && (
                    <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Extracting details...
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-20 border-dashed border-2"
                  onClick={() => {
                    setCurrentCaptureTarget('card');
                    setMediaCaptureMode('photo');
                    setShowMediaCapture(true);
                  }}
                  disabled={processing}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Scan Visiting Card
                </Button>
              )}
            </div>

            {/* Section 4: POC Details */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                4. POC Details (Optional)
              </Label>
              
              <div>
                <Label htmlFor="pocName" className="text-sm">Contact Name</Label>
                <Input
                  id="pocName"
                  placeholder="Enter contact person name"
                  value={formData.pocName}
                  onChange={(e) => setFormData(prev => ({ ...prev, pocName: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pocCompany" className="text-sm">Company</Label>
                <Input
                  id="pocCompany"
                  placeholder="Enter company name"
                  value={formData.pocCompany}
                  onChange={(e) => setFormData(prev => ({ ...prev, pocCompany: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pocCity" className="text-sm">City</Label>
                <Input
                  id="pocCity"
                  placeholder="Enter city"
                  value={formData.pocCity}
                  onChange={(e) => setFormData(prev => ({ ...prev, pocCity: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pocPhone" className="text-sm">Phone Number</Label>
                <Input
                  id="pocPhone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.pocPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, pocPhone: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pocEmail" className="text-sm">Email</Label>
                <Input
                  id="pocEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.pocEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, pocEmail: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pocLink" className="text-sm">Website/Link</Label>
                <Input
                  id="pocLink"
                  type="url"
                  placeholder="Enter website or social media link"
                  value={formData.pocLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, pocLink: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

          </form>
          </div>
          
          {/* Fixed Submit Button */}
          <div className="px-4 py-3 border-t flex-shrink-0 bg-white">
              <Button
                type="submit"
                size="lg"
                className="w-full"
              disabled={processing}
              onClick={handleSubmitQuickCapture}
              >
                {processing ? "Saving..." : "Save Quick Capture"}
              </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Media Capture Component */}
      <MediaCapture
        open={showMediaCapture}
        onOpenChange={setShowMediaCapture}
        onCapture={handleMediaCapture}
        mode={currentCaptureTarget === 'card' ? 'photo' : 'both'}
      />

      {/* Detail View Dialog */}
      <Dialog open={showDetailView} onOpenChange={setShowDetailView}>
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-[95vw] max-h-[90vh] sm:max-h-[95vh] p-0 flex flex-col gap-0">
          <DialogHeader className="px-4 pt-4 pb-3 border-b flex-shrink-0 bg-white">
            <DialogTitle>Capture Details</DialogTitle>
            <DialogDescription>
              {selectedCapture && new Date(selectedCapture.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4" style={{ maxHeight: 'calc(90vh - 100px)' }}>

          {selectedCapture && (
            <div className="space-y-6">
              {/* Product Media Section */}
              {selectedCapture.mediaUrl && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Image className="h-5 w-5 text-blue-600" />
                    Product Media
                  </Label>
                  {selectedCapture.mediaType === 'photo' ? (
                    <img
                      src={selectedCapture.mediaUrl}
                      alt={selectedCapture.productName}
                      className="w-full h-auto max-h-96 object-contain rounded-lg border"
                    />
                  ) : (
                    <video
                      src={selectedCapture.mediaUrl}
                      controls
                      className="w-full h-auto max-h-96 object-contain rounded-lg border"
                    />
                  )}
                </div>
              )}

              {/* Product Details Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Product Details
                </Label>
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  {selectedCapture.productName && (
                    <div>
                      <Label className="text-sm text-slate-600">Product Name</Label>
                      <p className="font-semibold text-lg">{selectedCapture.productName}</p>
                    </div>
                  )}
                  {selectedCapture.remarks && (
                    <div>
                      <Label className="text-sm text-slate-600">Remarks</Label>
                      <p className="text-sm whitespace-pre-wrap">{selectedCapture.remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Visiting Card Section */}
              {selectedCapture.visitingCardUrl && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-orange-600" />
                    Visiting Card
                  </Label>
                  <img
                    src={selectedCapture.visitingCardUrl}
                    alt="Visiting Card"
                    className="w-full h-auto max-h-64 object-contain bg-slate-100 rounded-lg border"
                  />
                </div>
              )}

              {/* POC Details Section */}
              {(selectedCapture.pocName || selectedCapture.pocCompany || selectedCapture.pocCity || selectedCapture.pocPhone || selectedCapture.pocEmail || selectedCapture.pocLink) && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    POC Details
                  </Label>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                    {selectedCapture.pocName && (
                      <div>
                        <Label className="text-sm text-slate-600">Contact Name</Label>
                        <p className="font-medium">{selectedCapture.pocName}</p>
                      </div>
                    )}
                    {selectedCapture.pocCompany && (
                      <div>
                        <Label className="text-sm text-slate-600">Company</Label>
                        <p className="font-medium">{selectedCapture.pocCompany}</p>
                      </div>
                    )}
                    {selectedCapture.pocCity && (
                      <div>
                        <Label className="text-sm text-slate-600">City</Label>
                        <p className="font-medium">{selectedCapture.pocCity}</p>
                      </div>
                    )}
                    {selectedCapture.pocPhone && (
                      <div>
                        <Label className="text-sm text-slate-600">Phone Number</Label>
                        <a 
                          href={`tel:${selectedCapture.pocPhone}`} 
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {selectedCapture.pocPhone}
                        </a>
                      </div>
                    )}
                    {selectedCapture.pocEmail && (
                      <div>
                        <Label className="text-sm text-slate-600">Email</Label>
                        <a 
                          href={`mailto:${selectedCapture.pocEmail}`} 
                          className="font-medium text-blue-600 hover:underline break-all"
                        >
                          {selectedCapture.pocEmail}
                        </a>
                      </div>
                    )}
                    {selectedCapture.pocLink && (
                      <div>
                        <Label className="text-sm text-slate-600">Website/Link</Label>
                        <a 
                          href={selectedCapture.pocLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline break-all"
                        >
                          {selectedCapture.pocLink}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Capture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {captureToDelete?.productName ? `"${captureToDelete.productName}"` : 'this capture'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}