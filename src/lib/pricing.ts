import { 
  PhotoPrintSpec, 
  IdPictureSpec, 
  DocumentPrintSpec, 
  OtherPrintSpec, 
  LaminationSize,
  IdPackageType,
  OrderItem,
  ServiceType
} from '@/types';

// Shared rush fee surcharge rate (25% rush expedited processing)
export const RUSH_FEE_RATE = 0.25;

// Official Dxlea ID Package Rates
export const DXLEA_ID_RATES: Record<IdPackageType, number> = {
  'Package 1 (2pcs 2x2 & 4pcs 1x1) - ₱50': 50,
  'Package 2 (4pcs 2x2 & 3pcs 1x1) - ₱50': 50,
  'Package 3 (8pcs 1x1) - ₱50': 50,
  'Package 4 (6pcs 2x2) - ₱50': 50,
  'Package 5 (6pcs Passport Size) - ₱65': 65,
  'Package 6 (4pcs Passport Size & 2pcs 2x2) - ₱60': 60,
  'Package 7 (3pcs Passport Size & 6pcs 1x1) - ₱75': 75,
  'Package 8 (6pcs 1.5x1.5) - ₱50': 50,
};

// Official Dxlea Bundled Photo Rates
export const DXLEA_PHOTO_BUNDLES = {
  'Wide Instax (8 pcs - ₱65)': 65,
  'Wide Instax (16 pcs - ₱125)': 125,
  'Wide Instax (24 pcs - ₱190)': 190,
  'Wallet Size (9 pcs - ₱60)': 60,
  'Wallet Size (18 pcs - ₱120)': 120,
  'Wallet Size (27 pcs - ₱170)': 170,
  'Mini Instax (9 pcs - ₱75)': 75,
  'Mini Instax (18 pcs - ₱145)': 145,
  'Mini Instax (27 pcs - ₱220)': 220,
};

// Official Dxlea Photostrips Rates
export const DXLEA_PHOTOSTRIP_RATES = {
  'S1': { '1 pc': 50, '3 pcs': 120, '6 pcs': 200 },
  'S2': { '2 pcs': 75, '4 pcs': 120, '6 pcs': 180 },
  'S3': { '1 pc': 50, '3 pcs': 120, '6 pcs': 200 },
};

// Standard Photo Sizes
export const DXLEA_STANDARD_PHOTO_RATES: Record<string, number> = {
  '3R': 25,
  '4R': 35,
  '5R': 50,
  'A4': 70,
};

// Official Dxlea Document & Photocopy Rate Matrix
export const DXLEA_DOC_RATES = {
  'Text Only': {
    'Black & White': {
      Short: { 'Single-Sided': 4, 'Back2Back': 6 },
      A4: { 'Single-Sided': 4, 'Back2Back': 6 },
      Long: { 'Single-Sided': 6, 'Back2Back': 8 },
    },
    'Partially Colored': {
      Short: { 'Single-Sided': 6, 'Back2Back': 8 },
      A4: { 'Single-Sided': 7, 'Back2Back': 9 },
      Long: { 'Single-Sided': 8, 'Back2Back': 10 },
    },
    'Fully Colored': {
      Short: { 'Single-Sided': 8, 'Back2Back': 8 },
      A4: { 'Single-Sided': 8, 'Back2Back': 11 },
      Long: { 'Single-Sided': 10, 'Back2Back': 14 },
    },
  },
  'Text with Picture': {
    'Black & White': {
      Short: { 'Single-Sided': 6, 'Back2Back': 10 },
      A4: { 'Single-Sided': 8, 'Back2Back': 12 },
      Long: { 'Single-Sided': 10, 'Back2Back': 15 },
    },
    'Partially Colored': {
      Short: { 'Single-Sided': 8, 'Back2Back': 12 },
      A4: { 'Single-Sided': 10, 'Back2Back': 14 },
      Long: { 'Single-Sided': 15, 'Back2Back': 19 },
    },
    'Fully Colored': {
      Short: { 'Single-Sided': 15, 'Back2Back': 25 },
      A4: { 'Single-Sided': 15, 'Back2Back': 30 },
      Long: { 'Single-Sided': 20, 'Back2Back': 40 },
    },
  },
  'Photocopy / Scan': {
    'Black & White': {
      Short: { 'Single-Sided': 5, 'Back2Back': 5 },
      A4: { 'Single-Sided': 5, 'Back2Back': 5 },
      Long: { 'Single-Sided': 8, 'Back2Back': 8 },
    },
    'Partially Colored': {
      Short: { 'Single-Sided': 6, 'Back2Back': 8 },
      A4: { 'Single-Sided': 6, 'Back2Back': 8 },
      Long: { 'Single-Sided': 10, 'Back2Back': 13 },
    },
    'Fully Colored': {
      Short: { 'Single-Sided': 8, 'Back2Back': 12 },
      A4: { 'Single-Sided': 8, 'Back2Back': 12 },
      Long: { 'Single-Sided': 12, 'Back2Back': 16 },
    },
  },
};

// Official Dxlea Lamination Rates
export const DXLEA_LAMINATION_RATES: Record<LaminationSize, number> = {
  'ID Size (2R 2.5x3.5")': 25,
  '3R Size (3.5x5")': 35,
  '4R Size (4x6")': 45,
  '5R Size (5x7")': 55,
  '6R Size (6x8")': 65,
  '8R / Short (8.5x11")': 80,
  'A4 Size (8.27x11.69")': 90,
  'Long Size (8.5x13")': 100,
};

export function getDocPageRate(spec: DocumentPrintSpec): number {
  const docTypeRates = DXLEA_DOC_RATES[spec.docType] || DXLEA_DOC_RATES['Text Only'];
  const colorRates = docTypeRates[spec.colorMode] || docTypeRates['Black & White'];
  const sizeRates = colorRates[spec.paperSize] || colorRates['A4'];
  return sizeRates[spec.duplex] || 4;
}

export function calculatePhotoPrice(spec: PhotoPrintSpec): number {
  const copies = Math.max(1, spec.copies || 1);

  if (spec.category === 'Bundled Packs (Wallet / Instax)' && spec.bundlePack) {
    const rate = DXLEA_PHOTO_BUNDLES[spec.bundlePack] || 60;
    return rate * copies;
  }

  if (spec.category === 'Photostrips (S1, S2, S3)' && spec.photostripStyle) {
    const styleKey = spec.photostripStyle.startsWith('S2') ? 'S2' : spec.photostripStyle.startsWith('S3') ? 'S3' : 'S1';
    const qty = spec.photostripQuantity || (styleKey === 'S2' ? '2 pcs' : '1 pc');
    const rateMap = DXLEA_PHOTOSTRIP_RATES[styleKey] as Record<string, number>;
    const rate = rateMap[qty] || 50;
    return rate * copies;
  }

  // Standard & Instax Inspired
  const size = spec.size || '4R';
  const unitPrice = DXLEA_STANDARD_PHOTO_RATES[size] || 35;
  return unitPrice * copies;
}

export function calculateIdPrice(spec: IdPictureSpec): number {
  const copies = Math.max(1, spec.copies || 1);
  let base = DXLEA_ID_RATES[spec.packageType] || 50;
  if (spec.changeAttire) {
    base += 30; // ₱30.00 digital attire change
  }
  return base * copies;
}

export function calculateDocPrice(spec: DocumentPrintSpec): number {
  const ratePerPage = getDocPageRate(spec);
  const baseCost = ratePerPage * Math.max(1, spec.pageCount);

  let bindingCost = 0;
  if (spec.binding === 'Corner Staple' || spec.binding === 'Book Fold Staple') {
    bindingCost = 5;
  }

  const formattingFee = spec.needsFormatting ? 15 : 0;
  return (baseCost + bindingCost + formattingFee) * Math.max(1, spec.copies);
}

export function calculateOtherPrice(spec: OtherPrintSpec): number {
  const qty = Math.max(1, spec.quantity || 1);

  if (spec.subType === 'Lamination') {
    const size = spec.laminationSize || 'A4 Size (8.27x11.69")';
    const rate = DXLEA_LAMINATION_RATES[size] || 90;
    return rate * qty;
  }

  if (spec.subType === 'Scan Document') {
    const pages = Math.max(1, spec.scanPages || 1);
    return 8 * pages * qty; // ₱8.00 / page
  }

  if (spec.subType === 'Sticker Printing') {
    const rate = spec.stickerSize === 'A4 Half (₱35/page)' ? 35 : 70;
    return rate * qty;
  }

  if (spec.subType === 'Layout / Graphic Design') {
    return 150 * qty; // standard layout service
  }

  if (spec.subType === 'Online Appointment') {
    return 60 * qty; // ₱60.00 for PSA, SSS, Pag-IBIG, PhilHealth, NBI, DFA
  }

  if (spec.subType === 'Document Encoding / Typing') {
    const pages = Math.max(1, spec.encodingPages || 1);
    return 25 * pages * qty; // ₱25.00 per page
  }

  if (spec.subType === 'Tarpaulin / Vinyl Banner') {
    let sqFt = 6;
    if (spec.dimensions) {
      const match = spec.dimensions.match(/(\d+(?:\.\d+)?)\s*[xX*]\s*(\d+(?:\.\d+)?)/);
      if (match) {
        sqFt = parseFloat(match[1]) * parseFloat(match[2]);
      }
    }
    return Math.max(1, sqFt) * 25 * qty;
  }

  return 50 * qty;
}

/**
 * Recompute unit price and subtotal for an order item based on official rates.
 * All client-supplied prices are discarded and calculated purely from specs.
 */
export function calculateOrderItemPricing(
  serviceType: ServiceType,
  spec: any,
  itemQuantity: number = 1
): { unitPrice: number; subtotal: number } {
  const quantity = Math.max(1, Math.min(500, Math.floor(Number(itemQuantity) || 1)));

  switch (serviceType) {
    case 'PHOTO': {
      const unitPrice = calculatePhotoPrice(spec || {});
      return {
        unitPrice,
        subtotal: unitPrice * quantity,
      };
    }
    case 'ID_PICTURE': {
      const unitPrice = calculateIdPrice(spec || {});
      return {
        unitPrice,
        subtotal: unitPrice * quantity,
      };
    }
    case 'DOCUMENT': {
      const unitPrice = calculateDocPrice(spec || {});
      return {
        unitPrice,
        subtotal: unitPrice * quantity,
      };
    }
    case 'OTHER': {
      // For OTHER services, calculate based on spec with quantity: 1, then scale by item quantity
      const specQty = Math.max(1, Math.min(500, Math.floor(Number(spec?.quantity) || 1)));
      const baseOtherPrice = calculateOtherPrice({ ...spec, quantity: 1 });
      const totalUnits = quantity * specQty;
      const unitPrice = baseOtherPrice * specQty;
      return {
        unitPrice,
        subtotal: baseOtherPrice * totalUnits,
      };
    }
    default: {
      return { unitPrice: 0, subtotal: 0 };
    }
  }
}

export interface RecomputedOrderTotals {
  items: OrderItem[];
  subtotal: number;
  rushFee: number;
  totalPrice: number;
}

/**
 * Recomputes all item prices and total price on the server.
 * Guarantees that client-sent prices are completely ignored.
 */
export function recalculateOrderTotals(
  items: OrderItem[],
  isRush: boolean
): RecomputedOrderTotals {
  let subtotal = 0;

  const recalculatedItems: OrderItem[] = (items || []).map((item) => {
    const qty = Math.max(1, Math.min(500, Math.floor(Number(item.quantity) || 1)));
    const pricing = calculateOrderItemPricing(item.serviceType, item.specifications, qty);
    subtotal += pricing.subtotal;

    return {
      ...item,
      quantity: qty,
      unitPrice: pricing.unitPrice,
      subtotal: pricing.subtotal,
    };
  });

  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const rushFee = isRush ? Math.round(roundedSubtotal * RUSH_FEE_RATE * 100) / 100 : 0;
  const totalPrice = Math.round((roundedSubtotal + rushFee) * 100) / 100;

  return {
    items: recalculatedItems,
    subtotal: roundedSubtotal,
    rushFee,
    totalPrice,
  };
}
