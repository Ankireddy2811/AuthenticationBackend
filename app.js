const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const sqlite3 = require('better-sqlite3');
const bcrypt = require('bcrypt');

app.use(cors());
app.use(express.json());

let db;

const connectToDB = () => {
    try {
        db = sqlite3(path.join(__dirname, 'auth.db'), { verbose: console.log });
        console.log('Connected to the database successfully');

        app.listen(3000, () => {
            console.log('Server is running on port 3000');
        });
    } catch (e) {
        console.error(`DB connection error: ${e.message}`);
        process.exit(1);
    }
};

connectToDB();

app.post('/register', (req, res) => {
    const { name, password, gender, mobileNo } = req.body;

    if (!name || !password || !gender || !mobileNo) {
        return res.status(400).send({ error: 'All fields are required' });
    }

    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const stmt = db.prepare('INSERT INTO Register (Name, Password, Gender, MobileNo) VALUES (?, ?, ?, ?)');
        const result = stmt.run(name, hashedPassword, gender, mobileNo);

        res.status(201).send({ id: result.lastInsertRowid, message: 'User registered successfully' });
    } catch (e) {
        console.error(`DB error during registration: ${e.message}`);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.post('/login', (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).send({ error: 'Name and password are required' });
    }

    try {
        const stmt = db.prepare('SELECT * FROM Register WHERE Name = ?');
        const getData = stmt.get(name);

        if (!getData) {
            return res.status(400).send({ error: 'User not found' });
        }

        const isPasswordCorrect = bcrypt.compareSync(password, getData.Password);

        if (!isPasswordCorrect) {
            return res.status(401).send({ error: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Login successful' });
    } catch (e) {
        console.error(`DB error during login: ${e.message}`);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});
