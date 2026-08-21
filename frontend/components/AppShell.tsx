import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3F7FC] text-[#0F172A] selection:bg-[#DBEAFE] selection:text-[#1D4ED8]">
      {/* GLOBAL STICKY NAVBAR */}
      <Navbar />

      {/* MAIN PAGE CONTAINER WITH STANDARDIZED VIEWPORT SPACING */}
      <main className="w-full flex-1 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 transition-all duration-200">
        {children}
      </main>

      {/* GLOBAL FOOTER */}
      <Footer />
    </div>
  );
}
