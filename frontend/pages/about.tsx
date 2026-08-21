import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, ShieldCheck, Trophy, Users, Zap, Compass, Sparkles } from 'lucide-react';

export default function About() {
  const team = [
    { name: 'Aryan Kelkar', role: 'Backend & System Architecture', focus: 'API & Real-time Sockets' },
    { name: 'Pranay Belnekar', role: 'Frontend & UI Engineering', focus: 'Product & Design System' },
    { name: 'Prathamesh Salunkhe', role: 'UX & State Integration', focus: 'Workflow & Form Flow' },
    { name: 'Ayush Kamble', role: 'Testing & Verification', focus: 'Quality Assurance & Docs' },
  ];

  return (
    <div className="w-full font-inter bg-[#FAFBF9] text-slate-900">
      
      {/* Hero Section */}
      <section className="py-16 sm:py-24 border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#075B45]">Our Story & Mission</span>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight uppercase leading-[0.95] mt-3 mb-6">
            Empowering Campus Sports.<br />
            <span className="text-[#075B45]">Built For Students.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto mb-10">
            CampusPlay is an editorial-grade sports platform created to eliminate physical paperwork, line waiting, and slot confusion across university sports grounds.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/bookings" 
              className="btn bg-[#075B45] hover:bg-[#044E3B] text-white px-7 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center gap-2"
            >
              <span>Book a Ground</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial Grid - Story & Contrast */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#075B45]">The Problem & Solution</span>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight uppercase mt-3 mb-6">
                Why We Built CampusPlay
              </h2>
              <p className="text-base text-slate-600 font-normal leading-relaxed mb-8">
                In most colleges, booking a ground requires physical forms, line waiting, and back-and-forth approval checks. CampusPlay digitizes the entire lifecycle into a live, transparent system.
              </p>

              <div className="space-y-4">
                {[
                  'Instant slot verification & real-time socket updates',
                  'Verified student access (@vit.edu.in authentication)',
                  'Transparent admin approval queue with audit history',
                  'Team member roster coordination for inter-departmental matches',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#075B45] flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold text-slate-900">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
                <Image 
                  src="/images/hero-sports.png" 
                  alt="Campus Sports Turf" 
                  width={700} 
                  height={500} 
                  className="w-full h-[400px] object-cover"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 sm:py-24 bg-[#FAFBF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#075B45]">Engineering Team</span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight uppercase mt-2">
              Meet The Builders
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-slate-950 text-white font-black text-sm flex items-center justify-center mb-4">
                  0{i + 1}
                </div>
                <h3 className="font-bold text-lg text-slate-950 mb-1">{member.name}</h3>
                <p className="text-xs font-bold text-[#075B45] uppercase tracking-wider mb-2">{member.role}</p>
                <p className="text-xs text-slate-500 font-medium">{member.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
