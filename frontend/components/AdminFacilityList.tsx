import { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Trophy, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Edit3, 
  Save, 
  X,
  Sparkles
} from 'lucide-react';
import api from '../lib/api';
import { CAMPUS_FACILITIES, FacilityInfo } from '../utils/facilityConfig';

export default function AdminFacilityList() {
  const [facilities, setFacilities] = useState<FacilityInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [editingFac, setEditingFac] = useState<FacilityInfo | null>(null);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/facilities');
      if (data?.data?.facilities && data.data.facilities.length > 0) {
        setFacilities(data.data.facilities);
      } else {
        setFacilities(CAMPUS_FACILITIES);
      }
    } catch {
      setFacilities(CAMPUS_FACILITIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleUpdateStatus = async (facilityId: string, newStatus: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE') => {
    try {
      await api.put(`/facilities/${facilityId}`, { status: newStatus });
      setToast(`Facility status updated to ${newStatus}`);
      fetchFacilities();
      setTimeout(() => setToast(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update facility status');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingFac) return;
    try {
      await api.put(`/facilities/${editingFac.id || (editingFac as any)._id}`, {
        status: editingFac.status,
        description: editingFac.description,
        capacity: editingFac.capacity,
        location: editingFac.location,
        operatingHours: editingFac.operatingHours
      });
      setToast('Facility details saved successfully');
      setEditingFac(null);
      fetchFacilities();
      setTimeout(() => setToast(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save facility edits');
    }
  };

  return (
    <div className="space-y-6 font-inter">
      {toast && (
        <div className="fixed right-4 top-20 z-50 rounded-[12px] bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white shadow-xl flex items-center gap-2">
          <Sparkles size={16} />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F172A]">Campus Facilities Setup</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configure facility maintenance status, capacity, and supported sports.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {facilities.map((fac: any) => {
          const isMaintenance = fac.status === 'MAINTENANCE';
          const isInactive = fac.status === 'INACTIVE';

          return (
            <div 
              key={fac.name} 
              className={`p-6 rounded-[22px] bg-white border transition-all duration-200 shadow-sm ${
                isMaintenance 
                  ? 'border-amber-200 bg-amber-50/20' 
                  : isInactive 
                    ? 'border-slate-200 opacity-75' 
                    : 'border-[#E8EEF5]'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] uppercase">
                      {fac.type || (fac.name.includes('Court') ? 'COURT' : 'GROUND')}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      fac.status === 'ACTIVE' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : isMaintenance 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {fac.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0F172A] mt-2">{fac.name}</h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateStatus(fac._id || fac.id, fac.status === 'MAINTENANCE' ? 'ACTIVE' : 'MAINTENANCE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      isMaintenance 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    <Wrench size={13} />
                    <span>{isMaintenance ? 'Set Active' : 'Maintenance'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-[#52657A] border-t border-[#F1F5F9] pt-4 mb-4">
                <div className="flex items-center gap-2">
                  <Trophy size={14} className="text-[#2563EB]" />
                  <span><strong>Supported Sports:</strong> {(fac.supportedSports || []).join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#2563EB]" />
                  <span><strong>Location:</strong> {fac.location || 'Campus Sports Complex'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-[#2563EB]" />
                  <span><strong>Capacity:</strong> {fac.capacity || 'Standard'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#2563EB]" />
                  <span><strong>Hours:</strong> {fac.operatingHours || '08:00 AM - 06:00 PM'}</span>
                </div>
              </div>

              <p className="text-xs text-[#64748B] italic bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                "{fac.description || `Official ${fac.name} facility.`}"
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
