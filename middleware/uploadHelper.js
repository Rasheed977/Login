const multer = require('multer');
const path = require('path');
// 1. Configure where and how files are saved
const storage = multer.diskStorage({
 destination: (req, file, cb) => {
 // Save files inside a folder named 'uploads' within our public assets
 cb(null, 'public/uploads/');
 },
 filename: (req, file, cb) => {
 // Give the file a unique name using the current timestamp + its original extension
 const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
 cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
 }
});
// 2. Set up strict security filters (Only allow JPG, JPEG, and PNG images)
const fileFilter = (req, file, cb) => {
 const allowedTypes = /jpeg|jpg|png/;
 const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
 const mimetype = allowedTypes.test(file.mimetype);
 if (extname && mimetype) {
 return cb(null, true);
 } else {
 cb(new Error('Security Error: Only image files (JPG, JPEG, PNG) are allowed!'));
 }
};

// 3. Initialize multer configuration with a 2MB file size cap restriction
const upload = multer({
 storage: storage,
 limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max weight limit
 fileFilter: fileFilter
});
module.exports = upload;