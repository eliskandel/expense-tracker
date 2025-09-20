export const markNotificationRead = async (id) => {
  const accessToken = await AsyncStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/notification/${id}/read/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ read: true }) // Send a body to ensure PATCH works on all backends
  });
  if (!response.ok) throw new Error('Failed to mark notification as read');
  return response.json();
};

export const markAllNotificationsRead = async () => {
  const accessToken = await AsyncStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/notification/mark-all-as-read/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ read: true })
  });
  if (!response.ok) throw new Error('Failed to mark all notifications as read');
  return response.json();
};

export const fetchUnreadCount = async () => {
  const accessToken = await AsyncStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/notification/unread/count/`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch unread count');
  return response.json();
};
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const fetchNotifications = async () => {
  const accessToken = await AsyncStorage.getItem('access_token');
  const response = await fetch(`${API_BASE_URL}/notification/`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
};
