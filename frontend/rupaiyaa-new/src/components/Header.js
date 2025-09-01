// rupaiyaa-new/src/components/Header.js
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useContext } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Assuming you use react-navigation
import { ThemeContext } from '../context/ThemeContext';

const getInitial = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
};

const Header = ({ title, subtitle, showProfileIcon = true, showBackButton = false, userName }) => {
    const navigation = useNavigation();
    const { colors } = useContext(ThemeContext);

    const headerBgColor = colors.cardBackground;
    const textColor = colors.text;
    const subtextColor = colors.subtext;
    const iconColor = colors.text;

    return (
        <View className={`flex-row items-center justify-between p-4 ${headerBgColor} shadow-md`}>
            {showBackButton ? (
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
                    <MaterialCommunityIcons name="arrow-left" size={24} color={iconColor} />
                </TouchableOpacity>
            ) : (
                <View className="w-10 h-6" /> // Placeholder for consistent spacing
            )}

            <View className="flex-1 items-center">
                {subtitle && <Text className={`text-sm ${subtextColor}`}>{subtitle}</Text>}
                <Text className={`text-xl font-bold ${textColor}`}>{title}</Text>
            </View>

            {showProfileIcon ? (
                <TouchableOpacity onPress={() => navigation.navigate('Profile')} className="w-10 h-10 rounded-full bg-purple-700 justify-center items-center">
                    <Text className="text-white text-lg font-bold">{getInitial(userName)}</Text>
                </TouchableOpacity>
            ) : (
                <View className="w-10 h-6" /> // Placeholder for consistent spacing
            )}
        </View>
    );
};

export default Header;