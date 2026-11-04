import type { Metadata } from 'next';
import Link from 'next/link';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ShieldCheck } from 'lucide-react';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
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
    <html lang="en" className={`${fraunces.variable} ${plusJakarta.variable}`}>
      <body className="font-sans min-h-screen flex flex-col bg-clay-sage text-clay-brown antialiased selection:bg-clay-pink selection:text-clay-brown">
        <Navbar />
        <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <footer className="no-print mt-auto py-8 text-center text-xs text-clay-milk/90 space-y-2">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-clay-mustard animate-pulse"></span>
              <span className="font-serif font-bold text-sm tracking-wide text-clay-milk">
                DXLEA PRINTING SERVICES
              </span>
              <span className="opacity-60">• Est. 2023</span>
            </div>
            <div className="opacity-90 flex flex-wrap items-center justify-center gap-3 text-[11px]">
              <span>📍 Concepcion Grande, Naga City</span>
              <span>•</span>
              <span>✉️ dxleaprinting@gmail.com</span>
              <span>•</span>
              <span>FB: dxlea printing</span>
              <span>•</span>
              <Link 
                href="/admin/login" 
                className="opacity-70 hover:opacity-100 hover:text-clay-mustard transition-opacity inline-flex items-center gap-1 font-medium"
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
