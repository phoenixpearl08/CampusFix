import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { issueAPI, maintenanceAPI, getFullImageUrl } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import TimelineView from '../../components/TimelineView';
import { 
  ArrowLeft, 
  MapPin, 
  Wrench, 
  Play, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  Send, 
  X,
  User,
  Phone
} from 'lucide-react';

export default function MaintenanceIssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Maintenance action states
  const [startingWork, setStartingWork] = useState(false);
  const [progressNote, setProgressNote] = useState('');
  const [postingProgress, setPostingProgress] = useState(false);

  // Resolution modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [completionFile, setCompletionFile] = useState(null);
  const [completionPreview, setCompletionPreview] = useState(null);
  const [resolving, setResolving] = useState(false);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      const res = await issueAPI.getIssueById(id);
      setIssue(res.data.issue);
    } catch (err) {
      console.error('Failed to load maintenance issue:', err);
      setError(err.response?.data?.error || 'Access denied or ticket not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [id]);

  // Start Work Action
  const handleStartWork = async () => {
    setStartingWork(true);
    try {
      const res = await maintenanceAPI.startWork(id, { notes: 'Maintenance technician arrived on site and commenced repairs.' });
      setIssue(res.data.issue);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start work on this issue.');
    } finally {
      setStartingWork(false);
    }
  };

  // Add Progress Update Action
  const handleAddProgress = async (e) => {
    e.preventDefault();
    if (!progressNote.trim()) return;

    setPostingProgress(true);
    try {
      const res = await maintenanceAPI.addProgress(id, { notes: progressNote.trim() });
      setIssue(res.data.issue);
      setProgressNote('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record progress note.');
    } finally {
      setPostingProgress(false);
    }
  };

  // Resolution Submission
  const handleResolveIssue = async (e) => {
    e.preventDefault();
    if (!resolutionSummary.trim()) {
      alert('Please provide resolution notes detailing the work completed.');
      return;
    }

    setResolving(true);
    try {
      const formData = new FormData();
      formData.append('resolutionNotes', resolutionSummary.trim());
      if (completionFile) {
        formData.append('completionPhoto', completionFile);
      }

      const res = await maintenanceAPI.resolveIssue(id, formData);
      setIssue(res.data.issue);
      setShowResolveModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark issue as resolved.');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400 mt-2">Loading ticket data...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-300 text-sm">
          {error || 'Issue not accessible.'}
        </div>
        <button
          onClick={() => navigate('/maintenance/assigned')}
          className="inline-flex items-center gap-2 text-xs text-pink-400 hover:text-pink-300 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Assigned Queue
        </button>
      </div>
    );
  }

  const reportImages = (issue.images || []).filter(img => img.image_type === 'REPORT');
  const completionImages = (issue.images || []).filter(img => img.image_type === 'COMPLETION');

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/maintenance/assigned')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assigned Queue
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-pink-400 bg-pink-950/50 px-3 py-1 rounded-lg border border-pink-500/30">
            {issue.issue_code}
          </span>
          <StatusBadge status={issue.status} size="lg" />
          <PriorityBadge priority={issue.final_priority} size="lg" />
        </div>
      </div>

      {/* Field Actions Action Bar */}
      <div className="rounded-2xl border border-pink-500/30 bg-[#151522] p-4 flex flex-wrap items-center justify-between gap-4 shadow-pink-glow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/30">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Technician Operations Control</h3>
            <p className="text-xs text-zinc-400">Current Ticket State: <strong className="text-pink-300">{issue.status}</strong></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {issue.status === 'ASSIGNED' && (
            <button
              onClick={handleStartWork}
              disabled={startingWork}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-pink-glow-sm transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              {startingWork ? 'Updating...' : 'Start Work On-Site'}
            </button>
          )}

          {issue.status === 'IN PROGRESS' && (
            <button
              onClick={() => setShowResolveModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete & Mark Resolved
            </button>
          )}

          {issue.status === 'RESOLVED' && (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
              ✓ Marked Resolved (Waiting Reporter Verification)
            </span>
          )}

          {issue.status === 'CLOSED' && (
            <span className="text-xs font-semibold text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-lg">
              ✓ Ticket Closed & Verified
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 space-y-5">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-pink-400">
                {issue.final_category} Task
              </span>
              <h1 className="text-xl font-black text-white mt-1">{issue.title}</h1>
            </div>

            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-[#161622]/80 p-4 rounded-xl border border-zinc-800/80">
              {issue.description}
            </div>

            {/* Reporter Contact Info */}
            <div className="rounded-xl border border-zinc-800 bg-[#161622]/50 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Reporter Contact</p>
                  <p className="text-xs font-bold text-white">{issue.reporter_name} ({issue.reporter_department || 'Student'})</p>
                </div>
              </div>
              {issue.reporter_phone && (
                <a
                  href={`tel:${issue.reporter_phone}`}
                  className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 bg-pink-950/30 border border-pink-500/30 px-3 py-1.5 rounded-lg"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Reporter: {issue.reporter_phone}
                </a>
              )}
            </div>

            {/* Location Specs */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#161622]/40">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-pink-400" />
                Exact Facility Location
              </span>
              <p className="text-sm font-bold text-white">
                {issue.building}
              </p>
              <p className="text-xs text-zinc-300 mt-0.5">
                Block {issue.block} • {issue.floor} {issue.room ? `• ${issue.room}` : ''}
              </p>
              {issue.map_coordinates && (
                <p className="text-[11px] font-mono text-zinc-500 mt-1">
                  Grid GPS: {issue.map_coordinates}
                </p>
              )}
            </div>

            {/* Initial Problem Photo */}
            {reportImages.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Initial Defect Photo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reportImages.map((img) => (
                    <div key={img.id} className="rounded-xl border border-zinc-800 overflow-hidden bg-black/40">
                      <img
                        src={getFullImageUrl(img.image_url)}
                        alt="Report defect"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion Photo */}
            {completionImages.length > 0 && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  ✓ Repair Completion Photo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {completionImages.map((img) => (
                    <div key={img.id} className="rounded-xl border border-emerald-500/30 overflow-hidden bg-black/60">
                      <img
                        src={getFullImageUrl(img.image_url)}
                        alt="Completion proof"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ))}
                </div>
                {issue.resolution_notes && (
                  <p className="text-xs text-emerald-200 mt-2 p-2 rounded bg-black/40 border border-emerald-500/20">
                    Notes: {issue.resolution_notes}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Progress Update Form */}
          {issue.status === 'IN PROGRESS' && (
            <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-pink-400" />
                Post Field Progress Note
              </h3>
              <form onSubmit={handleAddProgress} className="space-y-3">
                <textarea
                  rows={3}
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="Record parts replaced, delay reasons, or progress updates for the timeline..."
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-[#161622] p-3 text-xs text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={postingProgress || !progressNote.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {postingProgress ? 'Logging...' : 'Append Field Update'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Timeline */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 shadow-xl sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <div>
                <h3 className="text-sm font-bold text-white">Full Timeline Log</h3>
                <p className="text-[11px] text-zinc-400">Field work history audit</p>
              </div>
              <Clock className="w-4 h-4 text-pink-400" />
            </div>

            <TimelineView timeline={issue.timeline} currentStatus={issue.status} />
          </div>
        </div>
      </div>

      {/* Resolution Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border border-emerald-500/40 bg-[#121219] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Complete & Mark Resolved</h3>
              </div>
              <button onClick={() => setShowResolveModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                  Resolution Summary Notes <span className="text-emerald-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="Detail work performed (e.g. Replaced faulty circuit breaker, sealed pipe joint, verified no leakage)..."
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-[#161622] p-3 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                  Upload Completion Proof Photo (Recommended)
                </label>
                {completionPreview ? (
                  <div className="relative rounded-xl border border-emerald-500/40 p-2 max-w-xs bg-black/40">
                    <img src={completionPreview} alt="Proof" className="rounded h-36 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setCompletionFile(null); setCompletionPreview(null); }}
                      className="absolute top-3 right-3 p-1 rounded-full bg-black/80 text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-zinc-700 hover:border-emerald-500/50 bg-[#161622] cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-emerald-400 mb-1" />
                    <span className="text-xs text-white font-medium">Attach completed repair photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (f) {
                          setCompletionFile(f);
                          setCompletionPreview(URL.createObjectURL(f));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {resolving ? 'Submitting Resolution...' : 'Mark Issue as RESOLVED'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
