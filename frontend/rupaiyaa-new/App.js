
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useContext } from 'react';
import { View } from 'react-native';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import { ThemeContext, ThemeProvider } from './src/context/ThemeContext';
import AddScreen from './src/screens/AddScreen';
import GroupExpenseScreen from './src/screens/GroupExpenseScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import LearnScreen from './src/screens/LearnScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import './global.css';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// MainTabs and AppNavigation are now defined here, inside the component tree
// but outside the main App component, to access the context providers.
function MainTabs() {
    const { colors, isDarkMode } = useContext(ThemeContext);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: isDarkMode ? colors.card : colors.background,
                    borderTopWidth: 0,
                    height: 60,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: isDarkMode ? colors.subtext : colors.subtext,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home-outline" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="history" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Add"
                component={AddScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <View className="bg-purple-700 w-16 h-16 rounded-full items-center justify-center -top-4 shadow-md">
                            <MaterialCommunityIcons name="plus" color="#FFFFFF" size={32} />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Groups"
                component={GroupsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account-group-outline" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Learn"
                component={LearnScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="book-open-outline" color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

function AppNavigation() {
    const { isLoggedIn } = useContext(AuthContext);
    const { isDarkMode } = useContext(ThemeContext); // Use ThemeContext here too for a complete example

    // Lazy import to avoid circular dependency
    const SetBudgetGoal = require('./src/screens/SetBudgetGoal').default;
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isLoggedIn ? (
                    <>
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="SetBudgetGoal" component={SetBudgetGoal} />
                        <Stack.Screen name="GroupExpense" component={GroupExpenseScreen} />
                    </>
                ) : (
                    <Stack.Screen name="Auth" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
    
}

// The main App component wraps everything in providers
export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppNavigation />
            </AuthProvider>
        </ThemeProvider>
    );
}