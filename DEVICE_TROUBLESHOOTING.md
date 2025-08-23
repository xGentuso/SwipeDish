# SwipeDish - Device Loading Issues Troubleshooting

## 🚨 **"Opening Project" Stuck Issue - Solutions**

### **Quick Fixes (Try These First):**

#### **1. Force Close and Restart Expo Go**
```bash
# On your phone:
1. Force close Expo Go app completely (swipe up and swipe away)
2. Wait 10 seconds
3. Reopen Expo Go
4. Scan QR code again
```

#### **2. Try Different Connection Methods**
```bash
# On your computer, restart with tunnel mode:
pkill -f "expo start"
npx expo start --clear --tunnel

# Alternative: Try LAN mode
npx expo start --clear --lan

# Alternative: Try localhost with manual URL
npx expo start --clear --localhost
```

#### **3. Clear All Caches**
```bash
# Clear Expo cache
npx expo start --clear

# Clear npm cache
npm start -- --reset-cache

# Clear React Native cache
npx react-native start --reset-cache

# Clear Expo Go app cache (on phone)
Settings > Apps > Expo Go > Storage > Clear Cache
```

### **Network Connection Issues:**

#### **1. Same WiFi Network**
- Ensure your phone and computer are on the SAME WiFi network
- Avoid corporate/public WiFi (often blocks connections)
- Try using your phone's hotspot

#### **2. Firewall Issues**
```bash
# Temporarily disable firewall (macOS)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# Re-enable after testing
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

#### **3. Manual URL Entry**
If QR code fails, manually enter the URL in Expo Go:
```
exp://192.168.1.XXX:8081
# (Replace XXX with your computer's IP)
```

### **Advanced Solutions:**

#### **1. Check IP Address**
```bash
# Find your computer's IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or use:
ipconfig getifaddr en0
```

#### **2. Use Tunnel Mode (Best for Network Issues)**
```bash
npx expo start --tunnel
```
This creates a tunnel through Expo's servers, bypassing local network issues.

#### **3. Try Development Build**
If Expo Go continues to fail:
```bash
# Create a development build
npx expo run:ios --device
# or
npx expo run:android --device
```

### **Device-Specific Issues:**

#### **iOS Issues:**
- Update to latest Expo Go version
- Check iOS version compatibility
- Try airplane mode on/off
- Restart iPhone/iPad

#### **Android Issues:**
- Enable "Install unknown apps" for Expo Go
- Check Android version compatibility
- Clear Google Play Services cache
- Try USB debugging mode

### **Project-Specific Fixes:**

#### **1. Environment Variables**
Make sure `.env` file is properly configured:
```bash
# Check if .env exists
ls -la .env

# Verify environment variables are loaded
cat .env
```

#### **2. Port Conflicts**
```bash
# Kill processes on common ports
lsof -ti:8081 | xargs kill -9
lsof -ti:19000 | xargs kill -9
lsof -ti:19001 | xargs kill -9
```

#### **3. Dependencies Check**
```bash
# Reinstall dependencies
rm -rf node_modules
rm package-lock.json
npm install

# Check for peer dependency issues
npx expo-doctor
```

### **Alternative Development Methods:**

#### **1. Web Development**
```bash
npx expo start --web
```
Open in browser at `http://localhost:8081`

#### **2. iOS Simulator**
```bash
npx expo start --ios
```

#### **3. Android Emulator**
```bash
npx expo start --android
```

### **Common Error Messages & Solutions:**

#### **"Network request failed"**
- Try tunnel mode: `npx expo start --tunnel`
- Check firewall settings
- Switch to mobile hotspot

#### **"Unable to resolve module"**
- Clear cache: `npx expo start --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`

#### **"Metro has encountered an error"**
- Restart Metro: `npx expo start --clear`
- Check for syntax errors in recent changes

#### **"Development server is not responding"**
- Check if server is running: `ps aux | grep expo`
- Try different port: `npx expo start --port 8082`

### **Last Resort Solutions:**

#### **1. Fresh Expo Go Install**
1. Delete Expo Go app completely
2. Restart phone
3. Reinstall from App Store/Play Store
4. Try again

#### **2. Fresh Project Setup**
```bash
# Create new Expo project to test
npx create-expo-app TestApp
cd TestApp
npx expo start
```

#### **3. Use Expo Development Build**
```bash
npx expo install expo-dev-client
npx expo run:ios --device
```

### **Contact Support:**
If none of these solutions work:
1. Check Expo Status: https://status.expo.dev/
2. Expo Discord: https://discord.gg/expo
3. Expo Forums: https://forums.expo.dev/

---

## 📱 **Current Status Check:**

```bash
# Check what's running
ps aux | grep -E "(expo|npm)" | grep -v grep

# Check network
ifconfig | grep "inet "

# Check expo status
npx expo-doctor
```

The app has been restarted with `--tunnel` mode which should resolve most network connectivity issues.
