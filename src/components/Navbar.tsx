'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
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
              <span className="font-serif font-black text-xl text-clay-wine tracking-tight">
                Dxlea Printing
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
