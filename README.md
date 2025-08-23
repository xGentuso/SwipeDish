# 🍽️ SwipeDish

A Tinder-style restaurant discovery app built with React Native and Expo.

## 📱 Features

- **Swipe Interface**: Tinder-style swiping for restaurant discovery
- **Real Restaurant Data**: Integration with Yelp API for authentic restaurant information
- **User Authentication**: Email/password, Google Sign-In, and anonymous authentication
- **Smart Recommendations**: AI-powered restaurant suggestions based on user preferences
- **Real-time Matches**: Instant matching when multiple users like the same restaurant
- **Location-based Discovery**: Find restaurants near your current location
- **User Preferences**: Customizable cuisine and dietary preferences
- **Favorites System**: Save and manage your favorite restaurants

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- iOS Simulator or Android Emulator
- Firebase project
- Yelp API key

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

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   # Firebase Configuration
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Yelp API
   EXPO_PUBLIC_YELP_API_KEY=your_yelp_api_key

   # Google Sign-In
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id

   # Environment
   EXPO_PUBLIC_ENVIRONMENT=development
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   ```bash
   npm run ios     # iOS
   npm run android # Android
   ```

## 🔧 Configuration

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password, Google, Anonymous)
3. Create a Firestore database
4. Copy your Firebase config to `.env`

### Yelp API Setup

1. Go to [Yelp Developer Portal](https://www.yelp.com/developers)
2. Create a new app and get your API key
3. Add the API key to your `.env` file

### Google Sign-In Setup

1. Enable Google Sign-In in Firebase Authentication
2. Copy the Web Client ID to your `.env` file

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── constants/           # Colors, typography, and styles
├── navigation/          # Navigation setup
├── screens/            # Main app screens
├── services/           # Firebase and API services
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🎨 Design System

### Colors
- **Primary**: `#FF4D5A` (Match Red)
- **Secondary**: `#00C2D1` (Mint Blue)
- **Background**: `#121212` (Dark)
- **Surface**: `#1E1E1E` (Card Background)
- **Success**: `#00D26A` (Like Green)
- **Error**: `#F44336` (Dislike Red)

## 🔒 Security

- Environment variables for API keys
- Firebase security rules
- Input validation and sanitization
- Error boundary protection
- Production-ready logging configuration

## 📱 App Store Ready

This app is configured for production release with:
- Production environment settings
- App store metadata
- Security best practices
- Performance optimizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@swipedish.app or create an issue in this repository.

## 🚀 Deployment

### Production Build

```bash
# Build for production
eas build --profile production --platform ios
eas build --profile production --platform android
```

### App Store Submission

```bash
# Submit to App Store
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

---

**Built with ❤️ using React Native, Expo, and Firebase**
