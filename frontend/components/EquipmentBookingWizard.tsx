import { useState, useMemo, useEffect } from 'react';
import { 
  Dumbbell, 
  Calendar, 
  Clock, 
  Minus, 
  Plus, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  AlertCircle,
  PackageCheck,
  Sparkles,
  X
} from 'lucide-react';
import api from '../lib/api';
import { TIME_SLOTS } from '../constants';

interface EquipmentItem {
  _id: string;
  name: string;
  category: string;
  description: string;
  totalQuantity: number;
  availableQuantity?: number;
  image?: string;
}

interface Props {
  initialItem?: EquipmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EquipmentBookingWizard({ initialItem, isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(initialItem || null);
  const [quantity, setQuantity] = useState<number>(1);
  const [date, setDate] = useState<string>('');
  const [collectionTime, setCollectionTime] = useState<string>('');
  const [returnTime, setReturnTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const minDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Fetch equipment items if needed
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.get('/equipment')
      .then(({ data }) => {
        const eqList = data?.data?.equipment || [];
        setItems(eqList);
        if (initialItem) {
          const matched = eqList.find((i: EquipmentItem) => i._id === initialItem._id);
          setSelectedItem(matched || initialItem);
        } else if (eqList.length > 0 && !selectedItem) {
          setSelectedItem(eqList[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, initialItem]);

  // Set default times when date changes
  useEffect(() => {
    if (!date) {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    }
    if (!collectionTime && TIME_SLOTS.length > 0) {
      setCollectionTime(TIME_SLOTS[0]);
    }
    if (!returnTime && TIME_SLOTS.length > 1) {
      setReturnTime(TIME_SLOTS[1]);
    }
  }, [date]);

  // Reset wizard state on close
  const handleClose = () => {
    setStep(1);
    setQuantity(1);
    setError('');
    setSuccess(false);
    onClose();
  };

  const availableMax = selectedItem?.availableQuantity ?? selectedItem?.totalQuantity ?? 1;

  const handleNextStep1 = () => {
    setError('');
    if (!selectedItem) {
      setError('Please select an equipment item.');
      return;
    }
    if (quantity < 1) {
      setError('Quantity must be at least 1.');
      return;
    }
    if (quantity > availableMax) {
      setError(`Quantity cannot exceed available stock (${availableMax}).`);
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    setError('');
    if (!date) {
      setError('Please select a date.');
      return;
    }
    if (!collectionTime || !returnTime) {
      setError('Please select both collection and return times.');
      return;
    }
    if (collectionTime === returnTime) {
      setError('Return time must be after collection time.');
      return;
    }
    setStep(3);
  };

  const handleSubmitBooking = async () => {
    setError('');
    try {
      setSubmitting(true);
      await api.post('/equipment-bookings', {
        equipmentId: selectedItem?._id,
        quantity,
        date,
        collectionTime,
        returnTime,
      });

      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to submit equipment reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in font-inter">
      <div className="w-full max-w-xl bg-white border border-[#DCE6F0] rounded-[24px] shadow-[0_20px_50px_rgba(15,23,42,0.18)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E8EEF5] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold shadow-xs border border-[#BFDBFE]">
              <Dumbbell size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0F172A]">Equipment Reservation</h2>
              <p className="text-xs text-[#64748B]">Step {step} of 3</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 pt-4 pb-2 bg-white">
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider mb-2">
            <span className={step === 1 ? 'text-[#2563EB]' : 'text-[#64748B]'}>1. Equipment</span>
            <span className={step === 2 ? 'text-[#2563EB]' : 'text-[#64748B]'}>2. Schedule</span>
            <span className={step === 3 ? 'text-[#2563EB]' : 'text-[#64748B]'}>3. Review</span>
          </div>
          <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#2563EB] h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="py-8 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-200 animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-extrabold text-[#0F172A] mb-1">Reservation Submitted!</h3>
              <p className="text-sm text-[#64748B] max-w-sm">
                Your equipment booking is set to <span className="font-bold text-[#D97706]">Pending</span>. Admin will review and approve your request shortly.
              </p>
            </div>
          ) : (
            <>
              {/* STEP 1: SELECT EQUIPMENT & QUANTITY */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] mb-2">
                      Select Equipment
                    </label>
                    <select
                      value={selectedItem?._id || ''}
                      onChange={(e) => {
                        const item = items.find(i => i._id === e.target.value);
                        setSelectedItem(item || null);
                        setQuantity(1);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      {items.map(item => (
                        <option key={item._id} value={item._id}>
                          {item.name} ({item.category}) — {item.availableQuantity ?? item.totalQuantity} available
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedItem && (
                    <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2563EB]">
                          {selectedItem.category}
                        </span>
                        <h4 className="text-base font-extrabold text-[#0F172A]">{selectedItem.name}</h4>
                        <p className="text-xs text-[#52657A] mt-0.5">{selectedItem.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[#64748B] block font-medium">Available</span>
                        <span className="text-lg font-extrabold text-[#2563EB]">
                          {availableMax}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quantity Stepper */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] mb-2">
                      Select Quantity
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-11 h-11 rounded-xl bg-white border border-[#CBD5E1] text-[#0F172A] flex items-center justify-center hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="text-2xl font-extrabold text-[#0F172A] w-12 text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        disabled={quantity >= availableMax}
                        onClick={() => setQuantity(q => Math.min(availableMax, q + 1))}
                        className="w-11 h-11 rounded-xl bg-white border border-[#CBD5E1] text-[#0F172A] flex items-center justify-center hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: DATE & SCHEDULE */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] mb-1.5 flex items-center gap-1.5">
                      <Calendar size={14} className="text-[#2563EB]" />
                      <span>Reservation Date</span>
                    </label>
                    <input 
                      type="date"
                      min={minDate}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] mb-1.5 flex items-center gap-1.5">
                        <Clock size={14} className="text-[#2563EB]" />
                        <span>Collection Time</span>
                      </label>
                      <select
                        value={collectionTime}
                        onChange={(e) => setCollectionTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      >
                        {TIME_SLOTS.map((slot, idx) => (
                          <option key={idx} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] mb-1.5 flex items-center gap-1.5">
                        <Clock size={14} className="text-[#2563EB]" />
                        <span>Return Time</span>
                      </label>
                      <select
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      >
                        {TIME_SLOTS.map((slot, idx) => (
                          <option key={idx} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW & CONFIRM */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#2563EB]">
                      RESERVATION SUMMARY
                    </h4>

                    <div className="flex justify-between py-1.5 border-b border-[#E2E8F0] text-sm">
                      <span className="text-[#64748B] font-medium">Equipment</span>
                      <span className="font-extrabold text-[#0F172A]">{selectedItem?.name}</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-[#E2E8F0] text-sm">
                      <span className="text-[#64748B] font-medium">Quantity</span>
                      <span className="font-extrabold text-[#2563EB]">{quantity} units</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-[#E2E8F0] text-sm">
                      <span className="text-[#64748B] font-medium">Date</span>
                      <span className="font-extrabold text-[#0F172A]">{date}</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-[#E2E8F0] text-sm">
                      <span className="text-[#64748B] font-medium">Collection / Return</span>
                      <span className="font-extrabold text-[#0F172A]">{collectionTime} → {returnTime}</span>
                    </div>

                    <div className="flex justify-between py-1.5 text-sm">
                      <span className="text-[#64748B] font-medium">Initial Status</span>
                      <span className="font-extrabold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-md text-xs">
                        Pending Admin Approval
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Controls Footer */}
        {!success && (
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E8EEF5] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => (s - 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div></div>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={handleNextStep1}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-extrabold hover:bg-[#1D4ED8] transition-colors shadow-xs"
              >
                Continue to Schedule <ArrowRight size={16} />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleNextStep2}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-extrabold hover:bg-[#1D4ED8] transition-colors shadow-xs"
              >
                Review Reservation <ArrowRight size={16} />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitBooking}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-extrabold hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors shadow-md"
              >
                {submitting ? 'Submitting...' : 'Confirm & Reserve'} <Check size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
