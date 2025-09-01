import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const GroupExpenseModal = ({
  visible,
  onClose,
  isDarkMode,
  colors,
  groupExpenses,
  groupExpensesLoading,
  renderAddExpenseForm,
  selectedGroup
}) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <View style={{ width: '90%', padding: 24, borderRadius: 12, maxHeight: '80%', backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#111827' }}>
            {selectedGroup ? selectedGroup.name : 'Group Expenses'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={isDarkMode ? '#D1D5DB' : '#6B7280'} />
          </TouchableOpacity>
        </View>
        {/* Expense Log */}
        <View style={{ maxHeight: 180, marginBottom: 12 }}>
          {groupExpensesLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : !groupExpenses || !Array.isArray(groupExpenses) || groupExpenses.length === 0 ? (
            <Text style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280', textAlign: 'center', marginVertical: 8 }}>No expenses yet for this group.</Text>
          ) : (
            <ScrollView>
              {groupExpenses.map(exp => {
                let categoryLabel = '';
                if (typeof exp.category === 'object' && exp.category !== null) {
                  categoryLabel = exp.category.name || JSON.stringify(exp.category);
                } else {
                  categoryLabel = exp.category_name || exp.category || '';
                }
                return (
                  <View key={exp.id} style={{ borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB', paddingVertical: 8 }}>
                    <Text style={{ color: isDarkMode ? '#fff' : '#111827', fontWeight: 'bold' }}>{exp.description}</Text>
                    <Text style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 13 }}>Amount: {exp.amount}</Text>
                    <Text style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 13 }}>Category: {categoryLabel}</Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
        {/* Add Expense Form */}
        {renderAddExpenseForm()}
      </View>
    </View>
  </Modal>
);

export default GroupExpenseModal;
