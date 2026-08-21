import React from 'react';

interface StatusTagProps {
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
}

export default function StatusTag({ status }: StatusTagProps) {
  const map: Record<string, string> = {
    Approved: 'bg-[#DCFCE7] text-[#047857] border border-[#A7F3D0]',
    Pending: 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
    Rejected: 'bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]',
    Cancelled: 'bg-[#EDF4FB] text-[#52657A] border border-[#DCE6F0]',
  };
  const styleCls = map[status] || 'bg-[#EDF4FB] text-[#0F172A] border border-[#DCE6F0]';
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${styleCls}`}>
      {status}
    </span>
  );
}