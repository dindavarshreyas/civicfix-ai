import multer from 'multer';

// Memory storage for immediate processing with Sharp
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      err.code = 'INVALID_MIME_TYPE';
      cb(err, false);
    }
  },
});

export const reportImageUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'Image size exceeds the maximum allowed limit of 5 MB.',
          },
        });
      }
      return res.status(400).json({
        error: {
          code: 'UPLOAD_ERROR',
          message: err.message,
        },
      });
    }
    next();
  });
};
