import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContext, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import Modal from 'react-native-modal';
import { ThemeContext } from '../context/ThemeContext';

const FilterModal = ({ isVisible, onApply, onClose, initialFilters }) => {
    const { colors, isDarkMode } = useContext(ThemeContext);
    const [startDate, setStartDate] = useState(initialFilters.startDate);
    const [endDate, setEndDate] = useState(initialFilters.endDate);
    const [selectedType, setSelectedType] = useState(initialFilters.type);
    const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);

    const types = ['All', 'Expense', 'Income'];

    const handleApply = () => {
        onApply({ startDate, endDate, type: selectedType });
        onClose();
    };

    const handleClear = () => {
        setStartDate(null);
        setEndDate(null);
        setSelectedType('All');
    };

    return (
        <Modal isVisible={isVisible} onBackdropPress={onClose} style={{ margin: 0, justifyContent: 'flex-end' }}>
            <View className={`p-6 rounded-t-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <View className="flex-row justify-between items-center mb-6">
                    <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Filter Transactions</Text>
                    <TouchableOpacity onPress={onClose}>
                        <MaterialCommunityIcons name="close-circle" size={28} color={isDarkMode ? colors.subtext : colors.subtext} />
                    </TouchableOpacity>
                </View>

                {/* Date Range Filter */}
                <View className="mb-6">
                    <Text className={`text-base font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Date Range</Text>
                    <View className="flex-row justify-between">
                        {/* Start Date */}
                        <TouchableOpacity onPress={() => setStartDatePickerVisible(true)} className={`flex-1 p-3 rounded-lg mr-2`} style={{ backgroundColor: colors.card }}>
                            <Text className={`text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {startDate ? startDate.toDateString() : 'Start Date'}
                            </Text>
                        </TouchableOpacity>
                        <DatePicker
                            modal
                            open={isStartDatePickerVisible}
                            date={startDate || new Date()}
                            onConfirm={(date) => {
                                setStartDatePickerVisible(false);
                                setStartDate(date);
                            }}
                            onCancel={() => {
                                setStartDatePickerVisible(false);
                            }}
                            mode="date"
                        />
                        
                        {/* End Date */}
                        <TouchableOpacity onPress={() => setEndDatePickerVisible(true)} className={`flex-1 p-3 rounded-lg ml-2`} style={{ backgroundColor: colors.card }}>
                            <Text className={`text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {endDate ? endDate.toDateString() : 'End Date'}
                            </Text>
                        </TouchableOpacity>
                        <DatePicker
                            modal
                            open={isEndDatePickerVisible}
                            date={endDate || new Date()}
                            onConfirm={(date) => {
                                setEndDatePickerVisible(false);
                                setEndDate(date);
                            }}
                            onCancel={() => {
                                setEndDatePickerVisible(false);
                            }}
                            mode="date"
                        />
                    </View>
                </View>

                {/* Type Filter */}
                <View className="mb-6">
                    <Text className={`text-base font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Type</Text>
                    <View className="flex-row justify-between">
                        {types.map((type, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setSelectedType(type)}
                                className={`flex-1 p-3 rounded-lg mr-2 items-center`}
                                style={{
                                    backgroundColor: selectedType === type ? colors.primary : colors.card,
                                }}
                            >
                                <Text className={`font-semibold ${selectedType === type ? 'text-white' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row justify-between">
                    <TouchableOpacity onPress={handleClear} className="flex-1 p-4 rounded-full mr-2 items-center" style={{ backgroundColor: colors.danger }}>
                        <Text className="text-white font-bold">Clear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleApply} className="flex-1 p-4 rounded-full ml-2 items-center" style={{ backgroundColor: colors.primary }}>
                        <Text className="text-white font-bold">Apply Filters</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default FilterModal;