const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//registerUser API

app.post("/users/", async(request, response)=>{

    const {username, name, password, gender, location} = request.body;
    const hashedPassword = await bcrypt.hash(request.body.password, 10);
    const userObjectQuery =  `SELECT * FROM user WHERE username like "${username}"`
    
    const userObject = await db.get(userObjectQuery)

    if(userObject === undefined){
        const createUserQuery = `INSERT INTO user(username, name, password, gender, location)
            VALUES("${username}", "${name}", "${hashedPassword}", "${gender}", "${location}")`

        await db.run(createUserQuery)
        response.send('User Created')
    }else{
        //User already exists
        response.status = 400;
        response.send('User Already exists');
        console.log(response)
    }
})

//loginAPI

app.post("/login/", async(request, response)=>{
    const {username, password} = request.body;
    
    const userObjectQuery = `SELECT * FROM user WHERE username like "${username}"`
     
    const userObject = await db.get(userObjectQuery)

    if(userObject === undefined){
        response.status = 400;
        response.send("Invalid user")
    }else{
        const isPasswordsSame = await bcrypt.compare(password, userObject.password)
        if (isPasswordsSame){
            response.send("Login Success")
        }else{
            response.status = 400;
            response.send("Invalid password")
        }
    }
})

