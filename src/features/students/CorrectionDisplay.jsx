// Filename: src/features/students/CorrectionDisplay.jsx
import React from 'react';

/**
 * Visualizes the difference between the student's mistake and the correction.
 * Uses semantic <del> and <ins> tags for accessibility.
 */
export function CorrectionDisplay({ original, corrected }) {
  // Edge case: If strings are identical, just show one green line
  if (original === corrected) {
    return (
      <div className="text-green-700 font-medium">
        {corrected}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1 text-base leading-relaxed">
      {/* The Mistake (Strikethrough) */}
      <del 
        className="text-red-500 line-through decoration-red-300 opacity-70 decoration-2 italic"
        aria-label={`Incorrect: ${original}`}
      >
        {original}
      </del>
      
      {/* The Correction (Highlight) */}
      <ins 
        className="text-green-800 font-bold bg-green-100/80 px-2 py-0.5 rounded no-underline shadow-sm border border-green-200"
        aria-label={`Corrected: ${corrected}`}
      >
        {corrected}
      </ins>
    </div>
  );
}