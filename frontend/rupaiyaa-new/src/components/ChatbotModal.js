import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';


const ChatbotModal = ({ visible, onClose, onSend, isDarkMode, loading, response, context, history }) => {
  const [message, setMessage] = useState('');
  const scrollViewRef = useRef();

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  // Helper to render context summary
  const renderContext = () => {
    if (!context) return null;
    return (
      <View style={{ marginTop: 16, backgroundColor: isDarkMode ? '#23232a' : '#F3F4F6', borderRadius: 10, padding: 12 }}>
        {context.month_year && (
          <Text style={{ color: isDarkMode ? '#fff' : '#222', fontWeight: 'bold', marginBottom: 4 }}>{context.month_year} Summary</Text>
        )}
        {context.monthly_income !== undefined && (
          <Text style={{ color: isDarkMode ? '#fff' : '#222' }}>Income: NPR {context.monthly_income}</Text>
        )}
        {context.monthly_expenses !== undefined && (
          <Text style={{ color: isDarkMode ? '#fff' : '#222' }}>Expenses: NPR {context.monthly_expenses}</Text>
        )}
        {context.expense_by_category && (
          <View style={{ marginTop: 4 }}>
            <Text style={{ color: isDarkMode ? '#fff' : '#222', fontWeight: 'bold' }}>By Category:</Text>
            {Object.entries(context.expense_by_category).map(([cat, amt]) => (
              <Text key={cat} style={{ color: isDarkMode ? '#fff' : '#222', marginLeft: 8 }}>{cat}: NPR {amt}</Text>
            ))}
          </View>
        )}
        {context.budget_analysis && Array.isArray(context.budget_analysis) && context.budget_analysis.length > 0 && (
          <View style={{ marginTop: 4 }}>
            <Text style={{ color: isDarkMode ? '#fff' : '#222', fontWeight: 'bold' }}>Budget Analysis:</Text>
            {context.budget_analysis.map((b, idx) => (
              <Text key={idx} style={{ color: isDarkMode ? '#fff' : '#222', marginLeft: 8 }}>{b.category}: Allowed {b.allowed}, Spent {b.spent}, Remaining {b.remaining}, Used {b.percentage_used?.toFixed(1)}%</Text>
            ))}
          </View>
        )}
        {context.recent_expenses && Array.isArray(context.recent_expenses) && context.recent_expenses.length > 0 && (
          <View style={{ marginTop: 4 }}>
            <Text style={{ color: isDarkMode ? '#fff' : '#222', fontWeight: 'bold' }}>Recent Expenses:</Text>
            {context.recent_expenses.map((e, idx) => (
              <Text key={idx} style={{ color: isDarkMode ? '#fff' : '#222', marginLeft: 8 }}>{e.date}: {e.description} ({e.category__name}) - NPR {e.amount}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Scroll to bottom when history or response changes
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [history, response]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: isDarkMode ? '#18181B' : '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 0, minHeight: 260, maxHeight: '80%' }}>
          <ScrollView ref={scrollViewRef} style={{ padding: 20 }} contentContainerStyle={{ paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="robot" size={28} color={isDarkMode ? '#A78BFA' : '#7C3AED'} />
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginLeft: 8, color: isDarkMode ? '#fff' : '#222' }}>Chatbot</Text>
              <TouchableOpacity onPress={onClose} style={{ marginLeft: 'auto' }}>
                <MaterialCommunityIcons name="close" size={24} color={isDarkMode ? '#fff' : '#222'} />
              </TouchableOpacity>
            </View>
            {/* Chat history */}
            {Array.isArray(history) && history.length > 0 && history.map((msg, idx) => (
              <View key={msg.user_message_id || msg.ai_message_id || idx} style={{ marginBottom: 10, alignSelf: msg.ai_response ? 'flex-start' : 'flex-end', maxWidth: '90%' }}>
                {msg.user_message && (
                  <View style={{ backgroundColor: isDarkMode ? '#7C3AED' : '#E5E7EB', borderRadius: 10, padding: 8, marginBottom: 2, alignSelf: 'flex-end' }}>
                    <Text style={{ color: isDarkMode ? '#fff' : '#222' }}>{msg.user_message}</Text>
                  </View>
                )}
                {msg.ai_response && (
                  <View style={{ backgroundColor: isDarkMode ? '#23232a' : '#F3F4F6', borderRadius: 10, padding: 8, alignSelf: 'flex-start' }}>
                    <Text style={{ color: isDarkMode ? '#fff' : '#222' }}>{msg.ai_response}</Text>
                  </View>
                )}
              </View>
            ))}
            {/* AI Response */}
            {response && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: isDarkMode ? '#fff' : '#222', fontSize: 16 }}>{response}</Text>
              </View>
            )}
            {/* Context summary */}
            {renderContext()}
          </ScrollView>
          {/* Message input */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 0, paddingHorizontal: 20, paddingBottom: 16 }}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type your message..."
              placeholderTextColor={isDarkMode ? '#A1A1AA' : '#888'}
              style={{ flex: 1, borderWidth: 1, borderColor: isDarkMode ? '#27272A' : '#E5E7EB', borderRadius: 8, padding: 10, color: isDarkMode ? '#fff' : '#222', backgroundColor: isDarkMode ? '#27272A' : '#F3F4F6' }}
              editable={!loading}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={handleSend} disabled={loading || !message.trim()} style={{ marginLeft: 8, opacity: loading || !message.trim() ? 0.5 : 1 }}>
              {loading ? (
                <ActivityIndicator size={22} color={isDarkMode ? '#A78BFA' : '#7C3AED'} />
              ) : (
                <MaterialCommunityIcons name="send" size={24} color={isDarkMode ? '#A78BFA' : '#7C3AED'} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ChatbotModal;
