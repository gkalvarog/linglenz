// Filename: supabase/functions/check-sentence/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    console.log("1. Request Received");
    const { sentence, language } = await req.json()
    const API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!API_KEY) throw new Error("Server Misconfiguration: Missing API Key");

    // --- SENIOR ARCHITECT STRATEGY: THE GEMINI 2.5 WATERFALL ---
    // Using the official models from your documentation (Feb 2026)
    const models = [
        'gemini-2.5-flash',       // 1. Stable Standard
        'gemini-2.5-flash-lite',  // 2. High Throughput Backup
        'gemini-2.5-pro'          // 3. Advanced Reasoning Fallback
    ];

    let successData = null;
    let lastError = null;

    for (const model of models) {
        try {
            console.log(`Trying Model: ${model}...`);
            successData = await callGemini(API_KEY, model, sentence, language);
            console.log(`✅ SUCCESS with ${model}`);
            break; // Stop looping, we found a winner
        } catch (err) {
            console.warn(`⚠️ FAILED ${model}: ${err.message}`);
            lastError = err;
            // Continue to next model in the list
        }
    }

    if (!successData) {
        console.error("❌ ALL MODELS FAILED.");
        throw lastError || new Error("All AI models are currently unavailable.");
    }

    return new Response(successData, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("FUNCTION FAIL:", error.message);
    // Keep 200 OK for the frontend debugger to read the message
    return new Response(JSON.stringify({ 
        error: error.message, 
        debug: "Check Supabase Logs for Waterfall details" 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, 
    });
  }
});

// Helper to keep the main logic clean
async function callGemini(apiKey, model, sentence, language) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const prompt = `Act as a strict language tutor. Analyze this sentence: "${sentence}".
    Target Language: ${language || 'English'}.
    
    Return ONLY a JSON object (no markdown) with: { "is_correct": boolean, "corrected_sentence": string, "explanation": string, "categories": string[] }`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();

    // Catch specific Google API errors (Quota, Not Found, etc)
    if (data.error) throw new Error(`Google Error: ${data.error.message}`);
    if (!data.candidates || !data.candidates[0]) throw new Error("Empty response");

    const rawText = data.candidates[0].content.parts[0].text;
    return rawText.replace(/```json/g, '').replace(/```/g, '').trim();
}