
require('dotenv').config();
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
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});
noteSchema.index({ userId: 1, createdAt: -1 });

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
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 600000 }
}));

// --- ROUTES ---

// 1. Registration
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).send('Username and password are required.');
        }

        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.send('Username already taken. <a href="/register.html">Try again</a>');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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

        const user = await User.findOne({ username });
        if (!user) {
            return res.send('User not found. <a href="/login.html">Try again</a>');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            req.session.user = user.username;
            req.session.userId = user._id.toString();
            return res.redirect('/welcome');
        } else {
            return res.send('Incorrect password. <a href="/login.html">Try again</a>');
        }
    } catch (err) {
        res.status(500).send('Server error during login.');
    }
});

app.get('/welcome', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome</title>
            <style>
                :root {
                    --ink: #18241f;
                    --muted: #718079;
                    --cream: #f5f7f1;
                    --lime: #d9f36a;
                    --green: #285844;
                }

                * { box-sizing: border-box; }
                body {
                    display: grid;
                    min-height: 100vh;
                    margin: 0;
                    padding: 24px;
                    color: var(--ink);
                    background: var(--cream);
                    font-family: Manrope, sans-serif;
                    place-items: center;
                }
                main {
                    width: min(100%, 620px);
                    padding: clamp(32px, 8vw, 76px);
                    text-align: center;
                    background: #fffefa;
                    border: 1px solid #dce5df;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(39, 70, 54, .08);
                }
                .eyebrow {
                    margin: 0 0 18px;
                    color: #739480;
                    font-family: "DM Mono", monospace;
                    font-size: 11px;
                    letter-spacing: .12em;
                    text-transform: uppercase;
                }
                h1 {
                    margin: 0 0 16px;
                    font-size: clamp(32px, 7vw, 52px);
                    letter-spacing: -.06em;
                    line-height: 1.05;
                }
                h1 span { color: var(--green); }
                p {
                    margin: 0 auto 30px;
                    max-width: 420px;
                    color: var(--muted);
                    line-height: 1.7;
                }
                a {
                    display: inline-block;
                    padding: 14px 22px;
                    color: var(--green);
                    background: var(--lime);
                    border-radius: 9px;
                    font-size: 13px;
                    font-weight: 700;
                    text-decoration: none;
                    transition: background .2s, transform .2s;
                }
                a:hover {
                    background: #c8e556;
                    transform: translateY(-1px);
                }
            </style>
        </head>
        <body>
            <main>
                <p class="eyebrow">Login completed</p>
                <h1>Thank you for logging in, <span>${req.session.user}</span>.</h1>
                <p>Your dashboard is ready. Continue when you are ready to see your saved notes.</p>
                <a href="/dashboard">Continue to dashboard</a>
            </main>
        </body>
        </html>
    `);
});

// 3. Dashboard
app.get('/dashboard', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized. Please <a href="/login.html">login</a>.');
    }

    try {
        const currentUser = await User.findOne({ username: req.session.user });
        if (!currentUser) {
            return res.redirect('/logout');
        }
res.send(`
 <h1>Dashboard for ${req.session.user}</h1>
 <a href="/logout">Logout</a>
 <hr>
<style>
    body {
        font-family: Arial, sans-serif;
        margin: 20px;
    }
    input, textarea {
        width: 100%;
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 5px;
        border: 1px solid #ccc;
    }
    button {
        padding: 10px 20px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
    button:hover {
        background-color: #45a049;
    }
</style>
 <h3>Create a New Note with Image</h3>
 <input type="text" id="title" placeholder="Note Title"><br><br>
 <textarea id="content" placeholder="Write something..."></textarea><br><br>

 <label>Attach an Image (Max 2MB):</label><br>
 <input type="file" id="imageFile" accept="image/*"><br><br>

 <button onclick="saveNote()">Save Note</button>
 <hr>
 <h3>Your Saved Notes</h3>
 <div id="notesContainer">Loading...</div>
 <script>
 async function loadNotes() {
 const response = await fetch('/api/notes?limit=10'); // Fetch last 10 entries
 const data = await response.json();
 const container = document.getElementById('notesContainer');
 container.innerHTML = '';
 data.notes.forEach(note => {
 // If an image URL path path string exists, render an img HTML tag container block
 const imageElement = note.imageUrl
 ? \`<br><img src="\${note.imageUrl}" style="max-width:300px; border-radius:5px; margin-top:10px;" al
 : '';
 container.innerHTML += \`
 <div style="border: 1px solid #ccc; padding: 15px; margin: 10px 0; border-radius:5px;">
 <h4>\${note.title}</h4>
 <p>\${note.content}</p>
 \${imageElement}
 </div>
 \`;
 });
 }
 async function saveNote() {
 const title = document.getElementById('title').value;
 const content = document.getElementById('content').value;
 const fileInput = document.getElementById('imageFile');
 // Use FormData object to handle compound file multi-part data stream packages
 const formData = new FormData();
 formData.append('title', title);
 formData.append('content', content);

 if (fileInput.files[0]) {
 formData.append('image', fileInput.files[0]);
 }
 // Send payload data directly to our REST API endpoint
 // (Note: Do NOT set Content-Type headers manually when sending FormData, the browser handles it automatical
 await fetch('/api/notes', {
 method: 'POST',
 body: formData
 });
 document.getElementById('title').value = '';
 document.getElementById('content').value = '';
 fileInput.value = '';
 loadNotes();
 }
 loadNotes();
 </script>
`);

    } catch (err) {
        console.error(err);
        res.status(500).send('Dashboard error.');
    }
});

// 4. Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.send('You have logged out. <a href="/login.html">Login again</a>');
    });
});

// 5. Notes API - Create
app.post('/api/notes', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required.' });
        }

        const currentUser = await User.findOne({ username: req.session.user });
        if (!currentUser) {
            return res.status(401).json({ error: 'User not found.' });
        }

        const newNote = new Note({
            title,
            content,
            userId: currentUser._id
        });

        await newNote.save();
        return res.status(201).json({ message: 'Note saved successfully!', note: newNote });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create note.' });
    }
});

// 6. Notes API - Read with pagination + search
app.get('/api/notes', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const currentUser = await User.findOne({ username: req.session.user });
        if (!currentUser) {
            return res.status(401).json({ error: 'User not found.' });
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 5));
        const search = String(req.query.search || '').trim();

        const filter = { userId: currentUser._id };

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const totalNotes = await Note.countDocuments(filter);
        const totalPages = Math.max(1, Math.ceil(totalNotes / limit));
        const safePage = Math.min(page, totalPages);

        const notes = await Note.find(filter)
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * limit)
            .limit(limit);

        return res.status(200).json({
            notes,
            totalPages,
            currentPage: safePage
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to retrieve notes.' });
    }
});

// 7. Delete a note
app.delete('/api/notes/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const currentUser = await User.findOne({ username: req.session.user });
        if (!currentUser) {
            return res.status(401).json({ error: 'User not found.' });
        }

        const noteToDelete = await Note.findOne({ _id: req.params.id, userId: currentUser._id });
        if (!noteToDelete) {
            return res.status(404).json({ error: 'Note not found or unauthorized.' });
        }

        await Note.deleteOne({ _id: req.params.id });
        return res.status(200).json({ message: 'Note successfully destroyed.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to delete note.' });
    }
});

app.listen(PORT, () => {
    console.log(`Production Auth server running at http://localhost:${PORT}`);
});