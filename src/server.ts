import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB

// const herokuSSLSetting = { rejectUnauthorized: false }
// const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
// const dbConfig = {
//   connectionString: process.env.DATABASE_URL,
//   ssl: sslSetting,
// };

const dbConfig = process.env.LOCAL
  ? { database: `${process.env.LOCAL_DB}` }
  : {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  };

export const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

export const client = new Client(dbConfig);
client.connect();

// <----------------------------------- /users -------------------------------------------->

//get a user's username
app.get<{ id: number }>("/username/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const dbres = await client.query('SELECT username from users WHERE id=$1', [id]);
    if (dbres.rows) {
      res.status(200).json({
        status: "success",
        message: "Returned the user’s username",
        data: dbres.rows
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "Couldn't get username",
        data: dbres.rows,
      })
    }
  } catch (error) {
    console.error(error.message)
  }
});


//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
export const server = app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
