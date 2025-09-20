import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal, Platform, ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const API_BASE_URL = 'http://127.0.0.1:8000';

const GroupExpenseScreen = () => {
  const { isLoggedIn, id } = useContext(AuthContext);
  const { colors, isDarkMode } = useContext(ThemeContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { group } = route.params;

  // State for group expense log
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [groupExpensesLoading, setGroupExpensesLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);

  // State for add expense form
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [totalAmount, setTotalAmount] = useState('');
  const [splitType, setSplitType] = useState('equal'); // 'equal' or 'unequal'
  const [unequalSplitType, setUnequalSplitType] = useState('manual'); // 'manual' or 'itemized'
  const [manualSplits, setManualSplits] = useState({}); // {userId: amount}
  const [itemizedExpenses, setItemizedExpenses] = useState([{ item_name: '', amount: '', members: [] }]);
  const [isSettled, setIsSettled] = useState(false);
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [items, setItems] = useState([{ item_name: '', amount: '', owes: {} }]);
  const [categories, setCategories] = useState([]);
  const [isAddingSharedExpense, setIsAddingSharedExpense] = useState(false);
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);

  // State for expense detail modal
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseDetailVisible, setExpenseDetailVisible] = useState(false);
  const [updatingSettlement, setUpdatingSettlement] = useState(false);

  useEffect(() => {
    fetchGroupExpenses();
    fetchCategories();
    setExpensePaidBy(id || '');
  }, []);

  const getAccessToken = async () => {
    return await AsyncStorage.getItem('access_token');
  };

  const fetchGroupExpenses = async () => {
    setGroupExpensesLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('No access token');
      const res = await fetch(`${API_BASE_URL}/expense/groups/?group_id=${group.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Group expenses response status:', res.status);
      console.log('Group expenses data:', data);
      // Support data.expenses/members, data.results.expenses/members, and data.results[0].expenses/members
      let expensesArr = [];
      let membersArr = [];
      if (Array.isArray(data.expenses)) {
        expensesArr = data.expenses;
      } else if (data.results && Array.isArray(data.results.expenses)) {
        expensesArr = data.results.expenses;
      } else if (Array.isArray(data.results) && data.results[0] && Array.isArray(data.results[0].expenses)) {
        expensesArr = data.results[0].expenses;
      }
      if (Array.isArray(data.members)) {
        membersArr = data.members;
      } else if (data.results && Array.isArray(data.results.members)) {
        membersArr = data.results.members;
      } else if (Array.isArray(data.results) && data.results[0] && Array.isArray(data.results[0].members)) {
        membersArr = data.results[0].members;
      }
      setGroupExpenses(expensesArr);
      setGroupMembers(membersArr);
    } catch (err) {
      console.error('Error fetching group expenses:', err);
      setGroupExpenses([]);
    } finally {
      setGroupExpensesLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      
      const res = await fetch(`${API_BASE_URL}/expense/categories/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      setCategories(data.results || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleAddSharedExpense = async () => {
    if (!expenseDescription.trim() || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    // Validation for different split types
    let calculatedTotalAmount = 0;
    let expenseItems = [];
    let finalSplitType = splitType; // Will be 'equal', 'manual', or 'itemized'

    if (splitType === 'equal') {
      if (!totalAmount.trim()) {
        Alert.alert('Error', 'Please enter the total amount.');
        return;
      }
      calculatedTotalAmount = parseFloat(totalAmount);
      finalSplitType = 'equal';
    } else if (splitType === 'unequal') {
      if (unequalSplitType === 'manual') {
        const manualTotal = Object.values(manualSplits).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
        if (manualTotal === 0) {
          Alert.alert('Error', 'Please enter manual split amounts for at least one member.');
          return;
        }
        if (totalAmount.trim() && Math.abs(manualTotal - parseFloat(totalAmount)) > 0.01) {
          Alert.alert('Error', 'Manual split amounts must equal the total amount.');
          return;
        }
        calculatedTotalAmount = manualTotal;
        finalSplitType = 'manual';
        expenseItems = Object.entries(manualSplits)
          .filter(([_, amount]) => parseFloat(amount) > 0)
          .map(([memberId, amount]) => ({
            member_id: memberId,
            amount: parseFloat(amount)
          }));
      } else if (unequalSplitType === 'itemized') {
        const itemizedTotal = itemizedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        if (itemizedTotal === 0) {
          Alert.alert('Error', 'Please add at least one item with an amount.');
          return;
        }
        calculatedTotalAmount = itemizedTotal;
        finalSplitType = 'itemized';
        expenseItems = itemizedExpenses
          .filter(item => item.item_name.trim() && parseFloat(item.amount) > 0 && item.members.length > 0)
          .map(item => ({
            item_name: item.item_name,
            amount: parseFloat(item.amount),
            members: item.members
          }));
        if (expenseItems.length === 0) {
          Alert.alert('Error', 'Please ensure all items have a name, amount, and at least one member assigned.');
          return;
        }
      }
    }

    setIsAddingSharedExpense(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('No access token');

      // Format date as YYYY-MM-DD
      const formattedDate = expenseDate.toISOString().split('T')[0];


      // Build shares array for payload
      let shares = [];
      if (finalSplitType === 'equal') {
        // For equal split, divide amount equally among group members
        const memberIds = groupMembers.map(m => m.id);
        const shareAmount = calculatedTotalAmount / memberIds.length;
        shares = memberIds.map(userId => ({
          user: userId,
          amount_owed: shareAmount.toString(),
          item_name: ''
        }));
      } else if (finalSplitType === 'manual') {
        shares = Object.entries(manualSplits).map(([user, amount]) => ({
          user,
          amount_owed: amount.toString(),
          item_name: ''
        }));
      } else if (finalSplitType === 'itemized') {
        shares = [];
        itemizedExpenses.forEach(item => {
          item.members.forEach(userId => {
            shares.push({
              user: userId,
              amount_owed: item.amount.toString(),
              item_name: item.item_name
            });
          });
        });
      }

      const expenseData = {
        amount: totalAmount,
        description: expenseDescription,
        date: formattedDate,
        category_id: selectedCategory,
        group: group.id,
        split_type: finalSplitType,
        shares,
        created_by: id,
        is_settled: isSettled
      };

      console.log('Sending expense data:', expenseData);

      const response = await fetch(`${API_BASE_URL}/expense/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        Alert.alert('Success', 'Shared expense added successfully!');
        // Reset form
        setExpenseDescription('');
        setSelectedCategory(null);
        setTotalAmount('');
        setManualSplits({});
        setItemizedExpenses([{ item_name: '', amount: '', members: [] }]);
        setIsSettled(false);
        // Refresh expenses
        fetchGroupExpenses();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'Failed to add shared expense.');
        console.error('API Error:', errorData);
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not connect to the server.');
      console.error('Network Error:', error);
    } finally {
      setIsAddingSharedExpense(false);
    }
  };

  const handleExpensePress = async (expense) => {
    setSelectedExpense(expense);
    setExpenseDetailVisible(true);
    try {
      const accessToken = await getAccessToken();
      const res = await fetch(`${API_BASE_URL}/expense/expenseshares/?expense_id=${expense.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Merge the detailed info into selectedExpense
        setSelectedExpense(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Error fetching expense share details:', err);
    }
  };

  const handleUpdateSettlement = async (expenseId, newSettlementStatus) => {
    setUpdatingSettlement(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('No access token');

      const response = await fetch(`${API_BASE_URL}/expense/${expenseId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          is_settled: newSettlementStatus
        }),
      });

      if (response.ok) {
        Alert.alert('Success', `Expense ${newSettlementStatus ? 'marked as settled' : 'marked as unsettled'}!`);
        // Update the selected expense
        setSelectedExpense(prev => ({ ...prev, is_settled: newSettlementStatus }));
        // Refresh expenses list
        fetchGroupExpenses();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'Failed to update settlement status.');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not connect to the server.');
      console.error('Network Error:', error);
    } finally {
      setUpdatingSettlement(false);
    }
  };

  const renderExpenseItem = (expense) => {
    let categoryLabel = '';
    if (typeof expense.category === 'object' && expense.category !== null) {
      categoryLabel = expense.category.name || JSON.stringify(expense.category);
    } else {
      categoryLabel = expense.category_name || expense.category || '';
    }

    return (
      <TouchableOpacity 
        key={expense.id} 
        style={[styles.expenseItem, { backgroundColor: isDarkMode ? '#374151' : '#F9FAFB', borderColor: isDarkMode ? '#4B5563' : '#E5E7EB' }]}
        onPress={() => handleExpensePress(expense)}
        activeOpacity={0.7}
      >
        <View style={styles.expenseHeader}>
          <Text style={[styles.expenseDescription, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
            {expense.description}
          </Text>
          <Text style={[styles.expenseAmount, { color: colors.primary }]}>
            रू {expense.amount}
          </Text>
        </View>
        <Text style={[styles.expenseCategory, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
          Category: {categoryLabel}
        </Text>
        {expense.split_amount && (
          <Text style={[styles.splitAmount, { color: isDarkMode ? '#10B981' : '#059669' }]}>
            Your share: रू {expense.split_amount}
          </Text>
        )}
        <View style={styles.expenseFooter}>
          <Text style={[styles.expenseDate, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            {new Date(expense.created_at || expense.date).toLocaleDateString()}
          </Text>
          {expense.is_settled !== undefined && (
            <View style={[styles.settlementBadge, { backgroundColor: expense.is_settled ? '#10B981' : '#F59E0B' }]}>
              <Text style={styles.settlementText}>
                {expense.is_settled ? 'Settled' : 'Pending'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6' }]}>
      <Header 
        title={group.name} 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()}
        showProfileIcon={false} 
      />

      <ScrollView style={styles.content}>
        {/* Expense Log Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
            Expense Log
          </Text>
          {groupExpensesLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : !groupExpenses || groupExpenses.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: isDarkMode ? '#374151' : '#F9FAFB' }]}>
              <MaterialCommunityIcons 
                name="receipt" 
                size={48} 
                color={isDarkMode ? '#6B7280' : '#9CA3AF'} 
              />
              <Text style={[styles.emptyText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                No expenses yet for this group.
              </Text>
            </View>
          ) : (
            <View style={styles.expensesList}>
              {groupExpenses.map(renderExpenseItem)}
            </View>
          )}
        </View>

        {/* Add Expense Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
            Add New Expense
          </Text>

          {/* Split Type Buttons */}
          <View style={styles.splitTypeContainer}>
            <TouchableOpacity
              style={[
                styles.splitButton,
                splitType === 'equal' && styles.splitButtonActive,
                { backgroundColor: splitType === 'equal' ? colors.primary : (isDarkMode ? '#374151' : '#F3F4F6') }
              ]}
              onPress={() => setSplitType('equal')}
            >
              <Text style={[
                styles.splitButtonText,
                { color: splitType === 'equal' ? '#FFFFFF' : (isDarkMode ? '#D1D5DB' : '#374151') }
              ]}>
                Equal Split
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.splitButton,
                splitType === 'unequal' && styles.splitButtonActive,
                { backgroundColor: splitType === 'unequal' ? colors.primary : (isDarkMode ? '#374151' : '#F3F4F6') }
              ]}
              onPress={() => setSplitType('unequal')}
            >
              <Text style={[
                styles.splitButtonText,
                { color: splitType === 'unequal' ? '#FFFFFF' : (isDarkMode ? '#D1D5DB' : '#374151') }
              ]}>
                Unequal Split
              </Text>
            </TouchableOpacity>
          </View>

          {/* Unequal Split Sub-options */}
          {splitType === 'unequal' && (
            <View style={styles.unequalOptionsContainer}>
              <View style={styles.splitTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.splitButton,
                    unequalSplitType === 'manual' && styles.splitButtonActive,
                    { backgroundColor: unequalSplitType === 'manual' ? colors.primary : (isDarkMode ? '#374151' : '#F3F4F6') }
                  ]}
                  onPress={() => setUnequalSplitType('manual')}
                >
                  <Text style={[
                    styles.splitButtonText,
                    { color: unequalSplitType === 'manual' ? '#FFFFFF' : (isDarkMode ? '#D1D5DB' : '#374151') }
                  ]}>
                    Manual Split
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.splitButton,
                    unequalSplitType === 'itemized' && styles.splitButtonActive,
                    { backgroundColor: unequalSplitType === 'itemized' ? colors.primary : (isDarkMode ? '#374151' : '#F3F4F6') }
                  ]}
                  onPress={() => setUnequalSplitType('itemized')}
                >
                  <Text style={[
                    styles.splitButtonText,
                    { color: unequalSplitType === 'itemized' ? '#FFFFFF' : (isDarkMode ? '#D1D5DB' : '#374151') }
                  ]}>
                    Itemized Split
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Payment Settlement Toggle */}
          <View style={styles.formGroup}>
            <View style={styles.toggleContainer}>
              <Text style={[styles.formLabel, { color: isDarkMode ? '#9CA3AF' : '#4B5563' }]}>Payment Settlement</Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  { backgroundColor: isSettled ? colors.primary : (isDarkMode ? '#374151' : '#E5E7EB') }
                ]}
                onPress={() => setIsSettled(!isSettled)}
              >
                <View style={[
                  styles.toggleCircle,
                  { backgroundColor: '#FFFFFF', transform: [{ translateX: isSettled ? 22 : 2 }] }
                ]} />
              </TouchableOpacity>
              <Text style={[styles.toggleLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                {isSettled ? 'Settled' : 'Not Settled'}
              </Text>
            </View>
          </View>

          {/* Date Picker Button (cross-platform) */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: isDarkMode ? '#9CA3AF' : '#4B5563' }]}>Date</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={expenseDate.toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setExpenseDate(new Date(e.target.value))}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#4B5563' : '#D1D5DB',
                  marginBottom: 8,
                  color: isDarkMode ? '#FFFFFF' : '#111827',
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#4B5563' : '#D1D5DB',
                    marginBottom: 8,
                  }}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: isDarkMode ? '#FFFFFF' : '#111827' }}>
                    {expenseDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={expenseDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setExpenseDate(selectedDate);
                    }}
                    maximumDate={new Date()}
                  />
                )}
              </>
            )}
          </View>

          {/* Description Input */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: isDarkMode ? '#9CA3AF' : '#4B5563' }]}>Description</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', color: isDarkMode ? '#FFFFFF' : '#111827' }]}
              placeholder="What was this expense for?"
              placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
              value={expenseDescription}
              onChangeText={setExpenseDescription}
            />
          </View>

          {/* Category Picker */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: isDarkMode ? '#9CA3AF' : '#4B5563' }]}>Category</Text>
            {categories.length > 0 ? (
              <>
                <TouchableOpacity
                  style={[styles.pickerContainer, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', borderColor: isDarkMode ? '#4B5563' : '#D1D5DB' }]}
                  onPress={() => setCategoryDropdownVisible(true)}
                >
                  <Text style={[styles.picker, { color: selectedCategory ? (isDarkMode ? '#FFFFFF' : '#111827') : (isDarkMode ? '#6B7280' : '#9CA3AF') }]}> 
                    {selectedCategory ? categories.find(cat => cat.id === selectedCategory)?.name : 'Select a category'}
                  </Text>
                </TouchableOpacity>
                <Modal
                  visible={categoryDropdownVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setCategoryDropdownVisible(false)}
                >
                  <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setCategoryDropdownVisible(false)}>
                    <View style={[styles.categoryModal, { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }]}>
                      <ScrollView>
                        {categories.map(cat => (
                          <TouchableOpacity
                            key={cat.id}
                            style={[styles.categoryItem, { borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' }]}
                            onPress={() => {
                              setSelectedCategory(cat.id);
                              setCategoryDropdownVisible(false);
                            }}
                          >
                            <Text style={[styles.categoryText, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                              {cat.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </TouchableOpacity>
                </Modal>
              </>
            ) : (
              <Text style={[styles.emptyText, { color: isDarkMode ? '#9CA3AF' : '#4B5563' }]}>No categories found.</Text>
            )}
          </View>

          {/* Manual Split Section */}
          {splitType === 'unequal' && unequalSplitType === 'manual' && (
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: isDarkMode ? '#9CA3AF' : '#4B5563' }]}>Manual Split Amount</Text>
              {groupMembers.map((member) => (
                <View key={member.id} style={styles.manualSplitItem}>
                  <Text style={[styles.memberName, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                    {member.username}
                  </Text>
                  <TextInput
                    style={[styles.amountInput, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', color: isDarkMode ? '#FFFFFF' : '#111827' }]}
                    placeholder="रू 0.00"
                    placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                    keyboardType="numeric"
                    value={manualSplits[member.id] || ''}
                    onChangeText={(value) => setManualSplits(prev => ({ ...prev, [member.id]: value }))}
                  />
                </View>
              ))}
              <Text style={[styles.totalCalculation, { color: isDarkMode ? '#10B981' : '#059669' }]}>
                Total: रू {Object.values(manualSplits).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0).toFixed(2)}
              </Text>
            </View>
          )}

          {/* Itemized Split Section */}
          {splitType === 'unequal' && unequalSplitType === 'itemized' && (
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: isDarkMode ? '#9CA3AF' : '#4B5563' }]}>Itemized Expenses</Text>
              {itemizedExpenses.map((item, index) => (
                <View key={index} style={styles.itemizedExpenseItem}>
                  <View style={styles.itemRow}>
                    <TextInput
                      style={[styles.itemNameInput, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', color: isDarkMode ? '#FFFFFF' : '#111827' }]}
                      placeholder="Item name"
                      placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                      value={item.item_name}
                      onChangeText={(value) => {
                        const newItems = [...itemizedExpenses];
                        newItems[index].item_name = value;
                        setItemizedExpenses(newItems);
                      }}
                    />
                    <TextInput
                      style={[styles.amountInput, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', color: isDarkMode ? '#FFFFFF' : '#111827' }]}
                      placeholder="रू 0.00"
                      placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                      keyboardType="numeric"
                      value={item.amount}
                      onChangeText={(value) => {
                        const newItems = [...itemizedExpenses];
                        newItems[index].amount = value;
                        setItemizedExpenses(newItems);
                      }}
                    />
                  </View>
                  <Text style={[styles.membersLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Who had this item?</Text>
                  <View style={styles.membersSelection}>
                    {groupMembers.map((member) => (
                      <TouchableOpacity
                        key={member.id}
                        style={[
                          styles.memberChip,
                          {
                            backgroundColor: item.members.includes(member.id) 
                              ? colors.primary 
                              : (isDarkMode ? '#374151' : '#F3F4F6'),
                            borderColor: isDarkMode ? '#4B5563' : '#E5E7EB'
                          }
                        ]}
                        onPress={() => {
                          const newItems = [...itemizedExpenses];
                          const memberIndex = newItems[index].members.indexOf(member.id);
                          if (memberIndex > -1) {
                            newItems[index].members.splice(memberIndex, 1);
                          } else {
                            newItems[index].members.push(member.id);
                          }
                          setItemizedExpenses(newItems);
                        }}
                      >
                        <Text style={[
                          styles.memberChipText,
                          { color: item.members.includes(member.id) ? '#FFFFFF' : (isDarkMode ? '#D1D5DB' : '#374151') }
                        ]}>
                          {member.username}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {index > 0 && (
                    <TouchableOpacity
                      style={styles.removeItemButton}
                      onPress={() => {
                        const newItems = itemizedExpenses.filter((_, i) => i !== index);
                        setItemizedExpenses(newItems);
                      }}
                    >
                      <Text style={[styles.removeItemText, { color: '#EF4444' }]}>Remove Item</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                style={[styles.addItemButton, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
                onPress={() => setItemizedExpenses([...itemizedExpenses, { item_name: '', amount: '', members: [] }])}
              >
                <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
                <Text style={[styles.addItemText, { color: colors.primary }]}>Add Item</Text>
              </TouchableOpacity>
              <Text style={[styles.totalCalculation, { color: isDarkMode ? '#10B981' : '#059669' }]}>
                Total: रू {itemizedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2)}
              </Text>
            </View>
          )}

          {/* Total Amount Input */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: isDarkMode ? '#9CA3AF' : '#4B5563' }]}>
              {splitType === 'equal' ? 'Total Amount' : 'Expected Total Amount (for validation)'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', color: isDarkMode ? '#FFFFFF' : '#111827' }]}
              placeholder="रू 0.00"
              placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
              keyboardType="numeric"
              value={totalAmount}
              onChangeText={setTotalAmount}
            />
          </View>

          {/* Show calculated total for unequal splits */}
          {splitType === 'unequal' && (
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: isDarkMode ? '#9CA3AF' : '#4B5563' }]}>
                Calculated Total
              </Text>
              <View style={[styles.input, { backgroundColor: isDarkMode ? '#2D3748' : '#EDF2F7', justifyContent: 'center' }]}>
                <Text style={[styles.calculatedTotal, { color: isDarkMode ? '#10B981' : '#059669' }]}>
                  रू {
                    unequalSplitType === 'manual' 
                      ? Object.values(manualSplits).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0).toFixed(2)
                      : itemizedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2)
                  }
                </Text>
              </View>
              {totalAmount.trim() && (
                <Text style={[
                  styles.validationText, 
                  { 
                    color: Math.abs((unequalSplitType === 'manual' 
                      ? Object.values(manualSplits).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0)
                      : itemizedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
                    ) - parseFloat(totalAmount)) < 0.01 ? '#10B981' : '#EF4444'
                  }
                ]}>
                  {Math.abs((unequalSplitType === 'manual' 
                    ? Object.values(manualSplits).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0)
                    : itemizedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
                  ) - parseFloat(totalAmount)) < 0.01 ? '✓ Amounts match!' : '⚠ Amounts do not match!'}
                </Text>
              )}
            </View>
          )}

          {/* Add Button */}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }, isAddingSharedExpense && styles.buttonDisabled]}
            onPress={handleAddSharedExpense}
            disabled={isAddingSharedExpense}
          >
            {isAddingSharedExpense ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.addButtonText}>Add Expense</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Expense Detail Modal */}
      <Modal
        visible={expenseDetailVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setExpenseDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.expenseDetailModal, { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }]}>
            {selectedExpense && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                    Expense Details
                  </Text>
                  <TouchableOpacity onPress={() => setExpenseDetailVisible(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={isDarkMode ? '#D1D5DB' : '#6B7280'} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Description</Text>
                    <Text style={[styles.detailValue, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                      {selectedExpense.description}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Amount</Text>
                    <Text style={[styles.detailValue, { color: colors.primary, fontWeight: 'bold' }]}>
                      रू {selectedExpense.amount}
                    </Text>
                  </View>

                  {selectedExpense.split_amount && (
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Your Share</Text>
                      <Text style={[styles.detailValue, { color: isDarkMode ? '#10B981' : '#059669', fontWeight: 'bold' }]}>
                        रू {selectedExpense.split_amount}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Category</Text>
                    <Text style={[styles.detailValue, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                      {selectedExpense.category?.name || selectedExpense.category_name || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Date</Text>
                    <Text style={[styles.detailValue, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                      {new Date(selectedExpense.created_at || selectedExpense.date).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Split Type</Text>
                    <Text style={[styles.detailValue, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                      {selectedExpense.split_type || 'Equal'}
                    </Text>
                  </View>

                  {/* Settlement Status Toggle */}
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Payment Settlement</Text>
                    <View style={styles.settlementControl}>
                      <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          { backgroundColor: selectedExpense.is_settled ? colors.primary : (isDarkMode ? '#374151' : '#E5E7EB') }
                        ]}
                        onPress={() => handleUpdateSettlement(selectedExpense.id, !selectedExpense.is_settled)}
                        disabled={updatingSettlement}
                      >
                        <View style={[
                          styles.toggleCircle,
                          { backgroundColor: '#FFFFFF', transform: [{ translateX: selectedExpense.is_settled ? 22 : 2 }] }
                        ]} />
                      </TouchableOpacity>
                      <Text style={[styles.toggleLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                        {selectedExpense.is_settled ? 'Settled' : 'Not Settled'}
                      </Text>
                      {updatingSettlement && (
                        <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
                      )}
                    </View>
                  </View>

                  {/* Expense Shares Details (if available) */}
                  {selectedExpense.results && Array.isArray(selectedExpense.results) && selectedExpense.results.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Expense Shares</Text>
                      {selectedExpense.results.map((share, idx) => (
                        <View key={idx} style={{ marginBottom: 8, padding: 8, backgroundColor: isDarkMode ? '#23272e' : '#F3F4F6', borderRadius: 8 }}>
                          <Text style={{ color: isDarkMode ? '#fff' : '#222', fontWeight: 'bold' }}>User: {share.user?.username || share.user?.id || 'N/A'}</Text>
                          <Text style={{ color: colors.primary }}>Owes: रू {share.amount_owed}</Text>
                          {/* <Text style={{ color: share.is_settled ? '#10B981' : '#F59E42' }}>{share.is_settled ? 'Settled' : 'Not Settled'}</Text> */}
                          {share.item_name && <Text style={{ color: isDarkMode ? '#fff' : '#222' }}>Item: {share.item_name}</Text>}
                        </View>
                      ))}
                    </View>
                  )}
                  {/* Items Details (if available) */}
                  {selectedExpense.items && selectedExpense.items.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Items</Text>
                      {selectedExpense.items.map((item, index) => (
                        <View key={index} style={styles.itemDetail}>
                          <Text style={[styles.itemName, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
                            {item.item_name || `Item ${index + 1}`}
                          </Text>
                          <Text style={[styles.itemAmount, { color: colors.primary }]}>
                            रू {item.amount}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }]}
                    onPress={() => setExpenseDetailVisible(false)}
                  >
                    <Text style={[styles.closeButtonText, { color: isDarkMode ? '#D1D5DB' : '#374151' }]}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loader: {
    marginVertical: 32,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  expensesList: {
    gap: 12,
  },
  expenseItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseCategory: {
    fontSize: 14,
    marginBottom: 4,
  },
  splitAmount: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
  },
  splitTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  splitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  splitButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  splitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  pickerContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  picker: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryModal: {
    margin: 40,
    borderRadius: 8,
    padding: 16,
    maxHeight: 350,
    width: '80%',
  },
  categoryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryText: {
    fontSize: 16,
  },
  addButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  unequalOptionsContainer: {
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  toggleLabel: {
    fontSize: 14,
    marginLeft: 12,
  },
  manualSplitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memberName: {
    fontSize: 16,
    flex: 1,
  },
  amountInput: {
    width: 100,
    padding: 8,
    borderRadius: 6,
    fontSize: 14,
    textAlign: 'right',
  },
  totalCalculation: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  itemizedExpenseItem: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  itemNameInput: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    fontSize: 14,
  },
  membersLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  membersSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  memberChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  memberChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeItemButton: {
    alignSelf: 'flex-end',
  },
  removeItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addItemText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  calculatedTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  settlementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  settlementText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  expenseDetailModal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    marginBottom: 8,
  },
  settlementControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  itemName: {
    fontSize: 14,
    flex: 1,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  validationText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default GroupExpenseScreen;
