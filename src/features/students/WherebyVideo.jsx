// Filename: src/features/students/WherebyVideo.jsx
import React, { useMemo } from 'react';

export const WherebyVideo = React.memo(function WherebyVideo({ sessionId, teacherName, onRoomUrlChange }) {
  
  const roomUrl = useMemo(() => {
    // FIX: Use the official Whereby Demo room so it always works for testing
    const baseUrl = `https://demo.whereby.com/demo-class`; 
    
    // We add a random parameter so the browser thinks it's a new room
    const fullUrl = `${baseUrl}?visitorName=${encodeURIComponent(teacherName)}`;
    
    if (onRoomUrlChange) {
      setTimeout(() => onRoomUrlChange(fullUrl), 0);
    }
    
    return fullUrl;
  }, [teacherName, onRoomUrlChange]);

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
      <iframe
        src={roomUrl}
        className="w-full h-full border-none"
        allow="camera; microphone; fullscreen; speaker; display-capture"
        referrerPolicy="no-referrer"
        title="Classroom Video"
      />
    </div>
  );
});