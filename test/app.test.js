const { expect } = require("chai");
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
        it("should return 201, and a bookmark", () => {
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
      describe("/delete", () => {
        const bookmarkId = 3;
        const expectedBookmarks = testData.filter(
          (bookmark) => bookmark.id !== bookmarkId
        );
        it("should delete bookmark", () => {
          return supertest(app)
            .delete(`/bookmarks/${bookmarkId}`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(204)
            .then((res) => {
              return supertest(app)
                .get("/bookmarks")
                .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                .expect(expectedBookmarks);
            });
        });
      });
      context("given xss attack bookmark in database", () => {
        const maliciousBookmark = {
          id: 911,
          title: 'Naughty naughty very naughty <script>alert("xss");</script>',
          url:
            'http://Naughty-naughty-very-naughty-<script>alert("xss");</script>',
          description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
          rating: 1,
        };
        beforeEach(() => {
          return db.into("bookmarks").insert([maliciousBookmark]);
        });
        it("removes xss attack content", () => {
          return supertest(app)
            .get(`/bookmarks/${maliciousBookmark.id}`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(200)
            .expect((res) => {
              expect(res.body.title).to.eql(
                'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;'
              );
              expect(res.body.url).to.eql(
                'http://Naughty-naughty-very-naughty-&lt;script&gt;alert("xss");&lt;/script&gt;'
              );
              expect(res.body.description).to.eql(
                `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
              );
            });
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
