import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set. Please add it to your environment variables.");
} else {
  console.log("GEMINI_API_KEY is set.");
}

const systemPrompt = `
You are a flashcard creator. Your task is to generate concise and effective flashcards based on the given topic or content. Follow these guidelines.

1. Create clear and concise questions for the front of the flashcard.
2. Provide accurate and informative answers for the back of the flashcard.
3. Ensure that each flashcard focuses on a single concept or piece of information.
4. Use simple language to make the flashcards accessible to a wide range of learners.
5. Include a variety of question types, such as definitions, examples, comparisons, and applications.
6. Avoid overly complex or ambiguous phrasing in both questions and answers.
7. When appropriate, use mnemonics or memory aids to help reinforce the information.
8. Tailor the difficulty level of the flashcards to the user's specified preferences.
9. If given a body of text, extract the most important and relevant information for the flashcards.
10. Aim to create a balanced set of flashcards that covers the topic comprehensively.

Remember the goal is to facilitate effective learning and retention of information through these flashcards.

Return in the following JSON format:
{
  "flashcards": [
    {
      "front": "str",
      "back": "str"
    }
  ]
}
`;

export async function POST(req) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  try {
    const data = await req.json();
    console.log("Received data:", data);

    if (!data.prompt) {
      throw new Error("No prompt provided");
    }

    console.log("Calling Gemini API with prompt:", data.prompt);

    let completion;
    try {
      completion = await model.generateContent([
        systemPrompt,
        `Generate flashcards for the topic: ${data.prompt}`
      ]);
      console.log("API call succeeded:", completion);
    } catch (apiError) {
      console.error("API call failed:", apiError);
      throw new Error("Failed to contact Gemini API: " + apiError.message);
    }

    console.log("Complete API response:", completion);

    const messageContent = await completion.response.text(); // Make sure this is correct
    console.log("Message content:", messageContent);

    if (!messageContent) {
      throw new Error("Invalid response from Gemini API");
    }

    let flashCards;
    try {
      flashCards = JSON.parse(messageContent);
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      console.error("Raw response content:", messageContent); // Log the raw response for debugging
      throw new Error("Failed to parse the response from Gemini API.");
    }

    if (!flashCards || !flashCards.flashcards) {
      throw new Error("Invalid response format from Gemini API");
    }

    return NextResponse.json({ flashcards: flashCards.flashcards });
  } catch (error) {
    console.error("Error generating flashcards:", error.message);
    return NextResponse.json({ error: error.message || "Failed to generate flashcards." }, { status: 500 });
  }
}
