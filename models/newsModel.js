const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({
  title: { type: String, required: [true, "News must have a title"] },
  content: { type: String, required: [true, "News must have content"] },
  author: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const News = mongoose.model("News", newsSchema);
module.exports = News;
