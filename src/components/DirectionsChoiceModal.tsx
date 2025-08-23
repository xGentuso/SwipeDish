import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';
import { MapsService } from '../services/mapsService';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface DirectionsChoiceModalProps {
  visible: boolean;
  location: Location;
  title?: string;
  onClose: () => void;
}

export const DirectionsChoiceModal: React.FC<DirectionsChoiceModalProps> = ({
  visible,
  location,
  title,
  onClose,
}) => {
  const handleGoogleMaps = async () => {
    try {
      await MapsService.openGoogleMapsDirections(location, title);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Could not open Google Maps');
    }
  };

  const handleAppleMaps = async () => {
    try {
      await MapsService.openAppleMapsDirections(location, title);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Could not open Apple Maps');
    }
  };

  const handleDefaultMaps = async () => {
    try {
      await MapsService.openDirections(location, title);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Could not open directions');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <Text style={styles.title}>Choose Maps App</Text>
          
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Get directions to {title || 'this restaurant'}
          </Text>
          
          {location.address && (
            <Text style={styles.address}>{location.address}</Text>
          )}

          {/* Google Maps Option */}
          <TouchableOpacity style={styles.option} onPress={handleGoogleMaps}>
            <View style={styles.optionIcon}>
              <Ionicons name="logo-google" size={32} color="#4285F4" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Google Maps</Text>
              <Text style={styles.optionSubtitle}>Best for detailed directions and traffic</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Apple Maps Option (iOS only) */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.option} onPress={handleAppleMaps}>
              <View style={styles.optionIcon}>
                <Ionicons name="map" size={32} color="#007AFF" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Apple Maps</Text>
                <Text style={styles.optionSubtitle}>Native iOS experience with privacy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Default Maps Option */}
          <TouchableOpacity style={styles.option} onPress={handleDefaultMaps}>
            <View style={styles.optionIcon}>
              <Ionicons name="navigate" size={32} color={colors.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Default Maps</Text>
              <Text style={styles.optionSubtitle}>Use your device's default maps app</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  address: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  optionSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
