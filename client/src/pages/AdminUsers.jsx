import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { Users, Shield, UserCheck, ShieldAlert, Edit } from 'lucide-react';

export function AdminUsers() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('citizen');
  const [deptId, setDeptId] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users'),
  });

  const { data: deptData } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: () => api.get('/departments'),
  });

  const users = usersData?.users || [];
  const departments = deptData?.departments || [];

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role, department_id }) =>
      api.patch(`/admin/users/${userId}/role`, { role, department_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUser(null);
    },
    onError: (err) => setErrorMsg(err.message),
  });

  const openEditModal = (u) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setDeptId(u.department_id || (departments[0]?.id || ''));
    setErrorMsg(null);
  };

  const handleSaveRole = (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    updateRoleMutation.mutate({
      userId: selectedUser.id,
      role: newRole,
      department_id: newRole === 'officer' ? deptId : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-600" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">User & Role Management</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Assign municipal officer permissions and bind staff to specific department jurisdictions
        </p>
      </div>

      {usersLoading ? (
        <LoadingSpinner message="Fetching user directory..." />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Full Name</th>
                <th className="px-4 py-3.5">Current Role</th>
                <th className="px-4 py-3.5">Assigned Department</th>
                <th className="px-4 py-3.5">Joined Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                    {u.full_name}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : u.role === 'officer'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                    {u.departments ? `${u.departments.name} (${u.departments.code})` : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => openEditModal(u)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Role Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Update Role for {selectedUser.full_name}
            </h3>

            {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}

            <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  <option value="citizen">Citizen (General reporter)</option>
                  <option value="officer">Officer (Department field queue access)</option>
                  <option value="admin">Admin (Full system and analytics control)</option>
                </select>
              </div>

              {newRole === 'officer' && (
                <div>
                  <label className="block font-semibold mb-1">Assigned Department</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateRoleMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700"
                >
                  {updateRoleMutation.isPending ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
