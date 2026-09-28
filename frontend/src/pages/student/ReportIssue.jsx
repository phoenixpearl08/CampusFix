import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueAPI } from '../../services/api';
import CampusLocationSelector from '../../components/CampusLocationSelector';
import DuplicateModal from '../../components/DuplicateModal';
import PriorityBadge from '../../components/PriorityBadge';
import { 
  PlusCircle, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Image as ImageIcon, 
  X, 
  Zap, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

const CATEGORY_OPTIONS = [
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

export default function ReportIssue() {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    building: '',
    block: '',
    floor: '',
    room: '',
    mapCoordinates: ''
  });

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // AI & Duplicate State
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiPreviewData, setAiPreviewData] = useState(null);
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  // Submit State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLocationChange = (newLocation) => {
    setFormData((prev) => ({
      ...prev,
      ...newLocation
    }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File exceeds maximum size of 10MB.');
        return;
      }
      setSelectedPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  // Run AI Diagnostics Preview
  const handleRunAiPreview = async () => {
    if (!formData.title || !formData.description) {
      setErrorMessage('Please enter both issue title and description to run AI analysis.');
      return;
    }

    setAnalyzingAi(true);
    setErrorMessage('');

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('building', formData.building);
      data.append('block', formData.block);
      data.append('floor', formData.floor);
      data.append('room', formData.room);
      if (selectedPhoto) {
        data.append('photo', selectedPhoto);
      }

      const res = await issueAPI.analyzePreview(data);
      setAiPreviewData(res.data.aiAnalysis);

      if (res.data.duplicates && res.data.duplicates.length > 0) {
        setDuplicateMatches(res.data.duplicates);
        setIsDuplicateModalOpen(true);
      } else {
        setDuplicateMatches([]);
      }
    } catch (err) {
      console.error('AI preview failed:', err);
      setErrorMessage('Failed to complete AI diagnostic check. You may proceed to submit directly.');
    } finally {
      setAnalyzingAi(false);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e, forceCreate = false, duplicateOfId = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');

    if (!formData.title || !formData.description) {
      setErrorMessage('Please provide an issue title and description.');
      return;
    }

    if (!formData.building || !formData.block || !formData.floor) {
      setErrorMessage('Please select campus building, block, and floor level.');
      return;
    }

    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('building', formData.building);
      submitData.append('block', formData.block);
      submitData.append('floor', formData.floor);
      submitData.append('room', formData.room || '');
      submitData.append('mapCoordinates', formData.mapCoordinates || '');
      submitData.append('forceCreate', forceCreate ? 'true' : 'false');
      if (duplicateOfId) {
        submitData.append('duplicateOfId', duplicateOfId);
      }
      if (selectedPhoto) {
        submitData.append('photo', selectedPhoto);
      }

      const res = await issueAPI.createIssue(submitData);
      const created = res.data.issue;

      // Navigate to created issue page
      navigate(`/issues/${created.id}?created=true`);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        // Duplicate detected by server
        const dups = err.response.data.duplicates || [];
        setDuplicateMatches(dups);
        setAiPreviewData(err.response.data.aiAnalysis || null);
        setIsDuplicateModalOpen(true);
      } else {
        setErrorMessage(err.response?.data?.error || 'Failed to submit issue report. Please verify all fields.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkDuplicate = (targetIssueId) => {
    setIsDuplicateModalOpen(false);
    handleSubmit(null, false, targetIssueId);
  };

  const handleCreateAnyway = () => {
    setIsDuplicateModalOpen(false);
    handleSubmit(null, true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-pink-500/10 border border-pink-500/30 px-3 py-1 text-xs font-semibold text-pink-400 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>CampusFix Intelligent Intake</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Report Campus Maintenance Issue
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Describe the problem, upload an optional photo, and specify the campus location. Our AI engine will categorize, prioritize, and check for duplicates.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-6 space-y-5">
          {/* Issue Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
              Issue Title <span className="text-pink-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Water dripping from ceiling near electrical fuse panel"
              required
              className="w-full rounded-xl border border-zinc-700 bg-[#161622] px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-200 mb-1.5 flex items-center justify-between">
              <span>Detailed Description <span className="text-pink-500">*</span></span>
              <span className="text-[11px] text-zinc-400 font-normal">Include specifics: sounds, smell, danger</span>
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what is broken, when it started, and whether anyone could get hurt..."
              required
              className="w-full rounded-xl border border-zinc-700 bg-[#161622] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors"
            />
          </div>

          {/* Optional Category Override */}
          <div>
            <label className="block text-xs font-semibold text-zinc-200 mb-1.5 flex items-center justify-between">
              <span>Category (Optional — AI will auto-detect if left blank)</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-zinc-700 bg-[#161622] px-3.5 py-2.5 text-sm text-white focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors"
            >
              <option value="">Let AI Auto-Detect Category</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
              Upload Problem Photo (Optional)
            </label>

            {photoPreview ? (
              <div className="relative rounded-xl border border-pink-500/40 bg-zinc-900/60 p-3 max-w-sm">
                <img
                  src={photoPreview}
                  alt="Upload preview"
                  className="rounded-lg w-full h-48 object-cover border border-zinc-800"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-5 right-5 p-1.5 rounded-full bg-black/80 text-zinc-300 hover:text-white hover:bg-rose-600 transition-colors shadow-lg"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-zinc-400 mt-2 truncate">
                  Attached: {selectedPhoto?.name} ({(selectedPhoto?.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-zinc-700 hover:border-pink-500/50 bg-[#161622]/50 hover:bg-[#181826] cursor-pointer transition-all">
                <div className="p-3 rounded-full bg-pink-500/10 text-pink-400 mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-white">Click or drag image here to attach photo</span>
                <span className="text-[11px] text-zinc-500 mt-0.5">Supports PNG, JPEG, WebP up to 10MB</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Location Component */}
        <CampusLocationSelector
          value={{
            building: formData.building,
            block: formData.block,
            floor: formData.floor,
            room: formData.room,
            mapCoordinates: formData.mapCoordinates
          }}
          onChange={handleLocationChange}
        />

        {/* AI Diagnostics Trigger & Results Panel */}
        <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-b from-[#151522] to-[#101018] p-5 shadow-pink-glow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-bold text-white">CampusFix AI Pre-Submission Intelligence</h3>
            </div>
            <button
              type="button"
              onClick={handleRunAiPreview}
              disabled={analyzingAi || !formData.title || !formData.description}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 disabled:opacity-40 transition-colors"
            >
              {analyzingAi ? (
                <>
                  <span className="w-3 h-3 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></span>
                  Analyzing Report...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze with AI Preview
                </>
              )}
            </button>
          </div>

          {aiPreviewData ? (
            <div className="space-y-3 pt-3 border-t border-zinc-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-zinc-800 bg-black/40">
                  <span className="text-[11px] text-zinc-400 block mb-1">Detected Category</span>
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    {aiPreviewData.detectedCategory}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-zinc-800 bg-black/40">
                  <span className="text-[11px] text-zinc-400 block mb-1">Suggested Priority</span>
                  <PriorityBadge priority={aiPreviewData.suggestedPriority} size="md" />
                </div>
              </div>

              <div className="p-3 rounded-xl border border-pink-500/20 bg-pink-950/20 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 block mb-1">
                  AI Assessment & Reasoning:
                </span>
                <p className="text-zinc-200 leading-relaxed">
                  {aiPreviewData.reasoning}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Confidence: <strong className="text-pink-300">{(aiPreviewData.confidenceScore * 100).toFixed(0)}%</strong></span>
                  <span className="font-mono text-[10px] text-zinc-500">{aiPreviewData.provider}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400">
              Fill in the title and description, then click "Analyze with AI Preview" to view the predicted category, priority, and duplicate risks before final submission.
            </p>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-pink-glow hover:shadow-pink-glow-lg disabled:opacity-50 transition-all scale-100 hover:scale-105"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Logging Issue...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Submit Campus Issue Report
              </>
            )}
          </button>
        </div>
      </form>

      {/* Duplicate Detection Modal */}
      <DuplicateModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        duplicates={duplicateMatches}
        onCreateAnyway={handleCreateAnyway}
        onLinkDuplicate={handleLinkDuplicate}
      />
    </div>
  );
}
