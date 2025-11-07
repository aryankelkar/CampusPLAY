import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import PageHeader from '../../components/common/PageHeader';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute role="admin">
      <div>
        <PageHeader title="Admin Dashboard" subtitle="Manage booking requests and approvals" />
        <AdminDashboard />
      </div>
    </ProtectedRoute>
  );
}

function Tag({ status }: { status: 'Pending' | 'Approved' | 'Rejected' }) {
  const cls = status === 'Approved' ? 'badge-green' : status === 'Rejected' ? 'badge-red' : 'badge-yellow';
  return <span className={`badge ${cls}`}>{status}</span>;
}

function AdminDashboard() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // Removed daily view; only requests are shown
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'>('all');
  const [query, setQuery] = useState('');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; action: 'approve' | 'reject' | 'pending'; row?: any } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/bookings');
      setRows(data?.data?.bookings || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = useMemo(() => {
    const base = { all: rows.length, Pending: 0, Approved: 0, Rejected: 0, Cancelled: 0 } as Record<string, number>;
    for (const r of rows) {
      if (base[r.status] !== undefined) base[r.status]++;
    }
    return base;
  }, [rows]);

  const uniqueGames = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.game) set.add(r.game);
    return ['all', ...Array.from(set)];
  }, [rows]);

  useEffect(() => { load(); }, []);

  const act = async (id: string, action: 'approve' | 'reject' | 'pending', reason?: string) => {
    try {
      let response;
      
      if (action === 'reject') {
        response = await api.patch(`/bookings/${id}/reject`, { reason: reason || '' });
      } else if (action === 'approve') {
        response = await api.patch(`/bookings/${id}/approve`);
      } else {
        response = await api.patch(`/bookings/${id}/pending`);
      }
      
      // Real-time update: Use the booking data returned from API
      const updatedBooking = response.data?.data?.booking;
      
      if (updatedBooking) {
        setRows((prev) => prev.map((r) => (r._id === id ? { ...r, ...updatedBooking } : r)));
      }
      
      // Success messages
      const messages = {
        approve: '✅ Booking approved successfully',
        reject: '❌ Booking rejected successfully',
        pending: '🔄 Booking revoked - moved to pending'
      };
      
      setToast({ message: messages[action], type: 'success' });
      setTimeout(() => setToast(null), 3000);
      
    } catch (error: any) {
      // Handle specific error messages from backend
      const errorMessage = error?.response?.data?.message || 'Action failed. Please try again.';
      
      setToast({ message: `⚠️ ${errorMessage}`, type: 'error' });
      setTimeout(() => setToast(null), 4000);
      
      // Reload to ensure consistency on error
      load();
    }
  };

  const requestConfirm = (id: string, action: 'approve' | 'reject' | 'pending', row?: any) => {
    setConfirmTarget({ id, action, row });
    if (action === 'reject') setRejectReason('');
    setConfirmOpen(true);
  };

  // count-up animation (derive from counts with capitalized keys)
  const [anim, setAnim] = useState({ pending: 0, approved: 0, rejected: 0 });
  const pendingCount = statusCounts.Pending;
  const approvedCount = statusCounts.Approved;
  const rejectedCount = statusCounts.Rejected;
  useEffect(() => {
    const duration = 600; const fps = 30; const steps = Math.round((duration/1000)*fps);
    let i = 0; const start = { pending: 0, approved: 0, rejected: 0 };
    const iv = setInterval(() => {
      i += 1; const t = i/steps;
      setAnim({
        pending: Math.round(start.pending + t * pendingCount),
        approved: Math.round(start.approved + t * approvedCount),
        rejected: Math.round(start.rejected + t * rejectedCount),
      });
      if (i >= steps) clearInterval(iv);
    }, 1000/fps);
    return () => clearInterval(iv);
  }, [pendingCount, approvedCount, rejectedCount]);

  // Daily View removed

  const filteredRows = useMemo(() => {
    let list = statusFilter === 'all' ? rows : rows.filter((r) => r.status === statusFilter);
    if (gameFilter !== 'all') list = list.filter((r) => r.game === gameFilter);
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((r) =>
      (r.game || '').toLowerCase().includes(q) ||
      (r.ground || '').toLowerCase().includes(q) ||
      (r.name || r.student?.name || '').toLowerCase().includes(q) ||
      (r.roll || '').toLowerCase().includes(q) ||
      (r.date || '').toLowerCase().includes(q)
    );
  }, [rows, statusFilter, query, gameFilter]);

  // Flat list rendering (no grouped sections)
  const listToRender = filteredRows;

  const StatusChip = ({ status }: { status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' }) => {
    const cls = status === 'Approved'
      ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-green-700'
      : status === 'Rejected'
        ? 'bg-gradient-to-r from-rose-100 to-red-100 text-red-700'
        : status === 'Cancelled'
          ? 'bg-gray-100 text-gray-700'
          : 'bg-gradient-to-r from-amber-100 to-yellow-100 text-yellow-700';
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${cls}`}>{status}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-4 top-20 z-50 rounded-lg px-3 py-2 text-sm shadow ${toast.type==='success'?'bg-green-600 text-white':'bg-red-600 text-white'}`}>{toast.message}</div>
      )}
      {/* Summary cards as interactive filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className={`rounded-xl p-4 shadow-sm cursor-pointer transition hover:shadow-md ${statusFilter==='all'?'ring-1 ring-blue-300':''}`} style={{ background: '#E3F2FD' }} onClick={()=>setStatusFilter('all')}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">📊 All</div>
            <div className="text-xs text-gray-500">Everything</div>
          </div>
          <div className="mt-2 text-3xl font-bold text-blue-700">{statusCounts.all}</div>
        </div>
        <div className={`rounded-xl p-4 shadow-sm cursor-pointer transition hover:shadow-md ${statusFilter==='Pending'?'ring-1 ring-amber-300':''}`} style={{ background: '#FFFDE7' }} onClick={()=>setStatusFilter('Pending')}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">⏳ Pending</div>
            <div className="text-xs text-gray-500">Awaiting action</div>
          </div>
          <div className="mt-2 text-3xl font-bold text-amber-700">{anim.pending}</div>
        </div>
        <div className={`rounded-xl p-4 shadow-sm cursor-pointer transition hover:shadow-md ${statusFilter==='Approved'?'ring-1 ring-emerald-300':''}`} style={{ background: '#E8F5E9' }} onClick={()=>setStatusFilter('Approved')}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">✅ Approved</div>
            <div className="text-xs text-gray-500">All set</div>
          </div>
          <div className="mt-2 text-3xl font-bold text-emerald-700">{anim.approved}</div>
        </div>
        <div className={`rounded-xl p-4 shadow-sm cursor-pointer transition hover:shadow-md ${statusFilter==='Rejected'?'ring-1 ring-rose-300':''}`} style={{ background: '#FFEBEE' }} onClick={()=>setStatusFilter('Rejected')}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">❌ Rejected</div>
            <div className="text-xs text-gray-500">Needs attention</div>
          </div>
          <div className="mt-2 text-3xl font-bold text-rose-700">{anim.rejected}</div>
        </div>
      </div>

      {/* Search + Optional dropdown */}
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm">
          <span className="text-slate-400">🔎</span>
          <input aria-label="Search" className="search-anim flex-1 bg-transparent outline-none" placeholder="Search by student, sport, ground, date" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </div>
        <select aria-label="Filter by game" className="input min-w-[160px]" value={gameFilter} onChange={(e)=>setGameFilter(e.target.value)}>
          {uniqueGames.map((g) => (
            <option key={g} value={g}>{g === 'all' ? 'All games' : g}</option>
          ))}
        </select>
        {query && <button className="btn btn-ghost border border-gray-300" onClick={()=>setQuery('')}>Clear</button>}
      </div>
      {loading ? (
        <Loader className="py-6" />
      ) : filteredRows.length === 0 ? (
        <EmptyState title="No new requests today. Time for a coffee ☕" subtitle="Fresh requests will show up here." />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {listToRender.map((r) => {
              const cardBorder = r.status === 'Approved' ? 'border-l-green-400' : r.status === 'Rejected' ? 'border-l-rose-400' : 'border-l-amber-400';
              return (
                <motion.div
                  layout
                  key={r._id}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 0.6 }}
                  className={`rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md border-l-4 ${cardBorder}`}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold">{r.game} @ {r.ground}</span>
                      <span className="text-sm text-gray-600">{r.date} • {r.time}</span>
                      <span className="text-sm text-gray-700">Student: {(r.student?.name || r.name) || '-'}{(r.student?.roll || r.roll) ? ` • ${(r.student?.roll || r.roll)}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusChip status={r.status} />
                      <button className="btn btn-ghost border border-blue-300 text-blue-700 transition transform hover:-translate-y-0.5" onClick={() => setExpanded({ ...expanded, [r._id]: !expanded[r._id] })}>
                        {expanded[r._id] ? 'Hide' : 'View'} Details
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expanded[r._id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-100"
                      >
                        <div className="p-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <h3 className="mb-2 font-semibold text-blue-700">Student Details</h3>
                              <div className="text-sm text-gray-700 space-y-1">
                                <div><span className="text-gray-500">Name:</span> {r.name || r.student?.name || '-'}</div>
                                <div><span className="text-gray-500">Roll No:</span> {r.roll || r.student?.roll || '-'}</div>
                                <div><span className="text-gray-500">Email:</span> {r.email || r.student?.email || '-'}</div>
                                <div><span className="text-gray-500">Branch:</span> {r.branch || r.student?.branch || '-'}</div>
                                <div><span className="text-gray-500">Division:</span> {r.division || r.student?.division || '-'}</div>
                                <div><span className="text-gray-500">Class Year:</span> {r.classYear || r.student?.classYear || '-'}</div>
                              </div>
                            </div>
                            <div>
                              <h3 className="mb-2 font-semibold text-blue-700">Booking Info</h3>
                              <div className="text-sm text-gray-700 space-y-1">
                                <div><span className="text-gray-500">Game:</span> {r.game}</div>
                                <div><span className="text-gray-500">Ground:</span> {r.ground}</div>
                                <div><span className="text-gray-500">Date:</span> {r.date}</div>
                                <div><span className="text-gray-500">Time:</span> {r.time}</div>
                                <div><span className="text-gray-500">Status:</span> <StatusChip status={r.status} /></div>
                              </div>
                            </div>
                          </div>

                          {Array.isArray(r.teamMembers) && r.teamMembers.length > 0 && (
                            <div className="mt-4">
                              <h3 className="mb-2 font-semibold text-blue-700">Team Members</h3>
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[400px] text-left text-sm">
                                  <thead className="bg-gray-100 text-gray-700">
                                    <tr>
                                      <th className="p-2">Name</th>
                                      <th className="p-2">Roll No</th>
                                      <th className="p-2">Email</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {r.teamMembers.map((m: any, idx: number) => (
                                      <tr key={idx} className="border-b border-gray-100">
                                        <td className="p-2">{m.name}</td>
                                        <td className="p-2">{m.roll}</td>
                                        <td className="p-2">{m.email}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            {r.status === 'Pending' && (
                              <>
                                <button title="Confirm and allot this slot." onClick={() => requestConfirm(r._id, 'approve', r)} className="btn transition transform hover:-translate-y-0.5" style={{ background: 'linear-gradient(90deg,#22C55E,#16A34A)', color: '#fff' }}>Approve</button>
                                <button title="Deny booking and free the slot." onClick={() => requestConfirm(r._id, 'reject', r)} className="btn btn-ghost border border-red-300 text-red-600 transition transform hover:-translate-y-0.5">Reject</button>
                              </>
                            )}
                            {r.status === 'Approved' && (
                              <>
                                <button title="Move back to Pending." onClick={() => requestConfirm(r._id, 'pending', r)} className="btn btn-ghost border border-yellow-300 text-yellow-700 transition transform hover:-translate-y-0.5">Revoke</button>
                                <button title="Mark as Rejected." onClick={() => requestConfirm(r._id, 'reject', r)} className="btn btn-ghost border border-red-300 text-red-600 transition transform hover:-translate-y-0.5">Mark Rejected</button>
                              </>
                            )}
                            {r.status === 'Rejected' && (
                              <>
                                <button title="Move back to Pending." onClick={() => requestConfirm(r._id, 'pending', r)} className="btn btn-ghost border border-yellow-300 text-yellow-700 transition transform hover:-translate-y-0.5">Revoke</button>
                                <button title="Approve this slot." onClick={() => requestConfirm(r._id, 'approve', r)} className="btn transition transform hover:-translate-y-0.5" style={{ background: 'linear-gradient(90deg,#22C55E,#16A34A)', color: '#fff' }}>Approve</button>
                              </>
                            )}
                          </div>

                          {/* Audit trail (optional) */}
                          <div className="mt-4">
                            <h3 className="mb-2 font-semibold text-blue-700">History</h3>
                            <div className="text-sm text-gray-700 space-y-1">
                              {r.createdAt && (
                                <div>📌 Created: {new Date(r.createdAt).toLocaleString()}</div>
                              )}
                              {r.approvedAt && (
                                <div>🟢 Approved: {new Date(r.approvedAt).toLocaleString()} {r.approvedBy ? `by ${r.approvedBy}` : ''}</div>
                              )}
                              {r.rejectedAt && (
                                <div>🔴 Rejected: {new Date(r.rejectedAt).toLocaleString()} {r.rejectedBy ? `by ${r.rejectedBy}` : ''} {r.rejectionReason ? `• Reason: ${r.rejectionReason}` : ''}</div>
                              )}
                              {r.status === 'Pending' && (r.approvedAt || r.rejectedAt) && (
                                <div>🟡 Reverted to Pending</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                          )}
                        </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={confirmTarget?.action === 'approve' ? '✅ Approve Booking?' : confirmTarget?.action === 'reject' ? '⚠️ Reject Booking Request' : '🟡 Revoke Decision?'}
        description={confirmTarget ? (
          <div className="text-sm space-y-2">
            {confirmTarget.action === 'approve' ? (
              <>
                <div>You’re about to approve this slot for <b>{confirmTarget.row?.name || confirmTarget.row?.student?.name || 'student'}</b>.</div>
                <div>Sport: <b>{confirmTarget.row?.game}</b> | Ground: <b>{confirmTarget.row?.ground}</b> | Time: <b>{confirmTarget.row?.time}</b></div>
                <div className="text-xs text-gray-500">Once approved, the student will be notified.</div>
              </>
            ) : confirmTarget.action === 'reject' ? (
              <>
                <div>Please provide a reason (optional but recommended).</div>
                <textarea className="input h-24" placeholder="E.g., Ground unavailable during this time." value={rejectReason} onChange={(e)=>setRejectReason(e.target.value)} />
              </>
            ) : (
              <>
                <div>This will move the booking back to <b>Pending</b>. Continue?</div>
              </>
            )}
          </div>
        ) : null}
        confirmText={confirmTarget?.action === 'approve' ? 'Confirm Approval' : confirmTarget?.action === 'reject' ? 'Confirm Rejection' : 'Confirm Revoke'}
        cancelText="Cancel"
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        onConfirm={async () => {
          if (confirmTarget) {
            await act(confirmTarget.id, confirmTarget.action, confirmTarget.action==='reject'?rejectReason:undefined);
          }
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />
    </div>
  );
}
