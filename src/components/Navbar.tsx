'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  // Do not render customer storefront navbar on admin pages
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

          {/* Compact Social Facebook Pill */}
          <div className="flex items-center gap-2">
            <a
              href="https://www.facebook.com/Dxleaprinting/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-bold text-clay-wine bg-clay-paper/70 hover:bg-clay-pink-soft border border-clay-paper hover:border-clay-pink transition-all shadow-sm active:scale-95"
              title="Visit Dxlea Printing on Facebook"
            >
              <svg 
                className="w-3.5 h-3.5 fill-current text-clay-wine transition-transform group-hover:scale-110 flex-shrink-0" 
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="font-serif font-semibold hidden xs:inline">Facebook</span>
              <span className="text-[10px] text-clay-terracotta opacity-80">↗</span>
            </a>
          </div>

        </div>
      </div>
    </header>
  );
}
