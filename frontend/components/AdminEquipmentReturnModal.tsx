import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Dumbbell, 
  User, 
  Calendar, 
  Clock, 
  AlertCircle,
  Loader2,
  ShieldCheck,
  Check,
  Package
} from 'lucide-react';
import api from '../lib/api';

interface AdminEquipmentReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess: (updatedBooking: any, inventory: any) => void;
}

export default function AdminEquipmentReturnModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: AdminEquipmentReturnModalProps) {
  const [quantityReturned, setQuantityReturned] = useState<number>(0);
  const [quantityDamaged, setQuantityDamaged] = useState<number>(0);
  const [quantityMissing, setQuantityMissing] = useState<number>(0);
  const [returnCondition, setReturnCondition] = useState<string>('Good');
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [flagAsIssue, setFlagAsIssue] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const issuedQty = booking?.quantityIssued || booking?.quantity || 1;

  // Initialize quantities when modal opens
  useEffect(() => {
    if (booking) {
      setQuantityReturned(issuedQty);
      setQuantityDamaged(0);
      setQuantityMissing(0);
      setReturnCondition('Good');
      setReturnNotes('');
      setFlagAsIssue(false);
      setError(null);
    }
  }, [booking, issuedQty]);

  if (!isOpen || !booking) return null;

  const totalAccounted = Number(quantityReturned) + Number(quantityDamaged) + Number(quantityMissing);
  const isReconciled = totalAccounted === issuedQty;
  const hasDamageOrMissing = Number(quantityDamaged) > 0 || Number(quantityMissing) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReconciled) {
      setError(`Quantities must reconcile: Total issued (${issuedQty}) must equal Returned (${quantityReturned}) + Damaged (${quantityDamaged}) + Missing (${quantityMissing}).`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        quantityReturned: Number(quantityReturned),
        quantityDamaged: Number(quantityDamaged),
        quantityMissing: Number(quantityMissing),
        returnCondition,
        returnNotes: returnNotes.trim(),
        flagAsIssue: flagAsIssue || hasDamageOrMissing,
      };

      const { data } = await api.put(`/equipment-bookings/${booking._id}/confirm-return`, payload);
      const updated = data?.data?.booking || booking;
      const inventory = data?.data?.inventory || {};
      onSuccess(updated, inventory);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to confirm return. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-inter text-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-return-modal-title"
    >
      <div 
        className="bg-white w-full max-w-xl rounded-[22px] border border-[#CBD5E1] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#F8FAFC] px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 id="admin-return-modal-title" className="text-sm font-extrabold text-[#0F172A]">
                Confirm Physical Equipment Return
              </h3>
              <p className="text-[11px] text-[#52657A]">
                Inspect items physically and confirm restored stock
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Equipment & Student Context Card */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] uppercase">
                {booking.equipmentCategory || booking.equipment?.category || 'Equipment'}
              </span>
              <span className="text-xs font-mono font-extrabold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                Total Issued: {issuedQty} units
              </span>
            </div>

            <div className="flex items-center gap-2 font-extrabold text-sm text-[#0F172A]">
              <Dumbbell size={16} className="text-[#2563EB]" />
              <span>{booking.equipmentName || booking.equipment?.name || 'Sports Equipment'}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#52657A]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Student:</span>
                <strong className="text-[#0F172A]">{booking.studentName || booking.student?.name || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Roll / Contact:</span>
                <span className="font-mono text-[#0F172A]">{booking.studentRoll || 'N/A'}{booking.phone ? ` • ${booking.phone}` : ''}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Issue Date:</span>
                <span className="text-[#0F172A]">{booking.date}</span>
              </div>
            </div>
          </div>

          {/* Physical Quantities Input Form */}
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
              <strong className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">
                Physical Inventory Inspection
              </strong>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                isReconciled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {isReconciled ? '✓ Reconciled' : `⚠️ Unmatched (${totalAccounted}/${issuedQty})`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Usable Returned */}
              <div>
                <label className="block text-[11px] font-extrabold text-[#0F172A] mb-1">
                  Quantity Usable (Returned) <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={issuedQty}
                  value={quantityReturned}
                  onChange={(e) => setQuantityReturned(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-mono text-sm font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
                  Restores to available stock
                </span>
              </div>

              {/* Damaged */}
              <div>
                <label className="block text-[11px] font-extrabold text-[#0F172A] mb-1">
                  Quantity Damaged
                </label>
                <input
                  type="number"
                  min="0"
                  max={issuedQty}
                  value={quantityDamaged}
                  onChange={(e) => setQuantityDamaged(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-mono text-sm font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-amber-700 font-medium mt-1 block">
                  Not restored to stock
                </span>
              </div>

              {/* Missing */}
              <div>
                <label className="block text-[11px] font-extrabold text-[#0F172A] mb-1">
                  Quantity Missing
                </label>
                <input
                  type="number"
                  min="0"
                  max={issuedQty}
                  value={quantityMissing}
                  onChange={(e) => setQuantityMissing(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] font-mono text-sm font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-[10px] text-rose-700 font-medium mt-1 block">
                  Recorded as lost / missing
                </span>
              </div>
            </div>
          </div>

          {/* Condition & Notes */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-[#0F172A] mb-1">
                  Physical Return Condition
                </label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="Excellent">Excellent (Like new)</option>
                  <option value="Good">Good (Normal wear)</option>
                  <option value="Fair">Fair (Minor signs of use)</option>
                  <option value="Damaged">Damaged (Requires repair / replacement)</option>
                  <option value="Incomplete">Incomplete (Items missing)</option>
                </select>
              </div>

              {hasDamageOrMissing && (
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="flagIssue"
                    checked={flagAsIssue}
                    onChange={(e) => setFlagAsIssue(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <label htmlFor="flagIssue" className="text-xs font-bold text-[#0F172A] cursor-pointer">
                    Flag as &quot;Return Issue&quot; for Administrative Review
                  </label>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-[#0F172A] mb-1">
                Inspection Notes (Optional)
              </label>
              <textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Enter details about gear condition, damaged components, or student remarks..."
                className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] min-h-[60px]"
              />
            </div>
          </div>

          {/* Summary Warning */}
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-[11px] flex items-start gap-2">
            <ShieldCheck size={16} className="text-[#2563EB] shrink-0 mt-0.5" />
            <div>
              <strong>Inventory Restoration Rule:</strong> Only the <strong>{quantityReturned} usable units</strong> will be returned to the shelf and made available for new student bookings. Damaged and missing quantities remain excluded from active circulation.
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#0F172A] hover:bg-slate-100 text-xs font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isReconciled}
              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>Confirm & Restore Stock</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
