# SwipeDish Deployment Guide

This guide covers the complete deployment process for SwipeDish, from development setup to production builds for iOS and Android app stores.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Environment Configuration](#environment-configuration)
- [EAS Build Setup](#eas-build-setup)
- [iOS Deployment](#ios-deployment)
- [Android Deployment](#android-deployment)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Tools

```bash
# Node.js (v18 or later)
node --version
npm --version

# Expo CLI
npm install -g @expo/eas-cli
npm install -g expo-cli

# Git
git --version
```

### Development Accounts

- **Expo Account**: For EAS Build and deployment
- **Apple Developer Program**: For iOS app store ($99/year)
- **Google Play Console**: For Android app store ($25 one-time)
- **Firebase Project**: For backend services
- **Yelp Developer Account**: For restaurant data

### Development Environment

```bash
# iOS Development (macOS only)
xcode-select --install
# Install Xcode from Mac App Store

# Android Development (optional)
# Download Android Studio
# Set up Android SDK and emulators
```

## 🚀 Development Setup

### 1. Project Setup

```bash
# Clone repository
git clone https://github.com/xGentuso/SwipeDish.git
cd SwipeDish

# Install dependencies
npm install

# Install iOS pods (macOS only)
cd ios && pod install && cd ..
```

### 2. Environment Configuration

Create `.env` file in project root:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=swipedish-12345.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=swipedish-12345
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=swipedish-12345.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:ios:abc123def456

# Yelp API
EXPO_PUBLIC_YELP_API_KEY=your_yelp_api_key

# Google Services (optional)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com

# Debug Mode
EXPO_PUBLIC_DEBUG_MODE=true
```

### 3. Start Development Server

```bash
# Start Expo development server
npm start

# Run on specific platforms
npm run ios
npm run android
```

## ⚙️ Environment Configuration

### Development Environment

```env
# .env.development
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_FIREBASE_PROJECT_ID=swipedish-dev
EXPO_PUBLIC_API_BASE_URL=https://dev-api.swipedish.com
```

### Production Environment

```env
# .env.production
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_FIREBASE_PROJECT_ID=swipedish-prod
EXPO_PUBLIC_API_BASE_URL=https://api.swipedish.com
```

### App Configuration (`app.json`)

```json
{
  "expo": {
    "name": "SwipeDish",
    "slug": "swipedish",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1A1A1A"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.swipedish.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "SwipeDish uses your location to find nearby restaurants.",
        "NSCameraUsageDescription": "SwipeDish needs camera access to scan QR codes for room joining."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1A1A1A"
      },
      "package": "com.swipedish.app",
      "versionCode": 1,
      "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "CAMERA"]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-location",
      "expo-camera",
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.123456789-abc123def456"
        }
      ],
      [
        "expo-build-properties",
        {
          "ios": {
            "newArchEnabled": false
          },
          "android": {
            "newArchEnabled": false
          }
        }
      ]
    ]
  }
}
```

## 📱 EAS Build Setup

### 1. Initialize EAS

```bash
# Login to Expo account
eas login

# Initialize EAS in project
eas build:configure
```

### 2. EAS Configuration (`eas.json`)

```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "resourceClass": "medium",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "resourceClass": "medium",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "resourceClass": "medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your_apple_id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC123DEF4"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account-key.json",
        "track": "internal"
      }
    }
  }
}
```

### 3. Build Commands

```bash
# Development builds
eas build --platform ios --profile development
eas build --platform android --profile development

# Preview builds (TestFlight/Internal Testing)
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production builds
eas build --platform ios --profile production
eas build --platform android --profile production

# Build both platforms
eas build --platform all --profile production
```

## 🍎 iOS Deployment

### 1. Apple Developer Setup

1. **Join Apple Developer Program** ($99/year)
2. **Create App Identifier**
   - Bundle ID: `com.swipedish.app`
   - Enable capabilities: Push Notifications, Associated Domains

3. **Create Provisioning Profiles**
   - Development profile for testing
   - Distribution profile for App Store

### 2. App Store Connect Setup

1. **Create new app** in App Store Connect
2. **Configure app information**:
   - App Name: SwipeDish
   - Bundle ID: com.swipedish.app
   - SKU: swipedish-ios
   - Primary Language: English

3. **Upload app metadata**:
   - App description
   - Keywords
   - Screenshots (required sizes)
   - App icon (1024x1024)

### 3. Build and Submit

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store (after build completes)
eas submit --platform ios --profile production

# Or submit manually through App Store Connect
```

### 4. App Store Review Process

1. **Upload build** via EAS Submit or Xcode
2. **Add build to app version** in App Store Connect
3. **Fill out app review information**:
   - Demo account credentials
   - Review notes
   - Contact information
4. **Submit for review**
5. **Monitor review status** (typically 24-48 hours)

### 5. Release to App Store

1. **Approval notification** from Apple
2. **Choose release option**:
   - Manual release (recommended)
   - Automatic release after approval
3. **Release to all users** or phased release

## 🤖 Android Deployment

### 1. Google Play Console Setup

1. **Create developer account** ($25 one-time fee)
2. **Create new app**:
   - App name: SwipeDish
   - Default language: English
   - App or game: App

### 2. App Signing Setup

```bash
# Generate keystore (if not using Play App Signing)
keytool -genkeypair -v -keystore swipedish.keystore -alias swipedish -keyalg RSA -keysize 2048 -validity 10000

# Or use Play App Signing (recommended)
# Upload key will be generated by Google
```

### 3. Build Configuration

Update `eas.json` for Android:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:bundleRelease"
      }
    }
  }
}
```

### 4. Build and Submit

```bash
# Build AAB for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production
```

### 5. Play Store Listing

1. **Store listing**:
   - App name: SwipeDish
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots for different device types

2. **Content rating**:
   - Complete content rating questionnaire
   - Target age group: 13+ (contains social features)

3. **App content**:
   - Privacy policy URL
   - Target audience
   - Content declarations

### 6. Release Management

1. **Internal testing** (immediate)
2. **Closed testing** (alpha/beta)
3. **Open testing** (public beta)
4. **Production release** (live on Play Store)

## ✅ Production Checklist

### Pre-Build Checklist

- [ ] Environment variables configured
- [ ] Firebase project set to production
- [ ] API keys validated and working
- [ ] App icons and splash screens updated
- [ ] Version number and build number incremented
- [ ] Privacy policy and terms of service updated
- [ ] Analytics and crash reporting configured

### Build Checklist

- [ ] Development build tested on physical devices
- [ ] Preview build tested with real users
- [ ] Performance testing completed
- [ ] Memory leaks checked and fixed
- [ ] Battery usage optimized
- [ ] Network error handling tested

### Deployment Checklist

- [ ] App Store/Play Store metadata updated
- [ ] Screenshots for all required device sizes
- [ ] App description and keywords optimized
- [ ] Content rating completed
- [ ] Privacy policy linked
- [ ] Test accounts created for review

### Post-Deployment Checklist

- [ ] App store listings monitored
- [ ] User reviews monitored and responded to
- [ ] Analytics data flowing correctly
- [ ] Crash reports monitored
- [ ] Update schedule planned

## 🔧 Production Configuration

### Performance Optimization

```typescript
// app.json optimization
{
  "expo": {
    "optimization": {
      "minify": true,
      "gzip": true
    },
    "assetBundlePatterns": [
      "assets/images/**"
    ]
  }
}
```

### Bundle Size Optimization

```bash
# Analyze bundle size
npx expo install @expo/webpack-config
npx expo customize webpack.config.js

# Enable Hermes (Android)
# Add to app.json
{
  "expo": {
    "android": {
      "jsEngine": "hermes"
    }
  }
}
```

### Monitoring and Analytics

```typescript
// Production monitoring setup
import * as Sentry from '@sentry/react-native';
import { Analytics } from '@aws-amplify/analytics';

// Initialize error reporting
Sentry.init({
  dsn: 'your_sentry_dsn',
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT,
});

// Initialize analytics
Analytics.configure({
  AWSPinpoint: {
    appId: 'your_pinpoint_app_id',
    region: 'us-east-1',
  },
});
```

## 🐛 Troubleshooting

### Common Build Issues

#### "Expo CLI out of date"

```bash
npm install -g @expo/eas-cli@latest
eas --version
```

#### "Bundle identifier conflicts"

```bash
# Clear EAS cache
eas build:clear-cache

# Update bundle identifier in app.json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.swipedish"
    }
  }
}
```

#### "Provisioning profile issues"

```bash
# Regenerate credentials
eas credentials

# Select platform and follow prompts
```

### Common Deployment Issues

#### "App Store Review Rejection"

Common rejection reasons:

- Missing privacy policy
- Incomplete app functionality
- Guideline violations
- Technical issues

Solutions:

1. Review Apple's App Store Review Guidelines
2. Test app thoroughly before submission
3. Provide clear demo account and instructions
4. Address all technical issues

#### "Play Store Upload Issues"

```bash
# Check APK/AAB file
eas build:inspect --platform android

# Verify signing configuration
eas credentials --platform android
```

### Environment Issues

#### "Firebase configuration errors"

```bash
# Verify environment variables
echo $EXPO_PUBLIC_FIREBASE_API_KEY

# Test Firebase connection
npm run test:firebase
```

#### "API key not working"

```bash
# Verify API keys are active
curl -H "Authorization: Bearer $EXPO_PUBLIC_YELP_API_KEY" \
  "https://api.yelp.com/v3/businesses/search?location=NYC"
```

### Performance Issues

#### "Large bundle size"

```bash
# Analyze bundle
npx expo install @expo/metro-config
npx expo customize metro.config.js

# Enable tree shaking and minification
```

#### "Slow app startup"

```bash
# Profile startup time
npx expo install expo-screen-capture
npm run profile:startup
```

---

## 🚀 Continuous Deployment

### GitHub Actions Setup

```yaml
# .github/workflows/deploy.yml
name: Deploy SwipeDish

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Setup EAS
        uses: expo/expo-github-action@v7
        with:
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build and submit
        run: |
          eas build --platform all --profile production --non-interactive
          eas submit --platform all --profile production --non-interactive
```

This comprehensive deployment guide covers all aspects of building and deploying SwipeDish to production. Follow each section carefully and refer to the troubleshooting section for common issues.
