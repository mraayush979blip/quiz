import { GoogleGenAI, Type } from "@google/genai";
import { GeneratorConfig } from "../types";

// YOUR SHARED API KEY
// IMPORTANT: Restrict this key in Google Cloud Console to your specific domains (HTTP Referrers)
const DEFAULT_API_KEY = "AIzaSyCQOaKrf3o3JfBsgd3bOW0dnVAZYoyXUGo";

// Helper to clean Base64 strings
const cleanBase64 = (base64: string) => {
  const base64Data = base64.split(',')[1];
  return base64Data || base64;
};

// Helper to clean JSON output from Gemini (strips markdown code blocks)
const cleanJsonText = (text: string) => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
};

export const generateContent = async (config: GeneratorConfig, userApiKey?: string) => {
  // Use user's key if provided, otherwise use the default shared key
  const finalApiKey = userApiKey || DEFAULT_API_KEY;

  if (!finalApiKey) {
    throw new Error("Configuration Error: No API Key found.");
  }

  const ai = new GoogleGenAI({ apiKey: finalApiKey });
  
  const modelName = 'gemini-2.5-flash';

  const parts: any[] = [];
  
  if (config.file) {
    parts.push({
      inlineData: {
        mimeType: config.file.mimeType,
        data: cleanBase64(config.file.base64)
      }
    });
  }

  let systemPrompt = `You are an expert tutor AI. Your goal is to help the user learn about: "${config.topic}". 
  The difficulty level is: ${config.difficulty}. `;

  let promptText = "";
  let responseSchema = undefined;
  let responseMimeType = undefined;

  switch (config.goal) {
    case 'quiz':
      systemPrompt += `Create a multiple-choice quiz with exactly ${config.count} questions based on the topic/file provided. Assign a difficulty level (easy, medium, hard) to EACH question based on its complexity.`;
      promptText = `Generate ${config.count} quiz questions with difficulty ratings.`;
      responseMimeType = "application/json";
      responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "A list of 4 possible answers" 
            },
            correctAnswer: { 
              type: Type.STRING,
              description: "Must be exactly one of the strings from the options array"
            },
            explanation: { type: Type.STRING, description: "Why the answer is correct" },
            difficulty: { 
              type: Type.STRING, 
              enum: ["easy", "medium", "hard"],
              description: "The difficulty level of this specific question"
            }
          },
          required: ["question", "options", "correctAnswer", "explanation", "difficulty"]
        }
      };
      break;

    case 'flashcards':
      systemPrompt += `Create a set of exactly ${config.count} flashcards based on key concepts from the topic/file.`;
      promptText = `Generate ${config.count} flashcards.`;
      responseMimeType = "application/json";
      responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING, description: "Term or Question" },
            back: { type: Type.STRING, description: "Definition or Answer" }
          },
          required: ["front", "back"]
        }
      };
      break;

    case 'simplify':
      systemPrompt += "Explain the topic/file in simple terms suitable for a beginner or a 5-year old (ELI5). Use analogies.";
      promptText = "Provide a simplified explanation in Markdown format. Use headings, bullet points, and bold text for emphasis.";
      responseMimeType = "text/plain";
      break;

    case 'deep_dive':
      systemPrompt += "Provide a comprehensive, academic-level deep dive into the topic/file. Include historical context, advanced concepts, and future implications.";
      promptText = "Provide a deep dive analysis in Markdown format. Structure it like an article.";
      responseMimeType = "text/plain";
      break;
  }

  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: responseMimeType,
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    const textOutput = response.text;

    if (!textOutput) throw new Error("No response from Gemini");

    if (config.goal === 'quiz' || config.goal === 'flashcards') {
      try {
        const cleanedText = cleanJsonText(textOutput);
        return JSON.parse(cleanedText);
      } catch (e) {
        console.error("JSON Parse Error:", e, "Raw Output:", textOutput);
        throw new Error("AI generated invalid JSON. Please try again.");
      }
    }

    return textOutput;
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};