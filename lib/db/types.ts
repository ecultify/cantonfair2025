export interface Vendor {
  id: string;
  companyName: string;
  brandName?: string;
  country?: string;
  website?: string;
  email?: string;
  phone?: string;
  wechatId?: string;
  whatsapp?: string;
  address?: string;
  phase?: string;
  hall?: string;
  stall?: string;
  aisle?: string;
  mapLink?: string;
  source?: string;
  tags?: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuickCapture {
  id: string;
  
  // Product Media
  mediaType?: 'photo' | 'video';
  mediaUrl?: string;
  mediaThumbUrl?: string;
  
  // Remarks & Product Name
  productName: string;
  remarks?: string;
  
  // Visiting Card
  visitingCardUrl?: string;
  cardOcrJson?: {
    companyName?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    [key: string]: any;
  };
  
  // POC Details
  pocName?: string;
  pocCompany?: string;
  pocCity?: string;
  pocLink?: string;
  
  // Metadata
  userId: string;
  vendorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQuickCaptureInput {
  mediaType?: 'photo' | 'video';
  mediaUrl?: string;
  mediaThumbUrl?: string;
  productName: string;
  remarks?: string;
  visitingCardUrl?: string;
  cardOcrJson?: any;
  pocName?: string;
  pocCompany?: string;
  pocCity?: string;
  pocLink?: string;
  userId: string;
  vendorId?: string;
}