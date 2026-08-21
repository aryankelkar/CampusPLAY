import { ReactNode, useEffect } from 'react';

export default function ConfirmModal({
  open,
  title = 'Confirm action',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Keyboard shortcuts: Escape to cancel, Enter to confirm
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center modal-backdrop p-4 animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-lg modal-content p-6 sm:p-7 animate-scale-in my-auto">
        {/* Icon and Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] mb-1">{title}</h3>
            {description && (
              <div className="text-xs sm:text-sm text-[#52657A] leading-relaxed">
                {description}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 border-t border-[#DCE6F0]">
          <button 
            className="btn btn-outline flex-1 text-xs sm:text-sm"
            onClick={onCancel}
          >
            {cancelText} <span className="text-[11px] opacity-60 ml-1">(Esc)</span>
          </button>
          <button 
            className="btn btn-primary flex-1 text-xs sm:text-sm"
            onClick={onConfirm}
          >
            {confirmText} <span className="text-[11px] opacity-75 ml-1">(Enter)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

