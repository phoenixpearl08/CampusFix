import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bot, 
  ShieldAlert, 
  CopyCheck, 
  Activity, 
  Wrench, 
  BarChart4, 
  ArrowRight, 
  Sparkles, 
  CheckCircle,
  Building,
  Zap,
  Clock
} from 'lucide-react';

export default function LandingPage() {
  const { user, role } = useAuth();

  const getDashboardLink = () => {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'MAINTENANCE') return '/maintenance/dashboard';
    return '/dashboard';
  };

  const features = [
    {
      icon: Bot,
      title: 'AI Issue Detection',
      desc: 'Smart neural engine automatically identifies the correct maintenance category from natural language complaint text.',
      tag: 'Auto-Classify'
    },
    {
      icon: ShieldAlert,
      title: 'Smart Priority Scoring',
      desc: 'Calculates urgency (LOW, MEDIUM, HIGH, CRITICAL) using safety hazard recognition like water-electricity co-location.',
      tag: 'Safety Guard'
    },
    {
      icon: CopyCheck,
      title: 'Duplicate Detection',
      desc: 'Compares new reports with existing active tickets using location coordinates and semantic token similarity.',
      tag: 'Zero Redundancy'
    },
    {
      icon: Activity,
      title: 'Real-Time Tracking',
      desc: 'Transparent end-to-end status workflow: REPORTED → REVIEW → ASSIGNED → PROGRESS → RESOLVED → CLOSED.',
      tag: 'Full Audit Trail'
    },
    {
      icon: Wrench,
      title: 'Maintenance Management',
      desc: 'Dedicated field technician workflow with mobile work initiation, field notes, and photo completion proof.',
      tag: 'Field Operations'
    },
    {
      icon: BarChart4,
      title: 'Campus Analytics',
      desc: 'Analyzes recurring complaint hotspots across buildings, blocks, and floors to prevent repeated infrastructure failures.',
      tag: 'Predictive Insights'
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#09090c] text-slate-100 overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-pink-600/15 via-purple-600/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-pink-500/10 blur-[140px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-950/40 px-3.5 py-1.5 text-xs font-semibold text-pink-300 mb-8 backdrop-blur-md shadow-pink-glow-sm">
          <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span>Next-Gen Smart Campus Facilities Management</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
          <span className="text-white">CAMPUS</span>
          <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">FIX</span>
          <br />
          <span className="pink-gradient-text text-3xl sm:text-5xl lg:text-6xl font-extrabold">
            See It. Report It. Fix It.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed mb-10">
          AI-powered campus issue reporting and management. Instantly classify broken lights, water leaks, IT glitches, and hazards with transparent duplicate detection and real-time resolution timelines.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {user ? (
            <Link
              to={getDashboardLink()}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-pink-glow hover:shadow-pink-glow-lg transition-all scale-100 hover:scale-105"
            >
              Open Your Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-pink-glow hover:shadow-pink-glow-lg transition-all scale-100 hover:scale-105"
              >
                Report Campus Issue
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-zinc-200 bg-[#151520] hover:bg-[#1c1c2b] border border-zinc-700/80 transition-all"
              >
                Sign In to Portal
              </Link>
            </>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-14 pt-8 border-t border-zinc-800/80 flex flex-wrap items-center justify-center gap-8 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-pink-400" />
            <span>Role-Based Access Control</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-pink-400" />
            <span>Sub-Second AI Categorization</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-pink-400" />
            <span>Real Database Audit Timeline</span>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Intelligent Infrastructure Operations
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Engineered for modern universities to replace slow paper trails with rapid automated dispatch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group relative rounded-2xl border border-zinc-800 bg-[#111118]/80 p-6 backdrop-blur-md hover:border-pink-500/40 hover:bg-[#161622] transition-all duration-300 hover:-translate-y-1 hover:shadow-pink-glow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-white transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-pink-400 bg-pink-950/40 px-2.5 py-1 rounded-md border border-pink-500/20">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-pink-300 transition-colors">
                  {f.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workflow Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="rounded-3xl border border-pink-500/30 bg-gradient-to-b from-[#141420] to-[#0c0c12] p-8 sm:p-12 shadow-pink-glow">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-black text-white mb-3">
              Standardized Campus Resolution Pipeline
            </h3>
            <p className="text-xs text-zinc-400 mb-8">
              Every maintenance ticket strictly follows verifiable operational milestones.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold">
            {['REPORTED', 'UNDER REVIEW', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED'].map((step, idx) => (
              <React.Fragment key={step}>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900/90 text-zinc-200">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  {step}
                </div>
                {idx < 5 && (
                  <ArrowRight className="w-4 h-4 text-pink-500 hidden sm:inline" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-8 px-4 text-center text-xs text-zinc-500">
        <div className="flex items-center justify-center gap-2 mb-2 font-semibold text-zinc-400">
          <span>CampusFix — See It. Report It. Fix It.</span>
        </div>
        <p>© 2026 CampusFix Smart Campus Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
