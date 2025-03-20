const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({
  source: {
    id: String,
    name: String,
  },
  author: String,
  title: {
    type: String,
    required: [true, "News must have a title"],
  },
  description: String,
  url: {
    type: String,
    required: [true, "News must have a URL"],
  },
  urlToImage: String,
  publishedAt: Date,
  content: {
    type: String,
    required: [true, "News must have content"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const News = mongoose.model("News", newsSchema);
module.exports = News;
