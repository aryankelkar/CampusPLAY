import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, ShieldCheck, Trophy, Users, Zap, Compass, Sparkles } from 'lucide-react';

export default function About() {
  const team = [
    { name: 'Aryan Kelkar', role: 'Backend & System Architecture', focus: 'API & Real-time Sockets' },
    { name: 'Pranay Belnekar', role: 'Frontend & UI Engineering', focus: 'Product & Design System' },
    { name: 'Prathamesh Salunkhe', role: 'UX & State Integration', focus: 'Workflow & Form Flow' },
  ];

  return (
    <div className="w-full font-inter bg-transparent text-[#0F172A]">
      
      {/* Hero Section */}
      <section className="py-12 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Our Story & Mission</span>
          <h1 className="text-4xl sm:text-6xl font-black text-[#0F172A] tracking-tight uppercase leading-[0.95] mt-3 mb-6">
            Empowering Campus Sports.<br />
            <span className="text-[#2563EB]">Built For Students.</span>
          </h1>
          <p className="text-base sm:text-lg text-[#52657A] font-normal leading-relaxed max-w-2xl mx-auto mb-10">
            CampusPlay is an editorial-grade sports platform created to eliminate physical paperwork, line waiting, and slot confusion across university sports grounds.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/bookings" 
              className="btn btn-primary text-white px-7 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-md hover:-translate-y-0.5 transition-all"
            >
              <span>Book a Ground</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial Grid - Story & Contrast Card */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/85 backdrop-blur-sm rounded-[28px] border border-[#E8EEF5] p-6 sm:p-10 lg:p-12 shadow-[6px_6px_20px_rgba(148,163,184,0.12),-6px_-6px_20px_rgba(255,255,255,0.9)]">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              <div className="lg:col-span-6">
                <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">The Problem & Solution</span>
                <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight uppercase mt-3 mb-6">
                  Why We Built CampusPlay
                </h2>
                <p className="text-base text-[#52657A] font-normal leading-relaxed mb-8">
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
                      <CheckCircle2 size={18} className="text-[#10B981] flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-[#0F172A]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative rounded-2xl overflow-hidden border border-[#DCE6F0] shadow-xl">
                  <Image 
                    src="/images/campus-aerial-ground.jpg" 
                    alt="Campus Sports Grounds — Aerial Field View" 
                    width={700} 
                    height={500} 
                    className="w-full h-[360px] sm:h-[400px] object-cover"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 sm:py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Engineering Team</span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight uppercase mt-2">
              Meet The Builders
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <div key={i} className="bg-white rounded-[20px] border border-[#E8EEF5] p-6 shadow-[4px_4px_12px_rgba(148,163,184,0.12),-4px_-4px_12px_rgba(255,255,255,0.85)] hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-[14px] bg-[#DBEAFE] text-[#2563EB] font-black text-sm flex items-center justify-center mb-4">
                  0{i + 1}
                </div>
                <h3 className="font-bold text-lg text-[#0F172A] mb-1">{member.name}</h3>
                <p className="text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-2">{member.role}</p>
                <p className="text-xs text-[#52657A] font-medium">{member.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
