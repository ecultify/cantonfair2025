import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized - No auth header" }, { status: 401 });
    }

    // Verify user with the provided token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from("admin_roles")
      .select("id, role, email")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    console.log("Admin check:", { user: user.email, adminCheck, adminError });

    if (adminError || !adminCheck) {
      return NextResponse.json({ 
        error: "Forbidden - Admin access required",
        debug: { userEmail: user.email, isAdmin: !!adminCheck }
      }, { status: 403 });
    }

    // Get filter from query params
    const searchParams = request.nextUrl.searchParams;
    const mediaType = searchParams.get("type"); // 'video' or 'photo'

    // Fetch all quick captures (bypassing RLS with service role key)
    const { data: captures, error } = await supabase
      .from("quick_captures")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("Captures query:", { count: captures?.length, error });

    if (error) {
      console.error("Error fetching media:", error);
      return NextResponse.json({ 
        error: "Failed to fetch media",
        details: error.message 
      }, { status: 500 });
    }

    // Process and filter media items
    const mediaItems: any[] = [];

    captures?.forEach((capture: any) => {
      // Handle new media_items array format
      if (capture.media_items && Array.isArray(capture.media_items) && capture.media_items.length > 0) {
        capture.media_items.forEach((item: any) => {
          // Skip blob URLs (old testing data)
          if (item.url && item.url.startsWith('blob:')) {
            return; // Skip this item
          }
          
          if (!mediaType || item.type === mediaType) {
            mediaItems.push({
              id: `${capture.id}_${item.url}`,
              captureId: capture.id,
              type: item.type,
              url: item.url,
              thumbUrl: item.thumbUrl || item.url,
              productName: capture.product_name,
              remarks: capture.remarks,
              pocName: capture.poc_name,
              pocCompany: capture.poc_company,
              createdAt: capture.created_at,
              userId: capture.user_id,
            });
          }
        });
      }
      
      // Handle legacy single media format (backward compatibility)
      if (capture.media_url && capture.media_type) {
        // Skip blob URLs (old testing data)
        if (capture.media_url && capture.media_url.startsWith('blob:')) {
          return; // Skip this capture
        }
        
        if (!mediaType || capture.media_type === mediaType) {
          mediaItems.push({
            id: capture.id,
            captureId: capture.id,
            type: capture.media_type,
            url: capture.media_url,
            thumbUrl: capture.media_thumb_url || capture.media_url,
            productName: capture.product_name,
            remarks: capture.remarks,
            pocName: capture.poc_name,
            pocCompany: capture.poc_company,
            createdAt: capture.created_at,
            userId: capture.user_id,
          });
        }
      }
    });

    // Count how many were filtered out
    let blobUrlCount = 0;
    captures?.forEach((capture: any) => {
      if (capture.media_items && Array.isArray(capture.media_items)) {
        capture.media_items.forEach((item: any) => {
          if (item.url && item.url.startsWith('blob:')) blobUrlCount++;
        });
      }
      if (capture.media_url && capture.media_url.startsWith('blob:')) blobUrlCount++;
    });

    console.log("Media items processed:", { 
      totalCaptures: captures?.length,
      mediaItemsFound: mediaItems.length,
      blobUrlsFiltered: blobUrlCount,
      mediaType 
    });

    return NextResponse.json({ 
      success: true, 
      data: mediaItems,
      count: mediaItems.length,
      debug: {
        totalCaptures: captures?.length,
        mediaItemsProcessed: mediaItems.length,
        blobUrlsFiltered: blobUrlCount
      }
    });

  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 });
  }
}

