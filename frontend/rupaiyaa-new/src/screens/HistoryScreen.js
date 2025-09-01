import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext, useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, FlatList, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import CustomHeader from '../components/CustomHeader';
import FilterModal from '../components/FilterModal';

const HistoryScreen = () => {
    const { colors, isDarkMode } = useContext(ThemeContext);
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [filters, setFilters] = useState({ startDate: null, endDate: null, type: 'All' });

    const categories = ['All', 'Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Other'];
    const fetchTransactions = async () => {
        setIsLoading(true);
        setError(null);
        const transactionsUrl = 'http://127.0.0.1:8000/expense/reports/transactions/';
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            const response = await fetch(transactionsUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (response.ok) {
                const formattedData = data.map(item => ({
                    ...item,
                    type: item.type === 'income' ? 'Income' : 'Expense',
                    icon: item.type === 'income' ? 'arrow-top-right' : 'arrow-bottom-left',
                    category_name: item.category || 'Uncategorized',
                    category_color: item.type === 'income' ? '#10B981' : '#EF4444',
                    dateObj: new Date(item.date),
                }));
                setTransactions(formattedData);
            } else {
                setError('Failed to fetch transactions.');
                console.error('API Error:', data.detail || data);
            }
        } catch (err) {
            setError('Network error. Could not connect to the server.');
            console.error('Network Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(); }, []);

    const renderTransactionItem = ({ item }) => {
        const dateStr = item.dateObj ? item.dateObj.toDateString() : 'Unknown Date';
        const timeStr = item.dateObj ? item.dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        return (
            <View className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-4 rounded-xl mb-3 flex-row items-center justify-between shadow-sm`}>
                <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full justify-center items-center mr-3" style={{ backgroundColor: item.category_color }}>
                        <MaterialCommunityIcons name={item.icon} size={24} color="#FFFFFF" />
                    </View>
                    <View>
                        <Text className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.description || 'No Description'}
                        </Text>
                        <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {dateStr}{timeStr ? ` at ${timeStr}` : ''}
                        </Text>
                    </View>
                </View>
                <View className="items-end">
                    <Text className={`text-lg font-bold ${item.type === 'Income' ? 'text-green-500' : 'text-red-500'}`}>
                        {item.type === 'Expense' ? '-' : '+'} रू{item.amount}
                    </Text>
                    <View className="rounded-full px-2 py-1 mt-1" style={{ backgroundColor: item.category_color }}>
                        <Text className="text-white text-xs font-medium">{item.category_name}</Text>
                    </View>
                </View>
            </View>
        );
    };

    const filteredTransactions = transactions.filter(item => {
        const transactionDate = item.dateObj;
        const categoryMatch = activeCategory === 'All' || item.category_name === activeCategory;
        const searchMatch = searchQuery === '' || item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const typeMatch = filters.type === 'All' || item.type === filters.type;
        const startDateMatch = !filters.startDate || (transactionDate && transactionDate >= filters.startDate);
        const endDateMatch = !filters.endDate || (transactionDate && transactionDate <= filters.endDate);
        return categoryMatch && searchMatch && typeMatch && startDateMatch && endDateMatch;
    });

    return (
        <View className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <CustomHeader title="Transaction History" showProfileIcon onFilterPress={() => setFilterModalVisible(true)} />
            <View className="px-6 -mt-16 z-10">
                <View className={`flex-row items-center rounded-2xl p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} shadow-sm mb-4`}>
                    <MaterialCommunityIcons name="magnify" size={24} color={isDarkMode ? '#D1D5DB' : '#6B7280'} />
                    <TextInput
                        className={`flex-1 ml-2 text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        placeholder="Search transactions..."
                        placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {categories.map((filter, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => setActiveCategory(filter)}
                            className={`rounded-full px-4 py-2 mr-2 ${activeCategory === filter ? 'bg-purple-700' : (isDarkMode ? 'bg-gray-900' : 'bg-white')}`}
                        >
                            <Text className={`font-medium ${activeCategory === filter ? 'text-white' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}`}>{filter}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            <View className="flex-1 px-6">
                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text className={`mt-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Loading transactions...</Text>
                    </View>
                ) : error ? (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-red-500 text-base text-center">{error}</Text>
                        <TouchableOpacity onPress={fetchTransactions} className="mt-4 px-4 py-2 rounded-full bg-purple-500">
                            <Text className="text-white font-semibold">Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={filteredTransactions}
                        renderItem={renderTransactionItem}
                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View className="flex-1 items-center justify-center mt-20">
                                <MaterialCommunityIcons name="cash-remove" size={64} color={isDarkMode ? colors.subtext : colors.subtext} />
                                <Text className={`mt-4 text-center text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No transactions found.</Text>
                            </View>
                        )}
                    />
                )}
            </View>
            <FilterModal
                isVisible={isFilterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                onApply={setFilters}
                initialFilters={filters}
            />
        </View>
    );
};

export default HistoryScreen;