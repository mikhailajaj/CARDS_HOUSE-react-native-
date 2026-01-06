# GitHub Actions Workflows

This directory contains automated workflows for the Tarneeb Card Game project.

## 📋 Workflow Overview

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| **Test Suite** | `test.yml` | Push/PR to main/develop | Run unit tests with coverage |
| **Expo Preview** | `expo-preview.yml` | PR, Manual | Create preview for Expo Go |
| **Build Android** | `build-android.yml` | Push to main, Tags, Manual | Build Android APK |
| **Build iOS** | `build-ios.yml` | Push to main, Tags, Manual | Build iOS IPA |
| **OTA Update** | `expo-update.yml` | Push to main, Manual | Deploy over-the-air update |

## 🎯 Quick Reference

### Test on Every Change
```yaml
# test.yml - Automatic
✅ Runs on: Push/PR to main or develop
✅ No setup required
```

### Preview in Expo Go
```yaml
# expo-preview.yml
Trigger: Create a PR or run manually
Requirements: EXPO_TOKEN secret
Output: QR code to scan with Expo Go app
```

### Build Standalone Apps
```yaml
# build-android.yml & build-ios.yml
Trigger: Push to main, create version tag, or manual
Requirements: EXPO_TOKEN, EAS account
Output: APK/IPA files in workflow artifacts
```

### Push Quick Updates
```yaml
# expo-update.yml
Trigger: Push to main or manual
Requirements: EXPO_TOKEN
Output: OTA update to all installed apps
```

## 🔧 Setup Requirements

### 1. Expo Token (Required for all Expo workflows)
```bash
# Generate at: https://expo.dev/accounts/[username]/settings/access-tokens
# Add to: GitHub Repo → Settings → Secrets → Actions
Name: EXPO_TOKEN
Value: [your-token]
```

### 2. Update app.json
```json
{
  "expo": {
    "owner": "your-expo-username",
    "slug": "tarneeb-card-game"
  }
}
```

### 3. Initialize EAS (one-time)
```bash
npm install -g eas-cli
eas login
eas build:configure
```

## 📱 How to Use

### For Developers
1. **Make changes** → Create PR
2. **Tests run automatically** → Check results
3. **Preview available** → Test with Expo Go
4. **Merge when ready** → Auto-deploy updates

### For Releases
1. **Tag version**: `git tag v1.0.0 && git push origin v1.0.0`
2. **Builds trigger** automatically
3. **Download** from Actions → Artifacts
4. **Submit** to stores

### Manual Trigger
1. Go to **Actions** tab
2. Select workflow
3. Click **"Run workflow"**
4. Choose branch
5. Click **"Run workflow"** button

## 🎨 Status Badges

Add to your README.md:

```markdown
![Tests](https://github.com/USERNAME/REPO/workflows/Test%20Suite/badge.svg)
![Android](https://github.com/USERNAME/REPO/workflows/Build%20Android%20APK/badge.svg)
![iOS](https://github.com/USERNAME/REPO/workflows/Build%20iOS%20App/badge.svg)
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "EXPO_TOKEN not found" | Add token to GitHub Secrets |
| Android build fails | Check package name in app.json |
| iOS build fails | Configure Apple credentials with `eas credentials` |
| Workflow doesn't trigger | Check branch names in workflow file |

## 📚 Resources

- [Complete Setup Guide](../../DEPLOYMENT.md)
- [Expo CI/CD Docs](https://docs.expo.dev/build/building-on-ci/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

For detailed instructions, see [DEPLOYMENT.md](../../DEPLOYMENT.md)
