import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .from("admin_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (adminError || !adminCheck) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Get filter from query params
    const searchParams = request.nextUrl.searchParams;
    const mediaType = searchParams.get("type"); // 'video' or 'photo'

    // Fetch all quick captures
    let query = supabase
      .from("quick_captures")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: captures, error } = await query;

    if (error) {
      console.error("Error fetching media:", error);
      return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
    }

    // Process and filter media items
    const mediaItems: any[] = [];

    captures?.forEach((capture: any) => {
      // Handle new media_items array format
      if (capture.media_items && Array.isArray(capture.media_items)) {
        capture.media_items.forEach((item: any) => {
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

    return NextResponse.json({ 
      success: true, 
      data: mediaItems,
      count: mediaItems.length 
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

