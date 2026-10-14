import { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  Dumbbell, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import api from '../lib/api';

interface StudentEquipmentReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess: (updatedBooking: any) => void;
}

export default function StudentEquipmentReturnModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: StudentEquipmentReturnModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const equipmentName = booking.equipmentName || booking.equipment?.name || 'Sports Equipment';
  const category = booking.equipmentCategory || booking.equipment?.category || 'General';
  const quantityIssued = booking.quantityIssued || booking.quantity || 1;

  const formattedIssueDate = booking.issuedAt 
    ? new Date(booking.issuedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : booking.date;

  const handleConfirmReturn = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const { data } = await api.put(`/equipment-bookings/${booking._id}/request-return`);
      const updated = data?.data?.booking || { ...booking, status: 'Return Requested', returnRequestedAt: new Date() };
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Unable to submit return request. Please try again or visit the equipment desk.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-inter text-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-modal-title"
    >
      <div 
        className="bg-white w-full max-w-lg rounded-[22px] border border-[#CBD5E1] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#F8FAFC] px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 id="return-modal-title" className="text-sm font-extrabold text-[#0F172A]">
                Report Equipment Return
              </h3>
              <p className="text-[11px] text-[#52657A]">
                Submit confirmation that equipment was returned to desk staff
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Equipment Snapshot Card */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] uppercase">
                {category}
              </span>
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Quantity Issued: {quantityIssued} units
              </span>
            </div>

            <h4 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
              <Dumbbell size={16} className="text-[#2563EB]" />
              <span>{equipmentName}</span>
            </h4>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#52657A]">
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#64748B]">Issue Date:</span>
                <strong className="text-[#0F172A]">{formattedIssueDate}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#64748B]">Expected Return:</span>
                <strong className="text-[#0F172A]">{booking.returnTime || 'End of Slot'} ({booking.date})</strong>
              </div>
            </div>
          </div>

          {/* Confirmation Question */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5">
            <div className="flex items-start gap-2">
              <ShieldCheck size={18} className="text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs font-bold text-[#0F172A] block mb-1">
                  Have you physically returned this equipment to the college equipment desk?
                </strong>
                <p className="text-[11px] text-[#52657A] leading-relaxed">
                  Please hand all items to the on-duty sports desk administrator before confirming. 
                  Once submitted, the administrator will physically inspect the equipment condition and officially restore campus inventory.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-[#F8FAFC] px-5 py-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#0F172A] hover:bg-white text-xs font-bold transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmReturn}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            <span>Confirm Return</span>
          </button>
        </div>

      </div>
    </div>
  );
}
