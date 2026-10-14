import { useState, useEffect, useMemo } from 'react';
import api from '../../lib/api';
import { 
  Calendar, 
  Clock, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Filter, 
  FileText, 
  History, 
  RefreshCw, 
  BookOpen, 
  User, 
  MapPin, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  Check,
  ChevronRight,
  Image as ImageIcon,
  FileCheck,
  Eye,
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';
import Loader from '../common/Loader';
import EmptyState from '../common/EmptyState';
import ConfirmModal from '../common/ConfirmModal';
import TimetableDocumentViewer from './TimetableDocumentViewer';

const BRANCH_OPTIONS = ['INFT', 'CMPN', 'EXTC', 'EXCS', 'BIOMED'];
const YEAR_OPTIONS = ['FE', 'SE', 'TE', 'BE'];
const DIVISION_OPTIONS = ['A', 'B', 'C', 'D'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SESSION_TYPES = ['Lecture', 'Practical', 'Tutorial', 'Lab', 'Seminar', 'Workshop', 'Other'];

export default function AdminTimetableManagement() {
  const [activeTab, setActiveTab] = useState<'view' | 'manage' | 'import' | 'history'>('view');

  // Filter States
  const [selectedBranch, setSelectedBranch] = useState('INFT');
  const [selectedYear, setSelectedYear] = useState('SE');
  const [selectedDivision, setSelectedDivision] = useState('A');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  // Sessions State
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Document Upload & Active Reference Document State
  const [publishedDoc, setPublishedDoc] = useState<any | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [uploadType, setUploadType] = useState<'pdf' | 'image' | 'csv'>('pdf');
  
  // Document Upload Form (Step 2 - 7)
  const [docAcademicYear, setDocAcademicYear] = useState('2026-2027');
  const [docBranch, setDocBranch] = useState('INFT');
  const [docYearOfStudy, setDocYearOfStudy] = useState('SE');
  const [docSemester, setDocSemester] = useState('3');
  const [docDivision, setDocDivision] = useState('A');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docVersion, setDocVersion] = useState('v1.0');
  const [docUploading, setDocUploading] = useState(false);

  // History Tab States
  const [historyTab, setHistoryTab] = useState<'documents' | 'csv'>('documents');
  const [documentHistory, setDocumentHistory] = useState<any[]>([]);
  const [docHistoryLoading, setDocHistoryLoading] = useState(false);

  // Manual Session Modal / Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSession, setEditingSession] = useState<any | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    branch: 'INFT',
    academicYear: 'SE',
    division: 'A',
    semester: '3',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    subjectName: '',
    subjectCode: '',
    sessionType: 'Lecture',
    faculty: '',
    room: '',
    timetableVersion: 'v1.0',
    force: false,
  });

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [importVersion, setImportVersion] = useState('v1.0');
  const [deactivatePrevious, setDeactivatePrevious] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);

  // History State
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Confirm delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Published Timetable Document for Selected Group
  const loadPublishedDoc = async () => {
    try {
      setDocLoading(true);
      const { data } = await api.get('/timetables/documents', {
        params: {
          branch: selectedBranch,
          academicYear: selectedYear,
          division: selectedDivision,
          status: 'published',
        },
      });
      setPublishedDoc(data?.data?.documents?.[0] || null);
    } catch (err) {
      setPublishedDoc(null);
    } finally {
      setDocLoading(false);
    }
  };

  // Fetch Full Document History
  const loadDocumentHistory = async () => {
    try {
      setDocHistoryLoading(true);
      const { data } = await api.get('/timetables/documents');
      setDocumentHistory(data?.data?.documents || []);
    } catch (err) {
      showNotification('Failed to load document history', 'error');
    } finally {
      setDocHistoryLoading(false);
    }
  };

  // Fetch Sessions for View/Manage Tab
  const loadSessions = async () => {
    try {
      setLoading(true);
      const params: any = {
        branch: selectedBranch,
        academicYear: selectedYear,
        division: selectedDivision,
        active: true,
      };
      if (selectedDay !== 'all') params.day = selectedDay;
      if (selectedSemester !== 'all') params.semester = selectedSemester;

      const { data } = await api.get('/timetables', { params });
      setSessions(data?.data?.sessions || []);
    } catch (err: any) {
      showNotification(err?.response?.data?.message || 'Failed to load timetable sessions', 'error');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'view' || activeTab === 'manage') {
      loadSessions();
      loadPublishedDoc();
    } else if (activeTab === 'history') {
      loadHistory();
      loadDocumentHistory();
    }
  }, [activeTab, selectedBranch, selectedYear, selectedDivision, selectedDay, selectedSemester]);

  // Load Import History
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data } = await api.get('/timetables/import/history');
      setHistoryList(data?.data?.history || []);
    } catch (err: any) {
      showNotification('Failed to load import history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Download Template
  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/timetables/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'campusplay_timetable_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification('CSV template downloaded successfully.');
    } catch (err) {
      showNotification('Failed to download template', 'error');
    }
  };

  // Handle CSV File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      showNotification('Please upload a valid .csv file', 'error');
      return;
    }
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text || '');
      setPreviewData(null);
    };
    reader.readAsText(file);
  };

  // Preview CSV
  const handlePreviewCsv = async () => {
    if (!csvContent.trim()) {
      showNotification('Please select or upload a CSV file first.', 'error');
      return;
    }
    try {
      setPreviewLoading(true);
      const { data } = await api.post('/timetables/import/preview', {
        csvContent,
        timetableVersion: importVersion || 'v1.0',
      });
      setPreviewData(data?.data || null);
      showNotification(`Preview ready: ${data?.data?.validCount || 0} valid records identified.`);
    } catch (err: any) {
      showNotification(err?.response?.data?.message || 'CSV validation failed.', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Commit CSV Import
  const handleCommitImport = async () => {
    if (!previewData || !previewData.validRecords || previewData.validRecords.length === 0) {
      showNotification('No valid records to import.', 'error');
      return;
    }
    try {
      setCommitLoading(true);
      const { data } = await api.post('/timetables/import/commit', {
        records: previewData.validRecords,
        timetableVersion: importVersion || 'v1.0',
        sourceFilename: csvFile?.name || 'manual_upload.csv',
        deactivatePrevious,
      });

      showNotification(`Success: ${data?.data?.insertedCount || 0} timetable sessions saved.`);
      setPreviewData(null);
      setCsvContent('');
      setCsvFile(null);
      setActiveTab('view');
    } catch (err: any) {
      showNotification(err?.response?.data?.message || 'Failed to save timetable records.', 'error');
    } finally {
      setCommitLoading(false);
    }
  };

  // Save Manual Session
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.subjectName.trim()) {
      showNotification('Subject name is required', 'error');
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingSession) {
        await api.patch(`/timetables/${editingSession._id}`, sessionForm);
        showNotification('Session updated successfully.');
      } else {
        await api.post('/timetables', sessionForm);
        showNotification('New timetable session added successfully.');
      }
      setShowAddModal(false);
      setEditingSession(null);
      loadSessions();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        // Overlap warning
        if (window.confirm(`${err.response.data.message}\nDo you want to save this session anyway?`)) {
          try {
            await api.post('/timetables', { ...sessionForm, force: true });
            showNotification('Session saved with force override.');
            setShowAddModal(false);
            setEditingSession(null);
            loadSessions();
          } catch (e: any) {
            showNotification(e?.response?.data?.message || 'Failed to save', 'error');
          }
        }
      } else {
        showNotification(err?.response?.data?.message || 'Failed to save session', 'error');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Deactivate Session
  const handleDeleteSession = async (id: string) => {
    try {
      await api.delete(`/timetables/${id}`);
      showNotification('Session deactivated.');
      setConfirmDeleteId(null);
      loadSessions();
    } catch (err: any) {
      showNotification(err?.response?.data?.message || 'Failed to deactivate session', 'error');
    }
  };

  // Handle Document File Selection
  const handleDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>, expected: 'pdf' | 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showNotification('File exceeds maximum 10 MB limit.', 'error');
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (expected === 'pdf' && !lowerName.endsWith('.pdf')) {
      showNotification('Invalid file format. Please upload a .pdf file.', 'error');
      return;
    }

    if (expected === 'image' && !['.jpg', '.jpeg', '.png', '.webp'].some(ext => lowerName.endsWith(ext))) {
      showNotification('Invalid image format. Supported formats: .jpg, .jpeg, .png, .webp', 'error');
      return;
    }

    setDocFile(file);
    if (!docTitle) {
      setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    const previewUrl = URL.createObjectURL(file);
    setDocPreviewUrl(previewUrl);
  };

  // Submit Upload Document (PDF / Image)
  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) {
      showNotification('Please select a file to upload.', 'error');
      return;
    }
    if (!docTitle.trim()) {
      showNotification('Document title is required.', 'error');
      return;
    }

    try {
      setDocUploading(true);
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('branch', docBranch);
      formData.append('academicYear', docYearOfStudy);
      formData.append('division', docDivision);
      if (docSemester) formData.append('semester', docSemester);
      formData.append('documentTitle', docTitle.trim());
      formData.append('description', docDescription.trim());
      formData.append('timetableVersion', docVersion.trim() || 'v1.0');

      await api.post('/timetables/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showNotification('Official timetable document uploaded and published successfully!');
      
      // Clean up preview
      if (docPreviewUrl) URL.revokeObjectURL(docPreviewUrl);
      setDocFile(null);
      setDocPreviewUrl(null);
      setDocTitle('');
      setDocDescription('');

      // Align filter selections to newly uploaded group
      setSelectedBranch(docBranch);
      setSelectedYear(docYearOfStudy);
      setSelectedDivision(docDivision);
      if (docSemester) setSelectedSemester(docSemester);

      setActiveTab('view');
    } catch (err: any) {
      showNotification(err?.response?.data?.message || 'Failed to upload timetable document.', 'error');
    } finally {
      setDocUploading(false);
    }
  };

  // Remove / Deactivate Document
  const handleRemoveDocument = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this official timetable document?')) return;
    try {
      await api.delete(`/timetables/documents/${id}`);
      showNotification('Official timetable document deactivated.');
      loadPublishedDoc();
      if (activeTab === 'history') loadDocumentHistory();
    } catch (err: any) {
      showNotification(err?.response?.data?.message || 'Failed to remove document', 'error');
    }
  };

  return (
    <div className="space-y-6 font-inter text-[#0F172A]">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-2.5 rounded-[12px] shadow-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200 ${
          toast.type === 'success' ? 'bg-[#2563EB] text-white' : 'bg-rose-600 text-white'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Card Container */}
      <div className="bg-white rounded-[22px] border border-[#E8EEF5] p-5 sm:p-7 shadow-[6px_6px_18px_rgba(148,163,184,0.14),-6px_-6px_18px_rgba(255,255,255,0.9)]">
        
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E8EEF5]">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] text-[11px] font-extrabold uppercase tracking-[0.08em] mb-1 border border-[#BFDBFE]">
              Academic Schedules
            </span>
            <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
              Academic Timetable Administration
            </h2>
            <p className="text-xs text-[#52657A] mt-0.5">
              Manage weekly college lecture schedules, import verified departmental timetables, and audit session overlaps.
            </p>
          </div>

          {/* Tab Navigation Pill */}
          <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-[12px] border border-[#E2E8F0] flex-wrap justify-center text-xs font-bold">
            <button
              onClick={() => setActiveTab('view')}
              className={`px-3 py-1.5 rounded-[9px] transition-all flex items-center gap-1.5 ${
                activeTab === 'view' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#52657A] hover:text-[#0F172A]'
              }`}
            >
              <Calendar size={13} />
              <span>View Timetable</span>
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-3 py-1.5 rounded-[9px] transition-all flex items-center gap-1.5 ${
                activeTab === 'manage' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#52657A] hover:text-[#0F172A]'
              }`}
            >
              <Plus size={13} />
              <span>Manage Sessions</span>
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-3 py-1.5 rounded-[9px] transition-all flex items-center gap-1.5 ${
                activeTab === 'import' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#52657A] hover:text-[#0F172A]'
              }`}
            >
              <Upload size={13} />
              <span>Import Timetable</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-[9px] transition-all flex items-center gap-1.5 ${
                activeTab === 'history' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#52657A] hover:text-[#0F172A]'
              }`}
            >
              <History size={13} />
              <span>Audit History</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: VIEW TIMETABLE & TAB 2: MANAGE SESSIONS           */}
        {/* ======================================================== */}
        {(activeTab === 'view' || activeTab === 'manage') && (
          <div className="space-y-5">
            
            {/* Filter Bar */}
            <div className="p-4 rounded-[16px] bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-extrabold text-[#52657A] flex items-center gap-1 uppercase tracking-wider text-[10px]">
                  <Filter size={12} /> Target Group:
                </span>

                {/* Branch */}
                <select
                  aria-label="Filter by branch"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[10px] border border-[#DCE6F0] bg-white text-[#0F172A] font-bold focus:border-[#2563EB]"
                >
                  {BRANCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>

                {/* Academic Year */}
                <select
                  aria-label="Filter by year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[10px] border border-[#DCE6F0] bg-white text-[#0F172A] font-bold focus:border-[#2563EB]"
                >
                  {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>

                {/* Division */}
                <select
                  aria-label="Filter by division"
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[10px] border border-[#DCE6F0] bg-white text-[#0F172A] font-bold focus:border-[#2563EB]"
                >
                  {DIVISION_OPTIONS.map((d) => <option key={d} value={d}>Div {d}</option>)}
                </select>

                {/* Day Filter */}
                <select
                  aria-label="Filter by day"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="px-2.5 py-1.5 rounded-[10px] border border-[#DCE6F0] bg-white text-[#0F172A] font-medium focus:border-[#2563EB]"
                >
                  <option value="all">All Days (Mon–Sat)</option>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={loadSessions}
                  className="btn px-3 py-1.5 rounded-[10px] border border-[#DCE6F0] bg-white text-[#52657A] hover:text-[#0F172A] flex items-center gap-1 font-semibold"
                  title="Refresh timetable"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>

                {activeTab === 'manage' && (
                  <button
                    onClick={() => {
                      setEditingSession(null);
                      setSessionForm({
                        branch: selectedBranch,
                        academicYear: selectedYear,
                        division: selectedDivision,
                        semester: '3',
                        day: 'Monday',
                        startTime: '09:00',
                        endTime: '10:00',
                        subjectName: '',
                        subjectCode: '',
                        sessionType: 'Lecture',
                        faculty: '',
                        room: '',
                        timetableVersion: 'v1.0',
                        force: false,
                      });
                      setShowAddModal(true);
                    }}
                    className="btn btn-primary px-3.5 py-1.5 rounded-[10px] text-white flex items-center gap-1.5 font-bold shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Add Session</span>
                  </button>
                )}
              </div>
            </div>

            {/* OFFICIAL REFERENCE DOCUMENT SECTION */}
            {publishedDoc ? (
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck size={14} className="text-[#2563EB]" />
                    <span>Official Reference Document</span>
                  </h3>
                  <span className="text-[11px] text-[#52657A]">
                    {publishedDoc.branch} {publishedDoc.academicYear} Div {publishedDoc.division} • {publishedDoc.documentType.toUpperCase()}
                  </span>
                </div>
                <TimetableDocumentViewer
                  document={publishedDoc}
                  canManage={true}
                  onReplace={() => {
                    setUploadType(publishedDoc.documentType);
                    setDocBranch(publishedDoc.branch);
                    setDocYearOfStudy(publishedDoc.academicYear);
                    setDocDivision(publishedDoc.division);
                    if (publishedDoc.semester) setDocSemester(String(publishedDoc.semester));
                    setActiveTab('import');
                  }}
                  onRemove={handleRemoveDocument}
                />
              </div>
            ) : (
              <div className="p-3 bg-[#F8FAFC] rounded-[14px] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#52657A] mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">📄</span>
                  <span>No official reference document (PDF/Image) uploaded for this academic group yet.</span>
                </div>
                <button
                  onClick={() => {
                    setDocBranch(selectedBranch);
                    setDocYearOfStudy(selectedYear);
                    setDocDivision(selectedDivision);
                    setUploadType('pdf');
                    setActiveTab('import');
                  }}
                  className="btn bg-white hover:bg-slate-50 text-[#2563EB] border border-[#BFDBFE] px-3 py-1 rounded-[8px] font-bold text-[11px] flex items-center gap-1 self-start sm:self-auto shadow-xs"
                >
                  <Upload size={11} />
                  <span>Upload Document</span>
                </button>
              </div>
            )}

            {/* Results Grid / Schedule Display */}
            {loading ? (
              <Loader className="py-12" />
            ) : sessions.length === 0 ? (
              <EmptyState 
                title="NO STRUCTURED SESSIONS REGISTERED"
                subtitle={`No structured timetable entries exist in the database for ${selectedBranch} ${selectedYear} Division ${selectedDivision}. Upload a departmental CSV or add sessions manually to enable automated conflict detection.`}
              />
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-[#52657A] flex items-center justify-between font-semibold px-1">
                  <span>
                    Showing <strong>{sessions.length}</strong> active scheduled sessions for{' '}
                    <strong className="text-[#2563EB]">{selectedBranch} {selectedYear} Division {selectedDivision}</strong>
                  </span>
                  <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded text-[#0F172A]">
                    Version: {sessions[0]?.timetableVersion || 'v1.0'}
                  </span>
                </div>

                {/* Group By Day View */}
                {DAYS.map((day) => {
                  const daySessions = sessions.filter((s) => s.day === day);
                  if (selectedDay !== 'all' && selectedDay !== day) return null;
                  if (daySessions.length === 0 && selectedDay !== 'all') {
                    return (
                      <div key={day} className="p-4 rounded-[14px] bg-[#F8FAFC] text-center text-xs text-[#52657A]">
                        No sessions scheduled for {day}.
                      </div>
                    );
                  }
                  if (daySessions.length === 0) return null;

                  return (
                    <div key={day} className="border border-[#E2E8F0] rounded-[16px] overflow-hidden bg-white shadow-xs">
                      <div className="bg-[#F8FAFC] px-4 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
                        <span className="font-extrabold text-xs uppercase tracking-wider text-[#2563EB] flex items-center gap-1.5">
                          <Calendar size={13} />
                          <span>{day}</span>
                        </span>
                        <span className="text-[11px] font-bold text-[#52657A]">
                          {daySessions.length} session{daySessions.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="divide-y divide-[#E8EEF5]">
                        {daySessions.map((s) => (
                          <div 
                            key={s._id} 
                            className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F8FBFF] transition-colors text-xs"
                          >
                            <div className="flex items-center gap-3">
                              {/* Time Interval Badge */}
                              <div className="w-28 flex-shrink-0 font-mono font-bold text-[#0F172A] flex items-center gap-1 text-[11px]">
                                <Clock size={12} className="text-[#2563EB]" />
                                <span>{s.startTime} – {s.endTime}</span>
                              </div>

                              {/* Session Details */}
                              <div>
                                <div className="font-extrabold text-[#0F172A] flex items-center gap-1.5">
                                  <span>{s.subjectName}</span>
                                  {s.subjectCode && (
                                    <span className="text-[10px] font-mono text-[#52657A] bg-slate-100 px-1.5 py-0.2 rounded">
                                      {s.subjectCode}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 uppercase">
                                    {s.sessionType}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#52657A] flex items-center gap-2 mt-0.5">
                                  {s.room && <span>Room: <strong className="text-[#0F172A]">{s.room}</strong></span>}
                                  {s.faculty && <span>• Faculty: <strong className="text-[#0F172A]">{s.faculty}</strong></span>}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons in Manage Mode */}
                            {activeTab === 'manage' && (
                              <div className="flex items-center gap-1.5 justify-end">
                                <button
                                  onClick={() => {
                                    setEditingSession(s);
                                    setSessionForm({
                                      branch: s.branch,
                                      academicYear: s.academicYear,
                                      division: s.division,
                                      semester: s.semester ? String(s.semester) : '',
                                      day: s.day,
                                      startTime: s.startTime,
                                      endTime: s.endTime,
                                      subjectName: s.subjectName,
                                      subjectCode: s.subjectCode || '',
                                      sessionType: s.sessionType || 'Lecture',
                                      faculty: s.faculty || '',
                                      room: s.room || '',
                                      timetableVersion: s.timetableVersion || 'v1.0',
                                      force: false,
                                    });
                                    setShowAddModal(true);
                                  }}
                                  className="btn px-2.5 py-1 text-[11px] font-bold text-[#2563EB] hover:bg-blue-50 rounded-[8px]"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(s._id)}
                                  className="btn px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-[8px]"
                                  title="Deactivate session"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: IMPORT & UPLOAD TIMETABLE                         */}
        {/* ======================================================== */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            
            {/* Step 3: Upload Type Switcher */}
            <div className="p-1.5 bg-[#F1F5F9] rounded-[16px] border border-[#E2E8F0] flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setUploadType('pdf')}
                className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-[12px] text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  uploadType === 'pdf' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#52657A] hover:text-[#0F172A] bg-transparent'
                }`}
              >
                <FileText size={15} />
                <span>Upload PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadType('image')}
                className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-[12px] text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  uploadType === 'image' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#52657A] hover:text-[#0F172A] bg-transparent'
                }`}
              >
                <ImageIcon size={15} />
                <span>Upload Image</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadType('csv')}
                className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-[12px] text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  uploadType === 'csv' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#52657A] hover:text-[#0F172A] bg-transparent'
                }`}
              >
                <FileSpreadsheet size={15} />
                <span>Import CSV</span>
              </button>
            </div>

            {/* DOCUMENT UPLOAD (PDF & IMAGE) WORKFLOW */}
            {(uploadType === 'pdf' || uploadType === 'image') && (
              <form onSubmit={handleUploadDocumentSubmit} className="space-y-5">
                
                {/* Guide & Informational Header */}
                <div className="p-4 rounded-[16px] bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E3A8A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <strong className="font-bold text-sm block text-[#1D4ED8]">
                      Official Academic Timetable Document Upload ({uploadType.toUpperCase()})
                    </strong>
                    <span className="text-[#3B82F6] font-medium">
                      Upload an official {uploadType === 'pdf' ? 'PDF' : 'Image (PNG/JPEG/WebP)'} departmental timetable. Files are validated using binary signatures and stored securely.
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-100 text-[#1D4ED8] border border-blue-200 uppercase tracking-wider flex-shrink-0">
                    Max: 10 MB
                  </span>
                </div>

                {/* Step 2: Target Academic Group Selection */}
                <div className="bg-[#F8FAFC] p-4 rounded-[16px] border border-[#E2E8F0] space-y-3">
                  <h4 className="font-extrabold text-[#0F172A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Filter size={13} className="text-[#2563EB]" />
                    <span>Step 2 — Select Target Academic Group</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-[#52657A] mb-1">Academic Year:</label>
                      <input
                        type="text"
                        value={docAcademicYear}
                        onChange={(e) => setDocAcademicYear(e.target.value)}
                        placeholder="2026-2027"
                        className="input w-full px-3 py-1.5 rounded-[10px] border border-[#DCE6F0] bg-white font-bold text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#52657A] mb-1">Branch:</label>
                      <select
                        value={docBranch}
                        onChange={(e) => setDocBranch(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-[10px] border border-[#DCE6F0] bg-white font-bold text-xs"
                      >
                        {BRANCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#52657A] mb-1">Year of Study:</label>
                      <select
                        value={docYearOfStudy}
                        onChange={(e) => setDocYearOfStudy(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-[10px] border border-[#DCE6F0] bg-white font-bold text-xs"
                      >
                        {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#52657A] mb-1">Semester:</label>
                      <select
                        value={docSemester}
                        onChange={(e) => setDocSemester(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-[10px] border border-[#DCE6F0] bg-white font-bold text-xs"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#52657A] mb-1">Division:</label>
                      <select
                        value={docDivision}
                        onChange={(e) => setDocDivision(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-[10px] border border-[#DCE6F0] bg-white font-bold text-xs"
                      >
                        {DIVISION_OPTIONS.map((d) => <option key={d} value={d}>Division {d}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Step 4 & 5: File Selection & Document Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* File Dropzone */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#0F172A]">
                      Step 4 — Select {uploadType === 'pdf' ? 'PDF' : 'Image'} Document:
                    </label>
                    <div className="border-2 border-dashed border-[#CBD5E1] hover:border-[#2563EB] rounded-[16px] p-6 text-center bg-[#F8FAFC] transition-colors">
                      <input
                        type="file"
                        accept={uploadType === 'pdf' ? '.pdf' : '.jpg,.jpeg,.png,.webp'}
                        onChange={(e) => handleDocFileSelect(e, uploadType)}
                        className="hidden"
                        id="timetable-doc-input"
                      />
                      <label htmlFor="timetable-doc-input" className="cursor-pointer flex flex-col items-center">
                        {uploadType === 'pdf' ? (
                          <FileText size={32} className="text-[#2563EB] mb-2" />
                        ) : (
                          <ImageIcon size={32} className="text-[#2563EB] mb-2" />
                        )}
                        <span className="font-bold text-xs text-[#0F172A]">
                          {docFile ? docFile.name : `Click to select ${uploadType.toUpperCase()} file from computer`}
                        </span>
                        <span className="text-[11px] text-[#52657A] mt-1">
                          Max file size: 10 MB • {uploadType === 'pdf' ? 'Official PDF' : 'JPEG, PNG, or WebP'}
                        </span>
                        {docFile && (
                          <span className="mt-2 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Selected: {(docFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        )}
                      </label>
                    </div>

                    {/* Step 6: Document Metadata */}
                    <div className="bg-[#F8FAFC] p-4 rounded-[16px] border border-[#E2E8F0] space-y-3 text-xs">
                      <h4 className="font-extrabold text-[#0F172A] uppercase tracking-wider text-[11px]">
                        Step 6 — Enter Document Details & Metadata
                      </h4>

                      <div>
                        <label className="block font-semibold text-[#52657A] mb-1">
                          Document Title <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="text"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          placeholder={`e.g. ${docBranch} ${docYearOfStudy} Div ${docDivision} Official Timetable`}
                          className="input w-full px-3 py-1.5 rounded-[10px] border border-[#DCE6F0] font-bold text-xs bg-white"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-[#52657A] mb-1">
                            Timetable Version:
                          </label>
                          <input
                            type="text"
                            value={docVersion}
                            onChange={(e) => setDocVersion(e.target.value)}
                            placeholder="v1.0"
                            className="input w-full px-3 py-1.5 rounded-[10px] border border-[#DCE6F0] font-bold text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#52657A] mb-1">
                            Publication Status:
                          </label>
                          <input
                            type="text"
                            value="Published"
                            disabled
                            className="input w-full px-3 py-1.5 rounded-[10px] border border-[#DCE6F0] font-bold text-xs bg-slate-100 text-[#52657A]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#52657A] mb-1">
                          Description & Academic Notes (Optional):
                        </label>
                        <textarea
                          rows={2}
                          value={docDescription}
                          onChange={(e) => setDocDescription(e.target.value)}
                          placeholder="e.g. Revised timetable released with updated Lab batches and Room 402 assignments."
                          className="input w-full px-3 py-1.5 rounded-[10px] border border-[#DCE6F0] text-xs bg-white resize-none"
                        />
                      </div>

                      {/* Step 7: Confirm & Submit */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={docUploading || !docFile || !docTitle.trim()}
                          className="btn btn-primary w-full py-2.5 rounded-[10px] text-white font-extrabold flex items-center justify-center gap-2 shadow-xs hover:bg-[#1D4ED8]"
                        >
                          {docUploading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                          <span>{docUploading ? 'Saving to Persistent Storage...' : 'Step 7 — Confirm & Publish Document'}</span>
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Step 5: Document Preview Canvas */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#0F172A] flex items-center justify-between">
                      <span>Step 5 — Preview Before Publishing:</span>
                      {docPreviewUrl && (
                        <a
                          href={docPreviewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#2563EB] hover:underline font-bold flex items-center gap-1"
                        >
                          <ExternalLink size={11} />
                          <span>Open in Tab</span>
                        </a>
                      )}
                    </label>

                    <div className="border border-[#CBD5E1] rounded-[16px] bg-[#F8FAFC] overflow-hidden min-h-[380px] max-h-[520px] flex items-center justify-center p-3 relative shadow-inner">
                      {docPreviewUrl ? (
                        uploadType === 'pdf' ? (
                          <iframe
                            src={`${docPreviewUrl}#toolbar=1`}
                            title="PDF Preview"
                            className="w-full h-[460px] rounded-[10px] border border-[#CBD5E1] bg-white shadow-xs"
                          />
                        ) : (
                          <img
                            src={docPreviewUrl}
                            alt="Uploaded Timetable Preview"
                            className="max-h-[460px] max-w-full rounded-[10px] object-contain shadow-md"
                          />
                        )
                      ) : (
                        <div className="text-center text-[#52657A] p-8 space-y-2">
                          <Eye size={36} className="mx-auto text-slate-300" />
                          <p className="font-bold text-xs text-[#0F172A]">Document preview will appear here</p>
                          <p className="text-[11px]">Select a file above to verify multi-page PDF pages or image clarity before publishing.</p>
                        </div>
                      )}
                    </div>

                    {/* Section 7 Architecture Notice */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-[12px] text-[11px] text-[#52657A] leading-relaxed">
                      <strong className="text-[#0F172A] font-bold block mb-0.5">ℹ️ Reference Document Notice:</strong>
                      Uploading a PDF or image registers the official reference schedule for students and faculty. Timetable conflict detection relies strictly on validated structured sessions. To enable automated conflict detection, you can also import structured CSV records.
                    </div>
                  </div>

                </div>

              </form>
            )}

            {/* CSV STRUCTURED IMPORT WORKFLOW */}
            {uploadType === 'csv' && (
              <div className="space-y-6">
                
                {/* Guide & Instructions Header */}
                <div className="p-4 rounded-[16px] bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E3A8A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <strong className="font-bold text-sm block text-[#1D4ED8]">Bulk Timetable CSV Import</strong>
                    <span>Upload an official departmental timetable file. All records undergo server-side validation and conflict checks before saving.</span>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="btn bg-white hover:bg-slate-50 text-[#2563EB] border border-[#BFDBFE] px-3 py-1.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 flex-shrink-0 shadow-xs"
                  >
                    <Download size={13} />
                    <span>Download CSV Template</span>
                  </button>
                </div>

                {/* Upload & Config Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-3">
                    <label className="block text-xs font-bold text-[#0F172A]">
                      Select CSV Timetable File (.csv):
                    </label>
                    <div className="border-2 border-dashed border-[#CBD5E1] hover:border-[#2563EB] rounded-[16px] p-6 text-center bg-[#F8FAFC] transition-colors">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="timetable-csv-input"
                      />
                      <label htmlFor="timetable-csv-input" className="cursor-pointer flex flex-col items-center">
                        <Upload size={28} className="text-[#2563EB] mb-2" />
                        <span className="font-bold text-xs text-[#0F172A]">
                          {csvFile ? csvFile.name : 'Click to select CSV file from your computer'}
                        </span>
                        <span className="text-[11px] text-[#52657A] mt-1">
                          Max file size: 2MB • Standard UTF-8 CSV
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Version & Options */}
                  <div className="bg-[#F8FAFC] p-4 rounded-[16px] border border-[#E2E8F0] space-y-3 text-xs">
                    <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
                      Import Parameters
                    </h4>

                    <div>
                      <label className="block font-semibold text-[#52657A] mb-1">
                        Timetable Version Label:
                      </label>
                      <input
                        type="text"
                        value={importVersion}
                        onChange={(e) => setImportVersion(e.target.value)}
                        placeholder="e.g. v2026-Sem3"
                        className="input w-full px-3 py-1.5 rounded-[10px] border border-[#DCE6F0] font-bold text-xs bg-white"
                      />
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={deactivatePrevious}
                          onChange={(e) => setDeactivatePrevious(e.target.checked)}
                          className="rounded border-[#DCE6F0] text-[#2563EB]"
                        />
                        <span>Deactivate previous version for imported groups</span>
                      </label>
                    </div>

                    <div className="pt-3">
                      <button
                        onClick={handlePreviewCsv}
                        disabled={previewLoading || !csvContent}
                        className="btn btn-primary w-full py-2.5 rounded-[10px] text-white font-bold flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        {previewLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                        <span>{previewLoading ? 'Parsing CSV...' : 'Preview & Validate'}</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* PREVIEW & VALIDATION SUMMARY TABLE */}
            {previewData && (
              <div className="space-y-4 pt-4 border-t border-[#E8EEF5] animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#0F172A]">
                      Validation Results Summary
                    </h3>
                    <span className="text-xs text-[#52657A]">
                      Review identified issues before confirming database import.
                    </span>
                  </div>

                  <button
                    onClick={handleCommitImport}
                    disabled={commitLoading || previewData.validCount === 0}
                    className="btn btn-primary px-5 py-2.5 rounded-[12px] text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:bg-[#1D4ED8]"
                  >
                    {commitLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    <span>Confirm & Commit ({previewData.validCount} Valid Records)</span>
                  </button>
                </div>

                {/* Metric Summary Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="bg-[#F8FAFC] p-3 rounded-[12px] border border-[#E2E8F0]">
                    <div className="text-[10px] font-extrabold uppercase text-[#52657A]">Total Records</div>
                    <div className="text-xl font-extrabold text-[#0F172A]">{previewData.totalRecords}</div>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-[12px] border border-emerald-200">
                    <div className="text-[10px] font-extrabold uppercase text-emerald-800">Valid Records</div>
                    <div className="text-xl font-extrabold text-emerald-800">{previewData.validCount}</div>
                  </div>
                  <div className="bg-rose-50 p-3 rounded-[12px] border border-rose-200">
                    <div className="text-[10px] font-extrabold uppercase text-rose-800">Invalid Records</div>
                    <div className="text-xl font-extrabold text-rose-800">{previewData.invalidCount}</div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-[12px] border border-amber-200">
                    <div className="text-[10px] font-extrabold uppercase text-amber-800">Duplicates</div>
                    <div className="text-xl font-extrabold text-amber-800">{previewData.duplicateCount}</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-[12px] border border-purple-200">
                    <div className="text-[10px] font-extrabold uppercase text-purple-800">Overlaps</div>
                    <div className="text-xl font-extrabold text-purple-800">{previewData.overlapCount}</div>
                  </div>
                </div>

                {/* Overlap Callouts */}
                {previewData.overlaps && previewData.overlaps.length > 0 && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-[12px] text-xs space-y-1.5">
                    <strong className="font-extrabold text-purple-900 block">
                      ⚠️ Internal Timetable Session Overlaps Detected ({previewData.overlaps.length})
                    </strong>
                    {previewData.overlaps.map((o: any, idx: number) => (
                      <div key={idx} className="text-[11px] text-purple-800">
                        • Row {o.rowA} & Row {o.rowB} ({o.academicGroup}): {o.message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Invalid Records Callouts */}
                {previewData.invalidRecords && previewData.invalidRecords.length > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-[12px] text-xs space-y-1.5">
                    <strong className="font-extrabold text-rose-900 block">
                      ❌ Invalid Records Identified ({previewData.invalidRecords.length})
                    </strong>
                    <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-rose-200">
                      {previewData.invalidRecords.map((inv: any, idx: number) => (
                        <div key={idx} className="pt-1 text-[11px] text-rose-800 flex justify-between">
                          <span>Row {inv.row}: {inv.errors.join(', ')}</span>
                          <span className="font-mono text-[10px] text-rose-600 truncate max-w-[200px]">
                            {inv.raw.subjectName || inv.raw.branch || 'Malformed line'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Valid Records Preview List */}
                <div className="border border-[#E2E8F0] rounded-[14px] overflow-hidden">
                  <div className="bg-[#F8FAFC] px-4 py-2 border-b border-[#E2E8F0] text-xs font-extrabold text-[#0F172A]">
                    Preview of Valid Sessions to be Saved ({previewData.validCount})
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#E8EEF5] text-xs">
                    {previewData.validRecords.map((r: any, idx: number) => (
                      <div key={idx} className="px-4 py-2 flex items-center justify-between gap-2 hover:bg-[#F8FBFF]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#2563EB] w-20">{r.day}</span>
                          <span className="font-mono font-bold text-[#0F172A] w-24">{r.startTime}–{r.endTime}</span>
                          <strong className="text-[#0F172A]">{r.subjectName}</strong>
                          {r.subjectCode && <span className="text-[#52657A] font-mono">({r.subjectCode})</span>}
                        </div>
                        <div className="text-[11px] text-[#52657A]">
                          {r.branch} {r.academicYear} Div {r.division} • {r.sessionType}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: IMPORT & DOCUMENT AUDIT HISTORY                   */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            
            {/* Header with Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A]">
                  Administrative Timetable Audit & Version History
                </h3>
                <span className="text-xs text-[#52657A]">
                  Audited log of published official documents (PDF/images) and structured CSV imports.
                </span>
              </div>
              <button
                onClick={() => {
                  loadHistory();
                  loadDocumentHistory();
                }}
                className="btn px-3 py-1.5 rounded-[10px] border border-[#DCE6F0] bg-white text-xs font-semibold flex items-center gap-1 self-start sm:self-auto shadow-xs"
              >
                <RefreshCw size={12} className={(historyLoading || docHistoryLoading) ? 'animate-spin' : ''} />
                <span>Refresh History</span>
              </button>
            </div>

            {/* History Type Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-bold">
              <button
                onClick={() => setHistoryTab('documents')}
                className={`px-3 py-1.5 rounded-[8px] flex items-center gap-1.5 transition-all ${
                  historyTab === 'documents' 
                    ? 'bg-[#2563EB] text-white shadow-xs' 
                    : 'text-[#52657A] hover:text-[#0F172A] bg-slate-100'
                }`}
              >
                <FileText size={13} />
                <span>Official Timetable Documents ({documentHistory.length})</span>
              </button>
              <button
                onClick={() => setHistoryTab('csv')}
                className={`px-3 py-1.5 rounded-[8px] flex items-center gap-1.5 transition-all ${
                  historyTab === 'csv' 
                    ? 'bg-[#2563EB] text-white shadow-xs' 
                    : 'text-[#52657A] hover:text-[#0F172A] bg-slate-100'
                }`}
              >
                <FileSpreadsheet size={13} />
                <span>CSV Import Batches ({historyList.length})</span>
              </button>
            </div>

            {/* DOCUMENTS HISTORY VIEW */}
            {historyTab === 'documents' && (
              <div>
                {docHistoryLoading ? (
                  <Loader className="py-8" />
                ) : documentHistory.length === 0 ? (
                  <EmptyState
                    title="NO TIMETABLE DOCUMENTS UPLOADED"
                    subtitle="No official PDF or Image timetable documents have been uploaded yet."
                  />
                ) : (
                  <div className="border border-[#E2E8F0] rounded-[16px] overflow-hidden bg-white shadow-xs divide-y divide-[#E8EEF5]">
                    {documentHistory.map((doc: any) => {
                      const fileUrl = doc.fileUrl?.startsWith('http')
                        ? doc.fileUrl
                        : (doc.fileUrl || `/api/timetables/documents/${doc._id}/file`);
                      const downloadUrl = `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}download=true`;
                      const sizeMb = (doc.fileSize / (1024 * 1024)).toFixed(2);

                      return (
                        <div key={doc._id} className="p-4 text-xs space-y-2 hover:bg-[#F8FBFF] transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="p-1.5 rounded bg-blue-50 text-[#2563EB]">
                                {doc.documentType === 'pdf' ? <FileText size={15} /> : <ImageIcon size={15} />}
                              </span>
                              <strong className="text-sm font-extrabold text-[#0F172A]">
                                {doc.documentTitle}
                              </strong>
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-[#0F172A]">
                                {doc.documentType}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                doc.status === 'published' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : doc.status === 'archived'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {doc.status}
                              </span>
                              <span className="text-[10px] font-mono text-[#52657A] bg-slate-100 px-1.5 py-0.5 rounded">
                                {doc.timetableVersion || 'v1.0'}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 self-start sm:self-auto">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn bg-white hover:bg-slate-50 text-[#2563EB] border border-[#BFDBFE] px-2.5 py-1 rounded-[8px] text-[11px] font-bold flex items-center gap-1 shadow-xs"
                              >
                                <ExternalLink size={11} />
                                <span>Open</span>
                              </a>
                              <a
                                href={downloadUrl}
                                download
                                className="btn bg-white hover:bg-slate-50 text-[#0F172A] border border-[#DCE6F0] px-2.5 py-1 rounded-[8px] text-[11px] font-bold flex items-center gap-1 shadow-xs"
                              >
                                <Download size={11} />
                                <span>Download</span>
                              </a>
                              {doc.status === 'published' && (
                                <button
                                  onClick={() => handleRemoveDocument(doc._id)}
                                  className="btn bg-rose-50 hover:bg-rose-100 text-rose-600 px-2 py-1 rounded-[8px] text-[11px] font-bold"
                                  title="Deactivate document"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#52657A] pt-1">
                            <div>
                              <span>Academic Group:</span>{' '}
                              <strong className="text-[#0F172A]">{doc.branch} {doc.academicYear} Div {doc.division}</strong>
                            </div>
                            <div>
                              <span>Uploaded By:</span>{' '}
                              <strong className="text-[#0F172A]">{doc.uploadedByName || doc.uploadedByEmail || 'Admin'}</strong>
                            </div>
                            <div>
                              <span>File Details:</span>{' '}
                              <strong className="text-[#0F172A]">{sizeMb} MB • {doc.originalFilename}</strong>
                            </div>
                            <div>
                              <span>Date Uploaded:</span>{' '}
                              <strong className="text-[#0F172A]">{new Date(doc.createdAt).toLocaleString()}</strong>
                            </div>
                          </div>

                          {doc.description && (
                            <p className="text-[11px] text-[#52657A] italic bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                              Note: {doc.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CSV IMPORT BATCHES VIEW */}
            {historyTab === 'csv' && (
              <div>
                {historyLoading ? (
                  <Loader className="py-8" />
                ) : historyList.length === 0 ? (
                  <EmptyState
                    title="NO IMPORT HISTORY FOUND"
                    subtitle="No bulk timetable imports have been recorded yet."
                  />
                ) : (
                  <div className="border border-[#E2E8F0] rounded-[16px] overflow-hidden bg-white shadow-xs divide-y divide-[#E8EEF5]">
                    {historyList.map((item) => (
                      <div key={item._id} className="p-4 text-xs space-y-2 hover:bg-[#F8FBFF] transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-[#2563EB] font-mono">
                              {item.timetableVersion}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                              {item.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#52657A]">
                            {new Date(item.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#52657A] pt-1">
                          <div>
                            <span>Imported By:</span>{' '}
                            <strong className="text-[#0F172A]">{item.importedByName || item.importedByEmail || 'Admin'}</strong>
                          </div>
                          <div>
                            <span>Source File:</span>{' '}
                            <strong className="text-[#0F172A]">{item.sourceFilename || '-'}</strong>
                          </div>
                          <div>
                            <span>Inserted Records:</span>{' '}
                            <strong className="text-emerald-700">{item.insertedCount || item.validRecords}</strong>
                          </div>
                          <div>
                            <span>Total Parsed:</span>{' '}
                            <strong className="text-[#0F172A]">{item.totalRecords}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* MANUAL SESSION ADD / EDIT MODAL                          */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] max-w-lg w-full p-6 shadow-2xl border border-[#E2E8F0] text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">
                {editingSession ? 'Edit Academic Session' : 'Add New Academic Session'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#52657A] hover:text-[#0F172A] font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-3">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#52657A] mb-1">Branch</label>
                  <select
                    value={sessionForm.branch}
                    onChange={(e) => setSessionForm({ ...sessionForm, branch: e.target.value })}
                    className="select w-full px-2.5 py-1.5 rounded-[8px] border border-[#DCE6F0] font-bold"
                  >
                    {BRANCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#52657A] mb-1">Year</label>
                  <select
                    value={sessionForm.academicYear}
                    onChange={(e) => setSessionForm({ ...sessionForm, academicYear: e.target.value })}
                    className="select w-full px-2.5 py-1.5 rounded-[8px] border border-[#DCE6F0] font-bold"
                  >
                    {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#52657A] mb-1">Division</label>
                  <select
                    value={sessionForm.division}
                    onChange={(e) => setSessionForm({ ...sessionForm, division: e.target.value })}
                    className="select w-full px-2.5 py-1.5 rounded-[8px] border border-[#DCE6F0] font-bold"
                  >
                    {DIVISION_OPTIONS.map((d) => <option key={d} value={d}>Div {d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#52657A] mb-1">Day of Week</label>
                  <select
                    value={sessionForm.day}
                    onChange={(e) => setSessionForm({ ...sessionForm, day: e.target.value })}
                    className="select w-full px-2.5 py-1.5 rounded-[8px] border border-[#DCE6F0] font-semibold"
                  >
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#52657A] mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    className="input w-full px-2.5 py-1 rounded-[8px] border border-[#DCE6F0] font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#52657A] mb-1">End Time (24h)</label>
                  <input
                    type="time"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    className="input w-full px-2.5 py-1 rounded-[8px] border border-[#DCE6F0] font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#52657A] mb-1">Subject Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Data Structures & Algorithms"
                  value={sessionForm.subjectName}
                  onChange={(e) => setSessionForm({ ...sessionForm, subjectName: e.target.value })}
                  className="input w-full px-3 py-1.5 rounded-[8px] border border-[#DCE6F0] font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#52657A] mb-1">Subject Code</label>
                  <input
                    type="text"
                    placeholder="e.g. IT301"
                    value={sessionForm.subjectCode}
                    onChange={(e) => setSessionForm({ ...sessionForm, subjectCode: e.target.value })}
                    className="input w-full px-3 py-1.5 rounded-[8px] border border-[#DCE6F0] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#52657A] mb-1">Session Type</label>
                  <select
                    value={sessionForm.sessionType}
                    onChange={(e) => setSessionForm({ ...sessionForm, sessionType: e.target.value })}
                    className="select w-full px-2.5 py-1.5 rounded-[8px] border border-[#DCE6F0]"
                  >
                    {SESSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#52657A] mb-1">Faculty (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Sharma"
                    value={sessionForm.faculty}
                    onChange={(e) => setSessionForm({ ...sessionForm, faculty: e.target.value })}
                    className="input w-full px-3 py-1.5 rounded-[8px] border border-[#DCE6F0]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#52657A] mb-1">Room / Lab (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 301 / Lab 2"
                    value={sessionForm.room}
                    onChange={(e) => setSessionForm({ ...sessionForm, room: e.target.value })}
                    className="input w-full px-3 py-1.5 rounded-[8px] border border-[#DCE6F0]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn px-4 py-2 rounded-[10px] text-[#52657A] hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn btn-primary px-5 py-2 rounded-[10px] text-white font-extrabold flex items-center gap-1.5"
                >
                  {formSubmitting && <Loader2 size={13} className="animate-spin" />}
                  <span>{editingSession ? 'Update Session' : 'Save Session'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Session Delete */}
      <ConfirmModal
        open={Boolean(confirmDeleteId)}
        title="DEACTIVATE ACADEMIC SESSION"
        description="Are you sure you want to deactivate this scheduled academic session? It will no longer trigger timetable conflict alerts."
        confirmText="DEACTIVATE"
        onConfirm={() => {
          if (confirmDeleteId) handleDeleteSession(confirmDeleteId);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

    </div>
  );
}
