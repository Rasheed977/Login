const multer = require('multer');
const path = require('path');
// 1. Configure where and how files are saved
const storage = multer.diskStorage({
 destination: path.join(__dirname, '..', 'public', 'uploads'),
 filename: (req, file, cb) => {
 // Give the file a unique name using the current timestamp + its original extension
 const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
 cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
 }
});
// 2. Allow common raster image formats; SVG is intentionally excluded.
const fileFilter = (req, file, cb) => {
 const allowedTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
 };
 const extension = path.extname(file.originalname).toLowerCase();
 if (allowedTypes[extension] === file.mimetype) {
 return cb(null, true);
 } else {
 cb(new Error('Security Error: Only JPG, JPEG, PNG, GIF, and WebP images are allowed!'));
 }
};

// 3. Initialize multer configuration with a 10MB file size cap restriction
const upload = multer({
 storage: storage,
 limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
 fileFilter: fileFilter
});
module.exports = upload;