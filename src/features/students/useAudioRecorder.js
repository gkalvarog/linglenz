// Filename: src/features/students/useAudioRecorder.js
import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage MediaRecorder state, stream capture, and API upload.
 * * @param {Object} session - The active Supabase auth session.
 * @param {string} studentLanguage - The target language for the AI context.
 * @param {Function} onMistakeDetected - Callback when AI finds an error.
 */
export function useAudioRecorder(session, studentLanguage, onMistakeDetected) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs ensure we maintain values without triggering re-renders
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Configuration - Fail Fast if missing
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const supabaseUrl = projectId 
    ? `https://${projectId}.supabase.co/functions/v1/transcribe`
    : null;

  /**
   * Processes the collected audio chunks and sends them to the Edge Function.
   */
  const processAudio = useCallback(async () => {
    // Guard clauses
    if (audioChunksRef.current.length === 0) return;
    if (!session?.access_token) {
      console.warn("AudioRecorder: No active session token.");
      return;
    }
    if (!supabaseUrl) {
      console.error("AudioRecorder: Missing Supabase Project ID in env vars.");
      return;
    }

    setIsProcessing(true);

    try {
      // Create Blob. Note: We use 'audio/webm' as a standard, but the Edge Function 
      // should be robust enough to handle the binary stream regardless.
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Clear chunks immediately to prepare for next segment
      audioChunksRef.current = []; 

      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        if (!reader.result) {
          setIsProcessing(false);
          return;
        }

        // Extract raw base64 string (remove "data:audio/webm;base64," prefix)
        const base64Audio = reader.result.split(',')[1];

        // API Call
        const response = await fetch(supabaseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            audioData: base64Audio, 
            studentLanguage: studentLanguage || 'English' 
          }),
        });

        if (!response.ok) {
           throw new Error(`Edge Function Error: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Only trigger callback if logic was successfully executed
        if (result && !result.is_correct) {
          onMistakeDetected(result);
        }
      };
      
      reader.onerror = (err) => {
        console.error("Audio FileReader Error:", err);
        setIsProcessing(false);
      };

    } catch (error) {
      console.error("Audio Processing Exception:", error);
    } finally {
      // Always ensure we unset the processing flag
      setIsProcessing(false);
    }
  }, [session, studentLanguage, supabaseUrl, onMistakeDetected]);

  /**
   * Initializes the microphone stream and MediaRecorder.
   */
  const startListening = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Audio recording is not supported in this browser context (Secure Context required).");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine supported mimeType
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? { mimeType: 'audio/webm;codecs=opus' } 
        : undefined;

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      // Slice audio every 4000ms (4 seconds) for analysis
      // This balances latency vs context for the AI
      recorder.start(4000); 

      recorder.addEventListener("dataavailable", event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          processAudio();
        }
      });
      
      recorder.onerror = (e) => console.error("MediaRecorder Error:", e);

      setIsListening(true);
      console.log("AudioRecorder: Started");

    } catch (err) {
      console.error("Microphone Access Denied or Error:", err);
      alert("Could not access microphone. Please check your system permissions.");
    }
  }, [processAudio]);

  /**
   * Stops the recording and releases hardware resources.
   */
  const stopListening = useCallback(() => {
    // 1. Stop Recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // 2. Stop All Tracks (Crucial for turning off the hardware light)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsListening(false);
    console.log("AudioRecorder: Stopped");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return { 
    isListening, 
    isProcessing, 
    startListening, 
    stopListening 
  };
}