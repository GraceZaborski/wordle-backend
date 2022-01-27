import supertest from "supertest";
import { app, client, server } from "./server";

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

describe("POST /words/:id", () => {
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

//   test("retrieves specific number of snippets", async () => {
//     const response = await supertest(app).get("/snippets?limit=4");
//     expect(response.body.data.length).toEqual(4);
//     expect(response.body.message).toMatch("Retrieved snippets");
//     expect(response.status).toEqual(200);
//   });
//   test("returns 100 or fewer snippets if limit query param is over 100", async () => {
//     const response = await supertest(app).get("/snippets?limit=101");
//     expect(response.status).toEqual(200);
//     expect(response.body.message).toMatch("Retrieved snippets");
//     expect(response.body.data.length).toBeLessThanOrEqual(100);
//   });
//   test("returns 400 response if limit is 0 or less", async () => {
//     const response = await supertest(app).get("/snippets?limit=-1");
//     expect(response.status).toEqual(400);
//     expect(response.body.message).toMatch("Bad request");
//   });
//   test("returns 400 response if limit is not a number", async () => {
//     const response = await supertest(app).get("/snippets?limit=hello");
//     expect(response.status).toEqual(400);
//     expect(response.body.message).toMatch("Bad request");
//   });

// describe("GET /snippets/1", () => {
//   test("retrieves one snippets from the snippets table", async () => {
//     const response = await supertest(app).get("/snippets/1");
//     expect(response.status).toEqual(200);
//     expect(response.body.message).toMatch("Retrieved snippet");
//     expect(response.body.data).toHaveLength(1);
//   });
//   test("if snippet cannot be found, an error is returned", async () => {
//     const response = await supertest(app).get("/snippets/0");
//     expect(response.status).toEqual(404);
//     expect(response.body.message).toStrictEqual(
//       "Could not find a snippet with that ID."
//     );
//     expect(response.body.data).toStrictEqual({});
//   });
// });

afterAll(() => {
  client.end();
  server.close();
});
