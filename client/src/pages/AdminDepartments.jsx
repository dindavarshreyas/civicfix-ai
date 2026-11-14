import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { Building2, Plus, Check, X, Trash2, Edit2 } from 'lucide-react';

export function AdminDepartments() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['other']);
  const [formError, setFormError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: () => api.get('/departments'),
  });

  const departments = data?.departments || [];

  const createDeptMutation = useMutation({
    mutationFn: (newDept) => api.post('/admin/departments', newDept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err) => setFormError(err.message),
  });

  const deactivateDeptMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/departments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-departments'] }),
  });

  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setContactEmail('');
    setSelectedCategories(['other']);
    setFormError(null);
  };

  const handleCategoryToggle = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code || !name || !description || selectedCategories.length === 0) {
      setFormError('Please fill in code, name, description, and at least one handled category.');
      return;
    }

    createDeptMutation.mutate({
      code: code.toUpperCase(),
      name,
      description,
      handles_categories: selectedCategories,
      contact_email: contactEmail || null,
      sla_hours: { critical: 24, high: 72, medium: 168, low: 336 },
      is_active: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Department Registry</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic municipal department configuration. The AI Routing Agent dynamically queries this table.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading registered municipal departments..." />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Code</th>
                <th className="px-4 py-3.5">Department Name</th>
                <th className="px-4 py-3.5">Categories Handled</th>
                <th className="px-4 py-3.5">Contact Email</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="px-4 py-3.5 font-mono font-bold text-teal-700 dark:text-teal-400">
                    {dept.code}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-900 dark:text-white block">{dept.name}</span>
                    <span className="text-[11px] text-slate-400 block line-clamp-1">{dept.description}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {(dept.handles_categories || []).map((cat) => (
                        <span key={cat} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">{dept.contact_email || '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <Check className="w-3.5 h-3.5" /> Active
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => deactivateDeptMutation.mutate(dept.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Deactivate Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Department Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Register New Department</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <p className="text-xs text-red-600">{formError}</p>}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Department Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. PKG"
                    maxLength={10}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="dept@city.example"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Department Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Parks & Horticultural Gardens"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description & Scope</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describes jurisdiction and operational responsibilities..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5">Handled Categories</label>
                <div className="flex flex-wrap gap-2">
                  {['garbage', 'road_damage', 'streetlight', 'water_leakage', 'drainage', 'other'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryToggle(cat)}
                      className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                        selectedCategories.includes(cat)
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDeptMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700"
                >
                  {createDeptMutation.isPending ? 'Saving...' : 'Register Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
