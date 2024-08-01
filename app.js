const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');

app.use(cors());
app.use(express.json());

let db;

const connectToDB = async () => {
    try {
        db = await open({
            filename: path.join(__dirname, 'auth.db'),
            driver: sqlite3.Database
        });
        console.log('Connected to the database successfully');

        app.listen(3000, () => {
            console.log('Server is running at port 3000');
        });
    } catch (e) {
        console.log(`DB error is ${e.message}`);
        process.exit(1);
    }
};

connectToDB();

app.post('/register', async (req, res) => {
    const { name, password, gender, mobileNo } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO Register (Name, Password, Gender, MobileNo) VALUES (?, ?, ?, ?)';
        const result = await db.run(query, [name, hashedPassword, gender, mobileNo]);
        res.status(201).send({ id: result.lastID, message: 'User registered successfully' });
    } catch (e) {
        console.log(`DB error is ${e.message}`);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.post('/login', async (req, res) => {
    const { name, password } = req.body;
    try {
        const getData = await db.get('SELECT * FROM Register WHERE Name = ?', [name]);

        if (!getData) {
            return res.status(400).send({ error: 'User Not Found' });
        }

        const checkPassword = await bcrypt.compare(password, getData.Password);

        if (!checkPassword) {
            return res.status(401).send({ error: 'Invalid Credentials' });
        }

        res.status(200).json({ message: 'Login Successful' });
    } catch (e) {
        console.log(`DB error is ${e.message}`);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});
