# SwipeDish Troubleshooting Guide

## App Won't Load on Mobile Device

### Common Issues and Solutions:

#### 1. **QR Code Not Working**
- **Solution**: Make sure your phone and computer are on the same WiFi network
- **Alternative**: Try using the Expo Go app and manually enter the URL shown in the terminal

#### 2. **App Crashes on Load**
- **Check**: Look at the terminal logs for error messages
- **Common Causes**:
  - Firebase configuration issues
  - Missing environment variables
  - Network connectivity problems

#### 3. **Development Server Issues**
- **Restart**: Stop the server (Ctrl+C) and restart with `npm start`
- **Clear Cache**: Try `expo start -c` to clear cache
- **Check Port**: Make sure port 8081 (or 8082) is not blocked

#### 4. **Network Issues**
- **Firewall**: Check if your firewall is blocking the connection
- **Corporate Network**: Some corporate networks block Expo connections
- **Try Different Network**: Switch to mobile hotspot if on corporate WiFi

#### 5. **Expo Go App Issues**
- **Update**: Make sure you have the latest version of Expo Go
- **Reinstall**: Try uninstalling and reinstalling Expo Go
- **Clear Cache**: Clear Expo Go app cache in your phone settings

### Debugging Steps:

1. **Check Terminal Logs**
   - Look for error messages in the terminal
   - Check if the server started successfully

2. **Check Device Logs**
   - Open Expo Go app
   - Shake your device to open developer menu
   - Check for error messages

3. **Test Basic Connection**
   - Try opening the web version: `http://localhost:8081`
   - If web works, the issue is with mobile connection

4. **Environment Variables**
   - Make sure `.env` file exists and has correct values
   - Check that all required API keys are set

### Quick Fixes:

```bash
# Restart development server
pkill -f "expo start"
npm start

# Clear cache and restart
expo start -c

# Check if all dependencies are installed
npm install

# Reset Expo cache
expo r -c
```

### If Still Not Working:

1. **Check your phone's Expo Go app version**
2. **Try a different device**
3. **Check if your computer's firewall is blocking the connection**
4. **Try using a mobile hotspot instead of WiFi**

### Contact Support:
If none of these solutions work, please share:
- Terminal error messages
- Device type and OS version
- Expo Go app version
- Network setup details
