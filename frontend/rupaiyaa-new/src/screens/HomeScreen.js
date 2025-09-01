import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Platform, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
const API_BASE_URL = 'http://10.40.20.94:8000';
const screenWidth = Dimensions.get('window').width;
const CustomHeader = ({ 
    title, 
    subtitle,
    showProfileIcon = false,
    showTotalBalance = false,
    totalBalance = 'रू0'
}) => {
    const navigation = useNavigation();
    const { isDarkMode } = useContext(ThemeContext);
    const { userName } = useContext(AuthContext);

    const displayName = userName || 'User';
    const userInitial = displayName.charAt(0).toUpperCase();
    const gradientColors = isDarkMode ? ['#53048bff', '#6A0DAD'] : ['#8A2BE2', '#6d0eb0ff'];
    return (
        <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className={`rounded-b-3xl shadow-lg z-20 pb-6 ${Platform.OS === 'android' ? 'pt-8' : ''}`}
        >
            <SafeAreaView>
                <View className="flex-row justify-between items-center px-6">
                    <View>
                        <Text className="text-white text-lg font-medium opacity-80">{title}</Text>
                        {subtitle && <Text className="text-white text-2xl font-bold mt-1">{subtitle}</Text>}
                    </View>
                    <View className="flex-row items-center">
                        {/* Notification Icon */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Notifications')}
                            className="w-10 h-10 rounded-full bg-white bg-opacity-30 justify-center items-center mr-2"
                        >
                            <MaterialCommunityIcons name="bell-outline" size={24} color="white" />
                        </TouchableOpacity>
                        {showProfileIcon && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Profile')}
                                className="w-10 h-10 rounded-full bg-white bg-opacity-30 justify-center items-center"
                            >
                                <Text className="text-white font-bold text-lg">{userInitial}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {showTotalBalance && (
                    <View className="mt-4 px-6">
                        <Text className="text-white text-base opacity-80">Total Balance</Text>
                        <Text className="text-white text-4xl font-bold mt-1">{totalBalance}</Text>
                        <View className="flex-row items-center mt-2">
                            {/* <MaterialCommunityIcons name="trending-up" size={18} color="white" /> */}
                            {/* <Text className="text-white ml-1 text-sm opacity-90">+12.5% from last month</Text> */}
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
};

const HomeScreen = () => {
    const { colors, isDarkMode } = useContext(ThemeContext);
    const { userName } = useContext(AuthContext);
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
                    <TouchableOpacity>
                        <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
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

                    {/* Expense Analysis/Daily Spending */}
                    <View className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-4 rounded-xl shadow-sm mb-6`}>
                        <View className="flex-row items-center mb-4">
                            <MaterialCommunityIcons name="chart-bar" size={24} color={isDarkMode ? '#D1D5DB' : '#6B7280'} />
                            <Text className={`text-lg font-semibold ml-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Daily Spending</Text>
                        </View>
                        {Array.isArray(dailySpendingData.labels) && Array.isArray(dailySpendingData.datasets) && dailySpendingData.labels.length > 0 && dailySpendingData.datasets[0].data.length > 0 ? (
                            <View style={{ overflow: 'hidden', borderRadius: 16 }}>
                                <BarChart
                                    data={dailySpendingData}
                                    width={screenWidth - 48}
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

                    {/* Pie Chart for Expense Breakdown */}
                    <View className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-4 rounded-xl shadow-sm mb-6`}>
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
                                width={screenWidth - 48}
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

                    {/* Expense Breakdown */}
                    <View className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-4 rounded-xl shadow-sm mb-6`}>
                        <Text className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Expense Breakdown</Text>
                        {Array.isArray(expenseBreakdown) && expenseBreakdown.length > 0 ? (
                            <FlatList
                                data={expenseBreakdown}
                                renderItem={renderExpenseItem}
                                keyExtractor={(item, idx) => item?.name ? item.name : idx.toString()}
                                numColumns={2}
                            />
                        ) : (
                            <Text className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No expense breakdown data available</Text>
                        )}
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

export default HomeScreen;