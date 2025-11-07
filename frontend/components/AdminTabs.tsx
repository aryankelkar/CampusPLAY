import Link from 'next/link';
import { useRouter } from 'next/router';

const tabs = [
  { name: 'Pending', path: '/admin/pending' },
  { name: 'Approved', path: '/admin/approved' },
  { name: 'Rejected', path: '/admin/rejected' },
];

export default function AdminTabs() {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((t) => {
        const active = router.pathname === t.path;
        return (
          <Link
            key={t.path}
            href={t.path}
            className={
              `px-4 py-2 rounded-lg text-sm font-medium transition-all ` +
              (active ? `bg-blue-600 text-white shadow` : `bg-gray-100 text-gray-700 hover:bg-gray-200`)
            }
          >
            {t.name}
          </Link>
        );
      })}
    </div>
  );
}
