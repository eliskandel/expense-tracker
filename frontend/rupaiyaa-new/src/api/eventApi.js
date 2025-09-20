const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8000';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchEvents = async () => {
  const accessToken = await AsyncStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/event/`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch events');
  return await res.json();
};

export const createEvent = async (eventData) => {
  const accessToken = await AsyncStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/event/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });
  if (!res.ok) throw new Error('Failed to create event');
  return await res.json();
};
