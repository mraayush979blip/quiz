
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratorConfig } from "../types";

// INTERNAL KEY - Hidden from User UI
const INTERNAL_API_KEY = "AIzaSyBtAiQznbRhnRRZPrWf3wb2vBRsrfcXCdA";

// Helper to clean Base64 strings
const cleanBase64 = (base64: string) => {
  const base64Data = base64.split(',')[1];
  return base64Data || base64;
};

export const generateContent = async (config: GeneratorConfig) => {
  const ai = new GoogleGenAI({ apiKey: INTERNAL_API_KEY });
  
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
      return JSON.parse(textOutput);
    } catch (e) {
      console.error("JSON Parse Error", e);
      throw new Error("Failed to parse AI response as JSON");
    }
  }

  return textOutput;
};
