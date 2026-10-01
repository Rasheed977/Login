const Note = require('../models/Note');
const User = require('../models/User');
exports.getUserNotes = async (req, res) => {
 // 1. Authenticate check
 if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
 try {
 const currentUser = await User.findOne({ username: req.session.user });
 // 2. Parse Query Parameters from URL (with safe fallback defaults)
 const page = parseInt(req.query.page) || 1; // Default to page 1
 const limit = parseInt(req.query.limit) || 5; // Default to 5 items per page
 const searchQuery = req.query.search || ''; // Default to an empty search string
 // Calculate how many records MongoDB needs to skip over
 // Page 1 skips 0 items. Page 2 skips (2-1) * 5 = 5 items.
 const skipAmount = (page - 1) * limit;
 // 3. Construct a Dynamic MongoDB Query
 const dbQuery = { userId: currentUser._id };
 // If a search term exists, match it against title OR content (case-insensitive 'i')
 if (searchQuery) {
 dbQuery.$or = [
 { title: { $regex: searchQuery, $options: 'i' } },
 { content: { $regex: searchQuery, $options: 'i' } }
 ];
 }
 
 // 4. Run Concurrent Database Actions (Fetch Data + Count Total Records)
 const [userNotes, totalNotesCount] = await Promise.all([
 Note.find(dbQuery)
 .sort({ createdAt: -1 })
 .skip(skipAmount)
 .limit(limit),
 Note.countDocuments(dbQuery) // Required to compute total page numbers on the frontend
 ]);
 // 5. Send structured paginated response metadata
 res.status(200).json({
 currentPage: page,
 totalPages: Math.ceil(totalNotesCount / limit),
 totalItems: totalNotesCount,
 itemsPerPage: limit,
 notes: userNotes
 });
 } catch (err) {
 res.status(500).json({ error: 'Failed to retrieve paginated notes.' });
 }
};
// (Keep your createNote function underneath completely unchanged!)
const Note = require('../models/Note');
const User = require('../models/User');
exports.createNote = async (req, res) => {
 if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
 try {
 const { title, content } = req.body;
 const currentUser = await User.findOne({ username: req.session.user });
 // Check if a file was actually uploaded by the client user
 let imageUrl = '';
 if (req.file) {
 // Store the web-accessible URL path string pointing to our local public folder
 imageUrl = `/uploads/${req.file.filename}`;
 }
 const newNote = new Note({
 title,
 content,
 userId: currentUser._id,
 imageUrl: imageUrl // Store file path directly alongside note records
 });
 await newNote.save();
 res.status(201).json({ message: 'Note saved successfully!', note: newNote });
 } catch (err) {
 res.status(500).json({ error: 'Failed to save note with attached asset.' });
 }
};
