import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { issueAPI, getFullImageUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import TimelineView from '../../components/TimelineView';
import { 
  ArrowLeft, 
  MapPin, 
  Layers, 
  Calendar, 
  User, 
  Sparkles, 
  CheckCircle, 
  MessageSquare, 
  Send, 
  AlertOctagon,
  Image as ImageIcon,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAuth();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Close / Confirm Resolution state
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [closureNotes, setClosureNotes] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      const res = await issueAPI.getIssueById(id);
      setIssue(res.data.issue);
    } catch (err) {
      console.error('Failed to load issue:', err);
      setError(err.response?.data?.error || 'Unable to retrieve issue details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [id]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setPostingComment(true);
    try {
      const res = await issueAPI.addComment(id, { comment: commentText.trim() });
      setIssue((prev) => ({
        ...prev,
        comments: res.data.comments
      }));
      setCommentText('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post comment.');
    } finally {
      setPostingComment(false);
    }
  };

  const handleConfirmResolution = async () => {
    setConfirmingClose(true);
    try {
      const res = await issueAPI.confirmResolution(id, { feedbackNotes: closureNotes.trim() });
      setIssue(res.data.issue);
      setShowCloseModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm resolution.');
    } finally {
      setConfirmingClose(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400 mt-2">Loading ticket history...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-300 text-sm">
          {error || 'Issue not found.'}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs text-pink-400 hover:text-pink-300 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const reportImages = (issue.images || []).filter(img => img.image_type === 'REPORT');
  const completionImages = (issue.images || []).filter(img => img.image_type === 'COMPLETION');

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Back and Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-pink-400 bg-pink-950/50 px-3 py-1 rounded-lg border border-pink-500/30">
            {issue.issue_code}
          </span>
          <StatusBadge status={issue.status} size="lg" />
          <PriorityBadge priority={issue.final_priority} size="lg" />
        </div>
      </div>

      {/* Verified Resolution Confirmation Alert */}
      {issue.status === 'RESOLVED' && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">Work Marked Resolved by Maintenance</h3>
              <p className="text-xs text-zinc-300 mt-0.5">
                The facility technician reported completion of this job. Please inspect and confirm to close the ticket.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCloseModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all shrink-0"
          >
            <CheckCircle className="w-4 h-4" />
            Confirm Fix & Close Issue
          </button>
        </div>
      )}

      {/* Main Grid: Left Details & Right Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Images */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 space-y-5">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-pink-400">
                {issue.final_category} Maintenance Complaint
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                {issue.title}
              </h1>
            </div>

            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-[#161622]/80 p-4 rounded-xl border border-zinc-800/80">
              {issue.description}
            </div>

            {/* Location Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl border border-zinc-800 bg-[#161622]/40">
                <span className="text-[11px] text-zinc-500 flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-pink-400" />
                  Campus Location
                </span>
                <p className="text-xs font-semibold text-white">
                  {issue.building}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Block {issue.block} • {issue.floor} {issue.room ? `• ${issue.room}` : ''}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-zinc-800 bg-[#161622]/40">
                <span className="text-[11px] text-zinc-500 flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-pink-400" />
                  Assigned Team
                </span>
                <p className="text-xs font-semibold text-white">
                  {issue.assigned_team_name || 'Pending assignment by administrator'}
                </p>
                {issue.assigned_team_lead && (
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Lead: {issue.assigned_team_lead} ({issue.assigned_team_phone || 'Staff'})
                  </p>
                )}
              </div>
            </div>

            {/* Photos */}
            {reportImages.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                  Initial Problem Photo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reportImages.map((img) => (
                    <div key={img.id} className="rounded-xl border border-zinc-800 overflow-hidden bg-black/40">
                      <img
                        src={getFullImageUrl(img.image_url)}
                        alt="Reported problem"
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {img.caption && (
                        <p className="text-[11px] text-zinc-400 p-2 border-t border-zinc-800/60 truncate">
                          {img.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion Photo if resolved */}
            {completionImages.length > 0 && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Maintenance Completion Proof Photo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {completionImages.map((img) => (
                    <div key={img.id} className="rounded-xl border border-emerald-500/30 overflow-hidden bg-black/60">
                      <img
                        src={getFullImageUrl(img.image_url)}
                        alt="Completion proof"
                        className="w-full h-48 object-cover"
                      />
                      {issue.resolution_notes && (
                        <p className="text-xs text-emerald-200 p-2 border-t border-emerald-500/20">
                          {issue.resolution_notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Intelligence Card */}
          {issue.aiAnalysis && (
            <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-[#161622] via-[#121219] to-[#0d0d14] p-5 shadow-pink-glow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-bold text-white">CampusFix AI Neural Diagnostics</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-xs">
                <div className="p-2.5 rounded-lg border border-zinc-800 bg-black/40">
                  <span className="text-zinc-500 block text-[10px]">Detected Category</span>
                  <span className="font-bold text-white">{issue.aiAnalysis.detected_category}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-zinc-800 bg-black/40">
                  <span className="text-zinc-500 block text-[10px]">Suggested Priority</span>
                  <PriorityBadge priority={issue.aiAnalysis.suggested_priority} size="sm" />
                </div>
                <div className="p-2.5 rounded-lg border border-zinc-800 bg-black/40">
                  <span className="text-zinc-500 block text-[10px]">Model Confidence</span>
                  <span className="font-bold text-pink-400">{(issue.aiAnalysis.confidence_score * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-pink-500/20 bg-pink-950/20 text-xs text-zinc-300 leading-relaxed">
                <strong className="text-pink-300 block mb-1">Safety & Risk Analysis Reasoning:</strong>
                {issue.aiAnalysis.reasoning}
              </div>
            </div>
          )}

          {/* Comments & Updates Section */}
          <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-pink-400" />
              Ticket Activity & Communication
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {(issue.comments || []).length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">No messages yet. Send a note below to contact staff.</p>
              ) : (
                issue.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      c.user_role === 'ADMIN'
                        ? 'border-purple-500/30 bg-purple-950/20'
                        : c.user_role === 'MAINTENANCE'
                          ? 'border-amber-500/30 bg-amber-950/20'
                          : 'border-zinc-800 bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{c.user_name}</span>
                        <span className="text-[10px] uppercase font-semibold text-zinc-400 bg-black/40 px-1.5 py-0.5 rounded">
                          {c.user_role}
                        </span>
                      </div>
                      <time className="text-[10px] text-zinc-500">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <p className="text-zinc-200">{c.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSendComment} className="flex gap-2 pt-2 border-t border-zinc-800">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Post a query or update regarding this complaint..."
                className="flex-1 rounded-xl border border-zinc-700 bg-[#161622] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors"
              />
              <button
                type="submit"
                disabled={postingComment || !commentText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Post
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Operational Milestones Timeline */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 shadow-xl sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <div>
                <h3 className="text-sm font-bold text-white">Verified Lifecycle Timeline</h3>
                <p className="text-[11px] text-zinc-400">Strict chronological audit records</p>
              </div>
              <Clock className="w-4 h-4 text-pink-400" />
            </div>

            <TimelineView timeline={issue.timeline} currentStatus={issue.status} />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-[#121219] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Resolution & Close</h3>
                <p className="text-xs text-zinc-400">
                  Verify that the repairs in {issue.building} are satisfactory.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Feedback Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={closureNotes}
                onChange={(e) => setClosureNotes(e.target.value)}
                placeholder="e.g. Verified this morning, water leak is completely resolved and dry."
                className="w-full rounded-xl border border-zinc-700 bg-[#161622] p-3 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolution}
                disabled={confirmingClose}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              >
                {confirmingClose ? 'Closing Issue...' : 'Confirm Fix & Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
