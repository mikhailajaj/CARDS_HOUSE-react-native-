# Deployment Guide

This document explains how to deploy and run the Tarneeb app using GitHub Actions workflows.

## 📋 Available Workflows

### 1. **Test Suite** (`test.yml`)
- **Triggers**: Push/PR to `main` or `develop`
- **Purpose**: Runs automated tests with coverage
- **Requirements**: None (already configured)
- **Status**: ✅ Active

### 2. **Expo Preview** (`expo-preview.yml`)
- **Triggers**: Pull requests, manual dispatch
- **Purpose**: Creates a preview build that can be tested with Expo Go app
- **Requirements**: 
  - Expo account
  - `EXPO_TOKEN` secret
- **Use Case**: Quick testing on real devices without building native apps

### 3. **Build Android APK** (`build-android.yml`)
- **Triggers**: Push to `main`, version tags (`v*`), manual dispatch
- **Purpose**: Builds standalone Android APK
- **Requirements**:
  - Expo account with EAS
  - `EXPO_TOKEN` secret
  - EAS configured
- **Output**: Downloadable APK file

### 4. **Build iOS App** (`build-ios.yml`)
- **Triggers**: Push to `main`, version tags (`v*`), manual dispatch
- **Purpose**: Builds iOS app (IPA file)
- **Requirements**:
  - Expo account with EAS
  - `EXPO_TOKEN` secret
  - Apple Developer account
  - iOS certificates and provisioning profiles
- **Output**: IPA file for TestFlight/App Store

### 5. **Expo OTA Update** (`expo-update.yml`)
- **Triggers**: Push to `main`, manual dispatch
- **Purpose**: Push over-the-air updates to already installed apps
- **Requirements**:
  - Expo account
  - `EXPO_TOKEN` secret
- **Use Case**: Quick updates without rebuilding native apps

## 🚀 Setup Instructions

### Step 1: Create Expo Account
1. Go to [expo.dev](https://expo.dev)
2. Sign up or log in
3. Note your username/organization name

### Step 2: Install EAS CLI (Optional - for local testing)
```bash
npm install -g eas-cli
eas login
```

### Step 3: Configure Expo Token
1. Generate an Expo access token:
   ```bash
   eas login
   eas whoami  # Verify login
   # Generate token at: https://expo.dev/accounts/[your-username]/settings/access-tokens
   ```

2. Add to GitHub Secrets:
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `EXPO_TOKEN`
   - Value: Your Expo access token
   - Click "Add secret"

### Step 4: Update app.json
Update your `app.json` with your Expo account details:

```json
{
  "expo": {
    "owner": "your-expo-username",
    "slug": "tarneeb-card-game",
    ...
  }
}
```

### Step 5: Initialize EAS (First Time Only)
```bash
eas build:configure
```

This creates/updates the `eas.json` file.

## 📱 Usage

### Quick Preview (Expo Go)
1. Create a pull request or manually trigger the workflow
2. Go to Actions tab → "Expo Preview" → Run workflow
3. Once complete, install [Expo Go](https://expo.dev/client) on your device
4. Scan the QR code from Expo dashboard

### Build Android APK
1. **Automatic**: Push to `main` branch or create a version tag
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Manual**: 
   - Go to Actions → "Build Android APK" → "Run workflow"
   - Select branch → "Run workflow"

3. **Download**:
   - Check the workflow run
   - Download APK from "Artifacts" section
   - Or get link from EAS dashboard

### Build iOS App
1. **Prerequisites**:
   - Apple Developer account ($99/year)
   - Configure signing certificates in EAS:
     ```bash
     eas credentials
     ```

2. **Trigger Build**:
   - Push to `main` or create version tag
   - Or manually trigger from Actions tab

3. **Submit to TestFlight**:
   ```bash
   eas submit --platform ios
   ```

### OTA Update (Over-The-Air)
1. Make code changes
2. Push to `main` branch
3. Users with installed app will receive update automatically
4. No need to rebuild or redownload

## 🔧 Manual Workflow Triggers

All workflows (except test.yml) can be triggered manually:

1. Go to **Actions** tab in GitHub
2. Select the workflow from the left sidebar
3. Click **"Run workflow"** button
4. Select branch
5. Click **"Run workflow"** to confirm

## 📊 Workflow Status Badges

Add these to your README.md to show build status:

```markdown
![Tests](https://github.com/YOUR-USERNAME/YOUR-REPO/workflows/Test%20Suite/badge.svg)
![Android Build](https://github.com/YOUR-USERNAME/YOUR-REPO/workflows/Build%20Android%20APK/badge.svg)
![iOS Build](https://github.com/YOUR-USERNAME/YOUR-REPO/workflows/Build%20iOS%20App/badge.svg)
```

## 🎯 Recommended Workflow

### For Development
1. **Feature Branch** → Creates PR → Runs tests + Expo preview
2. Review and test with Expo Go
3. Merge to `develop` branch

### For Staging
1. **Develop** → Merge to `main`
2. Automatic OTA update deployed
3. Test on devices with existing app

### For Release
1. Create version tag: `git tag v1.0.0 && git push origin v1.0.0`
2. Automatic Android + iOS builds triggered
3. Download builds from Actions artifacts
4. Submit to Google Play / App Store

## 🛠️ Troubleshooting

### Workflow Fails: "EXPO_TOKEN not found"
- Ensure you've added `EXPO_TOKEN` to GitHub Secrets
- Token must have proper permissions

### Android Build Fails
- Check `app.json` has correct `package` name
- Ensure `eas.json` is configured
- Run `eas build --platform android` locally first

### iOS Build Fails
- Apple Developer account required
- Configure credentials: `eas credentials`
- Ensure bundle identifier is registered in Apple Developer portal

### OTA Update Not Received
- Check app was built with same release channel
- User needs to restart app to receive update
- Updates only work for JS/assets, not native code

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [GitHub Actions for Expo](https://docs.expo.dev/build/building-on-ci/)

## 🔐 Security Notes

- Never commit `EXPO_TOKEN` to repository
- Use GitHub Secrets for all sensitive tokens
- Rotate tokens periodically
- Use different tokens for different environments

## 💡 Cost Considerations

### Expo/EAS Pricing
- **Free tier**: Limited builds per month
- **Paid plans**: Unlimited builds, priority queue
- See [Expo Pricing](https://expo.dev/pricing)

### GitHub Actions
- **Public repos**: Unlimited minutes
- **Private repos**: 2,000 minutes/month (free tier)
- Builds can take 10-30 minutes each

---

**Need Help?** Open an issue or check [Expo Discord](https://chat.expo.dev/)
