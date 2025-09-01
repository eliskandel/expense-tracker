import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useContext } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

const getInitial = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
};

const Header = ({ title, subtitle, showProfileIcon = true, showBackButton = false, userName }) => {
    const navigation = useNavigation();
    const { colors } = useContext(ThemeContext); // Destructure colors directly from ThemeContext

    const headerBgColor = colors.cardBackground; // Use card background for header for consistency
    const textColor = colors.text;
    const subtextColor = colors.subtext;
    const iconColor = colors.text; // Use colors.text for icons by default

    return (
        <View className={`flex-row items-center justify-between p-4 ${headerBgColor} shadow-md`}>
            {/* Left side: Back Button or Placeholder */}
            {showBackButton ? (
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
                    <MaterialCommunityIcons name="arrow-left" size={24} color={iconColor} />
                </TouchableOpacity>
            ) : (
                <View className="w-10 h-6" /> // Placeholder for consistent spacing (adjust w-10 as needed for your icon size)
            )}

            {/* Center: Title and Subtitle */}
            <View className="flex-1 items-center"> {/* flex-1 to allow title to take available space and center */}
                {subtitle && <Text className={`text-sm ${subtextColor}`}>{subtitle}</Text>}
                <Text className={`text-2xl font-bold ${textColor}`}>{title}</Text>
            </View>

            {/* Right side: Profile Icon or Placeholder */}
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