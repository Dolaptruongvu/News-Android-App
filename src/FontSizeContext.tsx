// src/FontSizeContext.tsx
import React, { createContext, useState, useContext } from 'react';

// Create a context to store font size state
const FontSizeContext = createContext({
  fontSize: 16, // Default font size
  toggleFontSize: () => {}, // Function to toggle font size
});

// Provider component to wrap the entire application
export const FontSizeProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontSize, setFontSize] = useState(16); // Initialize font size state

  // Function to toggle font size between 16px and 20px
  const toggleFontSize = () => {
    setFontSize(prevSize => (prevSize === 16 ? 20 : 16));
  };

  return (
    // Provide font size and toggle function to all child components
    <FontSizeContext.Provider value={{ fontSize, toggleFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};

// Custom hook to use font size context in any component
export const useFontSize = () => useContext(FontSizeContext);
