import Link from 'next/link';
import { useRouter } from 'next/router';

export type AdminTabStatus = 'all' | 'Pending' | 'Approved' | 'Rejected';

interface AdminTabsProps {
  activeStatus?: AdminTabStatus;
  onStatusChange?: (status: AdminTabStatus) => void;
  counts?: Record<string, number>;
  showCounts?: boolean;
}

const tabs: Array<{ name: string; status: AdminTabStatus; path: string }> = [
  { name: 'OVERVIEW', status: 'all', path: '/admin/dashboard' },
  { name: 'PENDING', status: 'Pending', path: '/admin/pending' },
  { name: 'APPROVED', status: 'Approved', path: '/admin/approved' },
  { name: 'REJECTED', status: 'Rejected', path: '/admin/rejected' },
];

export default function AdminTabs({ activeStatus, onStatusChange, counts, showCounts = false }: AdminTabsProps) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F8FAFC] rounded-[14px] border border-[#E2E8F0] max-w-max font-inter">
      {tabs.map((t) => {
        const active = onStatusChange 
          ? (activeStatus || 'all') === t.status
          : router.pathname === t.path;

        const count = counts ? (counts[t.status] ?? (t.status === 'all' ? counts.all : undefined)) : undefined;

        if (onStatusChange) {
          return (
            <button
              key={t.name}
              type="button"
              onClick={() => onStatusChange(t.status)}
              className={
                `px-3.5 py-1.5 rounded-[10px] text-[11px] font-extrabold tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ` +
                (active 
                  ? `bg-[#2563EB] text-white shadow-xs` 
                  : `text-[#52657A] hover:text-[#0F172A] hover:bg-white bg-transparent border border-transparent hover:border-[#DCE6F0]`)
              }
            >
              <span>{t.name}</span>
              {showCounts && count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  active ? 'bg-white/25 text-white' : 'bg-[#E2E8F0] text-[#0F172A]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        }

        return (
          <Link
            key={t.path}
            href={t.path}
            className={
              `px-3.5 py-1.5 rounded-[10px] text-[11px] font-extrabold tracking-wider transition-all duration-200 flex items-center gap-1.5 ` +
              (active 
                ? `bg-[#2563EB] text-white shadow-xs` 
                : `text-[#52657A] hover:text-[#0F172A] hover:bg-white bg-transparent border border-transparent hover:border-[#DCE6F0]`)
            }
          >
            <span>{t.name}</span>
            {showCounts && count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                active ? 'bg-white/25 text-white' : 'bg-[#E2E8F0] text-[#0F172A]'
              }`}>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
