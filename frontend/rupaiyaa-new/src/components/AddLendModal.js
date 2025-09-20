import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Picker, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = 'http://127.0.0.1:8000';

const AddLendModal = ({ visible, onClose, onSuccess }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [participant, setParticipant] = useState('');
  // Removed transactionType as it's not needed in the payload
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      fetchUsers();
    }
  }, [visible]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/auth/list/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.results || data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (e) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const payload = {
        participant,
        amount,
        interest_rate: interestRate,
        due_date: dueDate,
        description,
      };
      const response = await fetch(`${API_BASE_URL}/lend/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        onSuccess && onSuccess();
        onClose();
      } else {
        const err = await response.text();
        setError(err || 'Failed to add lend');
      }
    } catch (e) {
      setError('Failed to add lend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: '90%' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Add Lend</Text>
          {error ? <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text> : null}
          {loading ? <ActivityIndicator /> : <>
            <Text style={{ marginBottom: 4 }}>Select User</Text>
            <Picker
              selectedValue={participant}
              onValueChange={setParticipant}
              style={{ marginBottom: 12 }}
            >
              <Picker.Item label="Select user" value="" />
              {users.map((u) => (
                <Picker.Item key={u.id || u.pk || u.uuid} label={u.username || u.email || u.name} value={u.id || u.pk || u.uuid} />
              ))}
            </Picker>
            <TextInput
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8 }}
            />
            <TextInput
              placeholder="Interest Rate"
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8 }}
            />
            <TextInput
              placeholder="Due Date (YYYY-MM-DD)"
              value={dueDate}
              onChangeText={setDueDate}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8 }}
            />
            <TextInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity onPress={onClose} style={{ marginRight: 16 }}>
                <Text style={{ color: '#7C3AED', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmit} style={{ backgroundColor: '#7C3AED', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </>}
        </View>
      </View>
    </Modal>
  );
};

export default AddLendModal;
