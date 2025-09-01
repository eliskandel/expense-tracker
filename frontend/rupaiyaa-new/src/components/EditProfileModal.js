// rupaiyaa-new/src/components/EditProfileModal.js
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useContext, useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Text, TextInput, TouchableOpacity, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { uploadProfileImage, updatePassword as apiUpdatePassword } from '../api/apiService';

const EditProfileModal = ({ isVisible, onClose }) => {
    const {
        userName,
        fullName: authFullName,
        profileImage: authProfileImage,
        id: userId,
        updateProfile,
        fetchUserProfile, // Re-added for refreshing after image upload
    } = useContext(AuthContext);

    const { colors, isDarkMode } = useContext(ThemeContext);

    const [newUsername, setNewUsername] = useState(userName);
    const [newFullName, setNewFullName] = useState(authFullName);
    const [currentLocalProfileImage, setCurrentLocalProfileImage] = useState(authProfileImage);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isVisible) {
            setNewUsername(userName);
            setNewFullName(authFullName);
            setCurrentLocalProfileImage(authProfileImage);
            setPasswordFieldsToDefault();
            setError(null);
        }
    }, [isVisible, userName, authFullName, authProfileImage]);

    const setPasswordFieldsToDefault = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
    };

    const textInputBg = isDarkMode ? 'bg-gray-600' : 'bg-gray-200';
    const textColor = colors.text;
    const placeholderColor = colors.subtext;
    const buttonBg = colors.primary;
    const buttonTextColor = 'text-white';

    const validateProfileForm = () => {
        if (!newUsername || !newFullName) {
            setError('Username and Full Name are required.');
            return false;
        }
        return true;
    };

    const validatePasswordForm = () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setError('All password fields are required.');
            return false;
        }
        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long.');
            return false;
        }
        if (newPassword !== confirmNewPassword) {
            setError('New password and confirm password do not match.');
            return false;
        }
        return true;
    };

    const handleUpdateProfile = async () => {
        if (!validateProfileForm()) return;

        setIsLoading(true);
        setError(null);
        try {
            await updateProfile({
                username: newUsername,
                full_name: newFullName,
            });
            Alert.alert('Success', 'Profile updated successfully!');
            setError(null);
            onClose();
        } catch (err) {
            const errorMessage = err.response?.data?.detail
                                || err.response?.data?.username?.[0]
                                || err.message
                                || 'Failed to update profile. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!validatePasswordForm()) return;

        setIsLoading(true);
        setError(null);
        try {
            await apiUpdatePassword({
                old_password: currentPassword,
                new_password1: newPassword,
                new_password2: confirmNewPassword,
            });
            Alert.alert('Success', 'Password updated successfully!');
            setPasswordFieldsToDefault();
            setError(null);
            onClose();
        } catch (err) {
            const errorMessage = err.response?.data?.detail
                                || err.response?.data?.old_password?.[0]
                                || err.response?.data?.new_password1?.[0]
                                || err.message
                                || 'Failed to change password. Please check your current password.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const pickImage = async (source) => {
        let result;
        const options = {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        };

        if (source === 'camera') {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Please grant camera access to take a profile picture.');
                return;
            }
            result = await ImagePicker.launchCameraAsync(options);
        } else {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Permission Required', 'Please grant media library access to pick a profile picture.');
                return;
            }
            result = await ImagePicker.launchImageLibraryAsync(options);
        }

        if (!result.canceled && result.assets && result.assets.length > 0) {
            if (!userId) {
                Alert.alert('Error', 'User ID is missing. Cannot upload profile picture.');
                return;
            }
            const asset = result.assets[0];
            setCurrentLocalProfileImage(asset.uri);

            setIsLoading(true);
            setError(null);
            try {
                const imageData = {
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    fileName: asset.fileName || `profile_image.${asset.type.split('/')[1] || 'jpg'}`,
                };
                await uploadProfileImage(userId, imageData);
                await fetchUserProfile(); // Call fetchUserProfile to refresh the main profile image in AuthContext
                Alert.alert('Success', 'Profile picture updated!');
                setError(null);
            } catch (err) {
                setError('Failed to upload profile picture. Please try again.');
                console.error('Image upload error:', err.response?.data || err.message);
                setCurrentLocalProfileImage(authProfileImage);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 justify-center items-center bg-black bg-opacity-50" // Semi-transparent dark overlay
            >
                <ScrollView
                    // MODIFIED: Ensure content flows from top and has bottom padding
                    className={`w-11/12 max-h-[90%] bg-white rounded-3xl p-6 shadow-lg`}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }} // Added paddingBottom (equivalent to pb-8)
                >
                    <TouchableOpacity onPress={onClose} className="absolute top-4 left-4 p-2 z-10">
                        <MaterialCommunityIcons name="close" size={28} color={colors.subtext} />
                    </TouchableOpacity>

                    <Text className={`text-2xl font-bold ${textColor} text-center mb-6 mt-8`}>Edit Profile</Text>

                    {error ? <Text className="text-red-500 text-center mb-4">{error}</Text> : null}
                    {isLoading && <ActivityIndicator size="large" color={colors.primary} className="mb-4" />}

                    {/* Profile Picture Section */}
                    <View className="items-center mb-6">
                        {currentLocalProfileImage ? (
                            <Image
                                source={{ uri: currentLocalProfileImage }}
                                style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: colors.primary }}
                            />
                        ) : (
                            <View className="w-32 h-32 rounded-full bg-purple-700 justify-center items-center">
                                <Text className="text-white text-5xl font-bold">{userName?.charAt(0).toUpperCase() || '?'}</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            onPress={() => Alert.alert(
                                "Change Profile Picture",
                                "Choose a source",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Gallery", onPress: () => pickImage('gallery') },
                                    { text: "Camera", onPress: () => pickImage('camera') },
                                ]
                            )}
                            className={`mt-4 p-2 px-4 rounded-full ${buttonBg}`}
                        >
                            <Text className={`font-semibold ${buttonTextColor}`}>Change Picture</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Personal Information Fields */}
                    <Text className={`text-xl font-semibold ${textColor} mb-3`}>Personal Information</Text>
                    <TextInput
                        className={`p-4 rounded-xl ${textInputBg} ${textColor} mb-4`}
                        placeholder="Username"
                        placeholderTextColor={placeholderColor}
                        value={newUsername}
                        onChangeText={setNewUsername}
                        autoCapitalize="none"
                        editable={!isLoading}
                    />
                    <TextInput
                        className={`p-4 rounded-xl ${textInputBg} ${textColor} mb-6`}
                        placeholder="Full Name"
                        placeholderTextColor={placeholderColor}
                        value={newFullName}
                        onChangeText={setNewFullName}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        onPress={handleUpdateProfile}
                        className={`${buttonBg} p-4 rounded-xl items-center mb-8`} // Ensure sufficient margin
                        disabled={isLoading}
                    >
                        <Text className={`text-lg font-bold ${buttonTextColor}`}>Save Profile Changes</Text>
                    </TouchableOpacity>

                    {/* Change Password Section */}
                    <Text className={`text-xl font-semibold ${textColor} mb-3 mt-4`}>Change Password</Text>
                    <TextInput
                        className={`p-4 rounded-xl ${textInputBg} ${textColor} mb-4`}
                        placeholder="Current Password"
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        autoCapitalize="none"
                        editable={!isLoading}
                    />
                    <TextInput
                        className={`p-4 rounded-xl ${textInputBg} ${textColor} mb-4`}
                        placeholder="New Password (min 8 characters)"
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                        autoCapitalize="none"
                        editable={!isLoading}
                    />
                    <TextInput
                        className={`p-4 rounded-xl ${textInputBg} ${textColor} mb-6`}
                        placeholder="Confirm New Password"
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                        autoCapitalize="none"
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        onPress={handleChangePassword}
                        className={`${buttonBg} p-4 rounded-xl items-center mb-4`}
                        disabled={isLoading}
                    >
                        <Text className={`text-lg font-bold ${buttonTextColor}`}>Change Password</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default EditProfileModal;