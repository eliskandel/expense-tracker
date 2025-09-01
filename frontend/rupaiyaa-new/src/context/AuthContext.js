// rupaiyaa-new/src/context/AuthContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, Alert } from 'react-native';
import { getUserDetails, updateProfile } from '../api/apiService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [userName, setUserName] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [fullName, setFullName] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [id, setId] = useState(null);
    const [error, setError] = useState(null);

    const fetchUserProfile = async () => {
        setError(null);
        setIsUpdating(true);
        try {
            const data = await getUserDetails();
            setUserName(data.username);
            setUserEmail(data.email);
            const userFullName = data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : data.username;
            setFullName(userFullName);
            // CORRECTED: Use data.image as per your API response
            setProfileImage(data.image || null);
            setId(data.id || null);

            await AsyncStorage.setItem('user_name', data.username);
            await AsyncStorage.setItem('user_email', data.email);
            if (userFullName) await AsyncStorage.setItem('full_name', userFullName);
            // CORRECTED: Use data.image for AsyncStorage
            if (data.image) await AsyncStorage.setItem('profile_image', data.image);
            if (data.id) await AsyncStorage.setItem('user_id', String(data.id));

            return data;
        } catch (e) {
            console.error('AuthContext: Error fetching user profile:', e.response?.data || e.message);
            setError(e.response?.data?.detail || 'Failed to fetch profile data.');

            const storedUserName = await AsyncStorage.getItem('user_name');
            const storedUserEmail = await AsyncStorage.getItem('user_email');
            const storedFullName = await AsyncStorage.getItem('full_name');
            const storedProfileImage = await AsyncStorage.getItem('profile_image');
            const storedId = await AsyncStorage.getItem('user_id');

            setUserName(storedUserName);
            setUserEmail(storedUserEmail);
            setFullName(storedFullName);
            setProfileImage(storedProfileImage);
            setId(storedId);

            throw e;
        } finally {
            setIsUpdating(false);
        }
    };

    const updateProfileData = async (profileData) => {
        setIsUpdating(true);
        setError(null);
        if (!id) {
            setError('User ID is missing. Cannot update profile.');
            setIsUpdating(false);
            return;
        }
        try {
            const data = await updateProfile(id, profileData);
            setUserName(data.username);
            const updatedUserFullName = data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : data.username;
            setFullName(updatedUserFullName);
            // CORRECTED: Use data.image for update response
            setProfileImage(data.image || null);

            await AsyncStorage.setItem('user_name', data.username);
            await AsyncStorage.setItem('full_name', updatedUserFullName);
            // CORRECTED: Use data.image for AsyncStorage
            if (data.image) await AsyncStorage.setItem('profile_image', data.image);

            Alert.alert('Success', 'Profile updated successfully!');
            return data;
        } catch (e) {
            console.error('AuthContext: Error updating user profile:', e.response?.data || e.message);
            setError(e.response?.data?.detail || e.response?.data?.username?.[0] || 'Failed to update profile.');
            throw e;
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const accessToken = await AsyncStorage.getItem('access_token');
                if (accessToken) {
                    setIsLoggedIn(true);
                    await fetchUserProfile();
                } else {
                    setIsLoggedIn(false);
                    setUserName(null);
                    setUserEmail(null);
                    setFullName(null);
                    setProfileImage(null);
                    setId(null);
                }
            } catch (e) {
                console.error('AuthContext: Failed to load auth data or fetch profile on app start', e);
                setError(e.message || 'Failed to initialize authentication.');
                const storedUserName = await AsyncStorage.getItem('user_name');
                const storedUserEmail = await AsyncStorage.getItem('user_email');
                const storedFullName = await AsyncStorage.getItem('full_name');
                const storedProfileImage = await AsyncStorage.getItem('profile_image');
                const storedId = await AsyncStorage.getItem('user_id');

                if (storedUserName && storedUserEmail) {
                    setIsLoggedIn(true);
                    setUserName(storedUserName);
                    setUserEmail(storedUserEmail);
                    setFullName(storedFullName);
                    setProfileImage(storedProfileImage);
                    setId(storedId);
                } else {
                    setIsLoggedIn(false);
                }
            } finally {
                setIsLoading(false);
            }
        };
        checkLoginStatus();
    }, []);

    const login = async (token) => {
        setIsLoading(true);
        setError(null);
        try {
            await AsyncStorage.setItem('access_token', token);
            setIsLoggedIn(true);
            await fetchUserProfile();
            Alert.alert('Success', 'You are logged in!');
        } catch (e) {
            console.error('AuthContext: Failed to save data to storage or fetch profile after login', e);
            setError('Login successful, but failed to load profile data.');
            await AsyncStorage.removeItem('access_token');
            setIsLoggedIn(false);
            setUserName(null);
            setUserEmail(null);
            setFullName(null);
            setProfileImage(null);
            setId(null);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('user_name');
            await AsyncStorage.removeItem('user_email');
            await AsyncStorage.removeItem('full_name');
            await AsyncStorage.removeItem('profile_image');
            await AsyncStorage.removeItem('user_id');
            setIsLoggedIn(false);
            setUserName(null);
            setUserEmail(null);
            setFullName(null);
            setProfileImage(null);
            setId(null);
            setError(null);
        } catch (e) {
            console.error('AuthContext: Failed to remove data from storage', e);
            setError('Failed to log out cleanly.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={{ marginTop: 10, color: '#1F2937' }}>Loading...</Text>
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            login,
            logout,
            userName,
            userEmail,
            fullName,
            profileImage,
            id,
            isLoading: isUpdating,
            error,
            fetchUserProfile,
            updateProfile: updateProfileData,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
