require('dotenv').config(); // Load environment variables from .env file
const dns = require('dns');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Define Note Schema & Model ---
const noteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    //This establishes a database relationship linking this note to a User ID
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});
const Note = mongoose.model('Notes', noteSchema);


dns.setServers((process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1').split(','));

// --- CONNECT TO MONGODB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to cloud MongoDB Atlas!'))
    .catch(err => console.error('Database connection error:', err));

// --- DEFINE USER SCHEMA & MODEL ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// --- MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 600000 }
}));

// Middleware to parse incoming JSON payloads
app.use(express.json());

// --- ROUTES ---

// 1. Registration
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check MongoDB if user already exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.send('Username already taken. <a href="/register.html">Try again</a>');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Save new user document to MongoDB
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.send('Registration successful! <a href="/login.html">Login here</a>');
    } catch (err) {
        res.status(500).send('Server error during registration.');
    }
});
 
// 2. Login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Query user from MongoDB
        const user = await User.findOne({ username });
        if (!user) {
            return res.send('User not found. <a href="/login.html">Try again</a>');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            req.session.user = user.username;
            res.redirect('/dashboard');
        } else {
            res.send('Incorrect password. <a href="/login.html">Try again</a>');
        }
    } catch (err) {
        res.status(500).send('Server error during login.');
    }
});

app.get('/dashboard', (req, res) => {
    if (req.session.user) {
        res.send(`
            <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
</head>
<style>
    :root {
        --ink: #18241f;
        --muted: #718079;
        --line: #dce5df;
        --cream: #f5f7f1;
        --paper: #fffefa;
        --lime: #d9f36a;
        --green: #285844;
        --shadow: 0 20px 60px rgba(39, 70, 54, .08);
    }

    * { box-sizing: border-box; }

    body {
        max-width: 1180px;
        min-height: 100vh;
        margin: 0 auto;
        padding: 54px clamp(24px, 6vw, 80px);
        color: var(--ink);
        background: var(--cream);
        font-family: Manrope, sans-serif;
    }

    h1 {
        margin: 0 0 8px;
        color: var(--ink);
        font-size: clamp(30px, 5vw, 48px);
        letter-spacing: -.06em;
        line-height: 1.05;
    }

    h1::before {
        display: block;
        margin-bottom: 14px;
        color: #739480;
        content: 'YOUR QUIET CORNER';
        font-family: "DM Mono", monospace;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: .12em;
    }

    h3 {
        margin: 34px 0 14px;
        color: var(--green);
        font-size: 17px;
        letter-spacing: -.04em;
    }

    hr {
        height: 1px;
        margin: 34px 0 38px;
        border: 0;
        background: var(--line);
    }

    a {
        color: var(--green);
        font-size: 12px;
        font-weight: 700;
        text-decoration: none;
    }

    a:hover { color: #597e32; text-decoration: underline; }

    input, textarea {
        display: block;
        width: min(100%, 520px);
        padding: 14px 15px;
        color: var(--ink);
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 9px;
        outline: none;
        font: inherit;
        line-height: 1.5;
        transition: border-color .2s, box-shadow .2s;
    }

    input { margin: 0 0 14px; }
    textarea { min-height: 150px; resize: vertical; }
    input:focus, textarea:focus { border-color: #8eac66; box-shadow: 0 0 0 3px rgba(217, 243, 106, .3); }
    input::placeholder, textarea::placeholder { color: #9aa69f; }

    button {
        margin-top: 16px;
        padding: 13px 20px;
        color: var(--green);
        background: var(--lime);
        border: 0;
        border-radius: 9px;
        font: 700 13px Manrope, sans-serif;
        cursor: pointer;
        transition: background .2s, transform .2s;
    }

    button:hover { background: #c8e556; transform: translateY(-1px); }

    #notesContainer {
        display: grid;
        gap: 12px;
        width: min(100%, 760px);
    }

    #notesContainer > div {
        padding: 20px !important;
        background: var(--paper);
        border: 1px solid var(--line) !important;
        border-radius: 12px !important;
        box-shadow: var(--shadow);
    }

    #notesContainer h4 { margin: 0 0 10px; color: var(--ink); font-size: 16px; letter-spacing: -.03em; }
    #notesContainer p { margin: 0 0 14px; color: #66766d; font-size: 13px; line-height: 1.65; white-space: pre-wrap; overflow-wrap: anywhere; }
    #notesContainer button { margin: 0; padding: 0; color: #ad6d62 !important; background: transparent; font: 500 10px "DM Mono", monospace; text-transform: uppercase; }

    
</style>    
<body>
 <h1>Dashboard for ${req.session.user}</h1>
 <a href="/logout">Logout</a>
 <hr>
 <h3>Create a New Private Note</h3>
 <input type="text" id="title" placeholder="Note Title"><br><br>
 <textarea id="content" placeholder="Write something..."></textarea><br><br>
 <button onclick="saveNote()">Save Note</button>
 <h3>Your Saved Notes</h3>
 <div id="notesContainer">Loading notes...</div>


     <script>
 // Fetch and display notes as soon as the dashboard loads
 async function loadNotes() {
 const response = await fetch('/api/notes');
 const notes = await response.json();
 const container = document.getElementById('notesContainer');
 container.innerHTML = '';
 if(notes.length === 0) {
 container.innerHTML = '<p>No notes found. Create your first one above!</p>';
 return;
 }
 notes.forEach(note => {
 container.innerHTML += \`
 <div style="border: 1px solid #ccc;  padding: 10px; margin: 10px 0; border-radius:5px;">
 <h4>\${note.title}</h4>
 <p>\${note.content}</p>
 <button onclick="deleteNote('\${note._id}')" style="color:red;">Delete</button>
 </div>
 \`;
 });
 }

 // Send data via JSON to our REST API
    async function saveNote() {
   const title = document.getElementById('title').value;
 const content = document.getElementById('content').value;
 await fetch('/api/notes', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ title, content })
 });

 document.getElementById('title').value = '';
 document.getElementById('content').value = '';
 loadNotes();
  }
 loadNotes();
 </script>
 </ body>
 </html>
 `);
    } else {
        res.status(401).send('Unauthorized. Please <a href="/login.html">login</a>.');
    }
});




// 4. Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.send('You have logged out. <a href="/login.html">Login again</a>');
    });
});

// 1. CREATE: Add a new private note
app.post('/api/notes', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    try {
        const { title, content } = req.body;
        // Find the current logged-in user's database object
        const currentUser = await User.findOne({ username: req.session.user });
        const newNote = new Note({
            title,
            content,
            userId: currentUser._id // Link the note to this user's unique ID
        });
        await newNote.save();
        res.status(201).json({ message: 'Note saved successfully!', note: newNote });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create note.' });
    }
});

// 2. READ: Fetch all notes belonging exclusively to the logged-in user
app.get('/api/notes', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const currentUser = await User.findOne({ username: req.session.user });
        // Only pull notes matching this specific user's ID
        const userNotes = await Note.find({ userId: currentUser._id }).sort({ createdAt: -1 });

        res.status(200).json(userNotes);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve notes.' });
    }
});

// 3. DELETE: Remove a note safely by its unique ID
app.delete('/api/notes/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const currentUser = await User.findOne({ username: req.session.user });

        // Ensure the note exists AND actually belongs to the user trying to delete it
        const noteToDelete = await Note.findOne({ _id: req.params.id, userId: currentUser._id });

        if (!noteToDelete) {
            return res.status(404).json({ error: 'Note not found or unauthorized.' });
        }
        await Note.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Note successfully destroyed.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete note.' });
    }
});

app.listen(PORT, () => {
    console.log(`Production Auth server running at http://localhost:${PORT}`);
});