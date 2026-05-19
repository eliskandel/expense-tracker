import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8000';

const EventExpenseScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { eventId, eventName } = route.params;
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [totalExpense, setTotalExpense] = useState(null);

  const fetchExpenses = async () => {
    setFetching(true);
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/event/expenses/?event_id=${eventId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.status === 401) {
        setExpenses([]);
        Alert.alert('Unauthorized', 'Please log in again.');
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.results)) {
        setExpenses(data.results);
      } else if (Array.isArray(data)) {
        setExpenses(data);
      } else {
        setExpenses([]);
      }
    } catch (e) {
      setExpenses([]);
    } finally {
      setFetching(false);
    }
  };

  const fetchTotalExpense = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/event/expenses/summary/?event_id=${eventId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Always use data.total_expenses as the total
        setTotalExpense(typeof data.total_expenses === 'number' ? data.total_expenses : 0);
      } else {
        setTotalExpense(0);
      }
    } catch {
      setTotalExpense(0);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchTotalExpense();
  }, []);

  const handleAddExpense = async () => {
    if (!description || !amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/event/expenses/?event_id=${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
          body: JSON.stringify({
            description,
            amount,
            event: eventId,
          }),
        });
      if (!res.ok) throw new Error('Failed to add expense');
      setDescription(''); setAmount('');
      fetchExpenses();
      Alert.alert('Success', 'Expense added!');
    } catch (e) {
      Alert.alert('Error', 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      await fetch(`${API_BASE_URL}/event/expenses/${expenseId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      fetchExpenses();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete expense');
    }
  };

  const handleDeleteEvent = async () => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await fetch(`${API_BASE_URL}/event/${eventId}/`, { method: 'DELETE' });
          navigation.goBack();
        } catch (e) {
          Alert.alert('Error', 'Failed to delete event');
        }
      }}
    ]);
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#F3F4F6' }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 8, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#E5E7EB' }}>
        <Text style={{ color: '#7C3AED', fontWeight: 'bold', fontSize: 16 }}>{'< Back'}</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#7C3AED' }}>{eventName}</Text>
        <TouchableOpacity onPress={handleDeleteEvent} style={{ padding: 6, borderRadius: 8, backgroundColor: '#FEE2E2' }}>
          <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Delete</Text>
        </TouchableOpacity>
      </View>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 16, backgroundColor: '#F9FAFB' }} />
        <TextInput placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 16, backgroundColor: '#F9FAFB' }} />
        <TouchableOpacity onPress={handleAddExpense} style={{ backgroundColor: '#7C3AED', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add Expense</Text>}
        </TouchableOpacity>
      </View>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#222' }}>Expenses</Text>
      {fetching ? <ActivityIndicator /> : (
        Array.isArray(expenses) && expenses.length > 0 ? (
          <ScrollView style={{ width: '100%' }}>
            {expenses.map(exp => (
              <View key={exp.id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontWeight: 'bold', color: '#7C3AED', fontSize: 16 }}>{exp.description}</Text>
                  <Text style={{ color: '#444' }}>Amount: {exp.amount}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteExpense(exp.id)} style={{ padding: 6, borderRadius: 8, backgroundColor: '#FEE2E2' }}>
                  <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={{ textAlign: 'center', color: '#888' }}>No expenses found.</Text>
        )
      )}
      {/* Total Expense Section */}
      <View style={{ marginTop: 18, alignItems: 'flex-start' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>Total Event Expense: <Text style={{ color: '#7C3AED' }}>रू{totalExpense !== null ? totalExpense : '...'}</Text></Text>
      </View>
    </View>
  );
};

export default EventExpenseScreen;
