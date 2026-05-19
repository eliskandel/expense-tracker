import React, { useContext } from "react";
import { StatusBar, View } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { AuthProvider, AuthContext } from "./src/context/AuthContext";
import { ThemeProvider, ThemeContext } from "./src/context/ThemeContext";

// Screens
import LoginScreen from "./app/LoginScreen";
import HomeScreen from "./app/HomeScreen";
import GroupsScreen from "./app/GroupsScreen";
import LearnScreen from "./app/LearnScreen";
import ProfileScreen from "./app/ProfileScreen";
import NotificationsScreen from "./app/NotificationsScreen";
import EventScreen from "./app/EventScreen";
import EventExpenseScreen from "./app/EventExpenseScreen";
import GroupExpenseScreen from "./app/GroupExpenseScreen";
import AddScreen from "./app/AddScreen";
import SetBudgetGoal from "./app/SetBudgetGoal";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="home-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{
          tabBarLabel: "",
          tabBarIcon: () => (
            <View
              style={{
                backgroundColor: "#6D28D9",
                width: 64,
                height: 64,
                borderRadius: 32,
                justifyContent: "center",
                alignItems: "center",
                marginTop: -20,
              }}
            >
              <MaterialCommunityIcons
                name="plus"
                color="#FFFFFF"
                size={32}
              />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-group-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Learn"
        component={LearnScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="book-open-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigation() {
  const { isLoggedIn } = useContext(AuthContext);
  const { isDarkMode, navigationTheme } = useContext(ThemeContext);

  const barStyle = isDarkMode ? "light-content" : "dark-content";

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar
        barStyle={barStyle}
        backgroundColor={navigationTheme.colors.card}
      />

      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="SetBudgetGoal" component={SetBudgetGoal} />
            <Stack.Screen
              name="GroupExpense"
              component={GroupExpenseScreen}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
            />
            <Stack.Screen name="EventScreen" component={EventScreen} />
            <Stack.Screen
              name="EventExpenseScreen"
              component={EventExpenseScreen}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppNavigation />
      </ThemeProvider>
    </AuthProvider>
  );
}