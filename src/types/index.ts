export type ServiceType = 'PHOTO' | 'ID_PICTURE' | 'DOCUMENT' | 'OTHER';

export type OrderStatus = 'PENDING' | 'PRINTING' | 'READY' | 'COMPLETED' | 'CANCELLED';

// Photo Print Types
export type PhotoPrintCategory = 
  | 'Standard & Instax Inspired'
  | 'Bundled Packs (Wallet / Instax)'
  | 'Photostrips (S1, S2, S3)';

export interface PhotoPrintSpec {
  category: PhotoPrintCategory;
  // Standard sizes
  size?: '2R (Wallet Size)' | '3R' | '4R' | '5R' | '6R' | '8R' | 'A4' | 'Polaroid / Instax';
  // Bundled pack selection
  bundlePack?: 
    | 'Wide Instax (8 pcs - ₱65)'
    | 'Wide Instax (16 pcs - ₱125)'
    | 'Wide Instax (24 pcs - ₱190)'
    | 'Wallet Size (9 pcs - ₱60)'
    | 'Wallet Size (18 pcs - ₱120)'
    | 'Wallet Size (27 pcs - ₱170)'
    | 'Mini Instax (9 pcs - ₱75)'
    | 'Mini Instax (18 pcs - ₱145)'
    | 'Mini Instax (27 pcs - ₱220)';
  // Photostrips selection
  photostripStyle?: 
    | 'S1: Vintage Star Frame (3 photos)'
    | 'S2: Film Strip Black Border (4 photos)'
    | 'S3: Movie Ticket Header (3 photos)';
  photostripQuantity?: '1 pc' | '2 pcs' | '3 pcs' | '4 pcs' | '6 pcs';
  photostripLayout?: '3-Photo Vertical' | '4-Photo Vertical' | '2x2 Grid' | 'Polaroid Dual';
  finish: 'Glossy' | 'Matte' | 'Satin / Rough Matte';
  border: 'No Border' | 'White Border';
  copies: number;
}

// All 8 Official Dxlea Rush ID Packages
export type IdPackageType = 
  | 'Package 1 (2pcs 2x2 & 4pcs 1x1) - ₱50'
  | 'Package 2 (4pcs 2x2 & 3pcs 1x1) - ₱50'
  | 'Package 3 (8pcs 1x1) - ₱50'
  | 'Package 4 (6pcs 2x2) - ₱50'
  | 'Package 5 (6pcs Passport Size) - ₱65'
  | 'Package 6 (4pcs Passport Size & 2pcs 2x2) - ₱60'
  | 'Package 7 (3pcs Passport Size & 6pcs 1x1) - ₱75'
  | 'Package 8 (6pcs 1.5x1.5) - ₱50';

export interface IdPictureSpec {
  packageType: IdPackageType;
  backgroundColor: 'White' | 'Royal Blue' | 'Red' | 'Neutral Gray' | 'Original (As-Is)';
  changeAttire: boolean;
  attireType?: 'Formal Suit' | 'Barong / Traditional' | 'Collared Shirt' | 'No Change';
  copies: number;
}

// Document Printing Spec
export interface DocumentPrintSpec {
  docType: 'Text Only' | 'Text with Picture' | 'Photocopy / Scan';
  paperSize: 'Short' | 'A4' | 'Long';
  colorMode: 'Black & White' | 'Partially Colored' | 'Fully Colored';
  duplex: 'Single-Sided' | 'Back2Back';
  binding: 'None' | 'Corner Staple' | 'Book Fold Staple' | 'Spiral / Ring Bind' | 'Hardbound';
  needsFormatting?: boolean;
  pageCount: number;
  copies: number;
}

export type LaminationSize = 
  | 'ID Size (2R 2.5x3.5")'
  | '3R Size (3.5x5")'
  | '4R Size (4x6")'
  | '5R Size (5x7")'
  | '6R Size (6x8")'
  | '8R / Short (8.5x11")'
  | 'A4 Size (8.27x11.69")'
  | 'Long Size (8.5x13")';

export type AppointmentAgency =
  | 'PSA (Birth/Marriage Certificate)'
  | 'SSS Appointment'
  | 'PAG-IBIG Fund'
  | 'PHILHEALTH'
  | 'NBI Clearance'
  | 'DFA Passport'
  | 'Other Agency';

// Other Services (Lamination, Scan, Sticker, Layout, Appointments, Encoding)
export interface OtherPrintSpec {
  subType: 
    | 'Lamination'
    | 'Scan Document'
    | 'Sticker Printing'
    | 'Layout / Graphic Design'
    | 'Online Appointment'
    | 'Document Encoding / Typing'
    | 'Tarpaulin / Vinyl Banner';
  laminationSize?: LaminationSize;
  stickerSize?: 'A4 Half (₱35/page)' | 'A4 Size (₱70/page)';
  scanPages?: number;
  layoutType?: 
    | 'Invitation (Wedding, Birthday, etc.)'
    | 'Tarpaulin Layout'
    | 'Thank-You Card'
    | 'Resume / CV Design'
    | 'Custom Sticker Design'
    | 'Business Card'
    | 'Signage / Banner'
    | 'Other Custom Layout';
  appointmentAgency?: AppointmentAgency;
  encodingPages?: number;
  dimensions?: string;
  notes?: string;
  quantity: number;
}

export interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  storagePath?: string;
  isRemoved?: boolean;
  removedAt?: string;
  pageCount?: number;
  isUploading?: boolean;
  progress?: number;
  storage?: 'supabase' | 'local';
}

export interface OrderItem {
  id: string;
  serviceType: ServiceType;
  title: string;
  specifications: PhotoPrintSpec | IdPictureSpec | DocumentPrintSpec | OtherPrintSpec | Record<string, any>;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  publicToken: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceType: ServiceType;
  status: OrderStatus;
  isRush: boolean;
  pickupTime?: string;
  notes?: string;
  items: OrderItem[];
  files: UploadedFileItem[];
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface PricingConfig {
  rushFeePercent: number;
}
