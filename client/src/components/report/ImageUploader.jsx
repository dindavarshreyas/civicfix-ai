import React, { useRef, useState } from 'react';
import { UploadCloud, Camera, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

export function ImageUploader({ file, setFile }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isStripping, setIsStripping] = useState(false);
  const inputRef = useRef(null);

  /**
   * Strips EXIF metadata via HTML5 Canvas re-encode
   */
  const processAndStripExif = (rawFile) => {
    return new Promise((resolve, reject) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(rawFile.type)) {
        return reject(new Error('Please upload an image in JPEG, PNG, or WebP format.'));
      }
      if (rawFile.size > 5 * 1024 * 1024) {
        return reject(new Error('Image size must be 5 MB or less.'));
      }

      setIsStripping(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Export as clean WebP (metadata stripped)
          canvas.toBlob(
            (blob) => {
              setIsStripping(false);
              if (!blob) return reject(new Error('Failed to process image'));
              const sanitizedFile = new File([blob], rawFile.name.replace(/\.[^/.]+$/, '') + '.webp', {
                type: 'image/webp',
              });
              resolve(sanitizedFile);
            },
            'image/webp',
            0.88
          );
        };
        img.onerror = () => {
          setIsStripping(false);
          reject(new Error('Unable to read image file'));
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        setIsStripping(false);
        reject(new Error('File reading failed'));
      };
      reader.readAsDataURL(rawFile);
    });
  };

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);
    try {
      const sanitized = await processAndStripExif(selected);
      setFile(sanitized);
      const url = URL.createObjectURL(sanitized);
      setPreviewUrl(url);
    } catch (err) {
      setError(err.message);
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const handleRemove = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
        Photo Evidence <span className="text-xs font-normal text-slate-500">(Optional if description provided)</span>
      </label>

      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 group aspect-video max-h-72 flex items-center justify-center">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors shadow-md"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>EXIF & GPS Sanitized ({Math.round(file?.size / 1024)} KB)</span>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-white/40 dark:bg-slate-900/40"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
            <Camera className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Take a photo or upload an image
          </p>
          <p className="text-xs text-slate-500 mt-1">JPEG, PNG, WebP up to 5 MB</p>
          {isStripping && <p className="text-xs text-teal-600 mt-2 font-medium animate-pulse">Stripping metadata...</p>}
        </div>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
    </div>
  );
}
