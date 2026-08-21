import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import EquipmentBookingWizard from '../../components/EquipmentBookingWizard';
import { 
  Dumbbell, 
  Search, 
  Filter, 
  Check, 
  Plus, 
  Calendar, 
  Clock, 
  Package, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface EquipmentItem {
  _id: string;
  name: string;
  category: string;
  description: string;
  totalQuantity: number;
  availableQuantity?: number;
  image?: string;
  status: string;
}

export default function EquipmentPage() {
  const { user } = useAuth();
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForBooking, setSelectedItemForBooking] = useState<EquipmentItem | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Date/time filters for checking availability
  const [filterDate, setFilterDate] = useState('');
  const [filterCollectionTime, setFilterCollectionTime] = useState('');
  const [filterReturnTime, setFilterReturnTime] = useState('');

  const categories = ['All', 'Cricket', 'Football', 'Volleyball', 'Badminton', 'General'];

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (filterDate) params.date = filterDate;
      if (filterCollectionTime) params.collectionTime = filterCollectionTime;
      if (filterReturnTime) params.returnTime = filterReturnTime;

      const { data } = await api.get('/equipment', { params });
      setEquipmentList(data?.data?.equipment || []);
    } catch (e: any) {
      setError('Unable to load sports equipment. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [filterDate, filterCollectionTime, filterReturnTime]);

  const filteredItems = useMemo(() => {
    return equipmentList.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [equipmentList, selectedCategory, searchQuery]);

  const handleOpenReserveModal = (item: EquipmentItem) => {
    setSelectedItemForBooking(item);
    setWizardOpen(true);
  };

  return (
    <>
      <Head>
        <title>Sports Equipment — CampusPlay</title>
        <meta name="description" content="Reserve sports equipment for your campus matches and training sessions." />
      </Head>

      <div className="space-y-6 font-inter">
        
        {/* Header Banner */}
          <div className="mb-8 text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DBEAFE] text-[#2563EB] text-xs font-extrabold uppercase tracking-wider mb-3 border border-[#BFDBFE]">
              <Dumbbell size={14} /> Campus Inventory
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] mb-2 uppercase">
              Sports Equipment
            </h1>
            <p className="text-sm sm:text-base text-[#52657A]">
              Reserve the equipment you need for your next game. Select items, choose your quantities, and manage your gear reservations effortlessly.
            </p>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="p-4 rounded-[20px] bg-white border border-[#DCE6F0] shadow-[7px_7px_18px_rgba(148,163,184,0.12)] mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

            </div>
          </div>

          {/* Equipment Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-48 rounded-[20px] bg-white border border-[#E2E8F0] p-6 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-white rounded-[20px] border border-rose-200 text-rose-600 font-semibold max-w-md mx-auto">
              <ShieldAlert size={32} className="mx-auto mb-2 text-rose-500" />
              <p>{error}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-[20px] border border-[#DCE6F0] max-w-md mx-auto">
              <Package size={40} className="mx-auto mb-3 text-[#94A3B8]" />
              <h3 className="text-base font-extrabold text-[#0F172A] mb-1">No equipment found</h3>
              <p className="text-xs text-[#64748B]">Try selecting a different category or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const avail = item.availableQuantity ?? item.totalQuantity;
                const isOutOfStock = avail <= 0;

                return (
                  <div 
                    key={item._id}
                    className="p-5 rounded-[22px] bg-white border border-[#DCE6F0] shadow-[7px_7px_18px_rgba(148,163,184,0.12)] hover:shadow-[7px_7px_22px_rgba(37,99,235,0.15)] transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB] uppercase tracking-wider border border-[#BFDBFE]">
                          {item.category}
                        </span>
                        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                          isOutOfStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isOutOfStock ? '0 Available' : `${avail} Available`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-extrabold border border-[#BFDBFE] shrink-0">
                          <Dumbbell size={22} />
                        </div>
                        <div>
                          <h3 className="text-lg font-extrabold text-[#0F172A] leading-tight">{item.name}</h3>
                          <p className="text-xs text-[#64748B] font-medium mt-0.5 line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E8EEF5] flex items-center justify-between mt-2">
                      <div className="text-[11px] text-[#64748B] font-medium">
                        Total Stock: <span className="font-extrabold text-[#0F172A]">{item.totalQuantity}</span>
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleOpenReserveModal(item)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5 ${
                          isOutOfStock 
                            ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                            : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-95'
                        }`}
                      >
                        {isOutOfStock ? 'Unavailable' : 'Reserve'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

      </div>

      {/* Equipment Reservation Wizard Modal */}
      <EquipmentBookingWizard
        initialItem={selectedItemForBooking}
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => fetchEquipment()}
      />
    </>
  );
}
