import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Users, Search, Shield, GraduationCap, Wrench, Calendar, Building, Phone } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await adminAPI.getUsers(params);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      alert(`User role successfully updated to ${newRole}.`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user role.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">User Directory & Roles</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Administer campus community accounts, assign field maintenance privileges, and configure roles.
          </p>
        </div>
        <div className="text-xs font-mono text-pink-400 bg-pink-950/40 border border-pink-500/30 px-3 py-1.5 rounded-lg">
          Total Users: {users.length}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search by name, email, department..."
            className="w-full rounded-xl border border-zinc-700 bg-[#161622] pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-zinc-700 bg-[#161622] px-3.5 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
        >
          <option value="">All Account Roles</option>
          <option value="STUDENT">Student / Staff</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="ADMIN">Administrator</option>
        </select>

        <button
          onClick={fetchUsers}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          Filter
        </button>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-400 mt-2">Loading user accounts...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] p-12 text-center text-zinc-400 text-xs">
          No users match the specified criteria.
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-[#121219] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#161622] text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5 text-center">Reports</th>
                  <th className="px-5 py-3.5">Role Authorization</th>
                  <th className="px-5 py-3.5">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center font-bold text-pink-400 text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{u.name}</p>
                          <p className="text-[11px] text-zinc-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-zinc-300">
                      {u.department || 'General Campus'}
                    </td>

                    <td className="px-5 py-3.5 text-zinc-400 font-mono text-[11px]">
                      {u.phone || '—'}
                    </td>

                    <td className="px-5 py-3.5 text-center font-bold text-white">
                      {u.reported_count || 0}
                    </td>

                    <td className="px-5 py-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                            : u.role === 'MAINTENANCE'
                              ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                              : 'bg-zinc-800/80 border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <option value="STUDENT">STUDENT / STAFF</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    <td className="px-5 py-3.5 text-zinc-500 text-[11px]">
                      {new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
