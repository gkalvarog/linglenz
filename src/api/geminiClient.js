// Filename: src/api/geminiClient.js
import { supabase } from './supabaseClient';

/**
 * Invokes the serverless Edge Function to analyze text.
 * Implements a "Safe Fallback" pattern to prevent UI crashes.
 * * @param {string} sentence - The student's raw input.
 * @param {string} language - The target language context.
 * @returns {Promise<Object>} - Standardized correction object.
 */
export async function checkStudentSentence(sentence, language) {
  const DEFAULT_ERROR_RESPONSE = {
    is_correct: false,
    corrected_sentence: "Analysis Unavailable",
    explanation: "We could not connect to the AI service at this moment. Please check your internet connection.",
    categories: ["System Error"]
  };

  try {
    // 1. Validate Input
    if (!sentence || typeof sentence !== 'string') {
      console.warn("GeminiClient: Invalid input provided.");
      return DEFAULT_ERROR_RESPONSE;
    }

    // 2. Invoke Edge Function
    // We use 'invoke' which handles the HTTP POST and Auth headers automatically
    const { data, error } = await supabase.functions.invoke('check-sentence', {
      body: { 
        sentence: sentence.trim(), 
        language: language || 'English' 
      }
    });

    // 3. Handle Network/Function Errors
    if (error) {
      throw new Error(`Edge Function Error: ${error.message}`);
    }

    // 4. Return Validated Data
    return data || DEFAULT_ERROR_RESPONSE;

  } catch (error) {
    console.error('Gemini API Critical Failure:', error);
    
    // Return safe fallback so the UI doesn't break
    return {
      ...DEFAULT_ERROR_RESPONSE,
      // If we have specific error details (like "Rate Limit"), we could expose them here
      explanation: "AI Service is temporarily unavailable. Your mistake has been logged locally." 
    };
  }
}