import React from 'react';
import Image from 'next/image';

/**
 * CampusPlay Global Textured Background System
 * 
 * Layered architectural design:
 * - Layer 1: Base cool-white & icy-blue canvas (#F8FBFF / #F1F7FF)
 * - Layer 2: Soft ambient radial depth gradients at outer corners
 * - Layer 3 & 4: Abstract organic curves & subtle paper grain texture (campusplay-textured-bg.jpg)
 * - Layer 5: Restrained corner dot matrices (top-right & bottom-left)
 * - Central Content Protection: High-luminance radial vignette preserving readability
 */
export default function GlobalBackground() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* LAYER 1: Base Cool-White Canvas */}
      <div className="absolute inset-0 bg-[#F4F8FC]" />

      {/* LAYER 2: Ambient Soft Tonal Radial Gradients */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 75% 55% at 5% 0%, rgba(219, 234, 254, 0.40) 0%, transparent 70%),
            radial-gradient(ellipse 65% 50% at 95% 100%, rgba(224, 242, 254, 0.40) 0%, transparent 70%),
            radial-gradient(circle 800px at 50% 30%, rgba(255, 255, 255, 0.85) 0%, transparent 75%)
          `,
        }}
      />

      {/* LAYER 3: Smooth Collegiate Athletic Texture with Micro-Noise */}
      <div className="absolute inset-0 opacity-[0.85]">
        <Image
          src="/images/campusplay-textured-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* CENTRAL HIGHLIGHT VIGNETTE (Keeps tables, forms, and cards on clean contrast) */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 35%, rgba(255, 255, 255, 0.40) 0%, transparent 80%)',
        }}
      />
    </div>
  );
}
