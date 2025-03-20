const News = require("../models/newsModel");
const catchAsync = require("../utils/catchAsync");
const axios = require("axios");
const { Readability } = require("@mozilla/readability");
const NEWS_API_URL = "https://newsapi.org/v2/everything";
const { JSDOM } = require("jsdom");

exports.getAllNews = catchAsync(async (req, res, next) => {
  let { page = 1, limit = 5 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const skip = (page - 1) * limit;
  const news = await News.find()
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalNews = await News.countDocuments();
  const totalPages = Math.ceil(totalNews / limit);

  res.status(200).json({
    status: "success",
    page,
    totalPages,
    totalNews,
    data: news,
  });
});

exports.getNewsById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  try {
    const news = await News.findById(id);

    if (!news) {
      return res
        .status(404)
        .json({ status: "fail", message: "News not found" });
    }

    res.status(200).json({
      status: "success",
      data: news,
    });
  } catch (error) {
    console.error("❌ Error fetching news by ID:", error.message);
    res.status(500).json({ status: "fail", message: "Failed to fetch news" });
  }
});


exports.getNewsContent = catchAsync(async (req, res, next) => {
  const news = await News.findById(req.params.id);

  if (!news) {
    return res.status(404).json({ status: "fail", message: "News not found" });
  }

  console.log("News Content:", news.content);

  res.status(200).json({
    status: "success",
    data: { content: news.content },
  });
});


exports.createNews = catchAsync(async (req, res, next) => {
  const newNews = await News.create({
    title: req.body.title,
    content: req.body.content,
    author: req.user.id, 
  });

  res.status(201).json({ status: "success", data: newNews });
});


exports.updateNews = catchAsync(async (req, res, next) => {
  const updatedNews = await News.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedNews) {
    return res.status(404).json({ status: "fail", message: "News not found" });
  }

  res.status(200).json({ status: "success", data: updatedNews });
});


exports.deleteNews = catchAsync(async (req, res, next) => {
  const deletedNews = await News.findByIdAndDelete(req.params.id);

  if (!deletedNews) {
    return res.status(404).json({ status: "fail", message: "News not found" });
  }

  res.status(204).json({ status: "success", data: null });
});


exports.fetchAndStoreNews = catchAsync(async (req, res, next) => {
  const NEWS_API_KEY = process.env.NEWS_API;

  try {
    const response = await axios.get(NEWS_API_URL, {
      params: {
        q: "technology", 
        sortBy: "publishedAt",
        apiKey: NEWS_API_KEY,
        language: "en",
        pageSize: 5, 
      },
    });

    const articles = response.data.articles || [];
    if (articles.length === 0) {
      return res
        .status(404)
        .json({ status: "fail", message: "No articles found" });
    }

    let newsDocs = [];

    for (const article of articles) {
      try {
        console.log(`🔗 Fetching article from: ${article.url}`);


        const articleResponse = await axios.get(article.url);
        const dom = new JSDOM(articleResponse.data, { url: article.url });


        const reader = new Readability(dom.window.document);
        const parsedArticle = reader.parse();

        const fullContent =
          parsedArticle?.textContent || "Failed to extract content.";


        const newsData = {
          source: {
            id: article.source.id || null,
            name: article.source.name || "Unknown",
          },
          author: article.author || "Unknown",
          title: article.title,
          description: article.description,
          url: article.url,
          urlToImage: article.urlToImage,
          publishedAt: article.publishedAt,
          content: fullContent, 
        };

        newsDocs.push(newsData);
      } catch (scrapeError) {
        console.error(
          `❌ Error scraping article: ${article.url}`,
          scrapeError.message
        );
      }
    }


    if (newsDocs.length > 0) {
      const insertedNews = await News.insertMany(newsDocs);
      res.status(200).json({
        status: "success",
        totalInserted: insertedNews.length,
        data: insertedNews,
      });
    } else {
      res
        .status(500)
        .json({ status: "fail", message: "Failed to fetch & scrape articles" });
    }
  } catch (error) {
    console.error(
      "❌ Error fetching news:",
      error.response?.data || error.message
    );
    res.status(500).json({ status: "fail", message: "Failed to fetch news" });
  }
});
