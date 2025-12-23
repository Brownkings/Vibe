# Netlify Deployment Guide for Vibe Website

This guide walks you through deploying your Vibe website to Netlify with two methods: **Manual Deployment** (quick start) and **Git Deployment** (recommended for ongoing development).

---

## Important Notes

> [!WARNING]
> **Backend Server Consideration**  
> Your project includes a Node.js/Express backend server (`server/` directory). Netlify is a **static site hosting platform** and doesn't support traditional Node.js servers.
> 
> You have two options:
> 1. **Deploy only the frontend** (static Vite build) - Articles/videos would need to be managed differently
> 2. **Deploy backend separately** to a platform like:
>    - **[Render](https://render.com)** - 750 hours/month FREE (Recommended ⭐)
>    - [Railway](https://railway.app) - $5/month minimum (no longer has free tier)
>    - [Heroku](https://heroku.com) - Paid plans only
>    - [Vercel](https://vercel.com) - Supports serverless functions

**Backend Hosting Comparison:**

| Platform | Free Tier | Monthly Cost | Best For |
|----------|-----------|--------------|----------|
| **Render** ⭐ | ✅ 750 hrs/month | **$0** | Full Node.js apps (recommended) |
| Railway | ❌ (trial only) | $5 minimum | Paid projects |
| Heroku | ❌ | $7+ | Enterprise |
| Vercel | Serverless only | $0 (limited) | Serverless functions |

This guide focuses on **deploying the frontend to Netlify** and **backend to Render** (both free tier).

---

## Prerequisites

- [ ] A [Netlify account](https://app.netlify.com/signup) (free)
- [ ] Your project built and tested locally
- [ ] Node.js installed on your computer

---

## Method 1: Manual Deployment (Drag & Drop)

This is the fastest way to get your site online but requires manual updates for each change.

### Step 1: Build Your Project

Open your terminal/PowerShell in the project directory and run:

```bash
npm run build
```

This creates a `dist` folder containing your production-ready static files.

### Step 2: Deploy to Netlify

1. Go to [Netlify](https://app.netlify.com)
2. Log in or create a free account
3. Click **"Add new site"** → **"Deploy manually"**
4. Drag and drop your entire `dist` folder onto the upload area
5. Wait for the deployment to complete (usually 30-60 seconds)

### Step 3: Your Site is Live! 🎉

Netlify will provide you with a random URL like `https://random-name-123456.netlify.app`

You can customize this:
- Go to **Site settings** → **Domain management** → **Options** → **Edit site name**
- Change to something like `vibe-multimedia.netlify.app`

---

## Method 2: Git Deployment (Recommended)

This method automatically redeploys your site whenever you push changes to GitHub/GitLab/Bitbucket.

### Step 1: Push Your Code to GitHub

If you haven't already:

```bash
# Initialize git (if not already done)
git init

# Create .gitignore file to exclude sensitive files
echo "node_modules
dist
.env
serviceAccountKey.json" > .gitignore

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

> [!CAUTION]
> **Never commit sensitive files!**  
> Ensure `.env` and `serviceAccountKey.json` are in your `.gitignore` before pushing to GitHub.

### Step 2: Connect Netlify to Your Repository

1. Go to [Netlify](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Netlify to access your repositories
5. Select your repository from the list

### Step 3: Configure Build Settings

Netlify should auto-detect your Vite project, but verify these settings:

| Setting | Value |
|---------|-------|
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |
| **Base directory** | (leave blank) |

### Step 4: Add Environment Variables

If your frontend uses environment variables (from `.env`):

1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add each variable from your `.env` file (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

> [!IMPORTANT]
> Only add **frontend** environment variables (those prefixed with `VITE_`). Backend variables should be configured on your backend hosting platform.

### Step 5: Deploy

Click **"Deploy site"** and Netlify will:
1. Clone your repository
2. Install dependencies (`npm install`)
3. Build your project (`npm run build`)
4. Deploy the `dist` folder

---

## Setting Up a Custom Domain (Optional)

### Using a Custom Domain You Own

1. Go to **Domain settings** → **Add custom domain**
2. Enter your domain (e.g., `www.vibemultimedia.com`)
3. Follow Netlify's instructions to update your DNS settings
4. Netlify automatically provides free HTTPS/SSL certificates

### Using Netlify Subdomain

1. Go to **Domain settings** → **Options** → **Edit site name**
2. Choose a name like `vibe-multimedia`
3. Your site will be at `https://vibe-multimedia.netlify.app`

---

## Deploying Your Backend Server to Render (FREE)

Since Netlify doesn't support Node.js servers, we'll deploy your backend to Render's free tier.

### Why Render?

✅ **750 hours/month FREE** (enough to run 24/7)  
✅ **100 GB bandwidth/month FREE**  
✅ **No credit card required**  
✅ **Automatic HTTPS**  
⚠️ Free tier services spin down after 15 minutes of inactivity (30-60 second cold start on next request)

---

### Step-by-Step: Deploy Backend to Render

#### 1. Create a Render Account

1. Go to [render.com](https://render.com)
2. Click **"Get Started"** or **"Sign Up"**
3. Sign up using GitHub (recommended for easier deployment) or email
4. No credit card required!

#### 2. Connect Your GitHub Repository

If you haven't pushed your code to GitHub yet, do that first:

```bash
# In your project directory
git add .
git commit -m "Prepare for deployment"
git push
```

#### 3. Create a New Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Click **"Connect Account"** to link your GitHub account (if not already connected)
3. Find and select your repository from the list
4. Click **"Connect"**

#### 4. Configure Your Web Service

Fill in the following settings:

| Setting | Value | Notes |
|---------|-------|-------|
| **Name** | `vibe-backend` | This becomes part of your URL |
| **Region** | Choose closest to you | e.g., Frankfurt, Oregon, Singapore |
| **Branch** | `main` | Or your default branch |
| **Root Directory** | `server` | Where your server code lives |
| **Runtime** | `Node` | Auto-detected |
| **Build Command** | `npm install` | Installs dependencies |
| **Start Command** | `node index.js` | Runs your server |
| **Instance Type** | **Free** | ⭐ Select this! |

> [!TIP]
> **Start Command**: If your server entry point is different, adjust accordingly. Based on your `package.json`, it should be `node index.js` or `node server/index.js` depending on your root directory setting.

#### 5. Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add each variable from your `.env` file:

**Required Environment Variables:**

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Server Configuration
PORT=10000
NODE_ENV=production

# Add any other variables from your .env file
```

> [!IMPORTANT]
> - **PORT**: Render provides port `10000` by default - your server should use `process.env.PORT`
> - **Do NOT include** frontend-only variables (those prefixed with `VITE_`)
> - **Do NOT include** `serviceAccountKey.json` contents here - use Supabase instead

#### 6. Deploy!

1. Click **"Create Web Service"** at the bottom
2. Render will:
   - Clone your repository
   - Run `npm install`
   - Start your server with `node index.js`
   - Assign you a URL like `https://vibe-backend.onrender.com`

This takes about 2-5 minutes for the first deployment.

#### 7. Verify Your Backend is Running

Once deployment completes:

1. Look for **"Your service is live 🎉"** message
2. Copy your service URL (e.g., `https://vibe-backend.onrender.com`)
3. Test it by visiting:
   ```
   https://vibe-backend.onrender.com/
   ```
4. You should see your API response (or test endpoint)

---

### Important: Update Your Server Code for Render

Make sure your `server/index.js` uses the `PORT` environment variable:

```javascript
// In server/index.js
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

If your code doesn't already do this, update it, commit, and push:

```bash
# Update server/index.js
git add server/index.js
git commit -m "Use PORT environment variable for Render"
git push
```

Render will automatically redeploy when it detects the push!

---

### Understanding Free Tier Limitations

> [!NOTE]
> **Cold Starts**: Your free tier backend will "sleep" after 15 minutes of inactivity. When someone visits your site after it's been asleep, the first request will take 30-60 seconds as Render "wakes up" the service. Subsequent requests will be fast.
> 
> **Solution**: For important demos, visit your backend URL a minute before to "warm it up".

### Update Frontend to Use Deployed Backend

After deploying your backend, update your frontend's API URLs:

In your frontend code, replace `localhost:3000` or wherever you're calling the backend with your new backend URL:

```javascript
// Example - Update this in your frontend code
const API_URL = 'https://vibe-backend.onrender.com';
```

Or use environment variables:

```javascript
// In your .env file
VITE_API_URL=https://vibe-backend.onrender.com

// In your code
const API_URL = import.meta.env.VITE_API_URL;
```

Then redeploy your frontend to Netlify.

---

## Troubleshooting

### Build Fails on Netlify

**Error**: `Module not found` or dependency errors
- **Solution**: Ensure all dependencies are in `dependencies`, not `devDependencies` (except Vite)
- Check the build logs in Netlify's dashboard

### 404 Errors on Page Refresh

If you're using client-side routing and get 404s when refreshing pages:

1. Create a file named `netlify.toml` in your project root:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. Commit and push this file

### Environment Variables Not Working

- Ensure they're prefixed with `VITE_` for Vite projects
- Added in Netlify dashboard under **Site settings** → **Environment variables**
- Rebuild the site after adding variables

### API Calls Failing

- Check that your backend is deployed and running
- Update API URLs in your frontend to point to deployed backend
- Check CORS settings on your backend to allow requests from Netlify domain

---

## Continuous Deployment

Once set up with Git deployment:

1. Make changes to your code locally
2. Commit: `git commit -am "Update feature"`
3. Push: `git push`
4. Netlify automatically detects the push and redeploys! ✨

Monitor deployments in the Netlify dashboard under **Deploys**.

---

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Netlify Forms](https://docs.netlify.com/forms/setup/) - If you need form handling
- [Netlify Functions](https://docs.netlify.com/functions/overview/) - Serverless functions alternative

---

## Summary Checklist

### Frontend Deployment (Netlify)
- [ ] Build project locally (`npm run build`)
- [ ] Deploy frontend to Netlify (manual or Git method)
- [ ] Add frontend environment variables (`VITE_*`) to Netlify
- [ ] Set up custom domain (optional)
- [ ] Configure continuous deployment (if using Git method)

### Backend Deployment (Render - FREE)
- [ ] Push code to GitHub
- [ ] Create Render account (no credit card needed)
- [ ] Deploy backend to Render as Web Service
- [ ] Add backend environment variables to Render
- [ ] Verify backend is running at `https://your-app.onrender.com`
- [ ] Update server code to use `process.env.PORT`

### Integration
- [ ] Update frontend API URLs to point to Render backend URL
- [ ] Redeploy frontend to Netlify with updated API URLs
- [ ] Test the live site end-to-end
- [ ] Check that articles/videos load correctly

**Your deployment architecture:**
```
Users → Netlify (Frontend) → Render (Backend) → Supabase (Database)
```

**Estimated Cost:** $0/month (completely free!) 🎉

**Need Help?** Feel free to ask for clarification on any step!
