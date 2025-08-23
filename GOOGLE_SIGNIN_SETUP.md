# Google Sign-In Setup Guide

## Step 1: Get Web Client ID from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/swipedish-ad11a/authentication/providers)
2. Click on "Authentication" → "Sign-in method"
3. Enable "Google" sign-in provider
4. Copy the "Web client ID" (it should look like: `672777871437-xxxxxxxxxxxxxxxxx.apps.googleusercontent.com`)

## Step 2: Update the Web Client ID

Replace the placeholder in `/src/services/authService.ts`:

```typescript
static initializeGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID_HERE', // Replace this
    offlineAccess: true,
  });
}
```

## Step 3: iOS Configuration (if building for iOS)

Add to `ios/SwipeDish/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>REVERSED_CLIENT_ID</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>YOUR_REVERSED_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

## Step 4: Android Configuration (if building for Android)

The configuration should automatically work with Expo, but if you need custom configuration, add to `android/app/src/main/res/values/strings.xml`:

```xml
<string name="server_client_id">YOUR_WEB_CLIENT_ID</string>
```

## Step 5: Test the Implementation

The new authentication flow includes:
- ✅ Email/Password Sign In
- ✅ Email/Password Sign Up  
- ✅ Google Sign-In
- ✅ Anonymous/Guest Sign-In

Users will now see the AuthScreen first and can choose their preferred sign-in method.