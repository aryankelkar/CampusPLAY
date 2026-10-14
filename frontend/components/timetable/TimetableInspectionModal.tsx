import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  ExternalLink, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Clock, 
  User, 
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Loader2
} from 'lucide-react';

interface TimetableInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id?: string;
    _id?: string;
    title?: string;
    documentTitle?: string;
    documentType: 'pdf' | 'image' | string;
    mimeType?: string;
    fileUrl?: string;
    timetableVersion?: string;
    uploadedAt?: string | Date;
    uploadedByName?: string;
    branch?: string;
    academicYear?: string;
    division?: string;
    semester?: number;
    description?: string;
  } | null;
  academicGroup?: {
    branch?: string;
    academicYear?: string;
    division?: string;
    semester?: number;
  };
}

export default function TimetableInspectionModal({
  isOpen,
  onClose,
  document,
  academicGroup,
}: TimetableInspectionModalProps) {
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Capture trigger element for focus restoration upon close
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = window.document.activeElement as HTMLElement;
      setZoom(100);
      setLoading(true);
      setLoadError(false);
    } else if (triggerRef.current) {
      triggerRef.current.focus?.();
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !document) return null;

  const docId = document.id || document._id || '';
  const docTitle = document.title || document.documentTitle || 'Academic Timetable';
  const docType = (document.documentType || 'pdf').toLowerCase();
  const isPdf = docType === 'pdf';

  const branch = document.branch || academicGroup?.branch || '-';
  const year = document.academicYear || academicGroup?.academicYear || '-';
  const div = document.division || academicGroup?.division || '-';
  const sem = document.semester || academicGroup?.semester;

  const rawUrl = document.fileUrl || `/api/timetables/documents/${docId}/file`;
  const fileUrl = rawUrl.startsWith('http') ? rawUrl : rawUrl;
  const downloadUrl = `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}download=true`;

  const formattedUploadDate = document.uploadedAt 
    ? new Date(document.uploadedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-timetable-title"
    >
      {/* Modal Surface */}
      <div 
        ref={modalRef}
        className="bg-white w-full max-w-5xl h-[92vh] max-h-[920px] rounded-[22px] border border-[#CBD5E1] shadow-2xl flex flex-col overflow-hidden font-inter text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
        <div className="bg-[#F8FAFC] px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-[12px] flex-shrink-0 ${isPdf ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-[#2563EB] border border-blue-200'}`}>
              {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="modal-timetable-title" className="text-sm sm:text-base font-extrabold text-[#0F172A] truncate">
                  {docTitle}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-200 text-[#0F172A]">
                  {docType}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  Published
                </span>
                <span className="text-[10px] font-mono text-[#52657A] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {document.timetableVersion || 'v1.0'}
                </span>
              </div>
              <div className="text-[11px] text-[#52657A] font-semibold mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="text-[#0F172A] font-bold">{branch} • {year} • Div {div}</span>
                {sem && <span>• Semester {sem}</span>}
                {formattedUploadDate && <span>• Uploaded {formattedUploadDate}</span>}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close timetable viewer"
            className="p-2 rounded-[10px] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <X size={20} />
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white px-5 py-2.5 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-[10px]">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="p-1.5 hover:bg-white rounded-[7px] text-[#0F172A] transition-all disabled:opacity-40"
              title="Zoom Out"
              disabled={zoom <= 50}
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[11px] font-bold px-2 text-[#0F172A] min-w-[42px] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(250, zoom + 25))}
              className="p-1.5 hover:bg-white rounded-[7px] text-[#0F172A] transition-all disabled:opacity-40"
              title="Zoom In"
              disabled={zoom >= 250}
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-1.5 hover:bg-white rounded-[7px] text-[#52657A] hover:text-[#0F172A] transition-all ml-0.5"
              title="Reset Zoom to 100%"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Document Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInNewTab}
              className="btn bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] px-3 py-1.5 rounded-[9px] text-[11px] font-bold flex items-center gap-1.5 shadow-xs"
              title="Open document in a new browser tab"
            >
              <ExternalLink size={13} />
              <span>Open in New Tab</span>
            </button>

            <a
              href={downloadUrl}
              download
              className="btn bg-white hover:bg-slate-50 text-[#0F172A] border border-[#CBD5E1] px-3 py-1.5 rounded-[9px] text-[11px] font-bold flex items-center gap-1.5 shadow-xs"
              title="Download official timetable document"
            >
              <Download size={13} />
              <span>Download</span>
            </a>
          </div>
        </div>

        {/* DOCUMENT CANVAS AREA */}
        <div className="flex-1 bg-slate-900/5 relative overflow-auto p-4 flex flex-col items-center justify-center min-h-0">
          
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs gap-2">
              <Loader2 size={26} className="text-[#2563EB] animate-spin" />
              <span className="text-xs font-bold text-[#52657A]">Loading timetable document...</span>
            </div>
          )}

          {loadError ? (
            <div className="p-8 text-center max-w-md bg-white rounded-[16px] border border-rose-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-sm font-bold text-[#0F172A]">Failed to load timetable preview</h4>
              <p className="text-[11px] text-[#52657A]">
                The document could not be rendered inside the dashboard. You can inspect or download it directly using the buttons above.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleOpenInNewTab}
                  className="btn btn-primary text-white text-xs px-3 py-1.5 rounded-[8px]"
                >
                  Open in Browser Tab
                </button>
              </div>
            </div>
          ) : isPdf ? (
            /* PDF VIEWER IFRAME */
            <div 
              style={{ width: `${zoom}%`, minWidth: '100%', height: '100%' }}
              className="h-full flex flex-col rounded-[14px] overflow-hidden border border-[#CBD5E1] bg-white shadow-md transition-all duration-150"
            >
              <iframe
                src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                title={docTitle}
                className="w-full flex-1 border-none min-h-[500px]"
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setLoadError(true); }}
              />
              <div className="bg-[#F8FAFC] py-2 px-3 text-center text-[11px] text-[#52657A] border-t border-[#E2E8F0] flex items-center justify-center gap-2 flex-shrink-0">
                <span>If preview does not display inside frame:</span>
                <button onClick={handleOpenInNewTab} className="text-[#2563EB] font-bold underline">
                  Open PDF Directly
                </button>
                <span>•</span>
                <a href={downloadUrl} download className="text-[#2563EB] font-bold underline">
                  Download PDF
                </a>
              </div>
            </div>
          ) : (
            /* IMAGE VIEWER */
            <div className="flex items-center justify-center w-full h-full overflow-auto p-2">
              <img
                src={fileUrl}
                alt={docTitle}
                style={{ width: `${zoom}%`, maxWidth: 'none', transition: 'width 0.15s ease' }}
                className="rounded-[12px] shadow-lg border border-[#CBD5E1] object-contain max-h-[80vh]"
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setLoadError(true); }}
              />
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="bg-[#F8FAFC] px-5 py-2.5 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between text-[11px] text-[#52657A] gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Official University Academic Timetable Document</span>
          </div>
          <div className="flex items-center gap-3">
            {document.uploadedByName && (
              <span className="flex items-center gap-1">
                <User size={12} className="text-[#2563EB]" />
                <span>Uploaded by: <strong className="text-[#0F172A]">{document.uploadedByName}</strong></span>
              </span>
            )}
            <span>Version: <strong className="text-[#0F172A]">{document.timetableVersion || 'v1.0'}</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
}
