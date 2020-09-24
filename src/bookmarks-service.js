const bookmarks = require("./dataStore");
const bookmarksService = {
  getAllBookmarks(db) {
    return db.select("*").from("bookmarks");
  },

  getBookmarkById(db, id) {
    console.log(id);
    return db("bookmarks").select("*").where("id", id).first();
  },
  insertBookmark(db, newBookmark) {
    return db("bookmarks")
      .insert(newBookmark)
      .returning("*")
      .then((bookmark) => {
        return bookmark[0];
      });
  },
};

module.exports = bookmarksService;
