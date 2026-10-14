import { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  ExternalLink, 
  Download, 
  Trash2, 
  RefreshCw, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface TimetableDocumentViewerProps {
  document: {
    _id: string;
    documentTitle: string;
    documentType: 'pdf' | 'image';
    mimeType: string;
    fileUrl: string;
    fileSize: number;
    description?: string;
    timetableVersion?: string;
    uploadedByName?: string;
    createdAt: string;
    status: string;
    branch: string;
    academicYear: string;
    division: string;
    semester?: number;
  };
  onReplace?: () => void;
  onRemove?: (id: string) => void;
  canManage?: boolean;
}

export default function TimetableDocumentViewer({
  document,
  onReplace,
  onRemove,
  canManage = true,
}: TimetableDocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);

  if (!document) return null;

  const isPdf = document.documentType === 'pdf';
  const fileSizeMb = (document.fileSize / (1024 * 1024)).toFixed(2);
  const formattedDate = new Date(document.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Construct streaming URL: keep relative so requests are served same-origin via Next.js proxy rewrite,
  // preventing browser iframe cross-origin connection refusal and security blocks.
  const rawUrl = document.fileUrl || `/api/timetables/documents/${document._id}/file`;
  const fileUrl = rawUrl.startsWith('http') ? rawUrl : rawUrl;
  const downloadUrl = `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}download=true`;


  return (
    <div className="bg-white rounded-[18px] border border-[#E2E8F0] shadow-xs overflow-hidden font-inter text-xs">
      
      {/* Header bar */}
      <div className="bg-[#F8FAFC] px-4 py-3 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-[10px] ${isPdf ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[#2563EB]'}`}>
            {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="text-sm font-extrabold text-[#0F172A]">
                {document.documentTitle}
              </strong>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-200 text-[#0F172A]">
                {document.documentType}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                {document.status}
              </span>
              <span className="text-[10px] font-mono text-[#52657A] bg-slate-100 px-1.5 py-0.5 rounded">
                {document.timetableVersion || 'v1.0'}
              </span>
            </div>
            <div className="text-[11px] text-[#52657A] mt-0.5">
              <span>{document.branch} {document.academicYear} Div {document.division}</span>
              {document.semester && <span> • Sem {document.semester}</span>}
              <span> • {fileSizeMb} MB • Uploaded {formattedDate}</span>
              {document.uploadedByName && <span> by {document.uploadedByName}</span>}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-white hover:bg-slate-50 text-[#2563EB] border border-[#BFDBFE] px-2.5 py-1.5 rounded-[9px] text-[11px] font-bold flex items-center gap-1 shadow-xs"
            title="Open in new browser tab"
          >
            <ExternalLink size={12} />
            <span>Open in Tab</span>
          </a>

          <a
            href={downloadUrl}
            download
            className="btn bg-white hover:bg-slate-50 text-[#0F172A] border border-[#DCE6F0] px-2.5 py-1.5 rounded-[9px] text-[11px] font-bold flex items-center gap-1 shadow-xs"
            title="Download document"
          >
            <Download size={12} />
            <span>Download</span>
          </a>

          {canManage && onReplace && (
            <button
              onClick={onReplace}
              className="btn bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] px-2.5 py-1.5 rounded-[9px] text-[11px] font-bold flex items-center gap-1"
              title="Upload an updated version to replace this document"
            >
              <RefreshCw size={12} />
              <span>Replace</span>
            </button>
          )}

          {canManage && onRemove && (
            <button
              onClick={() => onRemove(document._id)}
              className="btn bg-rose-50 hover:bg-rose-100 text-rose-600 px-2.5 py-1.5 rounded-[9px] text-[11px] font-bold flex items-center gap-1"
              title="Deactivate document"
            >
              <Trash2 size={12} />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional Description */}
      {document.description && (
        <div className="px-4 py-2 bg-[#F8FBFF] text-[#52657A] text-[11px] border-b border-[#E8EEF5]">
          {document.description}
        </div>
      )}

      {/* Viewer Canvas */}
      <div className={`p-4 bg-slate-900/5 flex flex-col items-center justify-center min-h-[420px] max-h-[640px] overflow-auto relative ${fullscreen ? 'fixed inset-0 z-50 bg-black/90 max-h-none p-8' : ''}`}>
        
        {/* Floating Controls for Zoom / Fullscreen */}
        {!isPdf && (
          <div className="absolute top-6 right-6 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-[10px] shadow-md border border-[#E2E8F0]">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="p-1 hover:bg-slate-100 rounded text-[#0F172A]"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[10px] font-bold px-1.5 text-[#0F172A]">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(250, zoom + 25))}
              className="p-1 hover:bg-slate-100 rounded text-[#0F172A]"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-1 hover:bg-slate-100 rounded text-[#0F172A] ml-1"
              title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Maximize2 size={14} />
            </button>
          </div>
        )}

        {/* PDF Embedded View */}
        {isPdf ? (
          <div className="w-full h-[580px] rounded-[12px] overflow-hidden border border-[#CBD5E1] bg-white shadow-inner flex flex-col">
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              title={document.documentTitle}
              className="w-full h-full border-none"
            />
            {/* Fallback bar in case browser disables inline iframe rendering */}
            <div className="bg-[#F8FAFC] p-2 text-center text-[11px] text-[#52657A] border-t border-[#E2E8F0] flex items-center justify-center gap-2">
              <span>If preview does not display, click to open or download directly:</span>
              <a href={fileUrl} target="_blank" rel="noreferrer" className="text-[#2563EB] font-bold underline">
                Open PDF
              </a>
              <span>•</span>
              <a href={downloadUrl} download className="text-[#2563EB] font-bold underline">
                Download PDF
              </a>
            </div>
          </div>
        ) : (
          /* Image Responsive View */
          <div className="flex items-center justify-center overflow-auto max-w-full">
            <img
              src={fileUrl}
              alt={document.documentTitle}
              style={{ width: `${zoom}%`, maxWidth: 'none', transition: 'width 0.15s ease' }}
              className="rounded-[10px] shadow-md border border-[#CBD5E1] object-contain max-h-[580px]"
            />
          </div>
        )}
      </div>

    </div>
  );
}
