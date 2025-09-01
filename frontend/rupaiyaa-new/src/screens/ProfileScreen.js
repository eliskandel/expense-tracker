import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContext, useState, useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Image, ActivityIndicator, Alert, Switch } from 'react-native';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import EditProfileModal from '../components/EditProfileModal';

const getInitial = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
};

const ProfileScreen = () => {
    const { isDarkMode, colors, toggleTheme } = useContext(ThemeContext);
    // Re-added fetchUserProfile to be destructured here
    const { userName, fullName, userEmail, profileImage, logout, isLoading, error, fetchUserProfile, id } = useContext(AuthContext);

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    // Reintroduced: Fetch user profile on component mount and when modal closes
    useEffect(() => {
        // Only fetch if not already loading and if the user is logged in
        if (!isLoading && id) { // Check for id to ensure a user is actually logged in
            fetchUserProfile();
        }
    }, [isEditModalVisible, id]); // Re-fetch when modal visibility changes OR when user ID changes (e.g., after login)


    const containerStyle = isDarkMode ? 'bg-gray-800' : 'bg-gray-100';
    const cardBgColor = isDarkMode ? 'bg-gray-700' : 'bg-white';
    const textStyle = isDarkMode ? 'text-white' : 'text-gray-900';
    const subtextStyle = isDarkMode ? 'text-gray-400' : 'text-gray-600';
    const iconColor = colors.subtext;

    if (isLoading && !id) { // If loading AND no user ID yet, show full screen loader
        return (
            <View className={`flex-1 justify-center items-center ${containerStyle}`}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className={`mt-4 ${textStyle}`}>Loading profile...</Text>
            </View>
        );
    }

    if (error && !id) { // If an error exists and we don't have basic profile info, show error screen
        return (
            <View className={`flex-1 justify-center items-center ${containerStyle}`}>
                <Text className="text-red-500 text-lg mb-4">{error}</Text>
                <TouchableOpacity onPress={fetchUserProfile} className="bg-purple-700 p-3 rounded-xl">
                    <Text className="text-white font-semibold">Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView className={`flex-1 ${containerStyle}`}>
            <Header title="Profile" showBackButton={true} showProfileIcon={false} />
            <View className="p-6">
                {/* Profile Card */}
                <View className={`${cardBgColor} p-6 rounded-3xl shadow-sm items-center mb-6`}>
                    {profileImage ? (
                        <View className="w-24 h-24 rounded-full bg-purple-700 justify-center items-center mb-4 overflow-hidden">
                            <Image source={{ uri: profileImage }} style={{ width: 96, height: 96, borderRadius: 48 }} />
                        </View>
                    ) : (
                        <View className="w-24 h-24 rounded-full bg-purple-700 justify-center items-center mb-4">
                            <Text className="text-white text-4xl font-bold">{getInitial(fullName || userName)}</Text>
                        </View>
                    )}
                    <Text className={`text-2xl font-bold ${textStyle}`}>{fullName || userName}</Text>
                    <Text className={`text-sm ${subtextStyle}`}>{userEmail}</Text>
                </View>

                {/* Account Settings Section */}
                <View className={`${cardBgColor} rounded-3xl p-6 shadow-sm mb-6`}>
                    <Text className={`text-xl font-bold ${textStyle} mb-4`}>Account Settings</Text>

                    {/* Dark/Light Mode Toggle */}
                    <View className="flex-row items-center justify-between p-3 rounded-lg mb-2">
                        <View className="flex-row items-center">
                            <MaterialCommunityIcons name={isDarkMode ? "weather-night" : "white-balance-sunny"} size={24} color={iconColor} />
                            <Text className={`ml-3 text-lg ${textStyle}`}>Dark Mode</Text>
                        </View>
                        <Switch
                            trackColor={{ false: colors.subtext, true: colors.primary }}
                            thumbColor={isDarkMode ? 'white' : 'white'}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={toggleTheme}
                            value={isDarkMode}
                        />
                    </View>

                    <TouchableOpacity onPress={() => setIsEditModalVisible(true)} className="flex-row items-center p-3 rounded-lg mb-2">
                        <MaterialCommunityIcons name="account-edit-outline" size={24} color={iconColor} />
                        <Text className={`ml-3 text-lg ${textStyle}`}>Edit Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsEditModalVisible(true)} className="flex-row items-center p-3 rounded-lg mb-2">
                        <MaterialCommunityIcons name="lock-reset" size={24} color={iconColor} />
                        <Text className={`ml-3 text-lg ${textStyle}`}>Change Password</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center p-3 rounded-lg">
                        <MaterialCommunityIcons name="bell-ring-outline" size={24} color={iconColor} />
                        <Text className={`ml-3 text-lg ${textStyle}`}>Notifications</Text>
                    </TouchableOpacity>
                </View>

                {/* Actions Section */}
                <View className={`${cardBgColor} rounded-3xl p-6 shadow-sm`}>
                    <Text className={`text-xl font-bold ${textStyle} mb-4`}>Actions</Text>

                    <TouchableOpacity className="flex-row items-center p-3 rounded-lg mb-2">
                        <MaterialCommunityIcons name="chart-box-outline" size={24} color={iconColor} />
                        <Text className={`ml-3 text-lg ${textStyle}`}>Export Data</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={logout} className="flex-row items-center p-3 rounded-lg">
                        <MaterialCommunityIcons name="logout" size={24} color="red" />
                        <Text className="ml-3 text-lg text-red-500 font-semibold">Log Out</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Edit Profile Modal Component */}
            <EditProfileModal
                isVisible={isEditModalVisible}
                onClose={() => setIsEditModalVisible(false)}
            />
        </ScrollView>
    );
};

export default ProfileScreen;