import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useContext, useEffect, useState } from 'react';
import { Image, Platform, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { fetchUnreadCount } from '../api/notificationApi';
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
    onFilterPress,
    onChatbotPress
}) => {
    const navigation = useNavigation();
    const { isDarkMode } = useContext(ThemeContext);
    const { userName, profileImage } = useContext(AuthContext);
    const displayName = userName || 'User';
    const userInitial = displayName.charAt(0).toUpperCase();

    const [unreadCount, setUnreadCount] = useState(0);
    const [notifLoading, setNotifLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        let intervalId;
        const loadUnreadCount = async () => {
            setNotifLoading(true);
            try {
                const data = await fetchUnreadCount();
                if (mounted) setUnreadCount(data.count || 0);
            } catch {
                if (mounted) setUnreadCount(0);
            } finally {
                if (mounted) setNotifLoading(false);
            }
        };
        loadUnreadCount();
        // Poll every 10 seconds
        intervalId = setInterval(loadUnreadCount, 10000);
        // Listen for notificationRead event to update unread count
        const handleNotificationRead = async (e) => {
            await loadUnreadCount();
        };
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('notificationRead', handleNotificationRead);
        }
        return () => {
            mounted = false;
            if (intervalId) clearInterval(intervalId);
            if (typeof window !== 'undefined' && window.removeEventListener) {
                window.removeEventListener('notificationRead', handleNotificationRead);
            }
        };
    }, []);

    // Always refresh notifications when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;
            const refresh = async () => {
                setNotifLoading(true);
                try {
                    const data = await fetchUnreadCount();
                    if (isActive) setUnreadCount(data.count || 0);
                } catch {
                    if (isActive) setUnreadCount(0);
                } finally {
                    if (isActive) setNotifLoading(false);
                }
            };
            refresh();
            return () => { isActive = false; };
        }, [])
    );

    const gradientColors = isDarkMode ? ['#4B0082', '#6A0DAD'] : ['#8A2BE2', '#640fa1ff'];
    const headerContainerClass = isSmall ? 'pb-4' : 'pb-6';

    const [chatbotHover, setChatbotHover] = useState(false);
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {onFilterPress && (
                            <TouchableOpacity onPress={onFilterPress} className="w-10 h-10 rounded-full bg-white bg-opacity-30 justify-center items-center mr-2">
                                <MaterialCommunityIcons name="filter-variant" size={24} color="white" />
                            </TouchableOpacity>
                        )}
                        {/* Notification Icon */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Notifications')}
                            className="w-10 h-10 rounded-full bg-white bg-opacity-30 justify-center items-center mr-2"
                        >
                            <MaterialCommunityIcons name="bell-outline" size={24} color="white" />
                            {notifLoading ? null : unreadCount > 0 && (
                                <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 }}>
                                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
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
                        {/* Chatbot icon removed from header */}
                    </View>
                </View>

                {showTotalBalance && !isSmall && (
                    <View className="mt-4 px-6">
                        <Text className="text-white text-base opacity-80">Total Balance</Text>
                        <Text className="text-white text-4xl font-bold mt-1">{totalBalance}</Text>
                        {/* <View className="flex-row items-center mt-2">
                            <MaterialCommunityIcons name="trending-up" size={18} color="white" />
                            <Text className="text-white ml-1 text-sm opacity-90">+12.5% from last month</Text>
                        </View> */}
                    </View>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
};

export default CustomHeader;