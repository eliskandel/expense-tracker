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
    const { isDarkMode, colors } = useContext(ThemeContext);

    return (
        <View className="flex-row items-center justify-between p-6">
            <View>
                {subtitle && <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</Text>}
                <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</Text>
            </View>

            {showBackButton && (
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
                    <MaterialCommunityIcons name="arrow-left" size={24} color={isDarkMode ? 'white' : 'black'} />
                </TouchableOpacity>
            )}

            {showProfileIcon && (
                <TouchableOpacity onPress={() => navigation.navigate('Profile')} className="w-10 h-10 rounded-full bg-purple-700 justify-center items-center">
                    <Text className="text-white text-lg font-bold">{getInitial(userName)}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default Header;