import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Calendar, 
  BookOpen, 
  User, 
  Users, 
  Loader2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Phone,
  PhoneCall,
  GraduationCap,
  History,
  Eye
} from 'lucide-react';
import TimetableInspectionModal from './TimetableInspectionModal';

interface AcademicVerificationPanelProps {
  booking: any;
  onRefresh?: () => void;
}

// Map academic year code to full academic title safely
function formatYearOfStudy(code?: string): string {
  if (!code) return '';
  const c = code.trim().toUpperCase();
  switch (c) {
    case 'FE':
      return 'First Year (FE)';
    case 'SE':
      return 'Second Year (SE)';
    case 'TE':
      return 'Third Year (TE)';
    case 'BE':
      return 'Final Year (BE)';
    default:
      return code;
  }
}

// Format semester display explicitly without guessing
function formatSemester(sem?: number | string | null): string {
  if (sem === null || sem === undefined || sem === '') {
    return 'Semester not provided';
  }
  return `Semester ${sem}`;
}

export default function AcademicVerificationPanel({ booking }: AcademicVerificationPanelProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchVerification = async () => {
      if (!booking?._id) return;
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get(`/bookings/${booking._id}/academic-verification`);
        if (isMounted) {
          setReport(data?.data?.report || null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Failed to load timetable verification');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVerification();
    return () => { isMounted = false; };
  }, [booking?._id]);

  // Resolving student profile with authoritative precedence:
  // 1. report.student (dynamically populated from current User profile)
  // 2. booking.student (populated user document)
  // 3. booking snapshot
  const student = report?.student || {
    name: booking.student?.name || booking.name || '-',
    roll: booking.student?.roll || booking.roll || '-',
    email: booking.student?.email || booking.email || '-',
    phone: booking.student?.phone || booking.phone || '',
    alternatePhone: booking.student?.alternatePhone || booking.alternatePhone || '',
    branch: booking.student?.branch || booking.branch || '',
    division: booking.student?.division || booking.division || '',
    academicYear: booking.student?.classYear || booking.classYear || '',
    semester: booking.student?.semester || booking.semester || null,
    academicVerificationStatus: booking.student?.academicVerificationStatus || 
      (booking.student?.academicProfileVerified ? 'VERIFIED' : (booking.academicVerificationStatus || 'UNVERIFIED')),
  };

  const verification = report?.verification;
  const status = verification?.status || (booking.timetableVerification?.status || 'VERIFICATION REQUIRES REVIEW');
  const bookingSnapshot = report?.bookingSnapshot;

  // Status Styling
  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'REFERENCE DOCUMENT AVAILABLE':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-300',
          icon: <FileText size={15} className="text-indigo-600" />,
          label: 'REFERENCE DOCUMENT AVAILABLE',
          dot: 'bg-indigo-500',
        };
      case 'STRUCTURED TIMETABLE AVAILABLE':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: <CheckCircle2 size={15} className="text-emerald-600" />,
          label: 'STRUCTURED TIMETABLE AVAILABLE',
          dot: 'bg-emerald-500',
        };
      case 'NO CONFLICT FOUND':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: <CheckCircle2 size={15} className="text-emerald-600" />,
          label: 'NO CONFLICT FOUND',
          dot: 'bg-emerald-500',
        };
      case 'CONFLICT DETECTED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          icon: <XCircle size={15} className="text-rose-600" />,
          label: 'CONFLICT DETECTED',
          dot: 'bg-rose-500',
        };
      case 'TIMETABLE UNAVAILABLE':
      case 'TIMETABLE NOT AVAILABLE':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: <AlertTriangle size={15} className="text-amber-600" />,
          label: s === 'TIMETABLE UNAVAILABLE' ? 'TIMETABLE UNAVAILABLE' : 'TIMETABLE NOT AVAILABLE',
          dot: 'bg-amber-500',
        };
      case 'ACADEMIC INFORMATION INCOMPLETE':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: <AlertCircle size={15} className="text-amber-600" />,
          label: 'ACADEMIC INFORMATION INCOMPLETE',
          dot: 'bg-amber-500',
        };
      case 'VERIFICATION REQUIRES REVIEW':
      default:
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          icon: <HelpCircle size={15} className="text-blue-600" />,
          label: s || 'VERIFICATION REQUIRES REVIEW',
          dot: 'bg-blue-500',
        };
    }
  };

  const badge = getStatusBadge(status);
  const conflicts = verification?.conflicts || [];
  const squadMembers = report?.squadMembers || [];

  const isOfficiallyVerified = student.academicVerificationStatus === 'VERIFIED';
  const hasProfileData = Boolean(student.branch && student.academicYear);

  return (
    <div className="space-y-4 font-inter text-xs">
      
      {/* SECTION 1, 2, & 3: GRID OF STUDENT CONTACT, ACADEMIC, AND BOOKING DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        {/* CARD 1: STUDENT CONTACT DETAILS */}
        <div className="bg-[#F8FAFC] p-4 rounded-[14px] border border-[#E2E8F0] space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h4 className="font-extrabold text-[#2563EB] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Phone size={13} />
              <span>Student Contact Details</span>
            </h4>
            {student.phone ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Phone on record
              </span>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                No Phone
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#52657A] font-medium">Full Name:</span>
              <strong className="text-[#0F172A] font-bold">{student.name}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#52657A] font-medium">College Email:</span>
              <strong className="text-[#0F172A] font-bold truncate max-w-[150px]" title={student.email}>
                {student.email}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#52657A] font-medium">Mobile Number:</span>
              <strong className="text-[#0F172A] font-bold font-mono">
                {student.phone ? (
                  <span className="text-emerald-700 font-bold">{student.phone}</span>
                ) : (
                  <span className="text-amber-700 italic">Not provided</span>
                )}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#52657A] font-medium">Alternate Mobile:</span>
              <span className="text-[#52657A] font-mono">
                {student.alternatePhone || <span className="text-slate-400 italic">Not provided</span>}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: STUDENT ACADEMIC DETAILS */}
        <div className="bg-[#F8FAFC] p-4 rounded-[14px] border border-[#E2E8F0] space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h4 className="font-extrabold text-[#2563EB] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap size={13} />
              <span>Student Academic Details</span>
            </h4>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
              isOfficiallyVerified
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : hasProfileData
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}>
              {isOfficiallyVerified
                ? 'Verified'
                : hasProfileData
                  ? 'Student-Provided'
                  : 'Incomplete'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#52657A] font-medium">Roll Number:</span>
              <strong className="text-[#0F172A] font-bold font-mono">{student.roll}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52657A] font-medium">Branch:</span>
              <strong className="text-[#0F172A] font-bold">
                {student.branch || <span className="text-amber-700 italic">Incomplete</span>}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52657A] font-medium">Year of Study:</span>
              <strong className="text-[#0F172A] font-bold">
                {student.academicYear ? (
                  formatYearOfStudy(student.academicYear)
                ) : (
                  <span className="text-amber-700 italic">Incomplete</span>
                )}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52657A] font-medium">Semester:</span>
              <strong className="text-[#0F172A] font-bold">
                {student.semester !== null && student.semester !== undefined && student.semester !== '' ? (
                  formatSemester(student.semester)
                ) : (
                  <span className="text-amber-700 italic">Semester not provided</span>
                )}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52657A] font-medium">Division:</span>
              <strong className="text-[#0F172A] font-bold">
                {student.division ? `Division ${student.division}` : <span className="text-amber-700 italic">Incomplete</span>}
              </strong>
            </div>
          </div>
        </div>

        {/* CARD 3: BOOKING DETAILS */}
        <div className="bg-[#F8FAFC] p-4 rounded-[14px] border border-[#E2E8F0] space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h4 className="font-extrabold text-[#2563EB] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={13} />
              <span>Booking Details</span>
            </h4>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-[#0F172A] border border-slate-200">
              {booking.status}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#52657A] font-medium">Sport:</span>
              <strong className="text-[#0F172A] font-bold">{booking.game}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52657A] font-medium">Ground:</span>
              <strong className="text-[#0F172A] font-bold">{booking.ground}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52657A] font-medium">Date:</span>
              <strong className="text-[#0F172A] font-bold">{booking.date}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52657A] font-medium">Slots:</span>
              <strong className="text-[#2563EB] font-bold">
                {Array.isArray(booking.timeSlots) && booking.timeSlots.length > 0 
                  ? booking.timeSlots.join(', ') 
                  : booking.time || 'N/A'}
              </strong>
            </div>
          </div>
        </div>

      </div>

      {/* HISTORICAL BOOKING-TIME ACADEMIC SNAPSHOT (IF PRESERVED) */}
      {bookingSnapshot?.hasSnapshot && (
        <div className="bg-slate-50/80 p-3 rounded-[12px] border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[#52657A] font-semibold text-[11px] pb-1 border-b border-slate-200">
            <span className="flex items-center gap-1.5">
              <History size={13} className="text-slate-500" />
              <span className="uppercase tracking-wider font-extrabold text-slate-700">Booking-Time Academic Snapshot</span>
            </span>
            <span className="text-[10px] text-slate-400">Captured at submission</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px]">Branch:</span>
              <strong className="text-slate-800">{bookingSnapshot.branch || 'None'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Year / Div:</span>
              <strong className="text-slate-800">{bookingSnapshot.classYear || '-'} {bookingSnapshot.division ? `(Div ${bookingSnapshot.division})` : ''}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Semester:</span>
              <strong className="text-slate-800">{bookingSnapshot.semester ? `Sem ${bookingSnapshot.semester}` : 'Not recorded'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Snapshot Phone:</span>
              <strong className="text-slate-800">{bookingSnapshot.phone || 'None'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* SECTION C: ACADEMIC TIMETABLE VERIFICATION */}
      <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#2563EB]" />
            <h4 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider">
              Section C — Academic Timetable Verification
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {loading && <Loader2 size={13} className="animate-spin text-[#2563EB]" />}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border uppercase tracking-wider ${badge.bg}`}>
              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              {badge.icon}
              <span>{badge.label}</span>
            </span>
          </div>
        </div>

        {/* Dual Status Indicators: Document vs Structured Conflict Check */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            verification?.referenceDocument
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            <FileText size={11} />
            REFERENCE DOCUMENT: {verification?.referenceDocument ? 'AVAILABLE' : 'NOT AVAILABLE'}
          </span>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            verification?.structuredTimetableAvailable
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            <CheckCircle2 size={11} />
            STRUCTURED CONFLICT CHECK: {verification?.structuredTimetableAvailable ? 'ACTIVE' : 'NOT AVAILABLE'}
          </span>
        </div>

        {/* Explanatory Message */}
        {verification?.explanation && (
          <p className="text-[11px] text-[#52657A] leading-relaxed bg-[#F8FAFC] p-3 rounded-[10px] border border-[#E8EEF5]">
            {verification.explanation}
          </p>
        )}

        {/* Reference Document Available Callout */}
        {verification?.referenceDocument && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 text-[#2563EB]">
                {verification.referenceDocument.documentType === 'pdf' ? <FileText size={16} /> : <ImageIcon size={16} />}
              </div>
              <div>
                <strong className="text-xs font-bold text-[#0F172A] block">
                  Official Reference Timetable Available: {verification.referenceDocument.documentTitle}
                </strong>
                <span className="text-[11px] text-[#52657A]">
                  Type: <span className="uppercase font-semibold">{verification.referenceDocument.documentType}</span> • Version: {verification.referenceDocument.timetableVersion || 'v1.0'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsViewerModalOpen(true)}
              className="btn bg-[#2563EB] hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-[9px] text-[11px] font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-xs cursor-pointer transition-colors"
            >
              <Eye size={13} />
              <span>Inspect Timetable</span>
            </button>
          </div>
        )}

        {/* Timetable Document Inspection Modal */}
        <TimetableInspectionModal
          isOpen={isViewerModalOpen}
          onClose={() => setIsViewerModalOpen(false)}
          document={verification?.referenceDocument}
          academicGroup={{
            branch: student.branch,
            academicYear: student.academicYear,
            division: student.division,
            semester: student.semester,
          }}
        />

        {error && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-[10px]">
            {error}
          </div>
        )}

        {/* CONFLICT DETECTED DETAILS LIST */}
        {conflicts.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-rose-600" />
              <span>Overlapping Academic Sessions Detected ({conflicts.length})</span>
            </div>

            <div className="space-y-2">
              {conflicts.map((c: any, idx: number) => (
                <div 
                  key={idx} 
                  className="bg-rose-50/60 border border-rose-200 rounded-[12px] p-3 text-xs space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1 font-bold text-[#0F172A]">
                    <span className="text-sm font-extrabold text-rose-900 flex items-center gap-1.5">
                      <BookOpen size={13} className="text-rose-600" />
                      {c.subjectName}
                      {c.subjectCode && <span className="text-[10px] text-[#52657A] font-mono">({c.subjectCode})</span>}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white text-rose-700 border border-rose-200 text-[10px] font-extrabold uppercase">
                      {c.sessionType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-rose-200/60 text-[#52657A]">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-rose-700">Class Hours:</span>
                      <strong className="text-[#0F172A] font-mono">{c.startTime} – {c.endTime}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-rose-700">Academic Group:</span>
                      <strong className="text-[#0F172A]">{c.branch} {c.academicYear} Div {c.division}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-rose-700">Room / Faculty:</span>
                      <span className="text-[#0F172A] font-medium">{c.room || '-'}{c.faculty ? ` • ${c.faculty}` : ''}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-rose-700">Timetable Version:</span>
                      <span className="text-[#0F172A] font-mono">{c.timetableVersion || 'v1.0'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Timetable Conflict Warning before Approval */}
            <div className="p-3 bg-amber-50 rounded-[12px] border border-amber-300 text-amber-900 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="font-bold block text-amber-950">Timetable Conflict Advisory</strong>
                This student has one or more officially scheduled academic sessions overlapping with the requested booking period. Review carefully before granting approval.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION D: SQUAD MEMBERS ACADEMIC VERIFICATION */}
      {squadMembers.length > 0 && (
        <div className="bg-[#F8FAFC] rounded-[16px] border border-[#E2E8F0] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <h4 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Users size={13} className="text-[#2563EB]" />
              <span>Section D — Squad Members Verification ({squadMembers.length})</span>
            </h4>
            <span className="text-[10px] text-[#52657A] font-medium">
              Independently verified against student registry
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {squadMembers.map((m: any, idx: number) => {
              const mBadge = getStatusBadge(m.verificationStatus);
              return (
                <div 
                  key={idx} 
                  className="bg-white p-3 rounded-[12px] border border-[#E8EEF5] space-y-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-1">
                    <strong className="text-[#0F172A] font-bold truncate">{m.name}</strong>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold border ${mBadge.bg}`}>
                      {mBadge.icon}
                      <span>{mBadge.label}</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-[#52657A] flex items-center justify-between">
                    <span className="font-mono">{m.roll}</span>
                    <span className="truncate max-w-[150px]">{m.email}</span>
                  </div>

                  {m.verifiedUser ? (
                    <div className="text-[10px] pt-1 border-t border-[#F1F5F9] text-[#2563EB] font-bold flex justify-between">
                      <span>Group: {m.branch} {m.academicYear} Div {m.division}</span>
                      {m.semester && <span>Sem {m.semester}</span>}
                    </div>
                  ) : (
                    <div className="text-[10px] pt-1 border-t border-[#F1F5F9] text-amber-700 italic">
                      Unverified profile (not registered in database)
                    </div>
                  )}

                  {m.conflicts && m.conflicts.length > 0 && (
                    <div className="text-[10px] text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200">
                      ⚠️ Has class conflict: {m.conflicts.map((c: any) => c.subjectName).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
