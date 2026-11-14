import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { overrideFormSchema } from '../../lib/validators';
import { AlertTriangle, X, Check } from 'lucide-react';

export function OverrideModal({ isOpen, onClose, onOverride, currentIssue, departments = [] }) {
  const [selectedField, setSelectedField] = useState('priority');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(overrideFormSchema),
    defaultValues: {
      field: 'priority',
      newValue: 'critical',
      reason: '',
    },
  });

  if (!isOpen) return null;

  const handleFieldChange = (e) => {
    const f = e.target.value;
    setSelectedField(f);
    setValue('field', f);
    if (f === 'priority') setValue('newValue', 'critical');
    if (f === 'category') setValue('newValue', 'road_damage');
    if (f === 'department' && departments.length > 0) setValue('newValue', departments[0].id);
  };

  const onSubmit = async (values) => {
    await onOverride(values);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Override AI Decision</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            All overrides are permanently audited with your officer credentials in the official municipal record. Overriding will trigger downstream recalculations (such as SLA window and department queueing).
          </p>

          {/* Select field to override */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Field to Override
            </label>
            <select
              value={selectedField}
              onChange={handleFieldChange}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            >
              <option value="priority">Priority Level</option>
              <option value="category">Category</option>
              <option value="department">Assigned Department</option>
            </select>
          </div>

          {/* New Value based on field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Designated Value
            </label>

            {selectedField === 'priority' && (
              <select
                {...register('newValue')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="critical">Critical (24h SLA)</option>
                <option value="high">High (72h SLA)</option>
                <option value="medium">Medium (7 days SLA)</option>
                <option value="low">Low (14 days SLA)</option>
              </select>
            )}

            {selectedField === 'category' && (
              <select
                {...register('newValue')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="garbage">Garbage & Solid Waste</option>
                <option value="road_damage">Road Damage & Potholes</option>
                <option value="streetlight">Electrical & Street Lighting</option>
                <option value="water_leakage">Water Supply & Leakage</option>
                <option value="drainage">Drainage & Storm Water</option>
                <option value="other">General Grievance Cell</option>
              </select>
            )}

            {selectedField === 'department' && (
              <select
                {...register('newValue')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            )}
            {errors.newValue && <p className="text-xs text-red-600 mt-1">{errors.newValue.message}</p>}
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mandatory Justification Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('reason')}
              rows={3}
              placeholder="State the on-the-ground facts or inspection notes justifying this override (minimum 10 characters)..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            {errors.reason && <p className="text-xs text-red-600 mt-1">{errors.reason.message}</p>}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
              {isSubmitting ? 'Recording Override...' : 'Apply & Audit Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
