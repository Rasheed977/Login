const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const validateNote = require('../middleware/validateNote');
// Import your brand new file upload helper middleware
const upload = require('../middleware/uploadHelper');
router.get('/', noteController.getUserNotes);
// Inject 'upload.single("image")' BEFORE validation.
// This parses the multipart form data so that text fields are populated for validateNote to check.
router.post('/', upload.single('image'), validateNote, noteController.createNote);
module.exports = router;