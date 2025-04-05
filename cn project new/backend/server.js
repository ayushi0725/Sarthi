const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');

// const bodyParser = require('body-parser');
// app.use(bodyParser.json());

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ✅ Serve static files from the "frontend" folder
app.use(express.static(path.join(__dirname, '../frontend')));

// ✅ SQLite Database Connection
const db = new sqlite3.Database(path.join(__dirname, 'CNproject.db'), (err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to SQLite');
        initializeDatabase();
    }
});

// ✅ Create tables if they don't exist
function initializeDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mobile TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        gender TEXT NOT NULL,
        stream TEXT NOT NULL
    )`);
}

// ✅ Serve the main page (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// ✅ Check if email already exists
app.post("/check-email", (req, res) => {
    const { email } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database query failed" });
        }
        res.json({ exists: !!row });
    });
});

// ✅ Login API
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT password, stream FROM users WHERE email = ?", [email], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database query failed" });
        } 

        if (row) {
            bcrypt.compare(password, row.password, (err, isMatch) => {
                if (isMatch) {
                    res.json({ success: true, stream: row.stream });
                } else {
                    res.status(401).json({ success: false, error: "Invalid email or password" });
                }
            });
        } else {
            res.status(401).json({ success: false, error: "Invalid email or password" });
        }
    });
});

// ✅ Signup API
app.post('/signup', async (req, res) => {
    const { name, mobile, email, password, gender, stream } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (name, mobile, email, password, gender, stream) VALUES (?, ?, ?, ?, ?, ?)';
        
        db.run(sql, [name, mobile, email, hashedPassword, gender, stream], function (err) {
            if (err) {
                return res.status(500).json({ message: 'Error registering user' });
            }
            res.json({ message: 'User registered successfully' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error hashing password' });
    }
});

// ✅ Start Server
const PORT = 3000;
const LOCAL_IP = "0.0.0.0"; // Use "0.0.0.0" for network access my ip = 192.168.1.38

app.listen(PORT, LOCAL_IP, () => {
    console.log(`Server running at http://${LOCAL_IP}:${PORT}`);
});

