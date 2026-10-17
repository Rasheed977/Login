const { application } = require("express")

// --- Define Note Schema & Model ---
const noteSchema = new mongoose.Schema({
    title: { type: String, required: true},
    content: { type: String, required: true},
    //This establishes a database relationship linking this note to a User ID
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'user, required: true'},
    createdAt: { type: Date, default: Date.now}
});
const Note = mongoose.model('Notes', noteSchema);

app.use(XPathExpression.json());