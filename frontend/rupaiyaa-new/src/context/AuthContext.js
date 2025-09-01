// rupaiyaa-new/src/context/AuthContext.js (USE THE VERSION YOU PROVIDED LAST)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, Alert } from 'react-native';
// Updated import: getUserDetails instead of getUserProfile
import { getUserDetails, updateProfile as apiUpdateProfile } from '../api/apiService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [fullName, setFullName] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [id, setId] = useState(null); // The user ID is crucial now
    const [error, setError] = useState(null);

    // Reintroduced: Function to fetch user profile from the backend using /auth/details/
    const fetchUserProfile = async () => {
        setError(null); // Clear previous errors
        try {
            const data = await getUserDetails(); // Call the new getUserDetails API service
            setUserName(data.username);
            setUserEmail(data.email);
            // Assuming 'full_name' or 'first_name' and 'last_name' from /auth/details/ response
            const userFullName = data.full_name || (data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : data.username);
            setFullName(userFullName);
            setProfileImage(data.profile_picture || null); // Assuming 'profile_picture' from backend
            setId(data.id || null); // Ensure ID is set from backend response

            // Update local storage with potentially new or confirmed data
            await AsyncStorage.setItem('user_name', data.username);
            await AsyncStorage.setItem('user_email', data.email);
            if (userFullName) await AsyncStorage.setItem('full_name', userFullName);
            if (data.profile_picture) await AsyncStorage.setItem('profile_image', data.profile_picture);
            if (data.id) await AsyncStorage.setItem('user_id', String(data.id));

            return data;
        } catch (e) {
            console.error('AuthContext: Error fetching user profile:', e.response?.data || e.message);
            setError(e.response?.data?.detail || 'Failed to fetch profile data.');

            // Even if API fetch fails, try to load from local storage as a fallback
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

            throw e; // Re-throw to be caught by calling component if needed
        }
    };

    // Function to update user profile via the backend (remains the same)
    const updateProfile = async (profileData) => {
        setIsLoading(true);
        setError(null);
        if (!id) {
            setError('User ID is missing. Cannot update profile.');
            setIsLoading(false);
            return;
        }
        try {
            const data = await apiUpdateProfile(id, profileData);
            setUserName(data.username);
            // Assuming 'full_name' or 'first_name' and 'last_name' from update response
            const updatedUserFullName = data.full_name || (data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : data.username);
            setFullName(updatedUserFullName);
            setProfileImage(data.profile_picture || null);

            await AsyncStorage.setItem('user_name', data.username);
            await AsyncStorage.setItem('full_name', updatedUserFullName);
            if (data.profile_picture) await AsyncStorage.setItem('profile_image', data.profile_picture);

            Alert.alert('Success', 'Profile updated successfully!');
            return data;
        } catch (e) {
            console.error('AuthContext: Error updating user profile:', e.response?.data || e.message);
            setError(e.response?.data?.detail || e.response?.data?.username?.[0] || 'Failed to update profile.');
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const accessToken = await AsyncStorage.getItem('access_token');
                if (accessToken) {
                    setIsLoggedIn(true);
                    // Crucial: Call fetchUserProfile to get full user details from backend
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
                // Fallback to local storage if API fails
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
    }, []); // Run once on component mount

    const login = async (token, userData) => {
        setIsLoading(true);
        setError(null);
        console.log('AuthContext: Attempting to log in with user ID:', userData?.id);
        try {
            await AsyncStorage.setItem('access_token', token);
            setIsLoggedIn(true);
            // Crucial: After login token is set, fetch full profile data from backend
            await fetchUserProfile();
            Alert.alert('Success', 'You are logged in!'); // Moved this alert here after profile data is loaded

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
            isLoading,
            error,
            fetchUserProfile, // Make fetchUserProfile available for other components if needed
            updateProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
};