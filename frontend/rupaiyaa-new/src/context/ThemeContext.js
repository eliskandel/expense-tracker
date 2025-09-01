// rupaiyaa-new/src/context/ThemeContext.js (REVERTED TO A PREVIOUS STATE FOR NOW)
import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Removed updateThemePreference import as we're reverting backend calls for now.
// Removed AuthContext import.

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Removed useContext(AuthContext)
    const systemColorScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

    const lightColors = {
        background: '#F5F3FF',
        cardBackground: '#FFFFFF',
        primary: '#7C3AED',
        accent: '#38BDF8',
        subtext: '#6B7280',
        text: '#1E293B',
        error: '#EF4444',
        success: '#22C55E',
    };
    const darkColors = {
        background: '#18181B',
        cardBackground: '#27272A',
        primary: '#A78BFA',
        accent: '#38BDF8',
        subtext: '#A1A1AA',
        text: '#F3F4F6',
        error: '#F87171',
        success: '#4ADE80',
    };

    const colors = isDarkMode ? darkColors : lightColors;

    useEffect(() => {
        const loadThemePreference = async () => {
            try {
                const storedPreference = await AsyncStorage.getItem('themePreference');
                if (storedPreference !== null) {
                    setIsDarkMode(storedPreference === 'dark');
                } else {
                    setIsDarkMode(systemColorScheme === 'dark');
                }
            } catch (e) {
                console.error('ThemeContext: Failed to load theme preference from AsyncStorage:', e);
            }
        };
        loadThemePreference();
    }, []);

    const toggleTheme = async () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        try {
            await AsyncStorage.setItem('themePreference', newMode ? 'dark' : 'light');
            console.log('ThemeContext: Saved theme preference locally:', newMode ? 'dark' : 'light');

            // REVERTED: No backend call for theme preference for now.
            // This avoids the 'AxiosError' until we define the correct endpoint.
            // You'll still see the local storage message, but no backend API call.

        } catch (e) {
            console.error('ThemeContext: Failed to save theme preference locally:', e);
        }
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