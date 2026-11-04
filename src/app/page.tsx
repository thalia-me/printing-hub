'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Camera, 
  UserSquare2, 
  FileText, 
  Sparkles, 
  QrCode, 
  Clock, 
  CheckCircle2, 
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Phone,
  Mail,
  Zap,
  UploadCloud,
  AlertCircle,
  FileEdit,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { 
  ServiceType, 
  PhotoPrintSpec, 
  IdPictureSpec, 
  DocumentPrintSpec, 
  OtherPrintSpec, 
  UploadedFileItem,
  Order
} from '@/types';
import { 
  calculatePhotoPrice, 
  calculateIdPrice, 
  calculateDocPrice, 
  calculateOtherPrice,
  RUSH_FEE_RATE 
} from '@/lib/pricing';
import { getSiteUrl } from '@/lib/siteUrl';
import PhotoServiceForm from '@/components/customer/PhotoServiceForm';
import IdPictureForm from '@/components/customer/IdPictureForm';
import DocumentServiceForm from '@/components/customer/DocumentServiceForm';
import OtherServiceForm from '@/components/customer/OtherServiceForm';
import FileUploader from '@/components/customer/FileUploader';

// 6 Discrete Steps definition
const STEP_LABELS = [
  { step: 1, title: 'Choose Service', short: 'Service' },
  { step: 2, title: 'Configure Order', short: 'Configure' },
  { step: 3, title: 'Upload Files', short: 'Files' },
  { step: 4, title: 'Customer Details', short: 'Details' },
  { step: 5, title: 'Review Order', short: 'Review' },
  { step: 6, title: 'Pickup Ticket', short: 'Confirmed' },
];

export default function HomePage() {
  const router = useRouter();

  // Wizard Step State (1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Active Service Tab
  const [activeTab, setActiveTab] = useState<ServiceType>('PHOTO');

  // Customer Contact State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [pickupTime, setPickupTime] = useState('In 30-45 Minutes (Express)');
  const [notes, setNotes] = useState('');
  const [isRush, setIsRush] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bringFilesLater, setBringFilesLater] = useState(false);

  // Confirmed Order result for Step 6
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Uploaded Files per service
  const [photoFiles, setPhotoFiles] = useState<UploadedFileItem[]>([]);
  const [idFiles, setIdFiles] = useState<UploadedFileItem[]>([]);
  const [docFiles, setDocFiles] = useState<UploadedFileItem[]>([]);
  const [otherFiles, setOtherFiles] = useState<UploadedFileItem[]>([]);

  // Specifications per service
  const [photoSpec, setPhotoSpec] = useState<PhotoPrintSpec>({
    category: 'Bundled Packs (Wallet / Instax)',
    bundlePack: 'Wallet Size (9 pcs - ₱60)',
    size: '4R',
    finish: 'Glossy',
    border: 'White Border',
    copies: 1,
  });

  const [idSpec, setIdSpec] = useState<IdPictureSpec>({
    packageType: 'Package 1 (2pcs 2x2 & 4pcs 1x1) - ₱50',
    backgroundColor: 'White',
    changeAttire: false,
    attireType: 'Formal Suit',
    copies: 1,
  });

  const [docSpec, setDocSpec] = useState<DocumentPrintSpec>({
    docType: 'Text Only',
    paperSize: 'A4',
    colorMode: 'Black & White',
    duplex: 'Single-Sided',
    binding: 'None',
    needsFormatting: false,
    pageCount: 5,
    copies: 1,
  });

  const [otherSpec, setOtherSpec] = useState<OtherPrintSpec>({
    subType: 'Lamination',
    laminationSize: 'A4 Size (8.27x11.69")',
    quantity: 1,
  });

  // Calculate Subtotal dynamically
  const calculateCurrentSubtotal = (): number => {
    switch (activeTab) {
      case 'PHOTO':
        return calculatePhotoPrice(photoSpec);
      case 'ID_PICTURE':
        return calculateIdPrice(idSpec);
      case 'DOCUMENT':
        return calculateDocPrice(docSpec);
      case 'OTHER':
        return calculateOtherPrice(otherSpec);
      default:
        return 0;
    }
  };

  const currentSubtotal = calculateCurrentSubtotal();
  const rushFee = isRush ? currentSubtotal * RUSH_FEE_RATE : 0;
  const grandTotal = currentSubtotal + rushFee;

  // Active files accessor & updater
  const getCurrentFiles = (): UploadedFileItem[] => {
    switch (activeTab) {
      case 'PHOTO': return photoFiles;
      case 'ID_PICTURE': return idFiles;
      case 'DOCUMENT': return docFiles;
      case 'OTHER': return otherFiles;
    }
  };

  const setCurrentFiles = (files: UploadedFileItem[]) => {
    switch (activeTab) {
      case 'PHOTO': setPhotoFiles(files); break;
      case 'ID_PICTURE': setIdFiles(files); break;
      case 'DOCUMENT': setDocFiles(files); break;
      case 'OTHER': setOtherFiles(files); break;
    }
  };

  // Human readable service item title
  const getItemTitle = (): string => {
    if (activeTab === 'PHOTO') {
      if (photoSpec.category === 'Bundled Packs (Wallet / Instax)') {
        return `Photo Bundle: ${photoSpec.bundlePack}`;
      } else if (photoSpec.category === 'Photostrips (S1, S2, S3)') {
        return `Photostrips: ${photoSpec.photostripStyle} (${photoSpec.photostripQuantity || '1 pc'})`;
      }
      return `${photoSpec.size || '4R'} Photo Print (${photoSpec.finish}, ${photoSpec.border})`;
    } else if (activeTab === 'ID_PICTURE') {
      return `Rush ID: ${idSpec.packageType} (${idSpec.backgroundColor} BG)`;
    } else if (activeTab === 'DOCUMENT') {
      return `${docSpec.docType} (${docSpec.paperSize}, ${docSpec.colorMode}, ${docSpec.duplex}, ${docSpec.pageCount} pgs)`;
    } else {
      if (otherSpec.subType === 'Lamination') {
        return `Lamination (${otherSpec.laminationSize || 'A4'})`;
      } else if (otherSpec.subType === 'Online Appointment') {
        return `Appointment (${otherSpec.appointmentAgency || 'Agency'})`;
      } else if (otherSpec.subType === 'Document Encoding / Typing') {
        return `Encoding / Typing (${otherSpec.encodingPages || 1} pgs)`;
      }
      return `${otherSpec.subType} (${otherSpec.dimensions || 'Custom'})`;
    }
  };

  // Specifications summary bullets for Review Step
  const getSpecsSummaryList = (): Array<{ label: string; value: string }> => {
    if (activeTab === 'PHOTO') {
      return [
        { label: 'Category', value: photoSpec.category },
        { 
          label: 'Format', 
          value: photoSpec.category === 'Bundled Packs (Wallet / Instax)'
            ? (photoSpec.bundlePack || 'Wallet Pack')
            : photoSpec.category === 'Photostrips (S1, S2, S3)'
            ? `${photoSpec.photostripStyle} • ${photoSpec.photostripQuantity}`
            : `${photoSpec.size} Size`
        },
        { label: 'Paper Finish', value: photoSpec.finish },
        { label: 'Border', value: photoSpec.border },
        { label: 'Copies / Sets', value: `${photoSpec.copies || 1} set(s)` },
      ];
    } else if (activeTab === 'ID_PICTURE') {
      return [
        { label: 'ID Package', value: idSpec.packageType },
        { label: 'Background Color', value: idSpec.backgroundColor },
        { label: 'Attire Change', value: idSpec.changeAttire ? (idSpec.attireType || 'Formal Suit') : 'No Change (As Is)' },
        { label: 'Number of Sets', value: `${idSpec.copies || 1} set(s)` },
      ];
    } else if (activeTab === 'DOCUMENT') {
      return [
        { label: 'Print Coverage', value: docSpec.docType },
        { label: 'Paper Size', value: docSpec.paperSize },
        { label: 'Color Mode', value: docSpec.colorMode },
        { label: 'Side Format', value: docSpec.duplex },
        { label: 'Binding', value: docSpec.binding },
        { label: 'Page Count', value: `${docSpec.pageCount} page(s)` },
        { label: 'Sets / Copies', value: `${docSpec.copies || 1} set(s)` },
      ];
    } else {
      return [
        { label: 'Craft Type', value: otherSpec.subType },
        ...(otherSpec.laminationSize ? [{ label: 'Lamination Size', value: otherSpec.laminationSize }] : []),
        ...(otherSpec.stickerSize ? [{ label: 'Sticker Size', value: otherSpec.stickerSize }] : []),
        ...(otherSpec.appointmentAgency ? [{ label: 'Agency', value: otherSpec.appointmentAgency }] : []),
        { label: 'Quantity', value: `${otherSpec.quantity || 1} pc(s)` },
      ];
    }
  };

  // Validation checks per step
  const canProceedFromStep3 = getCurrentFiles().length > 0 || bringFilesLater;
  const cleanedPhone = customerPhone.replace(/[\s\-\(\)]/g, '');
  const isPhoneValid = /^(09|\+639)\d{9}$/.test(cleanedPhone);
  const canProceedFromStep4 = customerName.trim().length >= 2 && isPhoneValid;

  // Final Order Submission Handler
  const handleSubmitOrder = async () => {
    if (!canProceedFromStep4) {
      setSubmitError('Please enter your full name (at least 2 characters) and a valid Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX).');
      setCurrentStep(4);
      return;
    }

    if (!canProceedFromStep3) {
      setSubmitError('Please upload your photo/document files or select "Transfer files in store".');
      setCurrentStep(3);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const files = getCurrentFiles();
      let specObj: any = {};
      if (activeTab === 'PHOTO') specObj = photoSpec;
      else if (activeTab === 'ID_PICTURE') specObj = idSpec;
      else if (activeTab === 'DOCUMENT') specObj = docSpec;
      else specObj = otherSpec;

      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        serviceType: activeTab,
        pickupTime,
        isRush,
        notes: bringFilesLater && files.length === 0
          ? (notes ? `${notes} • [Note: Bringing file in person / USB / Messenger]` : '[Note: Bringing file in person / USB / Messenger]')
          : notes,
        totalPrice: grandTotal,
        items: [
          {
            id: `item-${Date.now()}`,
            serviceType: activeTab,
            title: getItemTitle(),
            specifications: specObj,
            quantity: 1,
            unitPrice: currentSubtotal,
            subtotal: currentSubtotal,
          }
        ],
        files: files.map(f => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          dataUrl: f.dataUrl || null,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit order. Please check connection.');
      }

      // Notify any open admin broadcast listener
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('print_orders_channel');
          bc.postMessage({ type: 'NEW_ORDER', order: data.order });
          bc.close();
        } catch (e) {}
      }

      // Confetti celebratory burst!
      confetti({
        particleCount: 85,
        spread: 80,
        origin: { y: 0.6 }
      });

      setConfirmedOrder(data.order);
      setCurrentStep(6);
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while submitting your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetOrder = () => {
    setConfirmedOrder(null);
    setPhotoFiles([]);
    setIdFiles([]);
    setDocFiles([]);
    setOtherFiles([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setNotes('');
    setIsRush(false);
    setBringFilesLater(false);
    setCurrentStep(1);
  };

  // Scroll to top on step change for smooth flow
  useEffect(() => {
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }, [currentStep]);

  return (
    <div className="space-y-6 pb-16">
      {/* Playful Brand Intro Tagline */}
      <div className="text-center space-y-1 mb-2">
        <h2 className="font-serif font-black text-2xl sm:text-3xl text-clay-milk tracking-tight">
          Print Made Playful 🌸
        </h2>
        <p className="text-xs sm:text-sm text-clay-milk/90 font-medium">
          Handmade paper goods & studio prints for your colorful moments.
        </p>
      </div>

      {/* Main Stepper Shell */}
      <div className="bg-clay-milk rounded-5xl p-4 sm:p-8 lg:p-10 shadow-2xl border-4 border-clay-milk/60 space-y-8 relative overflow-hidden">
        
        {/* Scalloped Studio Banner */}
        <section className="relative overflow-visible rounded-4xl bg-clay-wine text-clay-milk p-6 sm:p-8 text-center space-y-3 shadow-clay scallop-bottom pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-clay-milk/15 border border-clay-milk/25 text-clay-milk text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-clay-mustard" />
            <span>Dxlea Studio • Est. 2023</span>
          </div>

          <h1 className="font-serif font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-tight max-w-2xl mx-auto">
            Step-by-Step Print Order
          </h1>

          <p className="text-clay-milk/85 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Order your prints in just a few quick steps. Get your instant pickup ticket and claim at the counter with zero line.
          </p>
        </section>

        {/* 6-Step Stepper Progress Bar */}
        <section className="space-y-3 bg-clay-cream p-4 sm:p-6 rounded-4xl border border-clay-paper shadow-sm">
          <div className="flex items-center justify-between text-xs font-serif font-bold text-clay-wine">
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-clay-wine text-clay-milk flex items-center justify-center text-[11px] font-mono">
                {currentStep}
              </span>
              <span>Step {currentStep} of 6: {STEP_LABELS[currentStep - 1].title}</span>
            </span>

            {currentStep < 6 && (
              <span className="font-mono text-xs px-3 py-1 rounded-full bg-clay-milk text-clay-brown border border-clay-paper font-bold">
                Est. Total: ₱{grandTotal.toFixed(2)}
              </span>
            )}
          </div>

          {/* Progress Track */}
          <div className="w-full bg-clay-paper/80 h-2.5 rounded-full overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-clay-terracotta to-clay-wine h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            ></div>
          </div>

          {/* Stepper Breadcrumb Pills (Desktop interactive trail) */}
          <div className="hidden sm:grid grid-cols-6 gap-1.5 pt-1">
            {STEP_LABELS.map((st) => {
              const isPassed = currentStep > st.step;
              const isCurrent = currentStep === st.step;
              const canJump = currentStep < 6 && st.step < currentStep;

              return (
                <button
                  key={st.step}
                  type="button"
                  disabled={!canJump}
                  onClick={() => canJump && setCurrentStep(st.step)}
                  className={`py-1.5 px-2 rounded-2xl text-[11px] font-serif font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-clay-wine text-clay-milk shadow-sm ring-2 ring-clay-terracotta/40'
                      : isPassed
                      ? 'bg-clay-milk text-clay-wine border border-clay-paper hover:bg-clay-pink-soft cursor-pointer'
                      : 'bg-clay-paper/40 text-clay-brown-muted/70 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span className="font-mono text-[10px]">
                    {isPassed ? '✓' : st.step}
                  </span>
                  <span className="truncate">{st.short}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* STEP 1: CHOOSE YOUR PRINTING SERVICE                                      */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <section className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="font-serif font-black text-2xl text-clay-wine tracking-tight">
                Step 1: Choose Your Printing Service
              </h2>
              <div className="squiggle-wine mx-auto my-1"></div>
              <p className="text-xs text-clay-brown-muted max-w-md mx-auto">
                Select one of our four specialty services below to begin configuring your prints
              </p>
            </div>

            {/* 4 Large, Clickable Service Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {[
                {
                  id: 'PHOTO' as ServiceType,
                  title: 'Photo Printing',
                  subtitle: 'Value wallet packs, photostrips & standard glossy or matte frame sizes (2R to A4)',
                  features: ['Wallet & Instax Packs', 'Photostrips (S1, S2, S3)', 'Frames 2R to A4'],
                  priceBadge: 'From ₱10.00',
                  icon: Camera,
                  colorClass: 'hover:border-clay-terracotta',
                  selectedClass: 'border-clay-terracotta bg-clay-pink-soft ring-4 ring-clay-terracotta/25 shadow-lg scale-[1.02]',
                },
                {
                  id: 'ID_PICTURE' as ServiceType,
                  title: 'ID Pictures',
                  subtitle: 'Rush packages (1x1, 2x2, Passport, 1.5x1.5) with attire change & background editing',
                  features: ['All 8 Official Combos', 'Passport & DFA format', 'Formal attire & BG swap'],
                  priceBadge: 'From ₱50.00',
                  icon: UserSquare2,
                  colorClass: 'hover:border-clay-mustard',
                  selectedClass: 'border-clay-mustard bg-clay-mustard-light ring-4 ring-clay-mustard/30 shadow-lg scale-[1.02]',
                },
                {
                  id: 'DOCUMENT' as ServiceType,
                  title: 'Document Printing',
                  subtitle: 'Black & white, full-color, back-to-back bond prints with staple or spiral ring binding',
                  features: ['A4, Short & Long Sizes', 'B&W or Full-Color', 'Staple & Spiral Binding'],
                  priceBadge: 'From ₱3.00 / pg',
                  icon: FileText,
                  colorClass: 'hover:border-clay-sage',
                  selectedClass: 'border-clay-sage bg-clay-sage/20 ring-4 ring-clay-sage/30 shadow-lg scale-[1.02]',
                },
                {
                  id: 'OTHER' as ServiceType,
                  title: 'Print Crafts',
                  subtitle: 'Heavy-duty lamination, waterproof vinyl stickers, layout graphic design & tarpaulins',
                  features: ['Heat Seal Lamination', 'Glossy Vinyl Stickers', 'Custom Graphic Layout'],
                  priceBadge: 'From ₱8.00',
                  icon: Sparkles,
                  colorClass: 'hover:border-clay-wine',
                  selectedClass: 'border-clay-wine bg-clay-paper ring-4 ring-clay-wine/25 shadow-lg scale-[1.02]',
                },
              ].map((srv) => {
                const isSelected = activeTab === srv.id;
                const Icon = srv.icon;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setActiveTab(srv.id)}
                    className={`relative text-left p-6 rounded-4xl border-2 transition-all duration-200 flex flex-col justify-between group ${
                      isSelected
                        ? srv.selectedClass
                        : `border-clay-paper bg-clay-milk hover:scale-[1.01] ${srv.colorClass} shadow-clay`
                    }`}
                  >
                    {/* Top Icon & Selection Indicator */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 rounded-3xl bg-clay-milk shadow-md border border-clay-paper flex items-center justify-center text-clay-wine group-hover:scale-105 transition-transform">
                          <Icon className="w-7 h-7 text-clay-wine" />
                        </div>
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-clay-wine border-clay-wine text-clay-milk' 
                            : 'border-clay-paper bg-clay-milk text-transparent'
                        }`}>
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>

                      <h3 className="font-serif font-black text-lg text-clay-wine mb-1.5">
                        {srv.title}
                      </h3>
                      <p className="text-xs text-clay-brown-muted leading-relaxed mb-4">
                        {srv.subtitle}
                      </p>

                      <ul className="space-y-1 mb-4 text-[11px] text-clay-brown font-medium">
                        {srv.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-clay-terracotta"></span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-clay-paper/80 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-clay-brown-muted">Starting rate:</span>
                      <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-clay-milk border border-clay-paper text-clay-terracotta shadow-inner">
                        {srv.priceBadge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step 1 Actions */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-8 py-4 rounded-full bg-clay-wine hover:bg-clay-wine-dark text-clay-milk font-serif font-bold text-sm shadow-clay hover:scale-[1.02] active:scale-98 transition-all flex items-center gap-2.5"
              >
                <span>Continue to Configure Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: CONFIGURE YOUR ORDER                                              */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <section className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-clay-paper">
              <div>
                <span className="text-xs font-serif font-bold text-clay-terracotta uppercase tracking-wider block">
                  Step 2 of 6
                </span>
                <h2 className="font-serif font-black text-2xl text-clay-wine">
                  Configure Your {activeTab === 'PHOTO' ? 'Photo Printing' : activeTab === 'ID_PICTURE' ? 'ID Pictures' : activeTab === 'DOCUMENT' ? 'Document Prints' : 'Print Crafts'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-clay-pink/30 text-clay-wine border border-clay-pink">
                  {getItemTitle()}
                </span>
                <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-full bg-clay-mustard-light text-clay-brown border border-clay-mustard">
                  Subtotal: ₱{currentSubtotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Render ONLY options relevant to selected service (with hideUpload=true) */}
            <div className="bg-clay-cream p-6 rounded-5xl border border-clay-paper shadow-sm">
              {activeTab === 'PHOTO' && (
                <PhotoServiceForm
                  files={photoFiles}
                  onFilesChange={setPhotoFiles}
                  spec={photoSpec}
                  onSpecChange={setPhotoSpec}
                  hideUpload={photoSpec.category !== 'Photostrips (S1, S2, S3)'}
                />
              )}

              {activeTab === 'ID_PICTURE' && (
                <IdPictureForm
                  files={idFiles}
                  onFilesChange={setIdFiles}
                  spec={idSpec}
                  onSpecChange={setIdSpec}
                  hideUpload={false}
                />
              )}

              {activeTab === 'DOCUMENT' && (
                <DocumentServiceForm
                  files={docFiles}
                  onFilesChange={setDocFiles}
                  spec={docSpec}
                  onSpecChange={setDocSpec}
                  hideUpload={true}
                />
              )}

              {activeTab === 'OTHER' && (
                <OtherServiceForm
                  files={otherFiles}
                  onFilesChange={setOtherFiles}
                  spec={otherSpec}
                  onSpecChange={setOtherSpec}
                  hideUpload={true}
                />
              )}
            </div>

            {/* Step 2 Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3.5 rounded-full bg-clay-paper hover:bg-clay-cream text-clay-brown font-serif font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Services</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-8 py-4 rounded-full bg-clay-wine hover:bg-clay-wine-dark text-clay-milk font-serif font-bold text-sm shadow-clay hover:scale-[1.02] active:scale-98 transition-all flex items-center gap-2.5"
              >
                <span>Continue to File Upload</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: UPLOAD YOUR FILES                                                 */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <section className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-clay-paper">
              <div>
                <span className="text-xs font-serif font-bold text-clay-terracotta uppercase tracking-wider block">
                  Step 3 of 6
                </span>
                <h2 className="font-serif font-black text-2xl text-clay-wine">
                  Upload Your Files
                </h2>
              </div>
              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-clay-paper text-clay-brown border border-clay-paper">
                {getCurrentFiles().length} file(s) attached
              </span>
            </div>

            {/* Dedicated File Upload Card */}
            <div className="bg-clay-cream p-6 sm:p-8 rounded-5xl border border-clay-paper shadow-clay space-y-6">
              <FileUploader
                files={getCurrentFiles()}
                onChange={setCurrentFiles}
                accept={
                  activeTab === 'PHOTO' || activeTab === 'ID_PICTURE'
                    ? 'image/*'
                    : activeTab === 'DOCUMENT'
                    ? 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*'
                    : 'image/*,application/pdf,.doc,.docx'
                }
                multiple={activeTab !== 'ID_PICTURE'}
                maxFiles={activeTab === 'PHOTO' ? 30 : activeTab === 'ID_PICTURE' ? 1 : 15}
                label={
                  activeTab === 'PHOTO'
                    ? 'Upload Your Photos or Collage Pictures'
                    : activeTab === 'ID_PICTURE'
                    ? 'Upload Portrait Photo or Selfie'
                    : activeTab === 'DOCUMENT'
                    ? 'Upload PDF, Word, or Scanned Documents'
                    : 'Upload Reference Images, Designs, or Documents'
                }
              />

              {/* Service Upload Guideline Note */}
              <div className="p-4 rounded-3xl bg-clay-milk border border-clay-paper text-xs text-clay-brown space-y-1">
                <p className="font-serif font-bold text-clay-wine flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-clay-terracotta" />
                  <span>File Guidelines for {activeTab === 'PHOTO' ? 'Photos' : activeTab === 'ID_PICTURE' ? 'ID Pictures' : activeTab === 'DOCUMENT' ? 'Documents' : 'Crafts'}:</span>
                </p>
                <p className="text-[11px] text-clay-brown-muted">
                  {activeTab === 'PHOTO' && 'Upload high resolution JPG or PNG files for vivid colors. Multiple photos are supported for sets and photostrips.'}
                  {activeTab === 'ID_PICTURE' && 'Look straight at the camera with even lighting. We will automatically crop, clean background, and center according to government standards.'}
                  {activeTab === 'DOCUMENT' && 'PDF format is strongly recommended to preserve exact page margins, headers, tables, and typography.'}
                  {activeTab === 'OTHER' && 'Upload logos, text drafts, or sample photos for custom crafting and lamination.'}
                </p>
              </div>

              {/* In-Store File Transfer Option */}
              <label className="p-4 rounded-3xl bg-clay-milk border border-clay-paper flex items-center justify-between cursor-pointer hover:border-clay-terracotta/40 transition-colors">
                <div className="pr-3">
                  <p className="text-xs font-serif font-bold text-clay-wine">
                    I will transfer files in store
                  </p>
                  <p className="text-[11px] text-clay-brown-muted">
                    Check this if you plan to bring your USB flash drive or send files via Facebook Messenger at the counter.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={bringFilesLater}
                  onChange={(e) => setBringFilesLater(e.target.checked)}
                  className="w-5 h-5 rounded text-clay-wine focus:ring-clay-wine bg-white border-clay-paper cursor-pointer"
                />
              </label>
            </div>

            {/* Validation Notice if attempting to proceed without file */}
            {!canProceedFromStep3 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Please upload at least 1 file above, or check &quot;I will transfer files in store&quot; to proceed.</span>
              </div>
            )}

            {/* Step 3 Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3.5 rounded-full bg-clay-paper hover:bg-clay-cream text-clay-brown font-serif font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Configure</span>
              </button>

              <button
                type="button"
                disabled={!canProceedFromStep3}
                onClick={() => setCurrentStep(4)}
                className={`px-8 py-4 rounded-full font-serif font-bold text-sm shadow-clay transition-all flex items-center gap-2.5 ${
                  canProceedFromStep3
                    ? 'bg-clay-wine hover:bg-clay-wine-dark text-clay-milk hover:scale-[1.02] active:scale-98'
                    : 'bg-clay-paper text-clay-brown-muted cursor-not-allowed opacity-70'
                }`}
              >
                <span>Continue to Customer Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: ENTER CUSTOMER DETAILS                                            */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <section className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-clay-paper">
              <div>
                <span className="text-xs font-serif font-bold text-clay-terracotta uppercase tracking-wider block">
                  Step 4 of 6
                </span>
                <h2 className="font-serif font-black text-2xl text-clay-wine">
                  Customer & Pickup Details
                </h2>
              </div>
              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-clay-sage/30 text-clay-brown border border-clay-sage/40">
                ⚡ Quick Counter Claim
              </span>
            </div>

            <div className="bg-clay-cream p-6 sm:p-8 rounded-5xl border border-clay-paper shadow-clay space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-serif font-bold text-clay-wine flex items-center gap-1.5 mb-1.5">
                    <User className="w-3.5 h-3.5 text-clay-terracotta" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-clay-milk border border-clay-paper rounded-2xl px-4 py-3 text-xs text-clay-brown placeholder-clay-brown-muted focus:outline-none focus:border-clay-terracotta shadow-clay-inner font-medium"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="text-xs font-serif font-bold text-clay-wine flex items-center gap-1.5 mb-1.5">
                    <Phone className="w-3.5 h-3.5 text-clay-terracotta" />
                    Mobile / Contact Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0917-123-4567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-clay-milk border border-clay-paper rounded-2xl px-4 py-3 text-xs text-clay-brown placeholder-clay-brown-muted focus:outline-none focus:border-clay-terracotta shadow-clay-inner font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Address */}
                <div>
                  <label className="text-xs font-serif font-bold text-clay-wine flex items-center gap-1.5 mb-1.5">
                    <Mail className="w-3.5 h-3.5 text-clay-terracotta" />
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. maria@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-clay-milk border border-clay-paper rounded-2xl px-4 py-3 text-xs text-clay-brown placeholder-clay-brown-muted focus:outline-none focus:border-clay-terracotta shadow-clay-inner font-medium"
                  />
                </div>

                {/* Target Claim Time */}
                <div>
                  <label className="text-xs font-serif font-bold text-clay-wine flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-clay-terracotta" />
                    Target Claim Time
                  </label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full bg-clay-milk border border-clay-paper rounded-2xl px-3.5 py-3 text-xs text-clay-brown focus:outline-none focus:border-clay-terracotta shadow-clay-inner font-medium"
                  >
                    <option value="In 30-45 Minutes (Express)">In 30-45 Minutes (Express)</option>
                    <option value="Today within 2-3 Hours">Today within 2-3 Hours</option>
                    <option value="Today before 6:00 PM Close">Today before 6:00 PM Close</option>
                    <option value="Tomorrow Morning (9:00 AM - 12:00 PM)">Tomorrow Morning (9:00 AM - 12:00 PM)</option>
                    <option value="Tomorrow Afternoon">Tomorrow Afternoon</option>
                  </select>
                </div>
              </div>

              {/* Priority Rush Switch */}
              <div className="p-4 rounded-3xl bg-clay-mustard-light border border-clay-mustard/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-clay-mustard text-clay-milk shadow-sm">
                    <Zap className="w-5 h-5 text-clay-wine" />
                  </div>
                  <div>
                    <p className="text-xs font-serif font-bold text-clay-wine">Priority Rush Expedite (+25%)</p>
                    <p className="text-[11px] text-clay-brown-muted">Fast-tracks your order to the front of the print queue</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isRush}
                  onChange={(e) => setIsRush(e.target.checked)}
                  className="w-5 h-5 rounded text-clay-wine focus:ring-clay-wine bg-clay-milk border-clay-paper cursor-pointer"
                />
              </div>

              {/* Additional Instructions / Notes */}
              <div>
                <label className="text-xs font-serif font-bold text-clay-wine flex items-center gap-1.5 mb-1.5">
                  <FileEdit className="w-3.5 h-3.5 text-clay-terracotta" />
                  Additional Notes or Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cut borders neatly, high gloss finish preferred, or specific sizing request..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-clay-milk border border-clay-paper rounded-2xl px-4 py-2.5 text-xs text-clay-brown placeholder-clay-brown-muted focus:outline-none focus:border-clay-terracotta shadow-clay-inner"
                ></textarea>
              </div>
            </div>

            {/* Validation alert */}
            {submitError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {!canProceedFromStep4 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Please enter your full name (min 2 letters) and a valid Philippine mobile number (e.g., 0917-123-4567 or +639171234567) to continue.</span>
              </div>
            )}

            {/* Step 4 Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3.5 rounded-full bg-clay-paper hover:bg-clay-cream text-clay-brown font-serif font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Files</span>
              </button>

              <button
                type="button"
                disabled={!canProceedFromStep4}
                onClick={() => setCurrentStep(5)}
                className={`px-8 py-4 rounded-full font-serif font-bold text-sm shadow-clay transition-all flex items-center gap-2.5 ${
                  canProceedFromStep4
                    ? 'bg-clay-wine hover:bg-clay-wine-dark text-clay-milk hover:scale-[1.02] active:scale-98'
                    : 'bg-clay-paper text-clay-brown-muted cursor-not-allowed opacity-70'
                }`}
              >
                <span>Continue to Review Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: REVIEW ORDER                                                      */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <section className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-clay-paper">
              <div>
                <span className="text-xs font-serif font-bold text-clay-terracotta uppercase tracking-wider block">
                  Step 5 of 6
                </span>
                <h2 className="font-serif font-black text-2xl text-clay-wine">
                  Review Your Order
                </h2>
              </div>
              <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-full bg-clay-mustard-light text-clay-brown border border-clay-mustard">
                Total: ₱{grandTotal.toFixed(2)}
              </span>
            </div>

            {/* Comprehensive Review Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Job & File Summary */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* 1. Printing Specifications Card */}
                <div className="bg-clay-cream p-5 rounded-4xl border border-clay-paper shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-clay-paper">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-serif font-bold text-clay-wine uppercase tracking-wide">
                        1. Selected Service & Specs
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-[11px] font-serif font-bold text-clay-terracotta hover:underline inline-flex items-center gap-1"
                    >
                      <FileEdit className="w-3 h-3" />
                      <span>Edit Specs</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-clay-milk border border-clay-paper">
                    <p className="font-serif font-bold text-sm text-clay-wine">{getItemTitle()}</p>
                    <p className="text-[11px] text-clay-brown-muted mt-0.5">Category: {activeTab}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {getSpecsSummaryList().map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-2xl bg-clay-milk/60 border border-clay-paper/60">
                        <span className="text-[10px] text-clay-brown-muted block">{item.label}</span>
                        <span className="font-bold text-clay-brown text-[11px]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Uploaded Files Card */}
                <div className="bg-clay-cream p-5 rounded-4xl border border-clay-paper shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-clay-paper">
                    <span className="text-xs font-serif font-bold text-clay-wine uppercase tracking-wide">
                      2. Files Attached ({getCurrentFiles().length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-[11px] font-serif font-bold text-clay-terracotta hover:underline inline-flex items-center gap-1"
                    >
                      <FileEdit className="w-3 h-3" />
                      <span>Edit Files</span>
                    </button>
                  </div>

                  {getCurrentFiles().length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {getCurrentFiles().map((f) => (
                        <div key={f.id} className="p-2.5 rounded-2xl bg-clay-milk border border-clay-paper flex items-center justify-between text-xs">
                          <span className="truncate max-w-[220px] font-medium text-clay-brown">{f.name}</span>
                          <span className="text-[10px] text-clay-brown-muted font-mono">{(f.size / 1024).toFixed(0)} KB</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-amber-50 text-amber-900 text-xs border border-amber-200">
                      ⚡ Customer will transfer files in person at counter (USB / Messenger)
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Customer Info & Price Breakdown */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* 3. Customer Information */}
                <div className="bg-clay-cream p-5 rounded-4xl border border-clay-paper shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-clay-paper">
                    <span className="text-xs font-serif font-bold text-clay-wine uppercase tracking-wide">
                      3. Customer Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="text-[11px] font-serif font-bold text-clay-terracotta hover:underline inline-flex items-center gap-1"
                    >
                      <FileEdit className="w-3 h-3" />
                      <span>Edit Info</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 rounded-xl bg-clay-milk">
                      <span className="text-clay-brown-muted">Name:</span>
                      <span className="font-bold text-clay-wine">{customerName}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-xl bg-clay-milk">
                      <span className="text-clay-brown-muted">Phone:</span>
                      <span className="font-mono font-bold text-clay-brown">{customerPhone}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-xl bg-clay-milk">
                      <span className="text-clay-brown-muted">Pickup Target:</span>
                      <span className="font-medium text-clay-brown">{pickupTime}</span>
                    </div>
                    {notes && (
                      <div className="p-2 rounded-xl bg-clay-milk text-[11px]">
                        <span className="text-clay-brown-muted block mb-0.5">Notes:</span>
                        <p className="text-clay-brown italic">{notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Complete Price Breakdown */}
                <div className="bg-clay-cream p-5 rounded-4xl border border-clay-paper shadow-sm space-y-3">
                  <h4 className="text-xs font-serif font-bold text-clay-wine uppercase tracking-wide pb-2 border-b border-clay-paper">
                    4. Price Breakdown
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-clay-brown-muted">
                      <span>Service Subtotal:</span>
                      <span className="font-mono font-bold text-clay-brown">₱{currentSubtotal.toFixed(2)}</span>
                    </div>

                    {isRush && (
                      <div className="flex justify-between text-clay-terracotta">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Priority Rush Fee (+25%):</span>
                        </span>
                        <span className="font-mono font-bold">+₱{rushFee.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm font-bold text-clay-wine pt-2 border-t border-clay-paper">
                      <span className="font-serif">Total Due at Counter:</span>
                      <span className="font-mono text-clay-wine text-2xl font-black">
                        ₱{grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-clay-brown-muted text-center border-t border-clay-paper/70">
                    <ShieldCheck className="w-3.5 h-3.5 text-clay-sage-dark" />
                    <span>Pay cash or GCash at the counter upon pickup</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message if Submission Fails */}
            {submitError && (
              <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Step 5 Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setCurrentStep(4)}
                className="px-6 py-3.5 rounded-full bg-clay-paper hover:bg-clay-cream text-clay-brown font-serif font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Details</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitOrder}
                className="px-9 py-4 rounded-full bg-clay-wine hover:bg-clay-wine-dark text-clay-milk font-serif font-bold text-sm shadow-clay hover:scale-[1.02] active:scale-98 transition-all flex items-center gap-2.5 disabled:opacity-75 disabled:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-clay-milk/40 border-t-clay-milk rounded-full animate-spin"></span>
                    <span>Saving Order & Generating QR Ticket...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Order & Get Pickup Ticket</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: ORDER SUBMISSION & CONFIRMED TICKET                               */}
        {/* ========================================================================= */}
        {currentStep === 6 && confirmedOrder && (
          <section className="space-y-6 animate-fade-in text-center max-w-xl mx-auto py-4">
            
            {/* Celebratory Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-clay-mustard-light border border-clay-mustard/40 text-clay-brown text-xs font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-clay-terracotta animate-spin" />
              <span>Order Received Successfully!</span>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif font-black text-3xl sm:text-4xl text-clay-wine tracking-tight">
                Your Pickup Ticket is Ready! 🎉
              </h2>
              <p className="text-xs sm:text-sm text-clay-brown-muted max-w-md mx-auto">
                Thank you, <span className="font-bold text-clay-wine">{confirmedOrder.customerName}</span>! Your print job has been placed in the live queue.
              </p>
            </div>

            {/* High-Contrast Pickup Ticket Card */}
            <div className="bg-clay-cream p-6 sm:p-8 rounded-5xl border-4 border-clay-paper shadow-2xl space-y-5">
              
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-clay-brown-muted uppercase tracking-wider block">
                  Official Reference Number
                </span>
                <span className="font-mono font-black text-2xl sm:text-3xl text-clay-wine tracking-wider block">
                  {confirmedOrder.orderNumber}
                </span>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-white rounded-3xl shadow-sm border-2 border-clay-paper inline-block">
                <QRCodeSVG
                  value={`${getSiteUrl()}/receipt/${confirmedOrder.publicToken || confirmedOrder.orderNumber}`}
                  size={190}
                  level="H"
                  fgColor="#382325"
                  bgColor="#ffffff"
                  includeMargin={true}
                />
              </div>

              <p className="text-xs text-clay-brown-muted font-medium max-w-xs mx-auto">
                📱 Screenshot or present this QR code at the Dxlea Printing counter upon claim.
              </p>

              {/* Quick Details Pill */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-clay-paper text-left">
                <div className="p-3 rounded-2xl bg-clay-milk">
                  <span className="text-[10px] text-clay-brown-muted block">Target Pickup</span>
                  <span className="font-bold text-clay-wine">{confirmedOrder.pickupTime || 'Today'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-clay-milk">
                  <span className="text-[10px] text-clay-brown-muted block">Total to Pay</span>
                  <span className="font-mono font-black text-clay-terracotta text-sm">₱{confirmedOrder.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Post-Submit Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push(`/receipt/${confirmedOrder.publicToken || confirmedOrder.orderNumber}`)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-clay-wine hover:bg-clay-wine-dark text-clay-milk font-serif font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>View Full Tracker & Receipt Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResetOrder}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-clay-paper hover:bg-clay-cream text-clay-brown font-serif font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-clay-terracotta" />
                <span>Place Another Order</span>
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
