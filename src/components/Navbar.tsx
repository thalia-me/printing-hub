'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Printer, 
  Search, 
  ShieldCheck, 
  Menu, 
  X, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchCode, setSearchCode] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    router.push(`/receipt/${searchCode.trim().toUpperCase()}`);
    setSearchCode('');
    setMobileMenuOpen(false);
  };

  const isAdmin = pathname.startsWith('/admin');

  // Separate Admin layout completely: do not render customer storefront navbar on admin pages
  if (isAdmin) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-clay-cream/95 backdrop-blur-md border-b border-clay-paper shadow-sm no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo with DXLEA circular logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-clay-pink shadow-sm group-hover:scale-105 transition-transform bg-white flex-shrink-0">
              <Image
                src="/images/logo.jpg"
                alt="Dxlea Printing Services Logo"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-lg sm:text-xl text-clay-wine tracking-tight">
                  Dxlea Printing
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-clay-pink/30 text-clay-wine border border-clay-pink/50">
                  Est. 2023
                </span>
              </div>
              <p className="text-[11px] text-clay-brown-muted hidden sm:block">
                Made with Care, Printed to Last • Quick QR Claim
              </p>
            </div>
          </Link>

          {/* Search Order Tracker Quick Pill */}
          <form onSubmit={handleTrackSubmit} className="hidden md:flex items-center relative max-w-xs w-full">
            <Search className="w-4 h-4 text-clay-brown-muted absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Track Order (PRT-...)"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full bg-clay-milk text-xs rounded-full pl-9 pr-3.5 py-2 border border-clay-paper text-clay-brown placeholder-clay-brown-muted/70 focus:outline-none focus:border-clay-terracotta focus:ring-1 focus:ring-clay-terracotta transition-colors uppercase font-mono shadow-clay-inner"
            />
          </form>

          {/* Navigation Links with playful pill aesthetic */}
          <nav className="hidden md:flex items-center gap-2.5">
            <Link
              href="/"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                pathname === '/' 
                  ? 'bg-clay-wine text-clay-milk shadow-md' 
                  : 'text-clay-brown hover:bg-clay-paper'
              }`}
            >
              Order Prints
            </Link>

            <button
              type="button"
              onClick={() => {
                const searchInput = document.querySelector('input[placeholder*="Track Order"]') as HTMLInputElement;
                if (searchInput) {
                  searchInput.focus();
                  searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-clay-brown bg-clay-paper/80 hover:bg-clay-paper border border-clay-paper transition-all"
            >
              <Search className="w-3.5 h-3.5 text-clay-terracotta" />
              <span>Track Order</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full bg-clay-paper text-clay-brown hover:bg-clay-mustard-light"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-clay-paper bg-clay-cream px-4 pt-3 pb-5 space-y-3">
          <form onSubmit={handleTrackSubmit} className="relative">
            <Search className="w-4 h-4 text-clay-brown-muted absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Enter Order Code (PRT-...)"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full bg-clay-milk text-xs rounded-full pl-9 pr-3 py-2 border border-clay-paper text-clay-brown placeholder-clay-brown-muted focus:outline-none uppercase font-mono"
            />
          </form>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 p-2.5 rounded-full bg-clay-wine text-xs font-bold text-clay-milk"
            >
              <Printer className="w-4 h-4" />
              <span>Start Order</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                const input = document.querySelector('input[placeholder*="Enter Order Code"]') as HTMLInputElement;
                if (input) input.focus();
              }}
              className="flex items-center justify-center gap-2 p-2.5 rounded-full bg-clay-paper text-xs font-bold text-clay-brown"
            >
              <Search className="w-4 h-4 text-clay-terracotta" />
              <span>Track Order</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
