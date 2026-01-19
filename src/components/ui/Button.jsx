// Filename: src/components/ui/Button.jsx
import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Button component with standardized variants and loading states.
 * * @param {string} variant - 'primary' | 'secondary' | 'danger'
 * @param {boolean} isLoading - Replaces content with a spinner and disables interaction
 * @param {React.ReactNode} icon - Optional icon to render before children
 */
export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  className, 
  disabled, 
  isLoading = false,
  type = 'button',
  title,
  icon: Icon
}) {
  const baseStyles = "relative flex items-center justify-center px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";
  
  const variants = {
    // Brand Green (Forest)
    primary: "bg-indigo-700 text-white hover:bg-indigo-800 shadow-md shadow-indigo-200 focus:ring-indigo-500",
    
    // Neutral Gray
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:ring-gray-400",
    
    // Destructive Red
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200 focus:ring-red-500",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button 
      type={type}
      onClick={isDisabled ? undefined : onClick} 
      className={clsx(baseStyles, variants[variant], className)}
      disabled={isDisabled}
      title={title}
      aria-disabled={isDisabled}
    >
      {/* Loading State Overlay */}
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin" />
        </span>
      )}

      {/* Content (Hidden when loading to maintain width) */}
      <span className={clsx("flex items-center gap-2", isLoading ? "invisible" : "visible")}>
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </span>
    </button>
  );
}