const express = require('express');
const app = express();
require('dotenv').config();
const cnctString = process.env.DATABASE_CONNECTION;
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const port = 3000;

// Connect to MongoDB
mongoose.connect(cnctString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB!")).catch((err) => console.error('MongoDB connection error: ', err));

// Define User Schema and Model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/rejestracja.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'rejestracja.html'));
});

app.get('/main.html', (req,res)=>{
    res.sendFile(path.join(__dirname, 'views', 'main.html'));
})

// POST route for handling form submission
app.post('/register', async (req, res) => {
    const { email, password, repeat_password } = req.body;

    // Validate passwords match
    if (password !== repeat_password) {
        return res.status(400).send('Passwords do not match.');
    }

    // Validate the input
    if (!email || !password) {
        return res.status(400).send('All fields are required.');
    }

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists.');
        }

        // Hash the password (use a valid salt round, e.g., 10)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save the user to the database
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        // Send a success response
        res.status(201).send('User registered successfully!');
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).send('Internal server error');
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

// Handle server errors
app.on('error', (error) => {
    console.error('Server error: ', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    app.close(() => {
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    app.close(() => {
        process.exit(0);
    });
});

// Handle error 404
app.use((req, res, next) => {
    res.status(404).send('Route to the page was not found.');
});

// Handle error 500
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (!res.headersSent) {
        res.status(500).send('Something went wrong!');
    }
});
