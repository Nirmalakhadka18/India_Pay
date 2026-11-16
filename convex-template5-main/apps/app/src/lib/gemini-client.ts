import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini client once and reuse it
// Set GEMINI_API_KEY (or GOOGLE_API_KEY) in your .env.local file
const client = new GoogleGenAI({});

export { client };
