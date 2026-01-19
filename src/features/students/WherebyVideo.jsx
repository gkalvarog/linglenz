// Filename: src/features/students/WherebyVideo.jsx
import React, { useMemo } from 'react';

// Memoize to prevent iframe reloads on parent renders
export const WherebyVideo = React.memo(function WherebyVideo({ sessionId, teacherName, onRoomUrlChange }) {
  
  // Construct URL with memoization to ensure stable references
  const roomUrl = useMemo(() => {
    const baseUrl = `https://demo.whereby.com/linglenz-${sessionId}`;
    const params = new URLSearchParams({
      displayName: teacherName,
      minimal: 'on', // Optimizes UI for embedding
      // Additional parameters can be added here (e.g., locking)
    });
    const fullUrl = `${baseUrl}?${params.toString()}`;
    
    // Notify parent of the URL for "Copy Link" features
    // We use a timeout to avoid "update during render" warnings in React
    if (onRoomUrlChange) {
      setTimeout(() => onRoomUrlChange(fullUrl), 0);
    }
    
    return fullUrl;
  }, [sessionId, teacherName, onRoomUrlChange]);

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
      <iframe
        src={roomUrl}
        className="w-full h-full border-none"
        allow="camera; microphone; fullscreen; speaker; display-capture"
        referrerPolicy="no-referrer"
        title={`Classroom Session ${sessionId}`}
        loading="lazy"
      />
    </div>
  );
});