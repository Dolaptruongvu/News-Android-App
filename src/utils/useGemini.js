const BACKEND_SUMMARIZE_URL = 'http://10.0.2.2:5000/api/v1/news/summarize';

export const summarizeContent = async content => {
  if (!content || content.trim() === '') {
    return 'Content was empty, nothing to summarize.';
  }
  try {
    const response = await fetch(BACKEND_SUMMARIZE_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({contentToSummarize: content}),
    });
    const data = await response.json();
    if (!response.ok) {
      return `Error from backend: ${data?.message || response.statusText}`;
    }
    return data?.summary || 'No summary available from backend.';
  } catch (error) {
    console.error('[CLIENT_SUMMARIZE] Network/Fetch Error:', error);
    return 'Unable to connect to summarization service.';
  }
};
