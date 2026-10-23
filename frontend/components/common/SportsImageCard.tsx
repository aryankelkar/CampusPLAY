import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface SportsImageCardProps {
  src: string;
  alt: string;
  title: string;
  category?: string;
  description: string;
  href?: string;
  ctaText?: string;
  badge?: string;
  badgeIcon?: LucideIcon;
  aspectRatio?: '4/3' | '16/9' | '3/2' | '21/9';
  priority?: boolean;
  objectPosition?: string;
  className?: string;
}

export default function SportsImageCard({
  src,
  alt,
  title,
  category,
  description,
  href,
  ctaText = 'View Details',
  badge,
  badgeIcon: BadgeIcon,
  aspectRatio = '4/3',
  priority = false,
  objectPosition = 'center',
  className = '',
}: SportsImageCardProps) {
  // Map aspect ratio to Tailwind classes
  const aspectClass = {
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-[16/9]',
    '3/2': 'aspect-[3/2]',
    '21/9': 'aspect-[21/9]',
  }[aspectRatio] || 'aspect-[4/3]';

  const cardContent = (
    <article 
      className={`group relative flex flex-col bg-white rounded-[22px] border border-[#E8EEF5] overflow-hidden shadow-[4px_4px_14px_rgba(148,163,184,0.12),-4px_-4px_14px_rgba(255,255,255,0.85)] hover:border-[#2563EB]/40 hover:shadow-[6px_6px_20px_rgba(37,99,235,0.10)] transition-all duration-300 motion-reduce:transition-none focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:ring-offset-2 ${className}`}
    >
      {/* Image Framing Container */}
      <div className={`relative w-full ${aspectClass} overflow-hidden bg-slate-100`}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025] motion-reduce:group-hover:scale-100"
          style={{ objectPosition }}
        />
        
        {/* Soft Vignette / Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/75 via-[#0F172A]/15 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
          {category && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#2563EB] text-[10px] font-extrabold tracking-wider uppercase border border-white/40 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              {category}
            </span>
          )}

          {badge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0F172A]/75 backdrop-blur-md text-white text-[10px] font-bold tracking-wide border border-white/20">
              {BadgeIcon && <BadgeIcon size={12} className="text-[#38BDF8]" />}
              {badge}
            </span>
          )}
        </div>

        {/* In-Frame Title for Mobile / Fast Scanning */}
        <div className="absolute bottom-3.5 left-4 right-4 pointer-events-none">
          <h3 className="text-xl font-extrabold text-white tracking-tight drop-shadow-sm">
            {title}
          </h3>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <p className="text-xs sm:text-sm text-[#52657A] leading-relaxed mb-4 line-clamp-3">
          {description}
        </p>

        {href && (
          <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
            <span className="text-xs font-bold text-[#2563EB] group-hover:text-[#1D4ED8] flex items-center gap-1.5 transition-colors">
              <span>{ctaText}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform motion-reduce:group-hover:translate-x-0" />
            </span>
          </div>
        )}
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full outline-hidden focus:outline-hidden">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
