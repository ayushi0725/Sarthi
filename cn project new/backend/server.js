const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(path.join(__dirname, '../frontend')));

const db = new sqlite3.Database(path.join(__dirname, 'CNproject.db'), (err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to SQLite');
        db.run("PRAGMA foreign_keys = ON");

        initializeDatabase();
    }
});

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

    db.run(`CREATE TABLE IF NOT EXISTS counselor_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        specialization TEXT,
        experience TEXT,
        bio TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS meeting_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        counselor_id INTEGER,
        date_time TEXT,
        message TEXT,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (counselor_id) REFERENCES users(id)
    )`);
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.post("/check-email", (req, res) => {
    const { email } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (err) return res.status(500).json({ error: "Database query failed" });
        res.json({ exists: !!row });
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT id, password, stream FROM users WHERE email = ?", [email], (err, row) => {
        if (err) return res.status(500).json({ error: "Database query failed" });

        if (row) {
            bcrypt.compare(password, row.password, (err, isMatch) => {
                if (isMatch) {
                    res.json({ success: true, stream: row.stream, userId: row.id });
                } else {
                    res.status(401).json({ success: false, error: "Invalid email or password" });
                }
            });
        } else {
            res.status(401).json({ success: false, error: "Invalid email or password" });
        }
    });
});
app.post('/signup', async (req, res) => {
    const { name, mobile, email, password, gender, stream } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (name, mobile, email, password, gender, stream) VALUES (?, ?, ?, ?, ?, ?)';

        db.run(sql, [name, mobile, email, hashedPassword, gender, stream], function (err) {
            if (err) return res.status(500).json({ message: 'Error registering user' });
            res.json({ message: 'User registered successfully' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error hashing password' });
    }
});

// === Counselor Profile Routes ===

app.post('/api/counselor/profile', (req, res) => {
    const { userId, specialization, experience, bio } = req.body;

    if (!userId || !specialization || !experience || !bio) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const checkQuery = `SELECT * FROM counselor_profiles WHERE user_id = ?`;
    db.get(checkQuery, [userId], (err, row) => {
        if (err) {
            console.error("Error checking profile:", err.message);
            return res.status(500).json({ success: false, message: "Database error." });
        }

        if (row) {
            const updateQuery = `UPDATE counselor_profiles SET specialization = ?, experience = ?, bio = ? WHERE user_id = ?`;
            db.run(updateQuery, [specialization, experience, bio, userId], function (err) {
                if (err) {
                    console.error("Error updating profile:", err.message);
                    return res.status(500).json({ success: false, message: "Update failed." });
                }
                res.json({ success: true, message: "Profile updated." });
            });
        } else {
            const insertQuery = `INSERT INTO counselor_profiles (user_id, specialization, experience, bio) VALUES (?, ?, ?, ?)`;
            db.run(insertQuery, [userId, specialization, experience, bio], function (err) {
                if (err) {
                    console.error("Error inserting profile:", err.message);
                    return res.status(500).json({ success: false, message: "Insertion failed." });
                }
                res.json({ success: true, message: "Profile created." });
            });
        }
    });
});


app.get('/api/counselor/profile/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `SELECT * FROM counselor_profiles WHERE user_id = ?`;
    db.get(query, [userId], (err, row) => {
        if (err) {
            console.error("Error fetching profile:", err.message);
            return res.status(500).json({ success: false, message: "Error retrieving profile." });
        }
        res.json({ success: true, profile: row });
    });
});    
app.get('/api/counselors/all', (req, res) => {
    const query = `
        SELECT u.id, u.name, u.email, cp.specialization, cp.experience, cp.bio
        FROM users u
        JOIN counselor_profiles cp ON u.id = cp.user_id
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching counselors:", err);
            return res.status(500).json({ success: false, message: 'Error fetching counselors.' });
        }
        res.json({ success: true, counselors: rows });
    });
});
app.get('/api/counselors', (req, res) => {
    const specialization = req.query.stream;
    const query = `
        SELECT u.id, u.name, u.email, cp.specialization, cp.experience, cp.bio
        FROM users u
        JOIN counselor_profiles cp ON u.id = cp.user_id
        WHERE LOWER(cp.specialization) LIKE LOWER(?)
    `;

    db.all(query, [`%${specialization}%`], (err, rows) => {
        if (err) {
            console.error("Error filtering counselors:", err);
            return res.status(500).json({ success: false, message: 'Error filtering counselors.' });
        }
        res.json({ success: true, counselors: rows });
    });
});


// === Meeting Requests ===

app.post('/api/meetings/request', (req, res) => {
    const { studentId, counselorId, dateTime, message } = req.body;
    const query = `INSERT INTO meeting_requests (student_id, counselor_id, date_time, message) VALUES (?, ?, ?, ?)`;
    db.run(query, [studentId, counselorId, dateTime, message], function (err) {
        if (err) return res.status(500).json({ success: false, message: 'Could not request meeting.' });
        res.json({ success: true, message: 'Meeting request sent.' });
    });
});

app.get('/api/meetings/counselor/:id', (req, res) => {
    const counselorId = req.params.id;
    const query = `
        SELECT mr.id, u.name AS student_name, mr.date_time, mr.message, mr.status
        FROM meeting_requests mr
        JOIN users u ON mr.student_id = u.id
        WHERE mr.counselor_id = ?
    `;
    db.all(query, [counselorId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'Error fetching meetings.' });
        res.json({ success: true, meetings: rows });
    });
});

app.patch('/api/meetings/respond', (req, res) => {
    const { meetingId, status } = req.body;
    const query = `UPDATE meeting_requests SET status = ? WHERE id = ?`;
    db.run(query, [status, meetingId], function (err) {
        if (err) return res.status(500).json({ success: false, message: 'Could not update status.' });
        res.json({ success: true, message: 'Status updated.' });
    });
});

const PORT = 3000;
const LOCAL_IP = "0.0.0.0";

app.listen(PORT, LOCAL_IP, () => {
    console.log(`Server running at http://${LOCAL_IP}:${PORT}`);
});
