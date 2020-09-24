const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
const testFixtures = require("./bookmarks-fixtures");

describe("bookmarks endpoint", () => {
  let db;
  before(() => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    app.set("db", db);
  });
  after(() => {
    db.destroy();
  });
  describe("/bookmarks", () => {
    context("App has data", () => {
      const testData = testFixtures.makeBookmarksArray();
      beforeEach(() => {
        return db.into("bookmarks").insert(testData);
      });
      afterEach(() => {
        return db("bookmarks").truncate();
      });
      describe("get all", () => {
        it("should return a 200, and array of bookmarks", () => {
          return supertest(app)
            .get("/bookmarks")
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(200, testData);
        });
      });
    });
    context("App has no data", () => {
      beforeEach(() => {
        return db("bookmarks").truncate();
      });
      describe("get all", () => {
        it("should return an empty array", () => {
          return supertest(app)
            .get("/bookmarks")
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(200, []);
        });
      });
    });
    describe("/post", () => {
      describe("insert new", () => {
        it("should return 201, and an article", () => {
          return supertest(app)
            .post("/bookmarks")
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .send({
              title: "Reddit",
              url: "https://www.reddit.com",
              description: "Trolls for days",
              rating: 5,
            })
            .then((res) => {
              supertest(app).get(`/bookmarks/${res.body.id}`).expect(res.body);
            });
        });
        const requiredFields = ["title", "url", "rating"];
        requiredFields.forEach((field) => {
          const newBookmark = {
            title: "Test new mark",
            url: "test new url",
            rating: 1,
          };
          it(`should return 400 if invalid ${field}`, () => {
            delete newBookmark[field];
            return supertest(app)
              .post("/bookmarks")
              .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
              .send({
                title: "Reddit",
                url: "https://www.reddit.com",
                description: "Trolls for days",
                rating: 5,
              });
          });
        });
      });
    });
  });
  describe("/bookmarks/:id", () => {
    before(() => {
      return db("bookmarks").truncate();
    });
    context("App has data", () => {
      const testData = testFixtures.makeBookmarksArray();
      beforeEach(() => {
        return db.into("bookmarks").insert(testData);
      });
      afterEach(() => {
        return db("bookmarks").truncate();
      });
      describe("Get by id", () => {
        const bookmarkId = 3;
        const bookmarkTestObject = testData[bookmarkId - 1];
        it("should return the given bookmark by id", () => {
          return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(200, bookmarkTestObject);
        });
      });
    });
    context("App has no data", () => {
      before(() => {
        return db("bookmarks").truncate();
      });
      describe("Get by id", () => {
        const bookmarkId = 3;
        it("should return a 404", () => {
          return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(404);
        });
      });
    });
  });
});
