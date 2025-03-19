const News = require("../models/newsModel");

exports.getAllNews = async (req, res) => {
  const news = await News.find().populate("author");
  res.status(200).json({ status: "success", data: news });
};
