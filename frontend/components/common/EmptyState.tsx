export default function EmptyState({ title = 'Nothing here yet', subtitle = '', className = '' }: { title?: string; subtitle?: string; className?: string }) {
  return (
    <div className={`card-soft p-6 text-center text-[#52657A] ${className}`}>
      <p className="text-sm font-bold text-[#0F172A]">{title}</p>
      {subtitle ? <p className="text-xs text-[#8897A8] mt-1">{subtitle}</p> : null}
    </div>
  );
}

