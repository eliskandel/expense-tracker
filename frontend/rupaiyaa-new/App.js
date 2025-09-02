import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useContext } from 'react';
// CHANGE: Import StatusBar
import { StatusBar, View } from 'react-native';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import { ThemeContext, ThemeProvider } from './src/context/ThemeContext';

import AddScreen from './src/screens/AddScreen';
import EventExpenseScreen from './src/screens/EventExpenseScreen';
import EventScreen from './src/screens/EventScreen';
import GroupExpenseScreen from './src/screens/GroupExpenseScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import LearnScreen from './src/screens/LearnScreen';
import LoginScreen from './src/screens/LoginScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import './global.css';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// No changes are needed in MainTabs, as it already uses the context correctly
// for its custom styling. The navigation theme will handle the defaults,
// and your custom styles will apply on top.
function MainTabs() {
    const { colors, isDarkMode } = useContext(ThemeContext);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: colors.cardBackground, // This correctly uses your theme
                    borderTopWidth: 0,
                    height: 60,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.subtext,
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
                    tabBarIcon: () => (
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
    // CHANGE: Destructure `navigationTheme` from the ThemeContext
    const { isDarkMode, navigationTheme } = useContext(ThemeContext);

    // CHANGE: Determine the status bar style based on the theme
    const barStyle = isDarkMode ? 'light-content' : 'dark-content';

    // Lazy import to avoid circular dependency
    const SetBudgetGoal = require('./src/screens/SetBudgetGoal').default;
    
    return (
        // CHANGE: Pass the dynamic navigationTheme to the container
        <NavigationContainer theme={navigationTheme}>
            {/* CHANGE: Add the StatusBar component to sync with the theme */}
            <StatusBar barStyle={barStyle} backgroundColor={navigationTheme.colors.card} />

            <Stack.Navigator 
                // You can still keep headerShown: false if you have custom headers,
                // but if you want to use the navigator's built-in header,
                // removing this will allow the theme to style it automatically.
                screenOptions={{ headerShown: false }}
            >
                {isLoggedIn ? (
                    <>
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="SetBudgetGoal" component={SetBudgetGoal} />
                        <Stack.Screen name="GroupExpense" component={GroupExpenseScreen} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} />
                        <Stack.Screen name="EventScreen" component={EventScreen} />
                        <Stack.Screen name="EventExpenseScreen" component={EventExpenseScreen} />
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
        // CHANGE: Swapped provider order for better dependency management.
        // It's best practice for providers that depend on others (Theme -> Auth)
        // to be nested inside the ones they depend on.
        <AuthProvider>
            <ThemeProvider>
                <AppNavigation />
            </ThemeProvider>
        </AuthProvider>
    );
}