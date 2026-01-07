---
description: How to update the live website with recent changes
---

# Deploying Updates to Live Server

Since you have already deployed the website, you need to push your local changes to GitHub and then pull them on your server.

## Step 1: Push Changes (Local Machine)
First, save your changes to the cloud repository.

```powershell
# 1. Stage all changes
git add .

# 2. Commit changes
git commit -m "Update PROCustom theme colors and fix OBS link"

# 3. Push to GitHub
git push origin main
```

## Step 2: Update Server (Remote Machine)
Connect to your VPS (via SSH) and run the following commands inside your project folder:

```bash
# 1. Navigate to project directory (Adjust path as needed)
cd ~/streamtheme

# 2. Pull latest code
git pull origin main

# 3. Rebuild Client (Since we changed UI/Colors)
cd client
npm install
npm run build
cd ..

# 4. Restart Server (To apply backend fixes)
cd server
npm install
pm2 reload ecosystem.config.js 
# OR if just running directly: pm2 restart server
```

> [!TIP]
> If you are using a different folder name on your server, replace `~/streamtheme` with your actual path.
