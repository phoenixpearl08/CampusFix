import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI, issueAPI, getFullImageUrl } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import TimelineView from '../../components/TimelineView';
import { 
  ArrowLeft, 
  MapPin, 
  Sparkles, 
  Layers, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Edit3, 
  GitMerge, 
  User, 
  Phone, 
  Mail,
  Send,
  Save,
  Check
} from 'lucide-react';

const CATEGORY_CHOICES = [
  'Electrical',
  'Plumbing',
  'HVAC & Ventilation',
  'Furniture & Carpentry',
  'Sanitation & Hygiene',
  'IT & Wi-Fi Network',
  'Structural & Civil',
  'Safety & Security',
  'Grounds & Waste'
];

const PRIORITY_CHOICES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUS_CHOICES = ['REPORTED', 'UNDER REVIEW', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED'];

export default function AdminIssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review & Override State
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  // Assign Team State
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [assigningTeam, setAssigningTeam] = useState(false);

  // Status Change State
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Duplicate Resolution State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [targetMergeId, setTargetMergeId] = useState('');
  const [mergeReason, setMergeReason] = useState('');

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  const fetchFullData = async () => {
    try {
      setLoading(true);
      const [issueRes, teamsRes] = await Promise.all([
        issueAPI.getIssueById(id),
        adminAPI.getTeams()
      ]);
      const iss = issueRes.data.issue;
      setIssue(iss);
      setEditCategory(iss.final_category);
      setEditPriority(iss.final_priority);
      setSelectedStatus(iss.status);
      setSelectedTeamId(iss.assigned_team_id || '');
      setTeams(teamsRes.data.teams || []);
    } catch (err) {
      console.error('Failed to load issue detail:', err);
      setError(err.response?.data?.error || 'Issue not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullData();
  }, [id]);

  // Review AI Parameters
  const handleSaveReview = async (e) => {
    e.preventDefault();
    setSavingReview(true);
    try {
      const res = await adminAPI.reviewIssueAI(id, {
        finalCategory: editCategory,
        finalPriority: editPriority,
        adminNotes
      });
      setIssue(res.data.issue);
      setAdminNotes('');
      alert('Review parameters successfully updated.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update review.');
    } finally {
      setSavingReview(false);
    }
  };

  // Assign Team
  const handleAssignTeam = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) {
      alert('Please select a maintenance team.');
      return;
    }
    setAssigningTeam(true);
    try {
      const res = await adminAPI.assignTeam(id, {
        teamId: selectedTeamId,
        instructions: assignInstructions
      });
      setIssue(res.data.issue);
      setSelectedStatus('ASSIGNED');
      alert('Maintenance team successfully assigned.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign team.');
    } finally {
      setAssigningTeam(false);
    }
  };

  // Update Status Manually
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdatingStatus(true);
    try {
      const res = await adminAPI.updateStatus(id, {
        status: selectedStatus,
        notes: statusNotes
      });
      setIssue(res.data.issue);
      setStatusNotes('');
      alert(`Issue status changed to ${selectedStatus}.`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Duplicate Resolution (Merge or Keep Independent)
  const handleResolveDuplicate = async (action) => {
    try {
      const res = await adminAPI.resolveDuplicate(id, {
        action,
        targetIssueId: targetMergeId,
        reason: mergeReason
      });
      alert(res.data.message);
      setShowDuplicateModal(false);
      fetchFullData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve duplicate state.');
    }
  };

  // Post Comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setPostingComment(true);
    try {
      const res = await issueAPI.addComment(id, {
        comment: commentText.trim(),
        isInternal: isInternalComment
      });
      setIssue((prev) => ({
        ...prev,
        comments: res.data.comments
      }));
      setCommentText('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add comment.');
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400 mt-2">Loading ticket control plane...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-300 text-sm">
          {error || 'Issue record missing.'}
        </div>
        <button
          onClick={() => navigate('/admin/issues')}
          className="inline-flex items-center gap-2 text-xs text-pink-400 hover:text-pink-300 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Issues
        </button>
      </div>
    );
  }

  const reportImages = (issue.images || []).filter(img => img.image_type === 'REPORT');
  const completionImages = (issue.images || []).filter(img => img.image_type === 'COMPLETION');

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/admin/issues')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Issues
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-pink-400 bg-pink-950/50 px-3 py-1 rounded-lg border border-pink-500/30">
            {issue.issue_code}
          </span>
          <StatusBadge status={issue.status} size="lg" />
          <PriorityBadge priority={issue.final_priority} size="lg" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details, Photos, Admin Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Overview Card */}
          <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 space-y-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-pink-400">
                {issue.final_category} Report
              </span>
              <h1 className="text-xl font-black text-white mt-1">{issue.title}</h1>
            </div>

            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-[#161622]/80 p-4 rounded-xl border border-zinc-800/80">
              {issue.description}
            </div>

            {/* Reporter details */}
            <div className="rounded-xl border border-zinc-800 bg-[#161622]/40 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-zinc-500 block">Reporter</span>
                <strong className="text-white">{issue.reporter_name}</strong> ({issue.reporter_department || 'Student'})
              </div>
              <div>
                <span className="text-zinc-500 block">Email</span>
                <a href={`mailto:${issue.reporter_email}`} className="text-pink-400 hover:underline">{issue.reporter_email}</a>
              </div>
              {issue.reporter_phone && (
                <div>
                  <span className="text-zinc-500 block">Phone</span>
                  <a href={`tel:${issue.reporter_phone}`} className="text-zinc-300">{issue.reporter_phone}</a>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#161622]/40 text-xs">
              <span className="text-zinc-500 block mb-1">Campus Location</span>
              <p className="font-bold text-white text-sm">
                📍 {issue.building} — Block {issue.block}, {issue.floor} {issue.room ? `• ${issue.room}` : ''}
              </p>
              {issue.map_coordinates && (
                <p className="text-[11px] font-mono text-zinc-500 mt-1">Grid Coordinates: {issue.map_coordinates}</p>
              )}
            </div>

            {/* Photos */}
            {reportImages.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Reporter Photo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reportImages.map((img) => (
                    <div key={img.id} className="rounded-xl border border-zinc-800 overflow-hidden bg-black/40">
                      <img
                        src={getFullImageUrl(img.image_url)}
                        alt="Initial defect"
                        className="w-full h-44 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completionImages.length > 0 && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  ✓ Maintenance Fix Proof Photo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {completionImages.map((img) => (
                    <div key={img.id} className="rounded-xl border border-emerald-500/30 overflow-hidden bg-black/60">
                      <img
                        src={getFullImageUrl(img.image_url)}
                        alt="Completion proof"
                        className="w-full h-44 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Intelligence & Review Card */}
          <div className="rounded-2xl border border-pink-500/30 bg-[#121219] p-6 space-y-5 shadow-pink-glow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                <h3 className="text-sm font-bold text-white">AI Diagnostics & Administrator Evaluation</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Editable by Admin</span>
            </div>

            {issue.aiAnalysis && (
              <div className="p-3.5 rounded-xl border border-pink-500/20 bg-pink-950/20 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-pink-300 font-bold uppercase tracking-wider">AI Assessment Reasoning:</span>
                  <span className="text-zinc-400 text-[11px]">Confidence: {(issue.aiAnalysis.confidence_score * 100).toFixed(0)}%</span>
                </div>
                <p className="text-zinc-200 leading-relaxed">{issue.aiAnalysis.reasoning}</p>
                <div className="text-[11px] text-zinc-400 pt-1 border-t border-pink-500/10 flex gap-4">
                  <span>AI Category: <strong className="text-zinc-200">{issue.ai_category}</strong></span>
                  <span>AI Priority: <strong className="text-zinc-200">{issue.ai_priority}</strong></span>
                </div>
              </div>
            )}

            {/* Override Controls */}
            <form onSubmit={handleSaveReview} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Verified Final Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-[#161622] px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                  >
                    {CATEGORY_CHOICES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Verified Final Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-[#161622] px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                  >
                    {PRIORITY_CHOICES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Administrator Review Notes
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Verified severity with campus security dispatch."
                  className="w-full rounded-xl border border-zinc-700 bg-[#161622] px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingReview}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-pink-glow-sm disabled:opacity-50 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingReview ? 'Saving...' : 'Confirm Parameters'}
                </button>
              </div>
            </form>
          </div>

          {/* Assign Maintenance Team Card */}
          <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
              <Layers className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-bold text-white">Assign Maintenance Team</h3>
            </div>

            <form onSubmit={handleAssignTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Select Active Response Squad <span className="text-pink-500">*</span>
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-[#161622] px-3.5 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                >
                  <option value="" disabled>Choose field maintenance squad</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category}) — Lead: {t.lead_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Special Dispatch Instructions
                </label>
                <input
                  type="text"
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                  placeholder="e.g. Bring pipe replacement seal and caution cones."
                  className="w-full rounded-xl border border-zinc-700 bg-[#161622] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={assigningTeam}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-pink-glow-sm disabled:opacity-50 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  {assigningTeam ? 'Assigning...' : 'Dispatch Maintenance Team'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Status Card */}
          <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-zinc-800">
              <Clock className="w-4 h-4 text-pink-400" />
              Manual Status Transition Control
            </h3>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Transition Status To
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-[#161622] px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                  >
                    {STATUS_CHOICES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Transition Audit Note
                  </label>
                  <input
                    type="text"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Audit reason for status override"
                    className="w-full rounded-xl border border-zinc-700 bg-[#161622] px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                >
                  {updatingStatus ? 'Updating...' : 'Apply Status Change'}
                </button>
              </div>
            </form>
          </div>

          {/* Comments & Updates Section */}
          <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Issue Activity & Messages</h3>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {(issue.comments || []).length === 0 ? (
                <p className="text-xs text-zinc-500 py-3 text-center">No comments logged.</p>
              ) : (
                issue.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border text-xs ${
                      c.is_internal
                        ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{c.user_name} ({c.user_role}) {c.is_internal ? '• [INTERNAL ONLY]' : ''}</span>
                      <time className="text-[10px] text-zinc-500">{new Date(c.created_at).toLocaleTimeString()}</time>
                    </div>
                    <p>{c.comment}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostComment} className="space-y-2 pt-2 border-t border-zinc-800">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Post admin update or question..."
                className="w-full rounded-xl border border-zinc-700 bg-[#161622] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="rounded border-zinc-700 text-pink-600 focus:ring-pink-500"
                  />
                  <span>Internal note (hidden from student)</span>
                </label>
                <button
                  type="submit"
                  disabled={postingComment || !commentText.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 shadow-xl sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <div>
                <h3 className="text-sm font-bold text-white">Database Lifecycle Audit</h3>
                <p className="text-[11px] text-zinc-400">Strict chronological events</p>
              </div>
              <Clock className="w-4 h-4 text-pink-400" />
            </div>

            <TimelineView timeline={issue.timeline} currentStatus={issue.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
