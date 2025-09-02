import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { fetchLendLogs, verifyLend } from '../api/lendApi';
import AddLendModal from '../components/AddLendModal';
// import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import CustomHeader from '../components/CustomHeader';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
const API_BASE_URL = 'http://10.40.20.94:8000';
const screenWidth = Dimensions.get('window').width;

const HomeScreen = () => {
    const { colors, isDarkMode } = useContext(ThemeContext);
    const { userName, id: userId } = useContext(AuthContext);
    const isFocused = useIsFocused();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [totalBalance, setTotalBalance] = useState('0');
    const [incomeTotal, setIncomeTotal] = useState('0');
    const [expensesTotal, setExpensesTotal] = useState('0');
    const [expenseBreakdown, setExpenseBreakdown] = useState([]);
    const [dailySpendingData, setDailySpendingData] = useState({
        labels: [],
        datasets: [{ data: [] }]
    });
    const [budgets, setBudgets] = useState([]);
    const [budgetsLoading, setBudgetsLoading] = useState(true);
    const [deletingBudgetId, setDeletingBudgetId] = useState(null);
    const [lendModalVisible, setLendModalVisible] = useState(false);
    const [lendLogs, setLendLogs] = useState([]);
    const [lendLoading, setLendLoading] = useState(false);
    const [verifyingId, setVerifyingId] = useState(null);
    // Fetch lend logs and filter for current user (initiator/participant)
    const loadLendLogs = async () => {
        setLendLoading(true);
        try {
            const data = await fetchLendLogs();
            const logs = data.results || data;
            // Only show logs where:
            // - If transaction_type is 'L' (Lend), user is the initiator
            // - If transaction_type is 'B' (Borrow), user is the participant
            const filteredLogs = logs.filter(log => {
                if (log.transaction_type === 'L') {
                    return log.initiator && String(log.initiator.id) === String(userId);
                } else if (log.transaction_type === 'B') {
                    return log.participant && String(log.participant.id) === String(userId);
                }
                return false;
            });
            setLendLogs(filteredLogs);
        } catch (e) {
            setLendLogs([]);
        } finally {
            setLendLoading(false);
        }
    };

    // Delete budget handler
    const handleDeleteBudget = async (budgetId) => {
        setDeletingBudgetId(budgetId);
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/budget/budgets/${budgetId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
            } else {
                const errorData = await response.text();
                alert(`Failed to delete budget: ${response.status} - ${errorData}`);
            }
        } catch (e) {
            alert('Error deleting budget.');
        } finally {
            setDeletingBudgetId(null);
        }
    };

    const fetchDashboardData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/expense/report/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            console.log('Dashboard API response:', data); // Debug log

            setTotalBalance(data?.total_balance ?? '0');
            setIncomeTotal(data?.total_income ?? '0');
            setExpensesTotal(data?.total_expenses ?? '0');
            setExpenseBreakdown(
                Array.isArray(data?.expense_breakdown)
                    ? data.expense_breakdown.map(item => ({
                        name: item.category_name ?? item.name ?? '',
                        amount: item.total_amount ?? item.amount ?? 0,
                        color: item.color ?? '#E5E7EB'
                    }))
                    : []
            );

            const dailyData = data?.daily_expenses;
            if (Array.isArray(dailyData) && dailyData.length > 0) {
                const labels = dailyData.map(item => item.day_of_week || item.date || '');
                const spendingValues = dailyData.map(item => parseFloat(item.total_amount ?? item.amount) || 0);
                setDailySpendingData({
                    labels: labels,
                    datasets: [{ data: spendingValues }]
                });
            } else {
                setDailySpendingData({
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    datasets: [{ data: [0, 0, 0, 0, 0] }]
                });
            }

        } catch (err) {
            setError(err.message);
            console.error('Fetch Error:', err.message);
            setDailySpendingData({
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                datasets: [{ data: [0, 0, 0, 0, 0] }]
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch budgets from API
    const fetchBudgets = async () => {
        setBudgetsLoading(true);
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            const response = await fetch(`${API_BASE_URL}/budget/budgets/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (response.ok && data.results) {
                setBudgets(data.results);
            } else {
                setBudgets([]);
            }
        } catch (e) {
            setBudgets([]);
        } finally {
            setBudgetsLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchDashboardData();
            fetchBudgets();
            loadLendLogs();
        }
    }, [isFocused]);

    const renderExpenseItem = ({ item }) => (
        <View className="flex-row items-center my-1 w-1/2">
            <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color || '#E5E7EB' }} />
            <Text className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{item.name || 'N/A'}</Text>
            <Text className={`font-semibold ml-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>रू{item.amount ?? 0}</Text>
        </View>
    );

    // Budget Card UI
    const renderBudgetCard = (item) => {
        const spent = item.total_expense || 0;
        const allowed = item.allowed_expense || item.budget || 0;
        const remaining = (allowed - spent).toFixed(2);
        const percent = allowed > 0 ? (spent / allowed) * 100 : 0;
        let status = 'On Track';
        let statusColor = '#7C3AED';
        if (percent >= 100) {
            status = 'Exceeded';
            statusColor = '#EF4444';
        } else if (percent >= (item.threshold_percentage || 80)) {
            status = 'Warning';
            statusColor = '#F59E42';
        }
        return (
            <View key={item.id} className={`mb-4 p-4 rounded-xl shadow bg-white border border-gray-200`}>
                <View className="flex-row justify-between items-start mb-2">
                    <View>
                        <Text className="font-bold text-base text-gray-800">{item.category?.name || 'All Categories'}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleDeleteBudget(item.id)}
                        disabled={deletingBudgetId === item.id}
                        style={{ opacity: deletingBudgetId === item.id ? 0.5 : 1 }}
                    >
                        {deletingBudgetId === item.id ? (
                            <ActivityIndicator size={20} color="#EF4444" />
                        ) : (
                            <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
                        )}
                    </TouchableOpacity>
                </View>
                <View className="flex-row items-center mb-1">
                    <View style={{ backgroundColor: statusColor, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>{status}</Text>
                    </View>
                    <Text className="text-gray-700 text-base font-semibold">रू{spent} / </Text>
                    <Text className="text-gray-400 text-base font-semibold">रू{allowed}</Text>
                </View>
                {/* Progress Bar */}
                <View className="w-full h-2 bg-gray-200 rounded-full mb-2">
                    <View style={{ width: `${Math.min(percent, 100)}%`, height: 8, backgroundColor: '#A78BFA', borderRadius: 8 }} />
                </View>
                <View className="flex-row justify-between items-center">
                    <Text className="text-green-600 font-semibold">रू{remaining} remaining</Text>
                    <Text className="text-gray-500 font-semibold">{percent.toFixed(1)}%</Text>
                </View>
            </View>
        );
    };

    const navigation = useNavigation();
    return (
        <View className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <CustomHeader
                title="Good Morning!"
                subtitle={`Welcome back, ${userName || 'User'}`}
                showProfileIcon={true}
                showTotalBalance={true}
                totalBalance={`रू${totalBalance}`}
            />

            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text className={`mt-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Loading data...</Text>
                </View>
            ) : error ? (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-red-500 text-base text-center">{error}</Text>
                    <TouchableOpacity onPress={fetchDashboardData} className="mt-4 px-4 py-2 rounded-full bg-purple-500">
                        <Text className="text-white font-semibold">Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView 
                    className="flex-1"
                    contentContainerStyle={{
                        paddingTop: 16,
                        paddingHorizontal: 24 // Ensures content doesn't overlap the header and matches chart width
                    }}
                >
                    {/* Income/Expenses Section */}
                    <View className="flex-row justify-between mb-6">
                        <View className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-4 rounded-xl flex-1 mr-2 shadow-sm flex-row items-center`}>
                            <View className="flex-1">
                                <Text className={`text-base font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Income</Text>
                                <Text className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>रू{incomeTotal}</Text>
                            </View>
                            <View className="w-10 h-10 rounded-full bg-green-200 justify-center items-center">
                                <MaterialCommunityIcons name="arrow-top-right" size={24} color="green" />
                            </View>
                        </View>
                        <View className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-4 rounded-xl flex-1 ml-2 shadow-sm flex-row items-center`}>
                            <View className="flex-1">
                                <Text className={`text-base font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Expenses</Text>
                                <Text className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>रू{expensesTotal}</Text>
                            </View>
                            <View className="w-10 h-10 rounded-full bg-red-200 justify-center items-center">
                                <MaterialCommunityIcons name="arrow-bottom-left" size={24} color="red" />
                            </View>
                        </View>
                    </View>

                    {/* Analytics Slider: BarChart, PieChart, Lent Money */}
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 24 }}
                    >
                        {/* BarChart Slide */}
                        <View style={{ width: screenWidth - 48, marginRight: 16 }} className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-4 rounded-xl shadow-sm`}>
                            <View className="flex-row items-center mb-4">
                                <MaterialCommunityIcons name="chart-bar" size={24} color={isDarkMode ? '#D1D5DB' : '#6B7280'} />
                                <Text className={`text-lg font-semibold ml-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Daily Spending</Text>
                            </View>
                            {Array.isArray(dailySpendingData.labels) && Array.isArray(dailySpendingData.datasets) && dailySpendingData.labels.length > 0 && dailySpendingData.datasets[0].data.length > 0 ? (
                                <View style={{ overflow: 'hidden', borderRadius: 16 }}>
                                    <BarChart
                                        data={dailySpendingData}
                                        width={screenWidth - 80}
                                        height={220}
                                        yAxisLabel="रू"
                                        fromZero={true}
                                        showValuesOnTopOfBars={true}
                                        chartConfig={{
                                            backgroundColor: isDarkMode ? '#1F2937' : '#ffffff',
                                            backgroundGradientFrom: isDarkMode ? '#1F2937' : '#ffffff',
                                            backgroundGradientTo: isDarkMode ? '#1F2937' : '#ffffff',
                                            decimalPlaces: 0,
                                            color: (opacity = 1) => `rgba(138, 43, 226, ${opacity})`,
                                            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                                            propsForBackgroundLines: {
                                                strokeDasharray: '',
                                                stroke: isDarkMode ? '#4B5563' : '#E5E7EB',
                                            },
                                            barPercentage: 0.7,
                                        }}
                                        style={{ borderRadius: 0 }}
                                    />
                                </View>
                            ) : (
                                <Text className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No daily spending data available</Text>
                            )}
                        </View>
                        {/* PieChart Slide */}
                        <View style={{ width: screenWidth - 48, marginRight: 16 }} className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-4 rounded-xl shadow-sm`}>
                            <View className="flex-row items-center mb-4">
                                <MaterialCommunityIcons name="chart-pie" size={24} color={isDarkMode ? '#D1D5DB' : '#6B7280'} />
                                <Text className={`text-lg font-semibold ml-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Expense Breakdown</Text>
                            </View>
                            {Array.isArray(expenseBreakdown) && expenseBreakdown.length > 0 ? (
                                <PieChart
                                    data={expenseBreakdown.map(item => ({
                                        name: item.name,
                                        amount: item.amount,
                                        color: item.color || '#A78BFA',
                                        legendFontColor: isDarkMode ? '#F3F4F6' : '#1E293B',
                                        legendFontSize: 12
                                    }))}
                                    width={screenWidth - 80}
                                    height={180}
                                    chartConfig={{
                                        color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
                                    }}
                                    accessor="amount"
                                    backgroundColor="transparent"
                                    paddingLeft={"15"}
                                    absolute
                                />
                            ) : (
                                <Text className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No expense breakdown data available</Text>
                            )}
                        </View>
                    </ScrollView>

                    {/* Set Budget Goal Button & Budget Cards Section (moved here) */}
                    <View className="mb-4">
                        <TouchableOpacity
                            style={{ backgroundColor: colors.primary }}
                            className="w-full py-3 rounded-xl items-center mb-4"
                            onPress={() => navigation.navigate('SetBudgetGoal')}
                        >
                            <Text className="text-white font-bold text-lg">Set Budget Goal</Text>
                        </TouchableOpacity>
                        <View>
                            {budgetsLoading ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : budgets.length === 0 ? (
                                <Text className="text-gray-400 text-center">No budgets set for this month.</Text>
                            ) : (
                                budgets.map(renderBudgetCard)
                            )}
                        </View>
                    </View>

                    {/* Lent Money Section (with Add Lend button) */}
                    <View className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-4 rounded-xl shadow-sm mb-6`}>
                        <View className="flex-row items-center mb-4 justify-between">
                            <View className="flex-row items-center">
                                <MaterialCommunityIcons name="hand-coin-outline" size={24} color={isDarkMode ? '#D1D5DB' : '#6B7280'} />
                                <Text className={`text-lg font-semibold ml-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Lent Money</Text>
                            </View>
                            <TouchableOpacity
                                style={{ backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 }}
                                onPress={() => setLendModalVisible(true)}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Add Lend</Text>
                            </TouchableOpacity>
                        </View>
                        {lendLoading ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : lendLogs.length === 0 ? (
                            <Text className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No lend logs yet.</Text>
                        ) : (
                            lendLogs.map((log) => {
                                // Show the other user's name
                                let otherUser = null;
                                if (log.transaction_type === 'L') {
                                    otherUser = log.participant;
                                } else if (log.transaction_type === 'B') {
                                    otherUser = log.initiator;
                                }
                                const otherUserName = otherUser ? (otherUser.first_name || '') + ' ' + (otherUser.last_name || '') || otherUser.username || 'User' : 'User';
                                return (
                                    <View key={log.id} style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginBottom: 10, backgroundColor: isDarkMode ? '#27272A' : '#F9FAFB' }}>
                                        <Text style={{ fontWeight: 'bold', color: isDarkMode ? '#fff' : '#222' }}>{otherUserName.trim()}</Text>
                                        <Text style={{ color: '#7C3AED', fontWeight: 'bold' }}>Amount: {log.amount}</Text>
                                        <Text>Type: {log.transaction_type === 'L' ? 'Lend' : 'Borrow'}</Text>
                                        <Text>Status: {log.status ? 'Pending' : 'Lend'}</Text>
                                        <Text>Due: {log.due_date}</Text>
                                        <Text>Description: {log.description}</Text>
                                        <TouchableOpacity
                                            style={{ marginTop: 8, backgroundColor: '#7C3AED', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'flex-end', opacity: verifyingId === log.id ? 0.5 : 1 }}
                                            disabled={verifyingId === log.id || log.status}
                                            onPress={async () => {
                                                setVerifyingId(log.id);
                                                try {
                                                    await verifyLend(log.id);
                                                    loadLendLogs();
                                                } catch (e) {
                                                    alert('Failed to verify lend');
                                                } finally {
                                                    setVerifyingId(null);
                                                }
                                            }}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{log.status ? 'Pending' : verifyingId === log.id ? 'Verifying...' : 'Mark as Pending'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })
                        )}
                        <AddLendModal
                            visible={lendModalVisible}
                            onClose={() => setLendModalVisible(false)}
                            onSuccess={() => {
                                setLendModalVisible(false);
                                fetchDashboardData();
                                loadLendLogs();
                            }}
                        />
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

export default HomeScreen;