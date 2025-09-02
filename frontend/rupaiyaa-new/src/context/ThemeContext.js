// src/context/ThemeContext.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { updateThemePreference } from '../api/apiService';
import { AuthContext } from './AuthContext'; // Import AuthContext

// 1. Import themes from React Navigation
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

    // Your custom color palettes remain the same
    const lightColors = {
        background: '#F5F3FF',
        cardBackground: '#FFFFFF',
        primary: '#7C3AED',
        accent: '#38BDF8',
        subtext: '#6B7280',
        text: '#1E293B',
        error: '#EF4444',
        success: '#22C55E',
        border: '#E5E7EB', // Added for navigation
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
        border: '#3F3F46', // Added for navigation
    };

    const colors = isDarkMode ? darkColors : lightColors;

    // 2. Create React Navigation compatible theme objects
    const MyLightTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            primary: lightColors.primary,
            background: lightColors.background,
            card: lightColors.cardBackground, // This styles the header
            text: lightColors.text,
            border: lightColors.border,
        },
    };

    const MyDarkTheme = {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            primary: darkColors.primary,
            background: darkColors.background,
            card: darkColors.cardBackground, // This styles the header
            text: darkColors.text,
            border: darkColors.border,
        },
    };

    // This is the theme object that NavigationContainer will use
    const navigationTheme = isDarkMode ? MyDarkTheme : MyLightTheme;

    // Load theme preference from AsyncStorage on component mount
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
    }, [systemColorScheme]); // Depend on systemColorScheme too

    // Toggle theme and update locally and on backend
    const toggleTheme = async () => {
        // ... your toggleTheme function remains exactly the same
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        try {
            await AsyncStorage.setItem('themePreference', newMode ? 'dark' : 'light');
            console.log('ThemeContext: Saved theme preference locally:', newMode ? 'dark' : 'light');

            // Using a function to get context, good approach!
            try {
                const { id: userId, isLoggedIn } = useContext(AuthContext);
                if (isLoggedIn && userId) {
                    await updateThemePreference(userId, newMode ? 'dark' : 'light');
                    console.log('ThemeContext: Sent theme preference to backend.');
                } else {
                    console.warn('ThemeContext: Not logged in or userId missing, skipping backend theme update.');
                }
            } catch (err) {
                console.warn('ThemeContext: AuthContext not available in toggleTheme.');
            }
        } catch (e) {
            console.error('ThemeContext: Failed to save theme preference locally or to backend:', e.response?.data || e.message);
        }
    };

    const theme = {
        isDarkMode,
        toggleTheme,
        colors,
        // 3. Add the navigation theme to the context value
        navigationTheme,
    };

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
};