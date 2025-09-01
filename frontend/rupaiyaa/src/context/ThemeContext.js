import { createContext, useState } from 'react';
import { useColorScheme } from 'react-native';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const colorScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

    // Colors inspired by the logo (purple, blue, white, accent)
    const lightColors = {
        background: '#F5F3FF', // light purple
        card: '#FFFFFF',
        primary: '#7C3AED', // vibrant purple (logo main)
        accent: '#38BDF8', // blue accent (logo secondary)
        subtext: '#6B7280',
        text: '#1E293B',
        error: '#EF4444',
        success: '#22C55E',
    };
    const darkColors = {
        background: '#18181B',
        card: '#27272A',
        primary: '#A78BFA', // lighter purple for dark mode
        accent: '#38BDF8',
        subtext: '#A1A1AA',
        text: '#F3F4F6',
        error: '#F87171',
        success: '#4ADE80',
    };

    const colors = isDarkMode ? darkColors : lightColors;

    const toggleTheme = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

    const theme = {
        isDarkMode,
        toggleTheme,
        colors,
    };

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
};