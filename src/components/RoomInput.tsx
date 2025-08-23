import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows, layout } from '../constants/styles';

interface RoomInputProps {
  onCreateRoom: (name: string, displayName: string) => Promise<void>;
  onJoinRoom: (pin: string, displayName: string) => Promise<void>;
  isLoading: boolean;
}

export const RoomInput: React.FC<RoomInputProps> = ({
  onCreateRoom,
  onJoinRoom,
  isLoading,
}) => {
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [roomName, setRoomName] = useState('');
  const [roomPin, setRoomPin] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      return;
    }

    try {
      if (mode === 'create') {
        if (!roomName.trim()) return;
        await onCreateRoom(roomName.trim(), displayName.trim());
      } else {
        if (!roomPin.trim()) return;
        await onJoinRoom(roomPin.trim(), displayName.trim());
      }
    } catch (error) {
      console.error('RoomInput handleSubmit error:', error);
      // The error handling is done in the parent component
      // This ensures the error doesn't crash the component
    }
  };

  const isFormValid = () => {
    if (!displayName.trim()) return false;
    if (mode === 'create' && !roomName.trim()) return false;
    if (mode === 'join' && !roomPin.trim()) return false;
    return true;
  };

  return (
    <View style={styles.container}>
      {/* Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            mode === 'join' && styles.toggleButtonActive,
          ]}
          onPress={() => setMode('join')}
        >
          <Text
            style={[
              styles.toggleText,
              mode === 'join' && styles.toggleTextActive,
            ]}
          >
            Join Room
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            mode === 'create' && styles.toggleButtonActive,
          ]}
          onPress={() => setMode('create')}
        >
          <Text
            style={[
              styles.toggleText,
              mode === 'create' && styles.toggleTextActive,
            ]}
          >
            Create Room
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        {mode === 'create' ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Room Name</Text>
            <TextInput
              style={styles.input}
              value={roomName}
              onChangeText={setRoomName}
              placeholder="Enter room name"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Room PIN</Text>
            <TextInput
              style={styles.input}
              value={roomPin}
              onChangeText={setRoomPin}
              placeholder="Enter 6-digit PIN"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            !isFormValid() && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'create' ? 'Create Room' : 'Join Room'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {mode === 'create'
            ? 'Create a new room and share the PIN with friends to start swiping together!'
            : 'Enter the 6-digit PIN shared by your friend to join their room.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.text,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.medium,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  submitButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  infoContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
