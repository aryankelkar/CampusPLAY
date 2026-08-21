import Link from 'next/link';
import { useRouter } from 'next/router';

const tabs = [
  { name: 'OVERVIEW', path: '/admin/dashboard' },
  { name: 'PENDING', path: '/admin/pending' },
  { name: 'APPROVED', path: '/admin/approved' },
  { name: 'REJECTED', path: '/admin/rejected' },
];

export default function AdminTabs() {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F8FAFC] rounded-[14px] border border-[#E2E8F0] max-w-max font-inter">
      {tabs.map((t) => {
        const active = router.pathname === t.path;
        return (
          <Link
            key={t.path}
            href={t.path}
            className={
              `px-3.5 py-1.5 rounded-[10px] text-[11px] font-extrabold tracking-wider transition-all duration-200 ` +
              (active 
                ? `bg-[#2563EB] text-white shadow-xs` 
                : `text-[#52657A] hover:text-[#0F172A] hover:bg-white bg-transparent border border-transparent hover:border-[#DCE6F0]`)
            }
          >
            {t.name}
          </Link>
        );
      })}
    </div>
  );
}
