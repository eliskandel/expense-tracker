import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CreateGroupModal = ({
  visible,
  onClose,
  isDarkMode,
  colors,
  newGroupName,
  setNewGroupName,
  searchQuery,
  setSearchQuery,
  members,
  membersLoading,
  selectedMembers,
  toggleMemberSelection,
  isCreatingGroup,
  handleCreateGroup
}) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <View style={{ width: '90%', padding: 24, borderRadius: 12, backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: isDarkMode ? '#FFFFFF' : '#111827' }}>Create New Group</Text>
        <TextInput
          style={{ width: '100%', padding: 14, marginBottom: 16, borderRadius: 8, fontSize: 16, backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', color: isDarkMode ? '#FFFFFF' : '#000000' }}
          placeholder="Group Name"
          placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
          value={newGroupName}
          onChangeText={setNewGroupName}
        />
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: isDarkMode ? '#FFFFFF' : '#111827' }}>Select Members</Text>
        <TextInput
          style={{ width: '100%', padding: 14, marginBottom: 16, borderRadius: 8, fontSize: 16, backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', color: isDarkMode ? '#FFFFFF' : '#000000' }}
          placeholder="Search by username..."
          placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={{ marginBottom: 16, borderWidth: 1, borderRadius: 8, height: 192, borderColor: isDarkMode ? '#4B5563' : '#E5E7EB' }}>
          {membersLoading ? (
            <ActivityIndicator style={{ marginVertical: 16 }} size="small" color={colors.primary} />
          ) : (
            <ScrollView>
              {members.length > 0 ? members.map(member => {
                if (member.id === id) return null;
                const isSelected = selectedMembers.includes(member.id);
                return (
                  <TouchableOpacity
                    key={member.id}
                    onPress={() => toggleMemberSelection(member.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 6, margin: 4, backgroundColor: isSelected ? (isDarkMode ? '#581c87' : '#f3e8ff') : 'transparent' }}
                  >
                    <MaterialCommunityIcons
                      name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                      size={22}
                      color={isSelected ? colors.primary : (isDarkMode ? '#9CA3AF' : '#6B7280')}
                    />
                    <Text style={{ marginLeft: 12, fontSize: 16, color: isDarkMode ? '#FFFFFF' : '#111827' }}>{member.username}</Text>
                  </TouchableOpacity>
                );
              }) : <Text style={{ color: isDarkMode ? '#9CA3AF' : '#4B5563', padding: 16 }}>No members found.</Text>}
            </ScrollView>
          )}
        </View>
        <TouchableOpacity
          style={{ width: '100%', paddingVertical: 14, borderRadius: 50, alignItems: 'center', marginBottom: 8, backgroundColor: isCreatingGroup ? '#A78BFA' : '#7C3AED' }}
          onPress={handleCreateGroup}
          disabled={isCreatingGroup}
        >
          {isCreatingGroup ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>Create</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={{ width: '100%', paddingVertical: 14, borderRadius: 50, alignItems: 'center', marginBottom: 8, backgroundColor: 'transparent' }} onPress={onClose}>
          <Text style={{ fontWeight: 'bold', color: isDarkMode ? '#9CA3AF' : '#4B5563' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default CreateGroupModal;
