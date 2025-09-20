import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const fetchLendLogs = async () => {
  const accessToken = await AsyncStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/lend/`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch lend logs');
  return response.json();
};

export const verifyLend = async (id) => {
  const accessToken = await AsyncStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/lend/${id}/verification/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to verify lend');
  return response.json();
};
