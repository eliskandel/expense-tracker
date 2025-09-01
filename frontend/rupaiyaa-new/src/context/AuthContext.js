import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [id, setId] = useState(null);

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const accessToken = await AsyncStorage.getItem('access_token');
                const storedUserName = await AsyncStorage.getItem('user_name');
                const storedUserEmail = await AsyncStorage.getItem('user_email');
                const storedProfileImage = await AsyncStorage.getItem('profile_image');
                const storedId = await AsyncStorage.getItem('user_id');

                console.log('AuthContext: Stored User ID on load:', storedId);

                if (accessToken && storedUserName && storedUserEmail) {
                    setIsLoggedIn(true);
                    setUserName(storedUserName);
                    setUserEmail(storedUserEmail);
                    setProfileImage(storedProfileImage);
                    setId(storedId); 
                }
            } catch (e) {
                console.error('AuthContext: Failed to load data from storage', e);
            } finally {
                setIsLoading(false);
            }
        };
        checkLoginStatus();
    }, []);

    const login = async (token, name, email, profileImageUrl, userId) => {
        console.log('AuthContext: Attempting to log in with user ID:', userId);
        try {
            await AsyncStorage.setItem('access_token', token);
            await AsyncStorage.setItem('user_name', name);
            await AsyncStorage.setItem('user_email', email);

            if (userId !== undefined && userId !== null) {
                await AsyncStorage.setItem('user_id', String(userId));
                setId(userId);
                console.log('AuthContext: User ID saved to storage:', userId);
            } else {
                console.log('AuthContext: User ID was undefined or null. Not saving.');
            }

            if (profileImageUrl) {
                await AsyncStorage.setItem('profile_image', profileImageUrl);
                setProfileImage(profileImageUrl);
            }

            setIsLoggedIn(true);
            setUserName(name);
            setUserEmail(email);

        } catch (e) {
            console.error('AuthContext: Failed to save data to storage', e);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('user_name');
            await AsyncStorage.removeItem('user_email');
            await AsyncStorage.removeItem('profile_image');
            await AsyncStorage.removeItem('user_id');
            setIsLoggedIn(false);
            setUserName(null);
            setUserEmail(null);
            setProfileImage(null);
            setId(null);
        } catch (e) {
            console.error('AuthContext: Failed to remove data from storage', e);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>Loading...</Text>
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout, userName, userEmail, profileImage, id }}>
            {children}
            {console.log('AuthContext: Rendered with values:', { isLoggedIn, userName, userEmail, profileImage, id })}
        </AuthContext.Provider>
    );
};
