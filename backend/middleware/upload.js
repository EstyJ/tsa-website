/*
  ============================================================
  THE SNOOGUMS ACADEMY - FILE UPLOAD MIDDLEWARE
  File: middleware/upload.js

  Multer is a Node.js middleware for handling multipart/form-data
  (the encoding type used for file uploads).

  It intercepts the file in the request, validates it,
  and saves it to disk — then puts file info in req.file.
  ============================================================
*/
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

/*
  diskStorage defines WHERE and HOW to store uploaded files.
  We use diskStorage (saving to disk) rather than memoryStorage
  (keeping in RAM) because CVs could be up to 5MB — too large for RAM.
*/
const cvStorage = multer.diskStorage({

  destination: (req, file, callback) => {
    /*
      callback(error, destinationPath)
      We save CVs in the uploads/cvs/ folder.
      fs.mkdirSync with recursive: true creates the folder if it doesn't exist.
    */
    const dir = path.join(__dirname, '../uploads/cvs');
    fs.mkdirSync(dir, { recursive: true });
    callback(null, dir);
  },

  filename: (req, file, callback) => {
    /*
      Generate a unique filename to prevent overwriting existing files.
      Format: cv-TIMESTAMP-RANDOM.extension
      e.g. cv-1702000000000-847392847.pdf
    */
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `cv-${uniqueSuffix}${extension}`);
  }
});

/*
  fileFilter validates the uploaded file type.
  We only accept PDF, DOC, and DOCX.
  callback(null, true)  → accept the file
  callback(null, false) → reject the file (silently)
  callback(error)       → reject and send an error
*/
const cvFileFilter = (req, file, callback) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

/*
  Create the multer upload instance with our storage, filter, and size limit.
  limits.fileSize is in bytes: 5 * 1024 * 1024 = 5MB
*/
const uploadCVMulter = multer({
  storage:    cvStorage,
  fileFilter: cvFileFilter,
  limits:     { fileSize: 5 * 1024 * 1024 }
});

/*
  Export a middleware that handles a SINGLE file in the field named "cv".
  This matches name="cv" in our careers form HTML.
  
  We wrap it in a custom function to handle multer errors gracefully
  (multer throws errors differently from regular Express errors).
*/
exports.uploadCV = (req, res, next) => {
  uploadCVMulter.single('cv')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${error.message}`
      });
    }
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next();
  });
};


/* Content upload (videos, slides, documents) for teachers */
const contentStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    const dir = path.join(__dirname, '../uploads/content');
    fs.mkdirSync(dir, { recursive: true });
    callback(null, dir);
  },
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `content-${uniqueSuffix}${extension}`);
  }
});

const contentFileFilter = (req, file, callback) => {
  const allowedMimes = [
    'video/mp4', 'video/quicktime', 'video/x-msvideo',
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Only video, PDF, PPT, and Word files are allowed'), false);
  }
};

const uploadContentMulter = multer({
  storage: contentStorage,
  fileFilter: contentFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

exports.uploadContent = (req, res, next) => {
  uploadContentMulter.single('content')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Maximum size is 100MB.' });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${error.message}` });
    }
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next();
  });
};
