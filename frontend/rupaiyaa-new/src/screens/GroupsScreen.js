import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import GroupList from '../components/GroupList';
import Header from '../components/Header';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const API_BASE_URL = 'http://10.40.20.94:8000';

const GroupsScreen = () => {
  const { isLoggedIn, id } = useContext(AuthContext);
  const { colors, isDarkMode } = useContext(ThemeContext);
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // State for category dropdown modal
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);

  // State for group expense log
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [groupExpensesLoading, setGroupExpensesLoading] = useState(false);

  // State for "Add Shared Expense" modal
  const [isAddExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState(id || '');
  const [splitType, setSplitType] = useState('equal');
  const [totalAmount, setTotalAmount] = useState('');
  const [individualAmounts, setIndividualAmounts] = useState({});
  const [isAddingSharedExpense, setIsAddingSharedExpense] = useState(false);
  const [items, setItems] = useState([{ item_name: '', amount: '', owes: {} }]);

  // New state for Categories
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const searchDebounce = useRef(null);

  const getAccessToken = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Authentication Error', 'Access token not found. Please log in again.');
        return null;
      }
      return token;
    } catch (error) {
      console.error('AsyncStorage error while getting token:', error);
      Alert.alert('Storage Error', 'Could not retrieve authentication token.');
      return null;
    }
  };

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/expense/groups/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok) {
        setGroups(data.results || data || []);
      } else {
        Alert.alert('Error Fetching Groups', data.detail || 'An unknown error occurred.');
      }
    } catch (error) {
      console.error('Network error in fetchGroups:', error);
      Alert.alert('Network Error', 'Could not connect to the server to fetch groups.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/expense/categories/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok) {
        setCategories(data.results || data || []);
        if (data.results && data.results.length > 0) {
          setSelectedCategory(data.results[0].id);
        }
      } else {
        Alert.alert('Error Fetching Categories', data.detail || 'Failed to fetch categories.');
      }
    } catch (error) {
      console.error('Network error in fetchCategories:', error);
      Alert.alert('Network Error', 'Could not connect to the server to fetch categories.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  const fetchMembers = async (query = '') => {
    setMembersLoading(true);
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setMembersLoading(false);
      return;
    }

    const url = query
      ? `${API_BASE_URL}/auth/list/?username=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/auth/list/`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok) {
        setMembers(data.results || data || []);
      } else {
        Alert.alert('Error Fetching Members', data.detail || 'Failed to fetch members.');
      }
    } catch (error) {
      console.error('Network error in fetchMembers:', error);
      Alert.alert('Network Error', 'Could not connect to the server to fetch members.');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Invalid Name', 'Group name cannot be empty.');
      return;
    }
    if (!isLoggedIn || !id) {
      Alert.alert('Authentication Error', 'User not authenticated. Please log in again.');
      return;
    }

    setIsCreatingGroup(true);

    const memberIds = [...new Set([...selectedMembers, id])];
    const groupData = { name: newGroupName.trim(), member_ids: memberIds };

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setIsCreatingGroup(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/expense/groups/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        data = null;
      }

      if (response.status === 201) {
        Alert.alert('Success', 'Group created successfully!');
        handleCloseCreateModal();
        fetchGroups();
      } else {
        let errorDetail = '';
        if (data) {
          if (typeof data === 'object') {
            if (data.detail) {
              errorDetail = data.detail;
            } else {
              errorDetail = Object.values(data).flat().join('\n');
            }
          } else {
            errorDetail = data.toString();
          }
        }
        Alert.alert('Creation Failed', errorDetail || 'Failed to create group.');
      }
    } catch (error) {
      console.error('Network error in handleCreateGroup:', error);
      Alert.alert('Network Error', 'Could not connect to the server.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleAddSharedExpense = async () => {
    if (!expenseDescription.trim()) {
      Alert.alert('Error', 'Please enter an expense description.');
      return;
    }
    if (!selectedCategory) {
        Alert.alert('Error', 'Please select a category.');
        return;
    }

    // Validate that selectedGroup has members and is properly defined
    if (!selectedGroup || !selectedGroup.members || !Array.isArray(selectedGroup.members) || selectedGroup.members.length === 0) {
      Alert.alert('Error', 'Selected group is invalid or has no members.');
      return;
    }

    let expensePayload = {
      description: expenseDescription,
      group: selectedGroup.id,
      split_type: splitType,
      category_id: selectedCategory,
      shares: [],
    };

    if (splitType === 'equal') {
      const parsedTotalAmount = parseFloat(totalAmount);
      if (isNaN(parsedTotalAmount) || parsedTotalAmount <= 0) {
        Alert.alert('Error', 'Total amount must be a number greater than zero.');
        return;
      }

      expensePayload.amount = parsedTotalAmount;
      
      // Fixed calculation - ensure we have valid members count
      const membersCount = selectedGroup.members.length;
      if (membersCount <= 0) {
        Alert.alert('Error', 'Group must have at least one member.');
        return;
      }

      const shareAmount = parsedTotalAmount / membersCount;
      
      // Validate shareAmount is positive
      if (shareAmount <= 0) {
        Alert.alert('Error', 'Share amount calculation resulted in invalid value.');
        return;
      }

      expensePayload.shares = selectedGroup.members.map(member => ({
        user: member.id,
        amount_owed: parseFloat(shareAmount.toFixed(2)), // Convert back to number to avoid string issues
      }));
    }

    if (splitType === 'manual') {
      const parsedTotalAmount = parseFloat(totalAmount);
      if (isNaN(parsedTotalAmount)) {
        Alert.alert('Error', 'Total amount must be a number.');
        return;
      }

      let totalEnteredAmount = 0;
      let shares = [];
      for (const member of selectedGroup.members) {
        const amount = parseFloat(individualAmounts[member.id]);
        if (isNaN(amount) || amount < 0) {
          Alert.alert('Error', `Please enter a valid amount for ${member.username}.`);
          return;
        }
        totalEnteredAmount += amount;
        shares.push({
          user: member.id,
          amount_owed: parseFloat(amount.toFixed(2)), // Convert to number
        });
      }

      if (Math.abs(totalEnteredAmount - parsedTotalAmount) > 0.01) { // Use small tolerance for floating point comparison
        Alert.alert('Error', `Individual amounts (${totalEnteredAmount.toFixed(2)}) do not add up to the total amount (${parsedTotalAmount.toFixed(2)}).`);
        return;
      }

      expensePayload.amount = parsedTotalAmount;
      expensePayload.shares = shares;
    }

    if (splitType === 'itemized') {
      let totalItemizedAmount = 0;
      let sharesMap = {}; // Use map to accumulate shares per user

      for (const item of items) {
        if (!item.item_name.trim()) {
          Alert.alert('Error', 'Please enter a name for all items.');
          return;
        }

        const itemAmount = parseFloat(item.amount);
        if (isNaN(itemAmount) || itemAmount <= 0) {
          Alert.alert('Error', `Please enter a valid amount for item: "${item.item_name}"`);
          return;
        }

        const peopleOwed = Object.keys(item.owes).filter(userId => item.owes[userId]);
        if (peopleOwed.length === 0) {
            Alert.alert('Error', `Please select at least one person for item: "${item.item_name}"`);
            return;
        }

        const sharePerPerson = itemAmount / peopleOwed.length;
        totalItemizedAmount += itemAmount;

        // Accumulate shares per user
        for (const userId of peopleOwed) {
            if (!sharesMap[userId]) {
                sharesMap[userId] = 0;
            }
            sharesMap[userId] += sharePerPerson;
        }
      }

      if (Object.keys(sharesMap).length === 0) {
        Alert.alert('Error', 'Please add and fill out at least one item.');
        return;
      }

      const parsedTotalAmount = parseFloat(totalAmount);
      if (isNaN(parsedTotalAmount)) {
          Alert.alert('Error', 'Total amount must be a number.');
          return;
      }

      // Convert shares map to array format expected by API
      const shares = Object.keys(sharesMap).map(userId => ({
          user: userId,
          amount_owed: parseFloat(sharesMap[userId].toFixed(2)), // Convert to number
      }));

      expensePayload.amount = parsedTotalAmount;
      expensePayload.shares = shares;
    }

    setIsAddingSharedExpense(true);
    const accessToken = await getAccessToken();
    console.log('Expense Payload:', JSON.stringify(expensePayload, null, 2));

    try {
      const response = await fetch(`${API_BASE_URL}/expense/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expensePayload),
      });

      const data = await response.json();
      setIsAddingSharedExpense(false);

      if (response.status === 201) {
        Alert.alert('Success', 'Shared expense added successfully!');
        handleCloseAddExpenseModal();
        fetchGroups();
      } else {
        console.error('API Error Response:', data);
        const errorDetail = data.detail || (typeof data === 'object' ? Object.values(data).flat().join('\n') : 'Failed to add shared expense.');
        Alert.alert('Error', errorDetail);
      }
    } catch (error) {
      setIsAddingSharedExpense(false);
      console.error('Network error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  // Modal handler functions
  const handleOpenCreateModal = () => {
    setNewGroupName('');
    setSelectedMembers([]);
    setSearchQuery('');
    setMembers([]);
    setCreateModalVisible(true);
    fetchMembers();
  };

  const handleCloseCreateModal = () => {
    setCreateModalVisible(false);
  };

  const handleOpenAddExpenseModal = async (group) => {
    navigation.navigate('GroupExpense', { group });
  };

  const handleCloseAddExpenseModal = () => {
    setAddExpenseModalVisible(false);
    setExpenseDescription('');
    setTotalAmount('');
    setIndividualAmounts({});
    setSelectedGroup(null);
    setSplitType('equal');
    setItems([{ item_name: '', amount: '', owes: {} }]);
    setSelectedCategory(null);
    setGroupExpenses([]);
  };

  const toggleMemberSelection = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  useEffect(() => {
    return () => {
      if (searchDebounce.current) {
        clearTimeout(searchDebounce.current);
      }
    };
  }, []);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (searchDebounce.current) { clearTimeout(searchDebounce.current); }
    searchDebounce.current = setTimeout(() => { fetchMembers(text); }, 500);
  };

  const renderMemberItem = (member) => {
    if (member.id === id) { return null; }
    const isSelected = selectedMembers.includes(member.id);
    return (
      <TouchableOpacity
        key={member.id}
        onPress={() => toggleMemberSelection(member.id)}
        style={[styles.memberItem, isSelected && { backgroundColor: isDarkMode ? '#581c87' : '#f3e8ff' }]}
      >
        <MaterialCommunityIcons
            name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={22}
            color={isSelected ? colors.primary : (isDarkMode ? '#9CA3AF' : '#6B7280')}
        />
        <Text style={[styles.memberName, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
            {member.username}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAddExpenseForm = () => (
    <ScrollView style={styles.formScrollView}>
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
              <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} activeOpacity={1} onPressOut={() => setCategoryDropdownVisible(false)}>
                <View style={{ margin: 40, backgroundColor: isDarkMode ? '#1F2937' : '#fff', borderRadius: 8, padding: 16, maxHeight: 350 }}>
                  <ScrollView>
                    {categories.map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' }}
                        onPress={() => {
                          setSelectedCategory(cat.id);
                          setCategoryDropdownVisible(false);
                        }}
                      >
                        <Text style={{ color: isDarkMode ? '#fff' : '#111827', fontSize: 16 }}>{cat.name}</Text>
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

      {/* Total Amount Input */}
      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: isDarkMode ? '#9CA3AF' : '#4B5563' }]}>Total Amount</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', color: isDarkMode ? '#FFFFFF' : '#111827' }]}
          placeholder="रू 0.00"
          placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          keyboardType="numeric"
          value={totalAmount}
          onChangeText={setTotalAmount}
        />
      </View>

      <TouchableOpacity
        style={[styles.addButton, isAddingSharedExpense && styles.buttonDisabled]}
        onPress={handleAddSharedExpense}
        disabled={isAddingSharedExpense}
      >
        {isAddingSharedExpense ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.addButtonText}>Add Expense</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6' }]}>
      <Header title="Groups" showBackButton={false} showProfileIcon={true} />

      <View style={styles.mainContent}>
        <GroupList
          groups={groups}
          loading={loading}
          isDarkMode={isDarkMode}
          colors={colors}
          onGroupPress={handleOpenAddExpenseModal}
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={handleOpenCreateModal}>
        <MaterialCommunityIcons name="plus" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal for creating new group */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCreateModalVisible}
        onRequestClose={handleCloseCreateModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>Create New Group</Text>

            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', color: isDarkMode ? '#FFFFFF' : '#000000' }]}
              placeholder="Group Name"
              placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>Select Members</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', color: isDarkMode ? '#FFFFFF' : '#000000' }]}
              placeholder="Search by username..."
              placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            <View style={[styles.membersListContainer, { borderColor: isDarkMode ? '#4B5563' : '#E5E7EB' }]}>
              {membersLoading ? (
                <ActivityIndicator style={{ marginVertical: 16 }} size="small" color={colors.primary} />
              ) : (
                <ScrollView>
                  {members.length > 0 ? members.map(renderMemberItem) : <Text style={[styles.emptyText, { color: isDarkMode ? '#9CA3AF' : '#4B5563', padding: 16 }]}>No members found.</Text>}
                </ScrollView>
              )}
            </View>
            <TouchableOpacity
              style={[styles.button, styles.createButton, isCreatingGroup && styles.buttonDisabled]}
              onPress={handleCreateGroup}
              disabled={isCreatingGroup}
            >
              {isCreatingGroup ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Create</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCloseCreateModal}>
              <Text style={[styles.buttonText, styles.cancelButtonText, { color: isDarkMode ? '#9CA3AF' : '#4B5563' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainContent: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', fontSize: 16, marginTop: 40 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#7C3AED', width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContainer: { width: '90%', padding: 24, borderRadius: 12 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  modalSubtitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { width: '100%', padding: 14, marginBottom: 16, borderRadius: 8, fontSize: 16 },
  membersListContainer: { marginBottom: 16, borderWidth: 1, borderRadius: 8, height: 192 },
  memberItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 6, margin: 4 },
  memberName: { marginLeft: 12, fontSize: 16 },
  button: { width: '100%', paddingVertical: 14, borderRadius: 50, alignItems: 'center', marginBottom: 8 },
  createButton: { backgroundColor: '#7C3AED' },
  buttonDisabled: { backgroundColor: '#A78BFA' },
  cancelButton: { backgroundColor: 'transparent' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  cancelButtonText: { fontWeight: 'bold' },
  formScrollView: { flexGrow: 1 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  addButton: { width: '100%', paddingVertical: 14, borderRadius: 50, alignItems: 'center', marginTop: 16, backgroundColor: '#7C3AED' },
  addButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  pickerContainer: { borderWidth: 1, borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
  picker: { width: '100%', height: 50, paddingHorizontal: 12, paddingVertical: 15 },
});

export default GroupsScreen;