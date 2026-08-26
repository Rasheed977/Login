require('dotenv').config(); // Load environment variables from .env file
const dns = require('dns');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

// 3. Dashboard
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
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
                .container {
                    background-color: #fff;
                    padding: 20px 40px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
                a {
                    display: inline-block;
                    margin-top: 20px;
                    text-decoration: none;
                    color: #fff;
                    background-color: #007BFF;
                    padding: 10px 20px;
                    border-radius: 5px;
                }
                a:hover {
                    background-color: #0056b3;
                }
            </style>
            <body>
                <div class="container">
                    <h1>Welcome, ${req.session.user}!</h1>
                    <p>You have successfully logged in.</p>
                    <a href="/logout">Logout</a>
                </div>
            </body>
            </html>
        `);
    } else {
        res.status(401).send('Unauthorized. Please <a href="/login.html">login</a> first.');
    }
});

// 4. Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.send('You have logged out. <a href="/login.html">Login again</a>');
    });
});

app.listen(PORT, () => {
    console.log(`Production Auth server running at http://localhost:${PORT}`);
});