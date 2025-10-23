"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { dataService } from "@/lib/data";
import { performOCR } from "@/lib/utils/ocr";
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
  productName: string;
  remarks?: string;
  visitingCardUrl?: string;
  pocName?: string;
  pocCompany?: string;
  pocCity?: string;
  pocLink?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated, signOut, signIn, signUp } = useAuth();
  const [quickCaptures, setQuickCaptures] = useState<QuickCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

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
    pocLink: "",
  });

  const [currentCaptureTarget, setCurrentCaptureTarget] = useState<'product' | 'card' | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadQuickCaptures();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

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
      } else {
        await signUp(email, password);
        toast.success("Account created! Please check your email for verification.");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
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
      
      // Process OCR on visiting card
      try {
        setProcessing(true);
        const ocrText = await performOCR(dataUrl);
        // You can auto-fill POC fields from OCR here if needed
        toast.success("Visiting card captured!");
      } catch (error) {
        console.error("OCR error:", error);
        toast.error("OCR processing failed");
      } finally {
        setProcessing(false);
      }
    }
    setCurrentCaptureTarget(null);
  };

  const handleSubmitQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    if (!formData.productName.trim()) {
      toast.error("Product name is required");
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
    capture.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
              >
                {authMode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
              </Button>
            </form>
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
                        {capture.productName}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle>Quick Capture</DialogTitle>
            <DialogDescription>Fill in the details below</DialogDescription>
          </DialogHeader>

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
                  placeholder="Enter product name"
                  value={formData.productName}
                  onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  required
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
                3. Visiting Card (Optional)
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
                    className="absolute top-2 right-2"
                    onClick={() => setFormData(prev => ({ ...prev, visitingCardUrl: "" }))}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-20 border-dashed border-2"
                  onClick={() => {
                    setCurrentCaptureTarget('card');
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

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={processing || !formData.productName.trim()}
              >
                {processing ? "Saving..." : "Save Quick Capture"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Media Capture Component */}
      <MediaCapture
        open={showMediaCapture}
        onOpenChange={setShowMediaCapture}
        onCapture={handleMediaCapture}
        mode="both"
      />

      {/* Detail View Dialog */}
      <Dialog open={showDetailView} onOpenChange={setShowDetailView}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Capture Details</DialogTitle>
            <DialogDescription>
              {selectedCapture && new Date(selectedCapture.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

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
                  <div>
                    <Label className="text-sm text-slate-600">Product Name</Label>
                    <p className="font-semibold text-lg">{selectedCapture.productName}</p>
                  </div>
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
              {(selectedCapture.pocName || selectedCapture.pocCompany || selectedCapture.pocCity || selectedCapture.pocLink) && (
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
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Capture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{captureToDelete?.productName}"? This action cannot be undone.
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