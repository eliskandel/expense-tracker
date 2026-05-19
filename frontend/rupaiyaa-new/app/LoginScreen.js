
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useContext, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { AuthContext } from '../src/context/AuthContext';

const API_BASE_URL = process.env.API_BASE_URL; // Your current API Base URL

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useContext(AuthContext); // Only passing token now

  const [isLoginMode, setIsLoginMode] = useState(true);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupPhoneNumber, setSignupPhoneNumber] = useState('');
  const [signupProfileImage, setSignupProfileImage] = useState(null);

  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access media library is needed to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSignupProfileImage(result.assets[0].uri);
    }
  };

  const handleLogin = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${process.env.API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: loginEmail, password: loginPassword }), // Assuming 'username' for email login
      });

      if (!response.ok) {
        let errorMessage = `Login failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map(e => e.detail || JSON.stringify(e)).join('\n');
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
              errorMessage = Object.values(errorData).flat().join('\n'); // Catch generic DRF errors
          }
        } catch (jsonError) {
            const plainTextError = await response.text();
            errorMessage = `Login failed: Server response was not valid JSON. Response text: "${plainTextError}"`;
        }
        Alert.alert('Login failed', errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setLoading(false);

      if (data.details) {
        console.log('Login successful, user data:', data);
        login(
          data.access,
          data.details.username || loginEmail,
          data.details.email || '',
          data.details.image || null,
          data.details.id
        );
        if (data.refresh) {
          await AsyncStorage.setItem('refresh_token', data.refresh);
        }
        // Alert will now be shown by AuthContext after profile is fetched
      } else {
        Alert.alert('Error', 'Login failed: Access token not received.');
        console.log('Login failed: No access token in response', data);
      }
    } catch (error) {
      setLoading(false);
      console.error('Network error during login:', error);
      Alert.alert(
        'Error',
        'Network error. Please check your internet connection or if the server is running.'
      );
    }
  };

  const handleSignup = async () => {
    if (signupPassword !== signupConfirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (!signupUsername || !signupEmail || !signupPassword || !signupFirstName || !signupLastName || !signupPhoneNumber) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('first_name', signupFirstName);
      formData.append('last_name', signupLastName);
      formData.append('username', signupUsername);
      formData.append('email', signupEmail);
      formData.append('password', signupPassword);
      formData.append('phone_number', signupPhoneNumber);

      if (signupProfileImage) {
        const filename = signupProfileImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('profile_image', { uri: signupProfileImage, name: filename, type });
      }

      const response = await fetch(`${process.env.API_BASE_URL}/auth/register/`, {
        method: 'POST',
        body: formData, // fetch will automatically set 'Content-Type': 'multipart/form-data'
      });

      const data = await response.json();
      setLoading(false);

      if (response.status === 201) {
        Alert.alert('Success', 'Account created successfully! Please log in.');
        setIsLoginMode(true);
        // Clear signup form fields
        setSignupFirstName('');
        setSignupLastName('');
        setSignupUsername('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupConfirmPassword('');
        setSignupPhoneNumber('');
        setSignupProfileImage(null);
      } else {
        let errorMessage = 'Registration failed.';
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map(e => e.detail || JSON.stringify(e)).join('\n');
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object' && Object.keys(data).length > 0) {
          errorMessage = Object.values(data).flat().join('\n');
        }
        Alert.alert('Error', errorMessage);
        console.log('Registration failed:', data);
      }
    } catch (error) {
      setLoading(false);
      console.error('Network error during signup:', error);
      Alert.alert(
        'Error',
        'Network error. Make sure your server is running and accessible.'
      );
    }
  };

  const renderLoginForm = () => (
    <View className="space-y-4">
      <View>
        <Text className="text-gray-600 mb-1">Email</Text>
        <TextInput
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
          placeholder="Enter your email"
          keyboardType="email-address"
          value={loginEmail}
          onChangeText={setLoginEmail}
        />
      </View>
      <View>
        <Text className="text-gray-600 mb-1">Password</Text>
        <TextInput
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
          placeholder="Enter your password"
          secureTextEntry
          value={loginPassword}
          onChangeText={setLoginPassword}
        />
      </View>
    </View>
  );

  const renderSignupForm = () => (
    <View className="space-y-4">
      <View>
        <Text className="text-gray-600 mb-1">First Name</Text>
        <TextInput
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
          placeholder="Enter your first name"
          value={signupFirstName}
          onChangeText={setSignupFirstName}
        />
      </View>
      <View>
        <Text className="text-gray-600 mb-1">Last Name</Text>
        <TextInput
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
          placeholder="Enter your last name"
          value={signupLastName}
          onChangeText={setSignupLastName}
        />
      </View>
      <View>
        <Text className="text-gray-600 mb-1">Username</Text>
        <TextInput
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
          placeholder="Choose a username"
          value={signupUsername}
          onChangeText={setSignupUsername}
        />
      </View>
      <View>
        <Text className="text-gray-600 mb-1">Email</Text>
        <TextInput
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
          placeholder="Enter your email"
          keyboardType="email-address"
          value={signupEmail}
          onChangeText={setSignupEmail}
        />
      </View>
      <View>
        <Text className="text-gray-600 mb-1">Password</Text>
        <TextInput
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
          placeholder="Enter a strong password"
          secureTextEntry
          value={signupPassword}
          onChangeText={setSignupPassword}
        />
      </View>
      <View>
        <Text className="text-gray-600 mb-1">Confirm Password</Text>
        <TextInput
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
          placeholder="Confirm your password"
          secureTextEntry
          value={signupConfirmPassword}
          onChangeText={setSignupConfirmPassword}
        />
      </View>
      <View>
        <Text className="text-gray-600 mb-1">Phone Number</Text>
        <TextInput
          className="w-full px-4 py-3 rounded-xl border border-gray-300"
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          value={signupPhoneNumber}
          onChangeText={setSignupPhoneNumber}
        />
      </View>
      <View>
        <Text className="text-gray-600 mb-1">Profile Image</Text>
        <TouchableOpacity
          className="w-full px-4 py-3 rounded-xl border border-gray-300 flex-row items-center justify-center bg-gray-50"
          onPress={pickImage}
        >
          {signupProfileImage ? (
            <Image 
              source={{ uri: signupProfileImage }} 
              className="w-12 h-12 rounded-full mr-4" 
            />
          ) : (
            <Text className="text-gray-500">Choose Profile Image</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 p-6 bg-gray-100">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-sm">
          {/* App Logo */}
          <View className="items-center mb-6">
            <Image
              source={require('../assets/Expense Tracer.png')}
              style={{ width: 64, height: 64, borderRadius: 32 }}
              resizeMode="contain"
            />
            <Text className="text-2xl font-bold text-purple-700 mt-2">
              Welcome to Rupaiyaa
            </Text>
            <Text className="text-sm text-gray-500">
              Your smart budget tracking companion
            </Text>
          </View>

          {/* Login/Sign Up Tabs */}
          <View className="flex-row rounded-full p-1 bg-gray-200 mb-6">
            <TouchableOpacity
              className={`flex-1 items-center py-2 px-4 rounded-full ${isLoginMode ? 'bg-white shadow' : ''}`}
              onPress={() => setIsLoginMode(true)}
            >
              <Text className={`font-semibold ${isLoginMode ? 'text-purple-700' : 'text-gray-500'}`}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 items-center py-2 px-4 rounded-full ${!isLoginMode ? 'bg-white shadow' : ''}`}
              onPress={() => setIsLoginMode(false)}
            >
              <Text className={`font-semibold ${!isLoginMode ? 'text-purple-700' : 'text-gray-500'}`}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Conditionally render form based on state */}
          {isLoginMode ? renderLoginForm() : renderSignupForm()}

          {/* Action Button */}
          <TouchableOpacity
            className="w-full bg-purple-700 py-4 rounded-xl mt-6 flex items-center justify-center"
            onPress={isLoginMode ? handleLogin : handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center font-bold">
                {isLoginMode ? 'Login' : 'Sign Up'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Terms of Service */}
          <Text className="text-xs text-gray-400 text-center mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default LoginScreen;