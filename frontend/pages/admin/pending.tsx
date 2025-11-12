import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../lib/api';
import AdminTabs from '../../components/AdminTabs';
import ConfirmModal from '../../components/common/ConfirmModal';
import PageHeader from '../../components/common/PageHeader';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

export default function PendingPage() {
  return (
    <ProtectedRoute role="admin">
      <div className="px-4 py-6">
        <PendingView />
      </div>
    </ProtectedRoute>
  );
}

function Tag({ status }: { status: 'Pending' | 'Approved' | 'Rejected' }) {
  const cls = status === 'Approved' ? 'badge-green' : status === 'Rejected' ? 'badge-red' : 'badge-yellow';
  return <span className={`badge ${cls}`}>{status}</span>;
}

function PendingView() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/bookings');
      const all = data?.data?.bookings || [];
      setRows(all.filter((b: any) => b.status === 'Pending'));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const act = async (id: string, action: 'approve' | 'reject') => {
    await api.patch(`/bookings/${id}/${action}`);
    await load();
  };
  const requestConfirm = (id: string, action: 'approve' | 'reject') => { setConfirmTarget({ id, action }); setConfirmOpen(true); };

  return (
    <div className="rounded-2xl p-4 bg-white/95 backdrop-blur border border-gray-100 max-w-6xl mx-auto">
      <div className="mb-4">
        <PageHeader title="Admin • Pending Bookings" subtitle="Review requests and take action" />
        <div className="mb-3">
          <AdminTabs />
        </div>
      </div>

      {loading ? (
        <Loader className="py-6" />
      ) : rows.length === 0 ? (
        <EmptyState title="No pending bookings" subtitle="New requests will appear here" />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r._id} className="rounded-lg border border-gray-200 bg-white/95 backdrop-blur shadow-md hover:shadow-lg transition">
              <div className="flex items-center justify-between p-3">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">{r.date} • {r.time}</span>
                  <span className="text-lg font-semibold text-gray-800">{r.game} @ {r.ground}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Tag status={r.status} />
                  <button className="btn btn-secondary" onClick={() => setExpanded({ ...expanded, [r._id]: !expanded[r._id] })}>
                    {expanded[r._id] ? 'Hide' : 'View'} Details
                  </button>
                </div>
              </div>

              {expanded[r._id] && (
                <div className="p-4 border-t border-gray-200">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="mb-2 font-semibold text-blue-700">Student Details</h3>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div><span className="text-gray-500">Name:</span> {r.name || r.student?.name}</div>
                        <div><span className="text-gray-500">Roll No:</span> {r.roll}</div>
                        <div><span className="text-gray-500">Email:</span> {r.email || r.student?.email}</div>
                        <div><span className="text-gray-500">Branch:</span> {r.branch}</div>
                        <div><span className="text-gray-500">Division:</span> {r.division}</div>
                        <div><span className="text-gray-500">Class Year:</span> {r.classYear}</div>
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-blue-700">Booking Info</h3>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div><span className="text-gray-500">Game:</span> {r.game}</div>
                        <div><span className="text-gray-500">Ground:</span> {r.ground}</div>
                        <div><span className="text-gray-500">Date:</span> {r.date}</div>
                        <div><span className="text-gray-500">Time:</span> {r.time}</div>
                        <div><span className="text-gray-500">Status:</span> <Tag status={r.status} /></div>
                      </div>
                    </div>
                  </div>

                  {Array.isArray(r.teamMembers) && r.teamMembers.length > 0 && (
                    <div className="mt-4">
                      <h3 className="mb-2 font-semibold text-blue-700">Team Members</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[400px] text-left text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-2">Name</th>
                              <th className="p-2">Roll No</th>
                              <th className="p-2">Email</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.teamMembers.map((m: any, idx: number) => (
                              <tr key={idx} className="border-b">
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

                  <div className="mt-4 flex gap-2">
                    <button onClick={() => requestConfirm(r._id, 'approve')} className="btn btn-primary">Approve ✅</button>
                    <button onClick={() => requestConfirm(r._id, 'reject')} className="btn btn-secondary">Reject ❌</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={confirmTarget?.action === 'approve' ? 'Approve booking?' : 'Reject booking?'}
        description={confirmTarget ? <div className="text-sm">Are you sure you want to {confirmTarget.action} this booking?</div> : null}
        confirmText={confirmTarget?.action === 'approve' ? 'Approve' : 'Reject'}
        cancelText="Cancel"
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        onConfirm={async () => {
          if (confirmTarget) await act(confirmTarget.id, confirmTarget.action);
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />
    </div>
  );
}
