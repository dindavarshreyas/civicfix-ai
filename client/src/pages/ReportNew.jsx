import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reportFormSchema } from '../lib/validators';
import { useCreateReport } from '../hooks/useReports';
import { ImageUploader } from '../components/report/ImageUploader';
import { LocationPicker } from '../components/report/LocationPicker';
import { EmergencyAdvisoryBanner, PrivacyNoticeBanner } from '../components/report/EmergencyAdvisoryBanner';
import {
  Camera,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export function ReportNew() {
  const navigate = useNavigate();
  const createReport = useCreateReport();

  const [currentStep, setCurrentStep] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [coords, setCoords] = useState({ lat: 12.9716, lng: 77.5946 });
  const [addressText, setAddressText] = useState('');
  const [landmark, setLandmark] = useState('');
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      description: '',
      latitude: 12.9716,
      longitude: 77.5946,
      address_text: '',
      landmark: '',
      consent: false,
    },
  });

  const descriptionValue = watch('description') || '';

  const handleCoordsChange = (lat, lng) => {
    setCoords({ lat, lng });
    setValue('latitude', lat);
    setValue('longitude', lng);
  };

  const handleNext = async () => {
    setSubmitError(null);
    if (currentStep === 1) {
      if (!imageFile && (!descriptionValue || descriptionValue.trim().length === 0)) {
        setSubmitError('Please provide either photo evidence or a text description (or both) before proceeding.');
        return;
      }
      if (descriptionValue && descriptionValue.trim().length > 0 && descriptionValue.trim().length < 10) {
        setSubmitError('Description must be at least 10 characters long when provided.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setValue('address_text', addressText);
      setValue('landmark', landmark);
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setSubmitError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const onSubmit = async (values) => {
    setSubmitError(null);
    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (values.description) {
        formData.append('description', values.description);
      }
      formData.append('latitude', String(coords.lat));
      formData.append('longitude', String(coords.lng));
      if (addressText) {
        formData.append('address_text', addressText);
      }
      if (landmark) {
        formData.append('landmark', landmark);
      }
      formData.append('consent', 'true');

      const res = await createReport.mutateAsync(formData);
      if (res.reportId) {
        navigate(`/report/processing/${res.reportId}`);
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit report. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      {/* Wizard Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            Step {currentStep} of 3
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {currentStep === 1 ? 'Evidence & Description' : currentStep === 2 ? 'Location Pin' : 'Review & Submit'}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-teal-600 transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      <EmergencyAdvisoryBanner />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        {submitError && (
          <div className="p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* STEP 1: Evidence */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Evidence & Description</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Provide a photo, a written description, or both. Our Vision & Intake Agent will analyze and classify the problem.
                </p>
              </div>

              <ImageUploader file={imageFile} setFile={setImageFile} />

              <PrivacyNoticeBanner />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Issue Description
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {descriptionValue.length}/1000 chars
                  </span>
                </div>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Describe what you see: e.g. 'Large pothole on the main bus road, water is filling it up and vehicles are swerving dangerously...'"
                  maxLength={1000}
                  className="w-full p-3.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pin the Exact Location</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Accurate coordinates allow our Duplicate Agent to link related complaints and guide municipal trucks.
                </p>
              </div>

              <LocationPicker
                latitude={coords.lat}
                longitude={coords.lng}
                onChangeCoords={handleCoordsChange}
                addressText={addressText}
                onChangeAddress={setAddressText}
                landmark={landmark}
                onChangeLandmark={setLandmark}
              />
            </div>
          )}

          {/* STEP 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Review & File Grievance</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Review your information before initiating the autonomous AI coordination pipeline.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 block">DESCRIPTION</span>
                  <p className="text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                    {descriptionValue || 'No text provided (Image evidence attached)'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="font-semibold text-slate-500 block">COORDINATES</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">PHOTO ATTACHED</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {imageFile ? `Yes (${Math.round(imageFile.size / 1024)} KB)` : 'No photo'}
                    </span>
                  </div>
                </div>

                {(addressText || landmark) && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-slate-500 block">ADDRESS & LANDMARK</span>
                    <p className="text-slate-800 dark:text-slate-200">
                      {[addressText, landmark].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Consent Checkbox */}
              <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('consent')}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 mt-0.5"
                  />
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold block text-slate-900 dark:text-white">Citizen Affirmation & Consent</span>
                    I affirm that this report accurately describes a real civic condition at the designated location, and I grant consent for CivicMind's autonomous agents to process this evidence.
                  </div>
                </label>
                {errors.consent && <p className="text-xs text-red-600 mt-1 pl-7">{errors.consent.message}</p>}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : <div />}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm ml-auto"
              >
                Continue to {currentStep === 1 ? 'Location' : 'Review'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={createReport.isPending}
                className="inline-flex items-center gap-2 px-7 py-3 text-sm font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-md shadow-teal-600/30 ml-auto disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {createReport.isPending ? 'Initiating Agents...' : 'Submit & Start Autonomous Pipeline'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
