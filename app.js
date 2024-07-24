const express = require("express");
const app = express();

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt")

app.use(cors());
app.use(express.json());


let db;

const connectToDB = async () => {
    try {
        db = await open({
            filename: path.join(__dirname, "auth.db"),
            driver: sqlite3.Database
        });
        console.log("Connected to the database successfully");

        // Start the server after establishing the database connection
        app.listen(3000, () => {
            console.log('Server is running at port 3000');
        });
    } catch (e) {
        console.log(`DB error is ${e.message}`);
        process.exit(1);
    }
};

connectToDB();




app.post("/register",async (request,response)=>{
   const {name,password,gender,mobileNo} = request.body

   try{
        const hashedPassword = await bcrypt.hash(password,10);
        const query = `INSERT INTO Register (Name,Password,Gender,MobileNo) VALUES('${name}','${hashedPassword}','${gender}',${mobileNo})`;
        const result = await db.run(query);
        response.status(201).json({ id: result.lastID, message: "User registered successfully" });
    } catch (e) {
        console.log(`DB error is ${e.message}`);
        response.status(500).json({ error: "Internal Server Error" });
    }
})

app.post("/login", async (request, response) => {
    const { name, password } = request.body;

    try {
        // Use parameterized queries to prevent SQL injection
        const getData = await db.get(`SELECT * FROM Register WHERE Name = ?`, [name]);

        if (!getData) {
            return response.status(400).json({ error: "User Not Found" });
        }

        // Check if the password matches the hashed password in the database
        const checkPassword = await bcrypt.compare(password, getData.Password);

        if (!checkPassword) {
            return response.status(401).json({ error: "Invalid Credentials" });
        }

        response.status(200).json({ message: "Login Successful" });
    } catch (e) {
        console.log(`DB error is ${e.message}`);
        response.status(500).json({ error: "Internal Server Error" });
    }
});
