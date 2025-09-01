import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContext } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const getInitial = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
};

const ProfileScreen = () => {
    const { isDarkMode, colors } = useContext(ThemeContext);
    const { userName, userEmail, profileImage, logout } = useContext(AuthContext);

    const containerStyle = isDarkMode ? 'bg-gray-800' : 'bg-gray-100';
    const cardBgColor = isDarkMode ? 'bg-gray-700' : 'bg-white';
    const textStyle = isDarkMode ? 'text-white' : 'text-gray-900';
    const subtextStyle = isDarkMode ? 'text-gray-400' : 'text-gray-600';

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
                            <Text className="text-white text-4xl font-bold">{getInitial(userName)}</Text>
                        </View>
                    )}
                    <Text className={`text-2xl font-bold ${textStyle}`}>{userName}</Text>
                    <Text className={`text-sm ${subtextStyle}`}>{userEmail}</Text>
                </View>

                {/* Account Settings Section */}
                <View className={`${cardBgColor} rounded-3xl p-6 shadow-sm mb-6`}>
                    <Text className={`text-xl font-bold ${textStyle} mb-4`}>Account Settings</Text>
                    
                    <TouchableOpacity className="flex-row items-center p-3 rounded-lg mb-2">
                        <MaterialCommunityIcons name="account-edit-outline" size={24} color={colors.subtext} />
                        <Text className={`ml-3 text-lg ${textStyle}`}>Edit Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center p-3 rounded-lg mb-2">
                        <MaterialCommunityIcons name="lock-reset" size={24} color={colors.subtext} />
                        <Text className={`ml-3 text-lg ${textStyle}`}>Change Password</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center p-3 rounded-lg">
                        <MaterialCommunityIcons name="bell-ring-outline" size={24} color={colors.subtext} />
                        <Text className={`ml-3 text-lg ${textStyle}`}>Notifications</Text>
                    </TouchableOpacity>
                </View>

                {/* Actions Section */}
                <View className={`${cardBgColor} rounded-3xl p-6 shadow-sm`}>
                    <Text className={`text-xl font-bold ${textStyle} mb-4`}>Actions</Text>
                    
                    <TouchableOpacity className="flex-row items-center p-3 rounded-lg mb-2">
                        <MaterialCommunityIcons name="chart-box-outline" size={24} color={colors.subtext} />
                        <Text className={`ml-3 text-lg ${textStyle}`}>Export Data</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={logout} className="flex-row items-center p-3 rounded-lg">
                        <MaterialCommunityIcons name="logout" size={24} color="red" />
                        <Text className="ml-3 text-lg text-red-500 font-semibold">Log Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

export default ProfileScreen;