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

  try {
    const escapedQuestion = question.replace(/'/g, "''").replace(/\\/g, "\\\\");
    const query = `
      SELECT chunk_content
      FROM ${knowledgeBaseName}
      WHERE content = '${escapedQuestion}'
      LIMIT 5;
    `;

    console.log(" Querying MindsDB KB:", query);
    mindsdbResult = await MindsDB.SQL.runQuery(query);
    console.log(
      " MindsDB KB Raw Result:",
      JSON.stringify(mindsdbResult, null, 2)
    );

    if (mindsdbResult?.type === "error") {
      console.error(" MindsDB Query Error:", mindsdbResult.error_message);
      throw new Error(mindsdbResult.error_message || "MindsDB query failed");
    }

    if (mindsdbResult?.rows?.length > 0) {
      context = mindsdbResult.rows
        .map((row) => row.chunk_content)
        .filter((content) => content != null && content.trim() !== "")
        .join("\n\n---\n\n");

      if (!context) {
        console.log(" No valid chunk_content found in the result.");
        context = "Relevant information not found in the knowledge base.";
      } else {
        console.log("Context for Gemini prepared.");
      }
    } else {
      console.log(" Context not found (0 rows).");
      context = "Relevant information not found in the knowledge base.";
    }
  } catch (error) {
    console.error(" Error querying MindsDB:", error.message || error);
    context = "An error occurred while retrieving context.";
  }

  try {
    let prompt;

    if (
      context &&
      !context.startsWith("An error occurred") &&
      !context.startsWith("Relevant information not found")
    ) {
      prompt = `You are an AI assistant for a news application. Your primary goal is to answer questions based *exclusively* on the provided news context.
Strictly adhere to the following instructions:
1. Your answer MUST be derived *only* from the 'Context' section below.
2. Do NOT use any external knowledge, personal opinions, or information not present in the context.
3. Do NOT apologize or offer to search elsewhere if the information is not in the context.
4. Answer in English.

Context:
"""
${context}
"""

Question: ${question}

Answer:`;
    } else {
      prompt = `${context}. Dựa trên kiến thức chung, hãy trả lời câu hỏi: ${question}`;
    }

    console.log("✨ Sending prompt to Gemini...");
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    console.log("Gemini Answer Received.");
    res.status(200).json({ status: "success", answer: answer });
  } catch (error) {
    console.error("Error calling Gemini API:", error.message || error);
    return next(new AppError("Could not generate AI answer.", 500));
  }
});

exports.summarizeContent = catchAsync(async (req, res, next) => {
  const { contentToSummarize } = req.body;

  if (
    !contentToSummarize ||
    typeof contentToSummarize !== "string" ||
    contentToSummarize.trim() === ""
  ) {
    return next(
      new AppError(
        "Please provide 'contentToSummarize' in the request body.",
        400
      )
    );
  }

  if (!geminiInitialized || !geminiModel) {
    console.error(
      "Attempted to summarize when Gemini model is not initialized."
    );
    return next(
      new AppError(
        "AI summarization service is not ready. Please try again later.",
        503
      )
    );
  }

  try {
    const prompt = `Please summarize the following text concisely:\n\n"""\n${contentToSummarize}\n"""`;

    console.log("✨ Sending summarization prompt to Gemini...");

    const result = await geminiModel.generateContent(prompt);
    const geminiResponse = await result.response;
    const summaryText = geminiResponse.text();

    if (!summaryText || summaryText.trim() === "") {
      console.warn("⚠️ Gemini returned an empty summary.");
      return res.status(200).json({
        status: "success",
        summary: "Could not generate a summary for the provided content.",
        message: "AI model returned an empty summary.",
      });
    }

    console.log("✅ Summary received from Gemini.");
    res.status(200).json({
      status: "success",
      summary: summaryText,
    });
  } catch (error) {
    console.error(
      "❌ Error calling Gemini API for summarization:",
      error.message || error
    );
    if (error.response && error.response.data) {
      console.error("Gemini Error Details:", error.response.data);
    }
    let userMessage = "Could not generate summary due to an AI service error.";
    if (error.message && error.message.includes("RESOURCE_EXHAUSTED")) {
      userMessage = "The AI service is currently busy. Please try again later.";
    } else if (
      error.message &&
      error.message.toLowerCase().includes("safety")
    ) {
      userMessage =
        "The content could not be summarized due to safety concerns.";
    }

    return next(new AppError(userMessage, 500));
  }
});
