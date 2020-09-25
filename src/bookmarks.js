const express = require("express");
const bookmarks = require("./dataStore");
const bookmarkRouter = express.Router();
const logger = require("./logger");
const { v4: uuid } = require("uuid");
const { readableHighWaterMark } = require("./logger");
bookmarkRouter.use(express.json());
const bookmarkSerivice = require("./bookmarks-service");
const xss = require("xss");

const bookmarksService = require("./bookmarks-service");
const convertBookmarks = (bookmark) => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: xss(bookmark.url),
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
});

bookmarkRouter
  .route("/")
  .get((req, res, next) => {
    bookmarksService
      .getAllBookmarks(req.app.get("db"))
      .then((bookmarks) => {
        res.json(bookmarks.map(convertBookmarks));
      })
      .catch(next);
  })
  .post((req, res) => {
    let { title, url, description, rating } = req.body;
    rating = parseInt(rating);
    if (!title) {
      logger.error("title is required");
      return res.status(400).send("title is required");
    }
    if (!url) {
      logger.error("url is required");
      return res.status(400).send("url is required");
    }
    if (!url.includes("http")) {
      logger.error("url must start with http");
      return res.status(400).send("url must start with http");
    }
    if (!description) {
      logger.error("description is required");
      return res.status(400).send("description is required");
    }
    if (Number.isNaN(rating) === true) {
      logger.error("rating must be a number");
      return res.status(400).send("rating must be a number");
    }
    if (!rating) {
      logger.error("rating is required");
      return res.status(400).send("rating is required");
    }
    if (rating < 1 || rating > 5) {
      logger.error("rating must be between 1 and 5");
      return res.status(400).send("rating must be between 1 and 5");
    }

    let newBookmark = {
      title,
      url,
      description,
      rating,
    };
    bookmarkSerivice
      .insertBookmark(req.app.get("db"), newBookmark)
      .then((bookmark) => {
        res
          .status(201)
          .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
          .json({ id: bookmark.id });
      });
  });

bookmarkRouter
  .route("/:bookmarkId")
  .get((req, res, next) => {
    let { bookmarkId } = req.params;

    bookmarkSerivice
      .getBookmarkById(req.app.get("db"), bookmarkId)
      .then((bookmark) => {
        if (!bookmark) {
          return res.status(404).send("Bookmark not found");
        }
        res.json(convertBookmarks(bookmark));
      })
      .catch(next);
  })
  .delete((req, res) => {
    let { bookmarkId } = req.params;
    bookmarkSerivice
      .deleteBookmark(req.app.get("db"), bookmarkId)
      .then((bookmark) => {
        if (!bookmark) {
          return res.status(404).send("Bookmark not found");
        }
        res.status(204).end();
      });
  })
  .patch((req, res, next) => {
    let { bookmarkId } = req.params;
    const { title, url, description, rating } = req.body;
    const newData = { title, url, description, rating }
    bookmarkSerivice
      .patchBookmark(req.app.get('db'), bookmarkId, newData)
      .then((bookmark) => {
        if (!bookmark) {
          return res.status(404).send("Bookmark not found");
        }
        res.status(204).end();
      })
      .catch(next)
  })

module.exports = bookmarkRouter;
