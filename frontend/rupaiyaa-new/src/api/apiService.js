// rupaiyaa-new/src/api/apiService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// !!! IMPORTANT: Ensure this matches your Django backend URL !!!
const API_BASE_URL = 'http://127.0.0.1:8000';

// Helper function for making authenticated fetch requests
const authenticatedFetch = async (url, options = {}) => {
    const token = await AsyncStorage.getItem('access_token');
    const headers = {
        // Default to application/json, but allow override for FormData
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    // If Content-Type is explicitly set to undefined (for FormData), remove it
    if (headers['Content-Type'] === undefined) {
        delete headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorData = {};
        try {
            errorData = await response.json(); // Try to parse JSON error
        } catch (e) {
            // If JSON parsing fails, use plain text response
            errorData = { detail: await response.text() };
        }
        const error = new Error(errorData.detail || `API Error: ${response.status} - ${response.statusText}`);
        error.response = { status: response.status, data: errorData }; // Attach response details
        throw error;
    }

    // Check if response has content before parsing JSON
    const text = await response.text();
    return text ? JSON.parse(text) : {}; // Return empty object for 204 No Content
};

// GET /auth/details/
export const getUserDetails = async () => {
    return authenticatedFetch('/auth/details/', {
        method: 'GET',
    });
};

// PATCH /auth/update/{id}/ for profile updates (username, full_name, theme_preference)
export const updateProfile = async (userId, profileData) => {
    if (!userId) {
        throw new Error('User ID is required for updating the profile.');
    }
    return authenticatedFetch(`/auth/update/${userId}/`, {
        method: 'PATCH',
        body: JSON.stringify(profileData),
    });
};

// POST /auth/change/password/
export const updatePassword = async (passwordData) => {
    return authenticatedFetch('/auth/change/password/', {
        method: 'POST',
        body: JSON.stringify(passwordData),
    });
};

// PATCH /auth/update/{id}/ for profile picture upload
export const uploadProfileImage = async (userId, imageData) => {
    if (!userId) {
        throw new Error('User ID is required for uploading profile picture.');
    }
    const formData = new FormData();
    formData.append('profile_picture', { // 'profile_picture' must match your Django field name
        uri: imageData.uri,
        name: imageData.fileName || 'profile.jpg',
        type: imageData.type || 'image/jpeg',
    });

    return authenticatedFetch(`/auth/update/${userId}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': undefined, // Crucial: Let fetch handle Content-Type for FormData
        },
        body: formData,
    });
};

// PATCH /auth/update/{id}/ for theme preference
export const updateThemePreference = async (userId, themePreference) => {
    if (!userId) {
        throw new Error('User ID is required for updating theme preference.');
    }
    return authenticatedFetch(`/auth/update/${userId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ theme_preference: themePreference }), // Adjust field name if different in Django
    });
};

// Note: Login, Logout, Register are handled directly in LoginScreen/AuthContext via raw fetch,
// as they often don't need the authenticatedFetch helper before a token exists.