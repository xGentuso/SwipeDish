import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../constants/styles';

const { width: screenWidth } = Dimensions.get('window');

export interface FilterState {
  cuisine: string;
  price: string | null;
  distance: number;
  rating: number;
  openNow: boolean;
  delivery: boolean;
  takeout: boolean;
}

interface FilterPanelProps {
  visible: boolean;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onReset: () => void;
  cuisineOptions: string[];
  priceOptions: string[];
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  visible,
  filters,
  onFilterChange,
  onReset,
  cuisineOptions,
  priceOptions,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const slideAnim = useState(new Animated.Value(0))[0];

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible, slideAnim]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  }, [expandedSection]);

  const renderCuisineFilter = useCallback(({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        filters.cuisine === item && styles.filterChipActive,
      ]}
      onPress={() => onFilterChange('cuisine', item)}
    >
      <Text
        style={[
          styles.filterChipText,
          filters.cuisine === item && styles.filterChipTextActive,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  ), [filters.cuisine, onFilterChange]);

  const renderPriceFilter = useCallback((price: string) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        filters.price === price && styles.filterChipActive,
      ]}
      onPress={() => onFilterChange('price', filters.price === price ? null : price)}
    >
      <Text
        style={[
          styles.filterChipText,
          filters.price === price && styles.filterChipTextActive,
        ]}
      >
        {price}
      </Text>
    </TouchableOpacity>
  ), [filters.price, onFilterChange]);

  const renderDistanceSlider = useCallback(() => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderTrack}>
        <View 
          style={[
            styles.sliderFill, 
            { width: `${(filters.distance / 20) * 100}%` }
          ]} 
        />
        <TouchableOpacity
          style={[
            styles.sliderThumb,
            { left: `${(filters.distance / 20) * 100}%` }
          ]}
        />
      </View>
      <Text style={styles.sliderValue}>{filters.distance || 0}km</Text>
    </View>
  ), [filters.distance]);

  const renderRatingFilter = useCallback(() => (
    <View style={styles.ratingContainer}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <TouchableOpacity
          key={rating}
          style={[
            styles.ratingButton,
            filters.rating >= rating && styles.ratingButtonActive,
          ]}
          onPress={() => onFilterChange('rating', filters.rating === rating ? 0 : rating)}
        >
          <Ionicons 
            name="star" 
            size={20} 
            color={filters.rating >= rating ? colors.primary : colors.textTertiary} 
          />
        </TouchableOpacity>
      ))}
      <Text style={styles.ratingText}>
        {filters.rating > 0 ? `${filters.rating}+ stars` : 'Any rating'}
      </Text>
    </View>
  ), [filters.rating, onFilterChange]);

  const renderToggleFilter = useCallback((key: keyof FilterState, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.toggleFilter,
        filters[key] ? styles.toggleFilterActive : undefined,
      ]}
      onPress={() => onFilterChange(key, !filters[key])}
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={filters[key] ? colors.text : colors.textTertiary} 
      />
      <Text style={[
        styles.toggleFilterText,
        filters[key] ? { color: colors.text } : null,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  ), [filters, onFilterChange]);

  const renderFilterSection = useCallback((
    title: string,
    icon: string,
    content: React.ReactNode,
    isExpanded: boolean
  ) => (
    <View style={styles.filterSection}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(title)}
      >
        <View style={styles.sectionTitleContainer}>
          <Ionicons name={icon as any} size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={colors.textTertiary} 
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <Animated.View style={styles.sectionContent}>
          {content}
        </Animated.View>
      )}
    </View>
  ), [toggleSection]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 400],
          }),
          opacity: slideAnim,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Cuisine Filter */}
        <View key="cuisine">
          {renderFilterSection(
            'Cuisine',
            'restaurant',
            <FlatList
              data={cuisineOptions}
              renderItem={renderCuisineFilter}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContainer}
            />,
            expandedSection === 'Cuisine'
          )}
        </View>

        {/* Price Filter */}
        <View key="price">
          {renderFilterSection(
            'Price Range',
            'card',
            <View style={styles.priceFiltersContainer}>
              {priceOptions.map(price => (
                <View key={price}>
                  {renderPriceFilter(price)}
                </View>
              ))}
            </View>,
            expandedSection === 'Price Range'
          )}
        </View>

        {/* Distance Filter */}
        <View key="distance">
          {renderFilterSection(
            'Distance',
            'location',
            renderDistanceSlider(),
            expandedSection === 'Distance'
          )}
        </View>

        {/* Rating Filter */}
        <View key="rating">
          {renderFilterSection(
            'Rating',
            'star',
            renderRatingFilter(),
            expandedSection === 'Rating'
          )}
        </View>

        {/* Service Filters */}
        <View key="services">
          {renderFilterSection(
            'Services',
            'options',
            <View style={styles.serviceFiltersContainer}>
              {renderToggleFilter('openNow', 'Open Now', 'time')}
              {renderToggleFilter('delivery', 'Delivery', 'bicycle')}
              {renderToggleFilter('takeout', 'Takeout', 'bag')}
            </View>,
            expandedSection === 'Services'
          )}
        </View>

        {/* Reset Button */}
        <View style={styles.resetContainer}>
          <TouchableOpacity style={styles.resetButton} onPress={onReset}>
            <Ionicons name="refresh" size={16} color={colors.primary} />
            <Text style={styles.resetButtonText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  sectionContent: {
    marginTop: spacing.sm,
  },
  filtersContainer: {
    paddingRight: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.text,
  },
  priceFiltersContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderTrack: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    position: 'relative',
    marginBottom: spacing.sm,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.card,
  },
  sliderValue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingButton: {
    padding: spacing.xs,
  },
  ratingButtonActive: {
    // Active state styling
  },
  ratingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  serviceFiltersContainer: {
    gap: spacing.sm,
  },
  toggleFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  toggleFilterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleFilterText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  toggleFilterTextActive: {
    color: colors.text,
  },
  resetContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  resetButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
