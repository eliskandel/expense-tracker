import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { fetchNotifications, fetchUnreadCount, markAllNotificationsRead, markNotificationRead } from '../api/notificationApi';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigation = useNavigation();

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications();
      setNotifications(data.results || data);
      const unread = await fetchUnreadCount();
      setUnreadCount(unread.unread_count || 0);
    } catch (e) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12, padding: 4 }}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={{ fontWeight: 'bold', fontSize: 22, flex: 1 }}>Notifications</Text>
        <Text style={{ backgroundColor: '#8A2BE2', color: 'white', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
          {unreadCount}
        </Text>
        <TouchableOpacity
          onPress={async () => {
            try {
              await markAllNotificationsRead();
              await loadNotifications();
              const unread = await fetchUnreadCount();
              if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('notificationRead', { detail: { id: 'all', count: unread.unread_count || 0 } }));
              }
            } catch (err) {
              console.log('Error marking all as read:', err);
            }
          }}
          style={{ padding: 8, backgroundColor: '#8A2BE2', borderRadius: 8, marginLeft: 8 }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Mark all as read</Text>
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator /> : error ? (
        <Text style={{ color: 'red' }}>{error}</Text>
      ) : notifications.length === 0 ? (
        <Text>No notifications.</Text>
      ) : (
        <ScrollView>
          {notifications.map((n, idx) => (
            <TouchableOpacity
              key={n.id}
              style={{
                borderBottomWidth: 1,
                borderColor: '#eee',
                paddingVertical: 12,
                // Updated background colors for read and unread notifications
                backgroundColor: n.is_read ? '#fafafa' : '#f3e8ff'
              }}
              onPress={async () => {
                if (!n.is_read) {
                  try {
                    const resp = await markNotificationRead(n.id);
                    console.log('Backend response for markNotificationRead:', resp);
                    await loadNotifications();
                    const unread = await fetchUnreadCount();
                    if (typeof window !== 'undefined' && window.dispatchEvent) {
                      window.dispatchEvent(new CustomEvent('notificationRead', { detail: { id: n.id, count: unread.unread_count || 0 } }));
                    }
                  } catch (err) {
                    console.log('Error marking notification as read:', err);
                  }
                }
              }}
            >
              <Text style={{ fontWeight: n.is_read ? 'normal' : 'bold' }}>{n.title || n.message || 'Notification'}</Text>
              {n.created_at && <Text style={{ color: '#888', fontSize: 12 }}>{n.created_at}</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default NotificationsScreen;