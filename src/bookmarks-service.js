const bookmarks = require("./dataStore");

const bookmarksService = {
  getAllbookmarks(db) {
    return db.select("*").from("bookmarks");
  },
};

module.exports = bookmarksService;
