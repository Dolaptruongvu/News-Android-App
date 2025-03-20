const GEMINI_API_KEY = 'AIzaSyByqG57Bzks_dzvVD5CD3Vo9x1Zr1Id2uE';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export const summarizeContent = async content => {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {text: `Summarize the following text in English:\n\n${content}`},
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No summary available.'
    );
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return 'Error generating summary.';
  }
};
