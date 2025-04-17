const News = require("../models/newsModel");
const catchAsync = require("../utils/catchAsync");
const axios = require("axios");
const { Readability } = require("@mozilla/readability");
const NEWS_API_URL = "https://newsapi.org/v2/everything";
const { JSDOM } = require("jsdom");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const AppError = require("../utils/appError");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let geminiModel; // Declare the model variable
let geminiInitialized = false; // <<< **** DECLARE THE FLAG HERE ****

console.log(process.env.GEMINI_API_KEY);

try {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ FATAL: GEMINI_API_KEY environment variable is not set.");
    // Optionally throw error to stop server: throw new Error("GEMINI_API_KEY missing");
  } else {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log("✨ Gemini Client Initialized");
    geminiInitialized = true; // <<< **** SET THE FLAG HERE ON SUCCESS ****
  }
} catch (error) {
  console.error("❌ Failed to initialize Gemini client:", error);
  geminiModel = null; // Ensure model is null on failure
  geminiInitialized = false; // <<< **** ENSURE FLAG IS FALSE ON FAILURE ****
}

const MindsDB = require("mindsdb-js-sdk").default; // Use .default for CommonJS

let mindsdbConnected = false; // Flag to track connection

// Wrap the connection logic in an async IIFE (Immediately Invoked Async Function Expression)
(async () => {
  try {
    const hostUrl = `http://${process.env.MINDSDB_HOST || "127.0.0.1"}:${
      process.env.MINDSDB_PORT || 47334
    }`;
    console.log(`🧠 Attempting to connect MindsDB SDK to: ${hostUrl}`);

    await MindsDB.connect({
      host: hostUrl,
    });

    console.log("✅ MindsDB SDK connected successfully.");
    mindsdbConnected = true; // Set flag on success
  } catch (error) {
    // Failed to connect to local instance
    console.error("❌ Failed to connect MindsDB SDK:", error);
    mindsdbConnected = false; // Ensure flag is false on error
  }
})(); // Immediately execute the async function

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

exports.queryKnowledgeBase = catchAsync(async (req, res, next) => {
  const { question } = req.body;
  const knowledgeBaseName = "news_kb_lc";

  // 1. Basic checks
  if (!question || typeof question !== "string" || question.trim() === "") {
    return next(new AppError("Please provide a 'question'.", 400));
  }
  if (!mindsdbConnected) {
    return next(new AppError("Knowledge base service is not ready.", 503));
  }
  if (!geminiInitialized || !geminiModel) {
    return next(new AppError("AI service is not ready.", 503));
  }

  let context = "";
  let mindsdbResult = null;

  // 2. Query MindsDB
  try {
    // Escape single quotes and backslashes for SQL query
    const escapedQuestion = question.replace(/'/g, "''").replace(/\\/g, "\\\\");
    const query = `
      SELECT chunk_content
      FROM ${knowledgeBaseName}
      WHERE content = '${escapedQuestion}'
      LIMIT 5;
    `;

    console.log(" Querying MindsDB KB:", query);
    mindsdbResult = await MindsDB.SQL.runQuery(query); // Assuming MindsDB SDK is initialized
    console.log(
      " MindsDB KB Raw Result:",
      JSON.stringify(mindsdbResult, null, 2)
    );

    if (mindsdbResult?.type === "error") {
      // Log the specific error message from MindsDB if available
      console.error(" MindsDB Query Error:", mindsdbResult.error_message);
      throw new Error(mindsdbResult.error_message || "MindsDB query failed");
    }

    // 3. Prepare Context for Gemini
    if (mindsdbResult?.rows?.length > 0) {
      context = mindsdbResult.rows
        .map((row) => row.chunk_content) // Get chunk_content
        .filter((content) => content != null && content.trim() !== "") // Filter out null/empty
        .join("\n\n---\n\n"); // Join the chunks

      if (!context) {
        console.log(" No valid chunk_content found in the result.");
        context = "Relevant information not found in the knowledge base."; // English context
      } else {
        console.log("Context for Gemini prepared.");
      }
    } else {
      console.log(" Context not found (0 rows).");
      context = "Relevant information not found in the knowledge base."; // English context
    }
  } catch (error) {
    console.error(" Error querying MindsDB:", error.message || error);
    context = "An error occurred while retrieving context."; // English context
  }

  // 4. Call Gemini
  try {
    let prompt;
    // Check if context is valid and not an error/not-found message
    if (
      context &&
      !context.startsWith("An error occurred") &&
      !context.startsWith("Relevant information not found")
    ) {
      // Keep the Vietnamese prompt structure
      prompt = `Dựa *chỉ* vào ngữ cảnh sau đây, hãy trả lời câu hỏi. Trả lời bằng tiếng anh. Nếu ngữ cảnh không đủ thông tin, hãy nói vậy.

Ngữ cảnh:
"""
${context}
"""

Câu hỏi: ${question}

Trả lời:`;
    } else {
      // Fallback prompt if context is missing or indicates an issue
      // Keep the Vietnamese part of the prompt
      prompt = `${context}. Dựa trên kiến thức chung, hãy trả lời câu hỏi: ${question}`;
    }

    console.log("✨ Sending prompt to Gemini...");
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const answer = response.text(); // Ensure this method exists and returns text

    console.log("Gemini Answer Received."); // Using checkmark for consistency if desired
    res.status(200).json({ status: "success", answer: answer });
  } catch (error) {
    // Log the specific error from Gemini API call
    console.error("Error calling Gemini API:", error.message || error);
    return next(new AppError("Could not generate AI answer.", 500));
  }
});
