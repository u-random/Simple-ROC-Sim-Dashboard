import { createContext, useContext, useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

// Create theme context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check system preference on mount
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(prefersDark);

        // Update theme class on body
        document.body.classList.toggle('dark', isDark);
    }, [isDark]);

    return (
        <ThemeContext.Provider value={{ isDark, setIsDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Theme toggle button component
export const ThemeToggle = () => {
    const { isDark, setIsDark } = useContext(ThemeContext);

    return (
        <button
            onClick={() => setIsDark(!isDark)}
            className="theme-toggle"
            aria-label="Toggle theme"
        >
            {isDark ? (
                <Sun className="theme-icon" />
            ) : (
                <Moon className="theme-icon" />
            )}
        </button>
    );
};

// Hook to use theme context
export const useTheme = () => useContext(ThemeContext);