# GitHub Pages Deployment Fixes

## Files Included

1. **vite.config.ts** — Replace your existing file with this one
2. **.github/workflows/deploy.yml** — Add this folder/file to your project root

---

## Step-by-Step Instructions

### 1. Update vite.config.ts

Replace your existing `vite.config.ts` with the provided one.

**IMPORTANT:** Edit line 9 to match your GitHub repository name:
```typescript
base: process.env.NODE_ENV === 'production' ? '/YOUR-REPO-NAME/' : '/',
```

### 2. Create public folder and move data.xlsx

```
mkdir public
mv data.xlsx public/
```

Your structure should look like:
```
your-project/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── components/
│   ├── Filters.tsx
│   ├── LegislationList.tsx
│   ├── Sidebar.tsx
│   └── Visualizations.tsx
├── public/
│   └── data.xlsx        ← moved here
├── App.tsx
├── constants.tsx
├── index.html
├── index.tsx
├── types.ts
├── vite.config.ts       ← replaced
└── package.json
```

### 3. Push to GitHub

```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

### 4. Enable GitHub Pages

1. Go to your repository on GitHub.com
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Build and deployment** → **Source**: Select **GitHub Actions**
4. Wait 2-3 minutes for deployment

### 5. Access Your Site

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

---

## ⚠️ Note About AI Summary Feature

The Gemini API integration won't work on GitHub Pages because:
- API keys in frontend code are visible to anyone
- GitHub Pages is static-only (no server-side code)

Options:
1. Remove the AI summary feature for the static deployment
2. Create a separate backend API to handle Gemini calls
3. Use a serverless function (Vercel, Netlify, etc.) instead of GitHub Pages
