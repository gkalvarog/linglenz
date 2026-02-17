// Filename: src/api/geminiClient.js
import { supabase } from './supabaseClient';

export async function checkStudentSentence(sentence, language) {
  // 1. Validate Input
  if (!sentence || typeof sentence !== 'string') {
    throw new Error("Invalid input provided");
  }

  try {
    // 2. Invoke Edge Function
    const { data, error } = await supabase.functions.invoke('check-sentence', {
      body: { 
        sentence: sentence.trim(), 
        language: language || 'English' 
      }
    });

    // 3. Handle Network Errors (Supabase connectivity issues)
    if (error) {
      console.error("🔥 Network/Supabase Error:", error);
      throw new Error(error.message || "Edge Function Connection Failed");
    }

    // 4. Handle "Paranoid Debugger" Errors (The critical part!)
    // If the server sent back an error message inside the data, show it!
    if (data && data.error) {
        console.error("💀 Backend Logic Error:", data.error);
        // This ALERT is what we need to see!
        alert(`DEBUG ERROR FROM SERVER:\n\n${data.error}`); 
        throw new Error(data.error);
    }

    // 5. Validate AI Response Structure
    if (!data || (typeof data.is_correct === 'undefined' && !data.corrected_sentence)) {
        console.error("⚠️ Invalid Data Shape:", data);
        throw new Error("AI returned unreadable data.");
    }

    return data;

  } catch (error) {
    console.error('Gemini Client Failure:', error);
    throw error;
  }
}