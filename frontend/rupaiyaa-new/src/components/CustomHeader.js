import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useContext } from 'react';
import { Image, Platform, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const CustomHeader = ({ 
    title, 
    subtitle,
    showBackButton = false,
    showProfileIcon = false,
    isSmall = false,
    showTotalBalance = false,
    totalBalance = 'रू0',
    onFilterPress
}) => {
    const navigation = useNavigation();
    const { isDarkMode } = useContext(ThemeContext);
    const { userName, profileImage } = useContext(AuthContext);
    const displayName = userName || 'User';
    const userInitial = displayName.charAt(0).toUpperCase();

    const gradientColors = isDarkMode ? ['#4B0082', '#6A0DAD'] : ['#8A2BE2', '#4B0082'];
    const headerContainerClass = isSmall ? 'pb-4' : 'pb-6';

    return (
        <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className={`rounded-b-3xl shadow-lg z-20 ${headerContainerClass} ${Platform.OS === 'android' ? 'pt-8' : ''}`}
        >
            <SafeAreaView>
                <View className="flex-row justify-between items-center px-6">
                    <View className="flex-row items-center">
                        {showBackButton && (
                            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                                <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                            </TouchableOpacity>
                        )}
                        <View>
                            <Text className="text-white text-lg font-medium opacity-80">{title}</Text>
                            {subtitle && <Text className="text-white text-2xl font-bold mt-1">{subtitle}</Text>}
                        </View>
                    </View>
                    
                    <View className="flex-row items-center">
                        {onFilterPress && (
                            <TouchableOpacity onPress={onFilterPress} className="w-10 h-10 rounded-full bg-white bg-opacity-30 justify-center items-center mr-2">
                                <MaterialCommunityIcons name="filter-variant" size={24} color="white" />
                            </TouchableOpacity>
                        )}
                        {showProfileIcon && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Profile')}
                                className="w-10 h-10 rounded-full bg-white bg-opacity-30 justify-center items-center overflow-hidden"
                            >
                                {profileImage ? (
                                    <Image source={{ uri: profileImage }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                                ) : (
                                    <Text className="text-white font-bold text-lg">{userInitial}</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {showTotalBalance && !isSmall && (
                    <View className="mt-4 px-6">
                        <Text className="text-white text-base opacity-80">Total Balance</Text>
                        <Text className="text-white text-4xl font-bold mt-1">{totalBalance}</Text>
                        <View className="flex-row items-center mt-2">
                            <MaterialCommunityIcons name="trending-up" size={18} color="white" />
                            <Text className="text-white ml-1 text-sm opacity-90">+12.5% from last month</Text>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
};

export default CustomHeader;