"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { dataService } from "@/lib/data";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Video, Image as ImageIcon, Loader2 } from "lucide-react";

interface MediaItem {
  id: string;
  captureId: string;
  type: "photo" | "video";
  url: string;
  thumbUrl: string;
  productName: string;
  remarks?: string;
  pocName?: string;
  pocCompany?: string;
  createdAt: string;
  userId: string;
}

export default function AdminMediaPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [activeTab, setActiveTab] = useState<"videos" | "photos">("videos");

  useEffect(() => {
    async function checkAdmin() {
      if (!isAuthenticated || !user) {
        router.push("/");
        return;
      }

      try {
        const adminStatus = await dataService.admin.isAdmin(user.id);
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, isAuthenticated, authLoading, router]);

  useEffect(() => {
    async function fetchMedia() {
      if (!isAdmin || !user) return;

      try {
        setLoadingMedia(true);
        
        // Get auth token from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          console.error("No auth token available");
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
        
        // Fetch videos
        const videoResponse = await fetch("/api/admin/media?type=video", { headers });
        const videoData = await videoResponse.json();
        console.log("Video response:", videoData);
        
        // Fetch photos
        const photoResponse = await fetch("/api/admin/media?type=photo", { headers });
        const photoData = await photoResponse.json();
        console.log("Photo response:", photoData);

        if (videoData.success) {
          setVideos(videoData.data);
        } else {
          console.error("Video fetch failed:", videoData);
        }
        
        if (photoData.success) {
          setPhotos(photoData.data);
        } else {
          console.error("Photo fetch failed:", photoData);
        }
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        setLoadingMedia(false);
      }
    }

    if (isAdmin && user) {
      fetchMedia();
    }
  }, [isAdmin, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900">Media Management</h1>
            <p className="text-xs text-slate-500 hidden sm:block">View all uploaded videos and photos</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "videos" | "photos")} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Videos ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Photos ({photos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="mt-0">
            {loadingMedia ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : videos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-4">No videos uploaded yet</p>
                  <div className="text-xs text-slate-400 space-y-2 max-w-md mx-auto text-left">
                    <p><strong>Troubleshooting:</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Check browser console (F12) for API errors</li>
                      <li>Ensure admin RLS policy migration was applied</li>
                      <li>Verify quick_captures table has data with media_items</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-black relative">
                      <video
                        src={video.url}
                        poster={video.thumbUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900 line-clamp-2">
                          {video.productName}
                        </h3>
                        <Badge variant="secondary" className="flex-shrink-0">
                          <Video className="h-3 w-3 mr-1" />
                          Video
                        </Badge>
                      </div>
                      {video.remarks && (
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                          {video.remarks}
                        </p>
                      )}
                      {video.pocName && (
                        <div className="text-xs text-slate-500 space-y-1">
                          <p><strong>POC:</strong> {video.pocName}</p>
                          {video.pocCompany && <p><strong>Company:</strong> {video.pocCompany}</p>}
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(video.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="mt-0">
            {loadingMedia ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : photos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 mb-4">No photos uploaded yet</p>
                  <div className="text-xs text-slate-400 space-y-2 max-w-md mx-auto text-left">
                    <p><strong>Troubleshooting:</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Check browser console (F12) for API errors</li>
                      <li>Ensure admin RLS policy migration was applied</li>
                      <li>Verify quick_captures table has data with media_items</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-slate-100 relative">
                      <img
                        src={photo.url}
                        alt={photo.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900 line-clamp-2">
                          {photo.productName}
                        </h3>
                        <Badge variant="secondary" className="flex-shrink-0">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Photo
                        </Badge>
                      </div>
                      {photo.remarks && (
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                          {photo.remarks}
                        </p>
                      )}
                      {photo.pocName && (
                        <div className="text-xs text-slate-500 space-y-1">
                          <p><strong>POC:</strong> {photo.pocName}</p>
                          {photo.pocCompany && <p><strong>Company:</strong> {photo.pocCompany}</p>}
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(photo.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

