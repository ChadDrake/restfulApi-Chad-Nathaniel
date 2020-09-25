const bookmarks = require("./dataStore");
const bookmarksService = {
  getAllBookmarks(db) {
    return db.select("*").from("bookmarks");
  },

  getBookmarkById(db, id) {
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

  deleteBookmark(db, id) {
    return db("bookmarks").where("id", id).delete();
  },
  
  patchBookmark(db, id, newData){
    return db('bookmarks')
      .where('id', id)
      .update(newData)
  }
};

module.exports = bookmarksService;
