import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomHeader from '../components/CustomHeader';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
const API_BASE_URL = 'http://127.0.0.1:8000';
const SetBudgetGoal = () => {
  const [month, setMonth] = useState(getCurrentMonth());
  const [categoryId, setCategoryId] = useState(0); // 0 = All
  const [threshold, setThreshold] = useState('');
  const [categories, setCategories] = useState([{ id: 0, name: 'All' }]);
  const [loading, setLoading] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    // Fetch categories from backend
    const fetchCategories = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/expense/categories/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setCategories([{ id: 0, name: 'All' }, ...data]);
        } else if (data.results && Array.isArray(data.results)) {
          setCategories([{ id: 0, name: 'All' }, ...data.results]);
        }
      } catch (e) {
        // fallback to just 'All'
      }
    };
    fetchCategories();
  }, []);

  const handleSaveBudget = async () => {
    if (!month) {
      Alert.alert('Invalid Input', 'Please select a month.');
      return;
    }
    if (!threshold || isNaN(threshold) || Number(threshold) < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid threshold percentage.');
      return;
    }
    setLoading(true);
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const payload = {
        month: month + '-01', // API expects full date string for month start
        category_id: categoryId,
        threshold_percentage: Number(threshold),
      };
      const response = await fetch(`${API_BASE_URL}/budget/budgets/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok || response.status === 201) {
        Alert.alert('Success', 'Budget goal saved to server!');
        setThreshold('');
      } else {
        let errorMsg = data.detail || 'Failed to save budget goal.';
        if (typeof data === 'object') {
          errorMsg = Object.values(data).flat().join('\n');
        }
        Alert.alert('Error', errorMsg);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget goal.');
    } finally {
      setLoading(false);
    }
  };

  // Month picker logic
  const handleMonthChange = (event, selectedDate) => {
    setShowMonthPicker(false);
    if (selectedDate) {
      setMonth(`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`);
    }
  };

  return (
    <View className="flex-1 bg-gray-100">
      <CustomHeader title="Set Budget Goal" showBackButton={true} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-sm">
          <Text className="text-2xl font-bold text-purple-700 mb-4 text-center">Set Your Budget Goal</Text>

          {/* Month Picker */}
          <Text className="mb-1 text-gray-600">Month</Text>
          {Platform.OS === 'web' ? (
            <TextInput
              className="w-full px-4 py-3 rounded-xl border border-gray-300 mb-4 text-lg"
              type="month"
              value={month}
              onChangeText={setMonth}
            />
          ) : (
            <TouchableOpacity
              className="w-full px-4 py-3 rounded-xl border border-gray-300 mb-4"
              onPress={() => setShowMonthPicker(true)}
            >
              <Text className="text-lg">{month}</Text>
            </TouchableOpacity>
          )}
          {showMonthPicker && (
            <DateTimePicker
              value={new Date(month + '-01')}
              mode="date"
              display="default"
              onChange={handleMonthChange}
            />
          )}

          {/* Category Picker */}
          <Text className="mb-1 text-gray-600">Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                className={`px-4 py-2 mr-2 rounded-xl border ${categoryId === cat.id ? 'bg-blue-600 border-blue-600' : 'bg-gray-100 border-gray-300'}`}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text className={categoryId === cat.id ? 'text-white font-bold' : 'text-gray-700'}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Threshold Percentage */}
          <Text className="mb-1 text-gray-600">Threshold Percentage (%)</Text>
          <TextInput
            className="w-full px-4 py-3 rounded-xl border border-gray-300 mb-4 text-lg"
            placeholder="e.g. 80"
            keyboardType="numeric"
            value={threshold}
            onChangeText={setThreshold}
          />

          <TouchableOpacity
            className="w-full bg-blue-600 py-4 rounded-xl items-center"
            onPress={handleSaveBudget}
            disabled={loading}
          >
            <Text className="text-white text-lg font-bold">{loading ? 'Saving...' : 'Save Budget'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SetBudgetGoal;
