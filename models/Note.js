const mongoose = require('mongoose');
const noteSchema = new mongoose.Schema({
 title: { type: String, required: true },
 content: { type: String, required: true },
 userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
 imageUrl: { type: String, default: '' }, // Stores the path to the uploaded image file
 createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Note', noteSchema);