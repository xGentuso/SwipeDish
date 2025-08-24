# SwipeDish 🍽️

**Swipe. Match. Dine Together.**

SwipeDish is a social restaurant discovery app that brings the fun of swiping to food exploration. Whether you're dining solo or making group decisions with friends, SwipeDish makes finding the perfect restaurant as easy as a swipe.

## ✨ Features

### 🍔 Restaurant Discovery

- **Intuitive Swiping**: Swipe left to pass, right to like, or tap the star to favorite
- **Smart Recommendations**: Powered by Yelp's comprehensive restaurant database
- **Personalized Filtering**: Set dietary restrictions, cuisine preferences, price range, and distance
- **Auto-Refresh**: Never run out of options with automatic card reloading

### 👥 Social Dining

- **Room System**: Create or join rooms using unique PIN codes
- **Real-Time Sync**: All room members see the same restaurant cards simultaneously
- **Match Magic**: When everyone swipes right on the same place, it's a match!
- **Group Decision Making**: End the "where should we eat?" debate once and for all

### 🗺️ Location & Maps

- **Location-Aware**: Find restaurants near you automatically
- **Interactive Maps**: View restaurant locations with integrated map modals
- **Multiple Directions**: Open in Google Maps, Apple Maps, or Waze with one tap
- **Address Details**: Complete location information for easy navigation

### ⭐ Personal Collections

- **Favorites**: Build your personal collection of must-try restaurants
- **Match History**: Keep track of all your group dining discoveries
- **Advanced Search**: Browse and filter restaurants in the Explore screen
- **Profile Preferences**: Customize your dining preferences and restrictions

## 🏗️ Technical Architecture

### Frontend

- **React Native + Expo**: Cross-platform mobile development
- **TypeScript**: Type-safe development for better reliability
- **Zustand**: Lightweight, modular state management
- **React Navigation**: Smooth navigation with tab and stack navigators
- **Styled Components**: Consistent, themeable styling system

### Backend & Services

- **Firebase**: Authentication, Firestore real-time database
- **Yelp Fusion API**: Restaurant data and search capabilities
- **Google Maps**: Location services and mapping functionality
- **Real-time Sync**: Live updates across all connected devices

### State Management

Modular store architecture with dedicated stores:

- **AuthStore**: User authentication and profiles
- **RoomStore**: Room management and match detection
- **CardsStore**: Restaurant cards and navigation
- **FavoritesStore**: Personal restaurant collections
- **PreferencesStore**: User dining preferences

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or later)
- **Expo CLI** or **Expo Tools**
- **iOS Simulator** or **Android Emulator** (optional)
- **Physical device** with Expo Go app (recommended)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/xGentuso/SwipeDish.git
   cd SwipeDish
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env` file in the root directory with your API keys:

   ```env
   # Firebase Configuration
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Yelp API
   EXPO_PUBLIC_YELP_API_KEY=your_yelp_api_key

   # Google Maps (optional)
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
   ```

4. **Start the development server**

   ```bash
   npm start
   ```

5. **Run on your device**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS Simulator, `a` for Android Emulator

### API Setup

#### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Email/Password and Google providers
3. Create a Firestore database with these collections:
   - `users` - User profiles and settings
   - `rooms` - Room data and member information
   - `matches` - Restaurant matches and room history
4. Copy your Firebase config values to the `.env` file

#### Yelp API Setup

1. Create a Yelp Developer account at [Yelp Developers](https://www.yelp.com/developers)
2. Create a new app to get your API key
3. Add the API key to your `.env` file
4. Note: Yelp API has rate limits (5,000 requests/day for free tier)

#### Google Services (Optional)

1. Create a Google Cloud project
2. Enable Maps JavaScript API and Places API
3. Create credentials for your API key
4. For Google Sign-In, create OAuth 2.0 credentials

## 📱 Development

### Available Scripts

```bash
# Start development server
npm start

# Run on specific platforms
npm run ios
npm run android
npm run web

# Code quality
npm run lint          # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm test              # Run Jest tests
npm run type-check    # TypeScript checking

# Building
npm run build         # Create production build
```

### Project Structure

```
SwipeDish/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── SwipeCard.tsx   # Individual restaurant card
│   │   ├── SwipeDeck.tsx   # Card stack with gestures
│   │   ├── MatchBanner.tsx # Match notification
│   │   └── ...
│   ├── screens/            # Main app screens
│   │   ├── SwipeDeckScreen.tsx    # Primary swiping interface
│   │   ├── ExploreScreen.tsx      # Restaurant browsing
│   │   ├── MatchesScreen.tsx      # Match history
│   │   └── ...
│   ├── services/           # External API integrations
│   │   ├── restaurantService.ts   # Restaurant data management
│   │   ├── yelpService.ts         # Yelp API integration
│   │   ├── firebase.ts            # Firebase configuration
│   │   └── ...
│   ├── store/              # State management
│   │   ├── useAuthStore.ts        # Authentication state
│   │   ├── useRoomStore.ts        # Room and match state
│   │   └── ...
│   ├── navigation/         # App navigation setup
│   ├── constants/          # App constants and themes
│   ├── utils/             # Helper functions and utilities
│   └── types/             # TypeScript type definitions
├── assets/                # Images, fonts, and static files
└── docs/                  # Documentation files
```

### Key Features Implementation

#### Restaurant Cards

- **Data Source**: Yelp Fusion API with local fallback data
- **Card Format**: Standardized FoodCard interface with image, title, details
- **Animations**: Smooth swipe animations with physics-based gestures
- **Performance**: Image optimization and memory management

#### Room System

- **Real-time Updates**: Firebase Firestore listeners for live synchronization
- **Match Algorithm**: Server-side logic to detect when all members like the same restaurant
- **PIN Generation**: Unique, user-friendly 4-digit room codes
- **Member Management**: Join/leave functionality with real-time updates

#### State Management

- **Modular Stores**: Separate Zustand stores for different app domains
- **Persistence**: AsyncStorage for offline data and preferences
- **Real-time Sync**: Firebase integration for cross-device synchronization
- **Error Handling**: Comprehensive error boundaries and fallback states

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Individual component and utility function testing
- **Integration Tests**: Store and service integration testing
- **E2E Tests**: Full user flow testing (planned)

## 📦 Building & Deployment

### EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for development
eas build --platform ios --profile development
eas build --platform android --profile development

# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Expo Classic Build

```bash
# Build APK for Android
expo build:android

# Build IPA for iOS
expo build:ios
```

## 🔧 Configuration

### Environment Variables

All configuration is managed through environment variables in `.env`:

- **EXPO*PUBLIC_FIREBASE*\***: Firebase service configuration
- **EXPO_PUBLIC_YELP_API_KEY**: Yelp API access
- **EXPO*PUBLIC_GOOGLE*\***: Google services integration

### App Configuration

Key settings in `app.json`:

- **Bundle identifier**: Unique app identifier for stores
- **Version management**: App version and build numbers
- **Permissions**: Camera, location, and notification permissions
- **Splash screen**: Branded loading screen configuration

## 🐛 Troubleshooting

### Common Issues

#### "Yelp API Key Not Found"

- Ensure `EXPO_PUBLIC_YELP_API_KEY` is set in your `.env` file
- Verify the API key is valid and not expired
- Check Yelp API rate limits haven't been exceeded

#### "Firebase Not Initialized"

- Confirm all Firebase environment variables are set
- Verify Firebase project configuration matches your environment
- Check Firebase service account permissions

#### "Location Services Unavailable"

- Grant location permissions in device settings
- For iOS simulator, set a custom location in Device > Location
- Ensure location services are enabled system-wide

#### Google Sign-In Issues

- Google Sign-In requires a development build (not Expo Go)
- Verify Google Web Client ID is correctly configured
- Check OAuth consent screen setup in Google Cloud Console

### Debug Mode

Enable additional logging by setting:

```env
EXPO_PUBLIC_DEBUG_MODE=true
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository** and create your feature branch
2. **Follow the code style** - run `npm run lint` to check
3. **Write tests** for new features and bug fixes
4. **Update documentation** for any API changes
5. **Submit a pull request** with a clear description of changes

### Code Style

- **TypeScript**: Strictly typed, no `any` types
- **ESLint**: Follow the configured rules
- **Prettier**: Auto-formatting on save
- **Naming**: Clear, descriptive variable and function names

### Commit Convention

```
type(scope): description

feat(auth): add Google sign-in integration
fix(cards): resolve swipe gesture sensitivity
docs(readme): update installation instructions
```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support & Contact

- **Issues**: Report bugs and feature requests on [GitHub Issues](https://github.com/xGentuso/SwipeDish/issues)
- **Discussions**: Join community discussions in [GitHub Discussions](https://github.com/xGentuso/SwipeDish/discussions)
- **Email**: For private inquiries, contact the development team

## 🚀 What's Next?

### Planned Features

- **Push Notifications**: Real-time match and room activity alerts
- **Restaurant Reviews**: In-app rating and review system
- **Social Features**: Friend connections and activity feeds
- **Advanced Filters**: More granular preference controls
- **Offline Mode**: Full offline functionality with data sync
- **Restaurant Reservations**: Direct booking integration

### Technical Roadmap

- **Performance Optimization**: Enhanced caching and loading strategies
- **A/B Testing**: Feature flag system for experimental features
- **Analytics Enhancement**: Detailed user behavior tracking
- **Accessibility**: Full VoiceOver and screen reader support
- **Internationalization**: Multi-language support

---

**Made with ❤️ by the SwipeDish team**

_Bringing people together, one swipe at a time._
