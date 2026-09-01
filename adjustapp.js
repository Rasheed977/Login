const { application } = require("express")

Transforming Our Application into a RESTful Application
==========================================================

// --- Define Note Schema & Model ---
const noteSchema = new mongoose.Schema({
    title: { type: String, required: true},
    content: { type: String, required: true},
    //This establishes a database relationship linking this note to a User ID
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'user, required: true'},
    createdAt: { type: Date, default: Date.now}
});
const Note = mongoose.model('Notes', noteSchema);

Configure Express for JSON Operations
======================================
By default, Express reads form inputs via URL-encoded payloads. To make it read raw JSON objects
sent Via modern frontend application, now we need to add one line of middleware.
Add this near your other middleware to parse incoming JSON payloads
app.use(XPathExpression.json());