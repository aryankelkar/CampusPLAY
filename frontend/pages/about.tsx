import Link from 'next/link';
import { ArrowRight, Calendar, CheckCircle, Users, BarChart3, Leaf, Zap } from 'lucide-react';

export default function About() {
  const features = [
    { icon: '⏱️', title: 'Quick Slot Booking', desc: 'Reserve grounds in seconds' },
    { icon: '🌐', title: 'All-in-One Dashboard', desc: 'Manage everything in one place' },
    { icon: '🧍', title: 'Student-Centric Design', desc: 'Built for student needs' },
    { icon: '📊', title: 'Real-Time Status', desc: 'Track approvals instantly' },
    { icon: '🏅', title: 'Encourages Participation', desc: 'Making sports accessible' },
    { icon: '🌿', title: 'Paper-Free', desc: 'Digital and sustainable' },
  ];

  const team = [
    { name: 'Aryan Kelkar', role: 'Backend & Research', avatar: '👨‍💻' },
    { name: 'Pranay Belnekar', role: 'Frontend Development', avatar: '👨‍🎨' },
    { name: 'Prathamesh Salunkhe', role: 'UX & Integration', avatar: '👨‍🔧' },
    { name: 'Ayush Kamble', role: 'Testing & Documentation', avatar: '👨‍🔬' },
  ];

  const values = [
    {
      icon: <Users className="w-8 h-8 text-primary-600" />,
      title: 'Accessibility',
      desc: 'Everyone deserves access to play.',
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-accent-600" />,
      title: 'Transparency',
      desc: 'Open, fair, and efficient booking.',
    },
    {
      icon: <Zap className="w-8 h-8 text-secondary-600" />,
      title: 'Engagement',
      desc: 'Encouraging participation through simplicity.',
    },
  ];

  return (
    <div className="w-full">
      {/* 1️⃣ Hero Section */}
      <section 
        className="relative min-h-[500px] flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(37, 99, 235, 0.15)), linear-gradient(180deg, #F0FDF4, #E0F2FE)',
        }}
      >
        {/* Image Placeholder - Replace with actual image */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
            <p className="text-6xl">🏟️</p>
          </div>
        </div>
        {/* Image prompt: Wide-angle view of college sports ground under soft morning light */}
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center animate-fade-in-up">
          <div className="badge badge-blue inline-flex items-center gap-2 mb-6">
            <span>🎯</span>
            <span>Our Mission to Play</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Empowering Campus Sports —{' '}
            <span className="text-gradient-sport">One Slot at a Time</span>
          </h1>
          <p className="text-xl text-muted max-w-3xl mx-auto mb-8 leading-relaxed">
            CampusPlay is more than a booking platform — it's a step toward smarter, 
            more inclusive campus sports culture.
          </p>
          <Link 
            href="/" 
            className="btn btn-primary inline-flex items-center gap-2 text-lg px-8 py-4 group"
          >
            <span>Explore CampusPlay</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* 2️⃣ Story Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <h2 className="section-title mb-4">Why CampusPlay?</h2>
            <p className="text-muted text-lg leading-relaxed mb-6">
              In most colleges, students face challenges accessing sports grounds — from waiting 
              for faculty permissions to carrying equipment daily. <strong className="text-primary-900">CampusPlay changes that</strong> by 
              digitizing the entire process — booking slots, tracking approvals, and promoting participation.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-red-500 font-bold">❌</span>
                <span className="text-gray-600 line-through">Manual paper forms</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-primary-600 font-bold">✅</span>
                <span className="font-semibold text-gray-800">Online instant booking</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-primary-600 font-bold">✅</span>
                <span className="font-semibold text-gray-800">Admin approval system</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-primary-600 font-bold">✅</span>
                <span className="font-semibold text-gray-800">Full transparency & tracking</span>
              </div>
            </div>
          </div>
          
          {/* Image Placeholder */}
          <div className="card p-8 flex items-center justify-center h-80 animate-fade-in">
            <div className="text-center">
              <p className="text-8xl mb-4">📱</p>
              <p className="text-muted text-sm">Flat illustration: Digital vs Manual Systems</p>
            </div>
          </div>
          {/* Image prompt: Students with paper forms vs using phone app */}
        </div>
      </section>

      {/* 3️⃣ Features Snapshot */}
      <section className="bg-gradient-to-b from-white to-primary-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="section-title mb-4">What Makes Us Different</h2>
            <p className="text-muted text-lg">Features designed with students in mind</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="card-interactive p-6 text-center animate-fade-in-up group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-lg mb-2 text-primary-950">{feature.title}</h3>
                <p className="text-sm text-muted">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4️⃣ Team Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="section-title mb-4">Meet the Minds Behind CampusPlay</h2>
          <p className="text-muted text-lg">Built by students, for students</p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, i) => (
            <div 
              key={i} 
              className="card p-6 text-center hover:shadow-sport-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-sport flex items-center justify-center text-5xl shadow-sport">
                {member.avatar}
              </div>
              <h3 className="font-bold text-lg text-primary-950 mb-1">{member.name}</h3>
              <p className="text-sm text-muted">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5️⃣ Values Section */}
      <section 
        className="relative py-20 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(37, 99, 235, 0.1))',
        }}
      >
        {/* Image Placeholder Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center">
            <p className="text-9xl">🌿</p>
          </div>
        </div>
        {/* Image prompt: Sunlight through tree leaves over green turf */}
        
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-12 animate-fade-in-up">
            <blockquote className="text-3xl md:text-4xl font-bold text-primary-900 mb-8 italic">
              "Sports unite us — technology empowers us."
            </blockquote>
            <h2 className="section-title mb-4">Our Philosophy</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, i) => (
              <div 
                key={i} 
                className="card p-8 text-center animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="font-bold text-xl mb-3 text-primary-950">{value.title}</h3>
                <p className="text-muted leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6️⃣ Vision Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image Placeholder */}
          <div className="card p-8 flex items-center justify-center h-80 order-2 md:order-1 animate-fade-in">
            <div className="text-center">
              <p className="text-8xl mb-4">🚀</p>
              <p className="text-muted text-sm">Futuristic sports facility with AI kiosk</p>
            </div>
          </div>
          {/* Image prompt: Futuristic college sports facility with AI booking kiosk */}
          
          <div className="order-1 md:order-2 animate-fade-in-up">
            <h2 className="section-title mb-4">Looking Ahead</h2>
            <p className="text-muted text-lg leading-relaxed mb-6">
              Our vision is to integrate <strong className="text-accent-700">AI-based slot recommendations</strong>, 
              real-time analytics, and mobile-friendly experiences that make sports participation 
              effortless and enjoyable.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-800">Smart Scheduling</p>
                  <p className="text-sm text-muted">AI suggests best times based on your preferences</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="w-6 h-6 text-accent-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-800">Real-Time Analytics</p>
                  <p className="text-sm text-muted">Track usage patterns and optimize availability</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Leaf className="w-6 h-6 text-secondary-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-800">Sustainable Approach</p>
                  <p className="text-sm text-muted">Paperless, efficient, eco-friendly system</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7️⃣ CTA Section */}
      <section 
        className="relative py-24 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(37, 99, 235, 0.2)), linear-gradient(180deg, #F0FDF4, #DBEAFE)',
        }}
      >
        {/* Image Placeholder Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-primary-200 via-accent-200 to-secondary-200 flex items-center justify-center">
            <p className="text-9xl">🏆</p>
          </div>
        </div>
        {/* Image prompt: Sports turf at golden hour with students celebrating */}
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary-950">
            Join the Movement
          </h2>
          <p className="text-xl text-muted mb-8 leading-relaxed">
            CampusPlay is built by students, for students.<br />
            Let's make campus sports accessible to all.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/bookings" 
              className="btn btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="mailto:contact@campusplay.com" 
              className="btn btn-outline inline-flex items-center gap-2 text-lg px-8 py-4"
            >
              <span>Contact Us</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
