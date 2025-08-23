import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { Room } from '../types';

interface RoomCreatedModalProps {
  visible: boolean;
  room: Room | null;
  onClose: () => void;
  onStartSwiping: () => void;
}

export const RoomCreatedModal: React.FC<RoomCreatedModalProps> = ({
  visible,
  room,
  onClose,
  onStartSwiping,
}) => {
  if (!room) return null;

  const handleCopyPin = async () => {
    try {
      await Clipboard.setStringAsync(room.pin);
      Alert.alert('Copied!', 'Room PIN copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy PIN to clipboard');
    }
  };

  const handleShareRoom = async () => {
    try {
      const message = `Join my SwipeDish room "${room.name}"!\n\nRoom PIN: ${room.pin}\n\nDownload SwipeDish to start swiping on restaurants together!`;
      
      await Share.share({
        message,
        title: `Join my SwipeDish room: ${room.name}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share room details');
    }
  };

  const handleStartSwiping = () => {
    onStartSwiping();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Room Created!</Text>
          <Text style={styles.subtitle}>Share this PIN with friends to join</Text>

          {/* Room Details */}
          <View style={styles.roomCard}>
            <Text style={styles.roomName}>{room.name}</Text>
            <View style={styles.pinContainer}>
              <Text style={styles.pinLabel}>Room PIN</Text>
              <View style={styles.pinDisplay}>
                <Text style={styles.pinText}>{room.pin}</Text>
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={handleCopyPin}
                  activeOpacity={0.7}
                >
                  <Ionicons name="copy-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Member Count */}
          <View style={styles.memberInfo}>
            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.memberText}>
              {room.members.length} member{room.members.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareRoom}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={20} color={colors.text} />
              <Text style={styles.shareButtonText}>Share Room</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartSwiping}
              activeOpacity={0.7}
            >
              <Ionicons name="play-outline" size={20} color={colors.text} />
              <Text style={styles.startButtonText}>Start Swiping</Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <Text style={styles.infoText}>
            Friends can join using the PIN above. Once everyone joins, start swiping to find restaurants you all love!
          </Text>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...shadows.large,
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  roomCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  roomName: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pinContainer: {
    alignItems: 'center',
  },
  pinLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  pinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pinText: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginRight: spacing.sm,
  },
  copyButton: {
    padding: spacing.xs,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  memberText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  shareButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  startButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.xs,
  },
});