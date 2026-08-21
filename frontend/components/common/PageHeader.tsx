export default function PageHeader({ 
  title, 
  subtitle, 
  eyebrow,
  action
}: { 
  title: string; 
  subtitle?: string; 
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-[#DCE6F0]/60">
      <div>
        {eyebrow && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] bg-[#DBEAFE] px-2.5 py-0.5 rounded-md border border-[#BFDBFE] inline-block mb-1">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs sm:text-sm text-[#52657A]">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

