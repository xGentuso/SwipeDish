# Map Functionality Standardization

This document outlines the standardized map configuration and usage patterns implemented across the SwipeDish app.

## Overview

All map components now use a centralized configuration system that ensures consistent behavior, styling, and error handling across the entire application.

## Standardized Components

### Map Configuration (`src/constants/mapConfig.ts`)

**Central configuration file** that defines:
- Provider selection (currently `PROVIDER_DEFAULT` for stability)
- Standard map configurations for different use cases
- Location validation and fallback handling
- Consistent styling and behavior

### Map Component Types

1. **MapModal** - Full-screen interactive map
   - Used in: ExploreScreen, SwipeCard
   - Features: Full interaction, user location, directions

2. **EmbeddedMap** - Inline interactive map
   - Used in: Restaurant details, cards
   - Features: Compact view, basic interaction

3. **MapPreview** - Non-interactive preview map
   - Used in: Card previews, thumbnails
   - Features: Static display, click to open full map

## Key Improvements

### ✅ Consistent Configuration
- All maps use the same provider settings
- Standardized zoom levels and interaction modes
- Unified styling across components

### ✅ Location Validation
- `validateLocation()` function ensures data safety
- Automatic fallback to Hamilton, ON for invalid locations
- Prevents crashes from malformed location data

### ✅ Error Prevention
- Removed Google Maps dependency to prevent configuration errors
- Uses native map providers (Apple Maps on iOS, Google Maps on Android)
- Graceful handling of missing location data

### ✅ Performance Optimization
- Disabled expensive features (traffic, buildings) for better performance
- Optimized settings for each map type (preview vs interactive)
- Reduced memory usage

## Usage Patterns

### Before Standardization
```typescript
// Inconsistent configurations across components
<MapView 
  provider={PROVIDER_GOOGLE} // Could cause crashes
  showsTraffic={true} // Performance impact
  // Missing location validation
/>
```

### After Standardization
```typescript
import { MODAL_MAP_CONFIG, validateLocation } from '../constants/mapConfig';

<MapView 
  {...MODAL_MAP_CONFIG}
  region={getDefaultRegion(validateLocation(location))}
/>
```

## Configuration Types

| Component Type | Configuration | Use Case |
|---------------|--------------|----------|
| **Preview** | `PREVIEW_MAP_CONFIG` | Non-interactive thumbnails |
| **Embedded** | `EMBEDDED_MAP_CONFIG` | Inline interactive maps |
| **Modal** | `MODAL_MAP_CONFIG` | Full-screen map modals |

## Location Handling

### Safe Location Processing
```typescript
const safeLocation = validateLocation(restaurant.location);
// Always returns valid coordinates with fallback
```

### Fallback Strategy
1. **Primary**: Use provided restaurant location
2. **Fallback**: Hamilton, ON (43.1599795, -79.2470299)
3. **Error handling**: Graceful degradation

## Future Enhancements

When ready to enable Google Maps:
1. Complete native rebuild with proper configuration
2. Update `getMapProvider()` to return `PROVIDER_GOOGLE`
3. All components will automatically use Google Maps

## Files Modified

### Core Configuration
- ✅ `src/constants/mapConfig.ts` - New centralized config

### Map Components  
- ✅ `src/components/MapModal.tsx` - Updated to use standard config
- ✅ `src/components/EmbeddedMap.tsx` - Updated to use standard config  
- ✅ `src/components/MapPreview.tsx` - Updated to use standard config

### Screen Components
- ✅ `src/screens/ExploreScreen.tsx` - Updated location validation
- ✅ `src/components/SwipeCard.tsx` - Updated location validation

### Configuration Files
- ✅ `app.json` - Fixed Google Maps plugin configuration
- ✅ `tsconfig.eas.json` - Removed deprecated TypeScript options

## Benefits Achieved

1. **🚫 No More Crashes**: Eliminated Google Maps configuration errors
2. **🔄 Consistency**: All maps behave the same way across the app  
3. **⚡ Performance**: Optimized settings for each map type
4. **🛡️ Reliability**: Location validation prevents data-related crashes
5. **🔧 Maintainability**: Single source of truth for map configuration
6. **🚀 Future-Ready**: Easy to switch to Google Maps when ready

The map functionality is now consistent, reliable, and ready for production use across all sections of the SwipeDish app.