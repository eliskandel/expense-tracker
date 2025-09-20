import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createEvent, fetchEvents } from '../api/eventApi';

const EventScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [eventExpenses, setEventExpenses] = useState({}); // { [eventId]: totalExpense }

  const loadEvents = async () => {
    setFetching(true);
    try {
      const data = await fetchEvents();
      const eventList = data.results || data;
      setEvents(eventList);
      // Fetch total expense for each event
      const accessToken = await AsyncStorage.getItem('access_token');
      const summaryResults = {};
      await Promise.all(
        (eventList || []).map(async (ev) => {
          try {
            const res = await fetch(`${process.env.API_BASE_URL || 'http://127.0.0.1:8000'}/event/expenses/summary/?event_id=${ev.id}`, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) {
              const data = await res.json();
              // Only total_expense is sent
              summaryResults[ev.id] = typeof data.total_expenses === 'number' ? data.total_expenses : 0;
            } else {
              summaryResults[ev.id] = 0;
            }
          } catch {
            summaryResults[ev.id] = 0;
          }
        })
      );
      setEventExpenses(summaryResults);
    } catch (e) {
      setEvents([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleAddEvent = async () => {
    if (!name || !description || !date || !location) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await createEvent({ name, description, date, location });
      setName(''); setDescription(''); setDate(''); setLocation('');
      loadEvents();
      Alert.alert('Success', 'Event created!');
    } catch (e) {
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>{'< Back'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Add an Event</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
        <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />
        <TouchableOpacity style={styles.button} onPress={handleAddEvent} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add Event</Text>}
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Events</Text>
      {fetching ? <ActivityIndicator /> : (
        <ScrollView style={{ width: '100%' }}>
          {events.length === 0 ? <Text style={{ textAlign: 'center', color: '#888' }}>No events found.</Text> :
            events.map(ev => (
              <TouchableOpacity
                key={ev.id || ev.name}
                style={styles.eventCard}
                onPress={() => navigation.navigate('EventExpenseScreen', { eventId: ev.id, eventName: ev.name })}
              >
                <Text style={styles.eventName}>{ev.name}</Text>
                <Text style={styles.eventDesc}>{ev.description}</Text>
                <Text style={styles.eventMeta}>Date: {ev.date}</Text>
                <Text style={styles.eventMeta}>Location: {ev.location}</Text>
                <Text style={styles.eventMeta}>Total Expense: रू{eventExpenses[ev.id] ?? '...'}</Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  backButton: {
    marginBottom: 8,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  backButtonText: {
    color: '#7C3AED',
    fontWeight: 'bold',
    fontSize: 16,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  button: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 15,
    color: '#444',
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 13,
    color: '#666',
  },
});

export default EventScreen;
