import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Layers, Plus, Phone, Mail, User, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Electrical',
    leadName: '',
    contactEmail: '',
    phone: ''
  });
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getTeams();
      setTeams(res.data.teams || []);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setCreating(true);

    try {
      await adminAPI.createTeam(formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        category: 'Electrical',
        leadName: '',
        contactEmail: '',
        phone: ''
      });
      fetchTeams();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to create team.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Maintenance Squads Directory
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Configure campus response squads, assign division leads, and monitor active maintenance tasks.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-pink-glow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Response Squad
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-400 mt-2">Loading teams...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-12 text-center text-zinc-400 text-xs">
          No maintenance squads registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-2xl border border-zinc-800 bg-[#121219] p-5 space-y-4 hover:border-pink-500/40 transition-all shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 bg-pink-950/40 px-2.5 py-1 rounded border border-pink-500/20">
                  {team.category}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{team.name}</h3>
                <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  Lead: <strong className="text-zinc-200">{team.lead_name}</strong>
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-zinc-800 text-xs text-zinc-400">
                {team.contact_email && (
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    <span>{team.contact_email}</span>
                  </p>
                )}
                {team.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    <span>{team.phone}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                <span className="text-zinc-500">
                  Technicians: <strong className="text-zinc-300">{team.member_count || 1}</strong>
                </span>
                <span className="font-semibold text-pink-400">
                  Active Tasks: {team.active_tasks || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-pink-500/30 bg-[#121219] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New Maintenance Squad</h3>

            {errorMsg && (
              <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/20 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Squad Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Electrical Safety Unit"
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-[#161622] p-2.5 text-xs text-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Facility Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-zinc-700 bg-[#161622] p-2.5 text-xs text-white focus:border-pink-500 focus:outline-none"
                >
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="HVAC & Ventilation">HVAC & Ventilation</option>
                  <option value="Furniture & Carpentry">Furniture & Carpentry</option>
                  <option value="Sanitation & Hygiene">Sanitation & Hygiene</option>
                  <option value="IT & Wi-Fi Network">IT & Wi-Fi Network</option>
                  <option value="Structural & Civil">Structural & Civil</option>
                  <option value="Safety & Security">Safety & Security</option>
                  <option value="Grounds & Waste">Grounds & Waste</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Squad Lead Name</label>
                <input
                  type="text"
                  value={formData.leadName}
                  onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
                  placeholder="e.g. Marcus Vance"
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-[#161622] p-2.5 text-xs text-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="squad@campusfix.edu"
                  className="w-full rounded-xl border border-zinc-700 bg-[#161622] p-2.5 text-xs text-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Dispatch Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 555-0210"
                  className="w-full rounded-xl border border-zinc-700 bg-[#161622] p-2.5 text-xs text-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 rounded-xl shadow-pink-glow-sm"
                >
                  {creating ? 'Saving...' : 'Register Squad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
