# GitHub Actions Workflows

This directory contains automated workflows for the Tarneeb Card Game project.

## 📋 Workflow Overview

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| **Deploy to GitHub Pages** | `deploy-web.yml` | Push to main, Manual | Deploy web build to GitHub Pages |

## 🎯 Quick Reference

### Deploy Web Build
```yaml
# deploy-web.yml
Trigger: Push to main or run manually
Requirements: GitHub Pages enabled in repository settings
Output: Web app accessible at your GitHub Pages URL
```

## 🔧 Setup Requirements

### 1. Enable GitHub Pages
1. Go to **Settings** → **Pages**
2. Set **Source** to "GitHub Actions"
3. Save settings

### 2. Push to Main Branch
The workflow automatically triggers when you push to the `main` branch, building and deploying your Expo web app to GitHub Pages.

## 📱 How to Use

### For Developers
1. **Make changes** → Push to main branch
2. **Workflow runs automatically** → Check Actions tab
3. **Web app deployed** → Visit GitHub Pages URL

### Manual Trigger
1. Go to **Actions** tab
2. Select "Deploy to GitHub Pages" workflow
3. Click **"Run workflow"**
4. Choose branch (main)
5. Click **"Run workflow"** button

## 🎨 Status Badge

Add to your README.md:

```markdown
![Deploy](https://github.com/USERNAME/REPO/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Workflow doesn't trigger | Check branch name is `main` |
| Pages not updating | Verify GitHub Pages is enabled in Settings |
| Build fails | Check `npm ci` runs successfully locally |
| 404 on deployed site | Ensure Pages source is set to "GitHub Actions" |

## 📚 Resources

- [Complete Setup Guide](../../DEPLOYMENT.md)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

For detailed instructions, see [DEPLOYMENT.md](../../DEPLOYMENT.md)
