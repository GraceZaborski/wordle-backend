import supertest from "supertest";
import { app, client, server } from "./server";

//Start the server on the given port
const port = 4000;

describe("GET /users", () => {
  test("get user ids and usernames", async () => {
    const response = await supertest(app).get("/users");
    expect(response.status).toEqual(200);
    expect(response.body.message).toMatch("Returned all users");
    expect(response.body.data.length).toBeGreaterThan(0);
  });
});

describe("GET /words/:id", () => {
  test("get a user's guessed words so far and return progress", async () => {
    const response = await supertest(app).get("/words/1");
    expect(response.status).toEqual(200);
    expect(response.body.message).toMatch("Returned a user's guesses so far");
    expect(response.body.data.length).toBeGreaterThan(0);
  });
  test("the first user's complete field returns true", async () => {
    const response = await supertest(app).get("/words/1");
    expect(response.body.data[0].complete).toEqual(true);
  });
});

describe.skip("POST /words/:id", () => {
  test("returns error for a double word", async () => {
    const response = await supertest(app).post("/words/2").send({
      word: "debit",
    });
    expect(response.status).toEqual(500);
    expect(response.body.message).toMatch("Duplicate word");
    expect(response.body.data.length).toBeGreaterThan(0);
  });
  test("Returns error if maximum number of words entered", async () => {
    const response = await supertest(app).post("/words/1").send({
      word: "dingo",
    });
    expect(response.status).toEqual(500);
    expect(response.body.message).toMatch("Reached maximum number of guesses");
  });
  // test("Successfully adds word", async () => {
  //     const response = await supertest(app).post("/words/2").send({
  //         word: "cheese",
  //     })
  //     expect(response.status).toEqual(200);
  //     expect(response.body.message).toMatch("Added a user's latest guess");
  // });
});

// describe("PUT /score/:id", () => {
//     test("add a user's score and update ", async () => {
//         const response = await supertest(app).get("/words/1");
//         expect(response.status).toEqual(200);
//         expect(response.body.message).toMatch("Returned a user's guesses so far");
//         expect(response.body.data.length).toBeGreaterThan(0);
//     });
//     test("the first user's complete field returns true", async () => {
//         const response = await supertest(app).get("/words/1");
//         expect(response.body.data[0].complete).toEqual(true);
//     });
// });

afterAll(() => {
  client.end();
  server.close();
});
