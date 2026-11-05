import type { Metadata } from 'next';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ShieldCheck } from 'lucide-react';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dxlea Printing Services - Made with Care, Printed to Last',
  description: 'Dxlea Printing Services (Est. 2023) - Online photo printing, ID pictures, documents, and paper crafts with instant counter pickup via QR code.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} font-sans`}>
      <body className="font-sans min-h-screen flex flex-col bg-clay-sage text-clay-brown antialiased selection:bg-clay-pink selection:text-clay-brown">
        <Navbar />
        <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <footer className="no-print mt-auto pt-8 pb-10 text-xs text-clay-milk/90 border-t border-clay-milk/15">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              {/* Brand & Exact Location */}
              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-clay-mustard animate-pulse" />
                  <span className="font-serif font-black text-sm tracking-wide text-clay-milk">
                    DXLEA PRINTING SERVICES
                  </span>
                </div>
                <p className="text-[11px] text-clay-milk/80">
                  📍 Concepcion Grande, Villa Grande Homes, Naga City, Camarines Sur.
                </p>
              </div>

              {/* Official Social Links & Contact */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px]">
                <a
                  href="https://www.facebook.com/Dxleaprinting/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-clay-milk text-clay-wine font-bold hover:bg-clay-cream transition-all shadow-sm active:scale-95"
                >
                  <svg className="w-3 h-3 fill-current text-clay-wine" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Official Facebook</span>
                  <span className="text-[9px] opacity-70">↗</span>
                </a>

                <a
                  href="mailto:dxleaprinting@gmail.com"
                  className="px-3 py-1.5 rounded-full bg-clay-sage-dark/40 text-clay-milk hover:bg-clay-sage-dark/60 transition-colors"
                >
                  ✉️ dxleaprinting@gmail.com
                </a>
              </div>
            </div>

            {/* Bottom Copyright & Staff Portal */}
            <div className="pt-3 border-t border-clay-milk/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-clay-milk/75">
              <p>© 2026 Dxlea Printing Services. All rights reserved.</p>
              <Link 
                href="/admin/login" 
                className="opacity-75 hover:opacity-100 hover:text-clay-mustard transition-opacity inline-flex items-center gap-1 font-medium"
                title="Dxlea Staff Management Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-clay-terracotta" />
                <span>Staff Portal</span>
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
