// rupaiyaa-new/src/api/apiService.js (REVERTED TO A PREVIOUS STATE FOR NOW)
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// !!! IMPORTANT: Replace with your actual Django backend URL !!!
const API_BASE_URL = 'http://10.40.20.94:8000'; // Your current API Base URL

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach JWT token for authenticated requests
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// This endpoint '/api/profile/' will likely result in a 404 based on our previous discussion.
// We will address the actual /auth/details/ fetch in AuthContext directly.
export const getUserProfile = async () => {
    try {
        const response = await api.get('/api/profile/');
        return response.data;
    } catch (error) {
        console.error('Error fetching user profile:', error.response?.data || error.message);
        throw error;
    }
};

// This uses userId as we previously confirmed for /auth/update/{id}/
export const updateProfile = async (userId, profileData) => {
    try {
        const response = await api.patch(`/auth/update/${userId}/`, profileData);
        return response.data;
    } catch (error) {
        console.error('Error updating user profile:', error.response?.data || error.message);
        throw error;
    }
};

// Password change endpoint (unchanged from earlier, assume it's correct)
export const updatePassword = async (passwordData) => {
    try {
        const response = await api.post('/api/change-password/', passwordData);
        return response.data;
    } catch (error) {
        console.error('Error changing password:', error.response?.data || error.message);
        throw error;
    }
};

// Upload Profile Image (uses userId for /auth/update/{id}/)
export const uploadProfileImage = async (userId, imageData) => {
    try {
        const formData = new FormData();
        formData.append('profile_picture', {
            uri: imageData.uri,
            name: imageData.fileName || 'profile.jpg',
            type: imageData.type || 'image/jpeg',
        });

        const response = await api.patch(`/auth/update/${userId}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading profile image:', error.response?.data || error.message);
        throw error;
    }
};

// REVERTED: Theme preference to use a generic endpoint (which will likely still 404)
// We will fix this once you provide the correct endpoint for theme preference.
export const updateThemePreference = async (themePreference) => {
    try {
        const response = await api.patch('/api/profile/', { theme_preference: themePreference });
        return response.data;
    } catch (error) {
        console.error('Error updating theme preference:', error.response?.data || error.message);
        throw error;
    }
};