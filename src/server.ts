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
app.use(cors()); //add CORS support to each following route handler

export const client = new Client(dbConfig);
client.connect();

/* <----------------------------------- notes -------------------------------------------->

commenter_id refers to the person commenting
commented_id refers to the user whose pattern was commented on */

// <----------------------------------- interfaces -------------------------------------------->

interface Username {
  username: string;
}

interface UsersWords {
  row: number;
  word: string;
}

interface Comment {
  commented_id: number;
  comment: string;
}

interface Score {
  score: number;
}

// <----------------------------------- users -------------------------------------------->

//get a all user's ids and usernames
app.get("/users", async (req, res) => {
  try {
    const dbres = await client.query("SELECT username, id from users");
    if (dbres.rows) {
      res.status(200).json({
        status: "success",
        message: "Returned all users",
        data: dbres.rows,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "Couldn't get users",
        data: dbres.rows,
      });
    }
  } catch (error) {
    console.error(error.message);
  }
});

//NOT IN USE CURRENTLY
//get a user's username
app.get<{ id: number }>("/username/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const dbres = await client.query(
      "SELECT username, id from users WHERE id=$1",
      [id]
    );
    if (dbres.rows) {
      res.status(200).json({
        status: "success",
        message: "Returned the user???s username",
        data: dbres.rows,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "Couldn't get username",
        data: dbres.rows,
      });
    }
  } catch (error) {
    console.error(error.message);
  }
});

//NOT IN USE CURRENTLY
//add a new user
app.post<{}, {}, Username>("/user", async (req, res) => {
  const { username } = req.body;
  try {
    const usernameCheck = await client.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );
    if (usernameCheck.rowCount > 0) {
      res.json({
        message: "Username already exists",
        data: usernameCheck.rows,
      });
    } else {
      const dbres = await client.query(
        "INSERT INTO users (username) VALUES ($1) RETURNING id, username",
        [username]
      );
      if (dbres.rows) {
        res.status(200).json({
          status: "success",
          message: "Added a new user",
          data: dbres.rows,
        });
      } else {
        res.status(500).json({
          status: "fail",
          message: "Couldn't add a new user",
          data: dbres.rows,
        });
      }
    }
  } catch (error) {
    console.error(error.message);
  }
});

// <----------------------------------- words -------------------------------------------->

//get a user's guessed words so far and return progress
app.get<{ id: number }>("/words/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const dbres = await client.query(
      "SELECT row, word, complete FROM words w join users u ON w.user_id = u.id WHERE w.user_id = $1",
      [id]
    );
    if (dbres.rows) {
      res.status(200).json({
        status: "success",
        message: "Returned a user's guesses so far",
        data: dbres.rows,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "Couldn't get user's guesses",
        data: dbres.rows,
      });
    }
  } catch (error) {
    console.error(error.message);
  }
});

//post a user's new word with associated row
app.post<{ id: number }, {}, UsersWords>("/words/:id", async (req, res) => {
  const { word } = req.body;
  const { id } = req.params;
  try {
    const dbres = await client.query("SELECT * FROM words where user_id=$1", [
      id,
    ]);
    const rowsSoFar = dbres.rowCount;
    const doubleWord = await client.query("SELECT * FROM words WHERE word=$1", [
      word,
    ]);
    if (rowsSoFar > 5) {
      res.status(500).json({
        status: "fail",
        message: "Reached maximum number of guesses",
        data: dbres.rows,
      });
    } else if (doubleWord.rowCount > 0) {
      res.status(500).json({
        status: "fail",
        message: "Duplicate word",
        data: dbres.rows,
      });
    } else {
      const latestGuess = await client.query(
        "INSERT INTO words (user_id, row, word) VALUES ($1, $2, $3) RETURNING row, word",
        [id, rowsSoFar + 1, word]
      );
      res.status(200).json({
        status: "success",
        message: "Added a user's latest guess",
        data: latestGuess.rows,
      });
    }
  } catch (error) {
    console.error(error.message);
  }
});

// <----------------------------------- comments -------------------------------------------->

//get the comments for a user's pattern
app.get<{ id: number }>("/comments/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const dbres = await client.query(
      "SELECT\
    c.comment_id,\
    c.commenter_id,\
    u.username as commenter_name,\
    c.comment,\
    c.date_added\
    FROM comments c\
    INNER JOIN users u ON c.commenter_id = u.id\
    WHERE commented_id=$1",
      [id]
    );
    if (dbres.rowCount > 0) {
      res.status(200).json({
        status: "success",
        message: "Returned a user's pattern's comments",
        data: dbres.rows,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "No comments for this user_id",
        data: dbres.rows,
      });
    }
  } catch (error) {
    console.error(error.message);
  }
});

//add a new comment
app.post<{ id: number }, {}, Comment>("/comments/:id", async (req, res) => {
  const { id } = req.params;
  const { commented_id, comment } = req.body;
  try {
    const dbres = await client.query(
      "INSERT INTO comments (commented_id, commenter_id, comment) VALUES ($1, $2, $3) RETURNING *",
      [commented_id, id, comment]
    );
    if (dbres.rows) {
      res.status(200).json({
        status: "success",
        message: "New comment added",
        data: dbres.rows,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "Couldn't add a new comement",
        data: dbres.rows,
      });
    }
  } catch (error) {
    console.error(error.message);
  }
});

// <----------------------------------- score -------------------------------------------->

//NOT CURRENTLY IN USE
//get a user's score
app.get<{ id: number }>("/score/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const dbres = await client.query(
      "SELECT id, username, complete FROM users WHERE id=$1",
      [id]
    );
    if (dbres.rows[0].complete === false) {
      res.status(200).json({
        status: "success",
        message: "User hasn't completed the daily wordle",
        data: dbres.rows,
      });
    } else {
      const dbres = await client.query("SELECT * FROM users WHERE id=$1", [id]);
      if (dbres.rows[0].complete === false) {
        res.status(200).json({
          status: "success",
          message: "Received user's score",
          data: dbres.rows,
        });
      } else {
        res.status(500).json({
          status: "fail",
          message: "Could not receive user's score",
          data: dbres.rows,
        });
      }
    }
  } catch (error) {
    console.error(error.message);
  }
});

//NOT CURRENTLY IN USE
//add a user's score
app.put<{ id: number }, {}, Score>("/score/:id", async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;
  try {
    const alreadyTru = await client.query(
      "SELECT complete FROM users WHERE id=$1",
      [id]
    );
    if (alreadyTru.rows[0].complete == true) {
      res.status(500).json({
        status: "fail",
        message: "User has already completed the daily puzzle",
        data: alreadyTru.rows,
      });
    } else {
      const dbres = await client.query(
        "UPDATE users SET complete=$1, score=$2 WHERE id=$3 RETURNING *",
        [true, score, id]
      );
      if (dbres.rows) {
        res.status(200).json({
          status: "success",
          message: "Score and progress status updated",
          data: dbres.rows,
        });
      } else {
        res.status(500).json({
          status: "fail",
          message: "Couldn't udpate score or progress",
          data: dbres.rows,
        });
      }
    }
  } catch (error) {
    console.error(error.message);
  }
});

// <----------------------------------- reset after 24 hrs -------------------------------------------->

//delete all user's word and progress data (completeness and score)
app.delete("/reset", async (req, res) => {
  try {
    const dbres = await client.query(
      "UPDATE users SET complete = false, score = 0 returning *; DELETE from words returning *; "
    );
    res.status(200).json({
      status: "success",
      message: "Reset table data",
      data: dbres.rows,
    });
  } catch (error) {
    console.error(error.message);
  }
});

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
export const server = app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
