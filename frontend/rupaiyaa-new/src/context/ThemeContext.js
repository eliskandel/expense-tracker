import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { updateThemePreference } from '../api/apiService';
import { AuthContext } from './AuthContext'; // Import AuthContext

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Correct: useContext at the top level
    const { id: userId, isLoggedIn } = useContext(AuthContext);
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
    }, []);

    // Toggle theme and update locally and on backend
    const toggleTheme = async () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        try {
            await AsyncStorage.setItem('themePreference', newMode ? 'dark' : 'light');
            console.log('ThemeContext: Saved theme preference locally:', newMode ? 'dark' : 'light');

            // Only attempt to update backend if user is logged in and userId is available
            if (isLoggedIn && userId) {
                await updateThemePreference(userId, newMode ? 'dark' : 'light'); // Pass userId
                console.log('ThemeContext: Sent theme preference to backend.');
            } else {
                console.warn('ThemeContext: Not logged in or userId missing, skipping backend theme update.');
            }
        } catch (e) {
            console.error('ThemeContext: Failed to save theme preference locally or to backend:', e.response?.data || e.message);
            // Optionally, revert theme if backend update fails and provide feedback
            // setIsDarkMode(!newMode);
            // AsyncStorage.setItem('themePreference', !newMode ? 'dark' : 'light');
            // Alert.alert('Error', 'Failed to update theme preference on server.');
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