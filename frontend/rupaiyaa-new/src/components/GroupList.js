import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';

const GroupList = ({
  groups,
  loading,
  isDarkMode,
  colors,
  onGroupPress
}) => (
  <View style={{ flex: 1 }}>
    {loading ? (
      <ActivityIndicator style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} size="large" color={colors.primary} />
    ) : (
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              { padding: 16, marginBottom: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 },
              !isDarkMode && { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
              { backgroundColor: isDarkMode ? '#374151' : '#FFFFFF' }
            ]}
            onPress={() => onGroupPress(item)}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#4B5563' : '#E5E7EB' }}>
              <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: isDarkMode ? '#FFFFFF' : '#111827' }}>{item.name}</Text>
              <Text style={{ fontSize: 14, color: isDarkMode ? '#9CA3AF' : '#6B7280' }}>{item.members ? item.members.length : 0} members</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ textAlign: 'center', fontSize: 16, marginTop: 40, color: isDarkMode ? '#9CA3AF' : '#4B5563' }}>
              You are not a member of any group yet. Create one!
            </Text>
          </View>
        )}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16 }}
      />
    )}
  </View>
);

export default GroupList;
