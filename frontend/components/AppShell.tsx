import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import GlobalBackground from './common/GlobalBackground';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen flex flex-col bg-transparent text-[#0F172A] selection:bg-[#DBEAFE] selection:text-[#1D4ED8]">
      {/* GLOBAL TEXTURED BACKGROUND SYSTEM */}
      <GlobalBackground />

      {/* GLOBAL STICKY NAVBAR */}
      <Navbar />

      {/* MAIN PAGE CONTAINER WITH PROPER NAVBAR CLEARANCE */}
      <main className="w-full flex-1 max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-8 sm:pt-12 lg:pt-14 pb-20 transition-all duration-200">
        {children}
      </main>

      {/* GLOBAL FOOTER */}
      <Footer />
    </div>
  );
}
