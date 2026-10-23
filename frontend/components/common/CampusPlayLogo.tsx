import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface CampusPlayLogoProps {
  /** 'full' displays complete horizontal logo with emblem, wordmark & tagline. 'emblem' displays square monogram. */
  variant?: 'full' | 'emblem';
  /** URL to link to. Defaults to '/'. Pass null or false to disable link wrapper. */
  href?: string | null | false;
  /** High priority preload for above-the-fold headers to eliminate layout shifts (CLS). */
  priority?: boolean;
  /** Additional container classes */
  className?: string;
  /** Image-specific classes */
  imgClassName?: string;
  /** Custom image width (preserves aspect ratio automatically) */
  width?: number;
  /** Custom image height */
  height?: number;
  /** Accessible alt text */
  alt?: string;
  /** Click handler */
  onClick?: () => void;
}

export default function CampusPlayLogo({
  variant = 'full',
  href = '/',
  priority = true,
  className = '',
  imgClassName = '',
  width,
  height,
  alt,
  onClick,
}: CampusPlayLogoProps) {
  const isEmblem = variant === 'emblem';

  // Master dimensions from tight asset metrics:
  // Full logo: 951 x 204 (aspect ratio ~4.66:1)
  // Emblem: 302 x 302 (1:1)
  const defaultWidth = isEmblem ? 42 : 280;
  const defaultHeight = isEmblem ? 42 : 60;
  const intrinsicWidth = isEmblem ? 302 : 951;
  const intrinsicHeight = isEmblem ? 302 : 204;

  const src = isEmblem ? '/campusplay-emblem.png' : '/campusplay-logo.png';
  const defaultAlt = isEmblem 
    ? 'CampusPlay Sports Emblem' 
    : 'CampusPlay — Your Campus. Your Game. Your Time.';

  const imageElement = (
    <div
      className={`inline-flex items-center justify-center select-none flex-shrink-0 ${
        isEmblem
          ? 'w-9 h-9 sm:w-10 sm:h-10'
          : 'w-[180px] sm:w-[220px] md:w-[260px] lg:w-[290px]'
      } ${className}`}
    >
      <Image
        src={src}
        alt={alt || defaultAlt}
        width={width || intrinsicWidth}
        height={height || intrinsicHeight}
        priority={priority}
        className={`w-full h-auto object-contain transition-opacity duration-150 ${imgClassName}`}
        sizes={
          isEmblem
            ? '42px'
            : '(max-width: 640px) 180px, (max-width: 768px) 230px, (max-width: 1024px) 270px, 320px'
        }
      />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="inline-flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 rounded-lg transition-transform active:scale-[0.99]"
        title="CampusPlay Home"
        aria-label={alt || defaultAlt}
      >
        {imageElement}
      </Link>
    );
  }

  return imageElement;
}
