# Render.com Deployment Guide

## 📋 Prerequisites

1. GitHub repository: https://github.com/sevilsfrova213-netizen/bdu
2. Render.com account
3. PostgreSQL database credentials

## 🚀 Step-by-Step Deployment

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure database:
   - **Name**: `bsu-database` (or any name)
   - **Database**: `bdsu`
   - **User**: `bdsu_user`
   - **Region**: Oregon (or closest to you)
   - **Plan**: Free
4. Click **"Create Database"**
5. Wait for database to be ready (2-3 minutes)
6. **Save credentials**:
   - Internal Database URL
   - External Database URL
   - Host, Port, Database name, Username, Password

### Step 2: Initialize Database Schema

1. Go to your database in Render Dashboard
2. Click **"Connect"** → **"External Connection"**
3. Use any PostgreSQL client (psql, DBeaver, pgAdmin) or use Render's Web Shell
4. Execute `database.sql`:
   ```bash
   # From local machine
   psql -h <hostname> -U bdsu_user -d bdsu -f database.sql
   
   # Or copy-paste SQL content in Render Web Shell
   ```
5. Verify tables created:
   ```sql
   \dt
   ```

### Step 3: Deploy Web Service

#### Option A: Using render.yaml (Automatic)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository: `sevilsfrova213-netizen/bdu`
4. Render will detect `render.yaml` and configure automatically
5. Click **"Apply"**
6. Wait for deployment (3-5 minutes)

#### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository: `sevilsfrova213-netizen/bdu`
4. Configure:
   - **Name**: `bsu-chat`
   - **Region**: Oregon (same as database)
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

### Step 4: Configure Environment Variables

In your Web Service settings, add these environment variables:

```bash
NODE_ENV=production
SESSION_SECRET=<generate-random-secure-string>
DATABASE_URL=<your-postgres-internal-url>
```

**Important**: Use **Internal Database URL** from Step 1 for `DATABASE_URL`

Example:
```
DATABASE_URL=postgresql://bdsu_user:YOUR_PASSWORD@dpg-xxxxx-a/bdsu
```

### Step 5: Deploy and Test

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Wait for build and deployment (3-5 minutes)
3. Check logs for any errors
4. Your app will be available at: `https://bsu-chat.onrender.com` (or your custom URL)

### Step 6: Verify Deployment

Test these URLs:
- **Home**: `https://your-app.onrender.com/`
- **Register**: `https://your-app.onrender.com/register.html`
- **Login**: `https://your-app.onrender.com/login.html`
- **Admin**: `https://your-app.onrender.com/admin-login.html`

## ⚠️ Common Issues

### Issue 1: "Cannot find module '/opt/render/project/src/index.js'"

**Cause**: Wrong entry point
**Fix**: Already fixed in latest commit. Ensure `package.json` has:
```json
{
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  }
}
```

### Issue 2: Database connection error

**Cause**: Wrong credentials or URL
**Fix**: 
1. Use **Internal Database URL** (starts with `postgresql://`)
2. Ensure database is in same region as web service
3. Check credentials are correct

### Issue 3: Build fails

**Cause**: Missing dependencies or wrong Node version
**Fix**: 
1. Ensure `package.json` has `engines` field:
   ```json
   "engines": {
     "node": ">=18.0.0"
   }
   ```
2. Clear build cache in Render settings

### Issue 4: App crashes after deployment

**Check logs**:
1. Go to Render Dashboard → Your Service
2. Click **"Logs"**
3. Look for errors

**Common fixes**:
- Database not initialized (run `database.sql`)
- Wrong environment variables
- Port already in use (Render auto-assigns port)

## 🔐 Admin Credentials

After successful deployment:
- **Username**: `618ursamajor618`
- **Password**: `majorursa618`

## 📚 Post-Deployment

1. **Test registration**: Create a test user
2. **Configure admin panel**:
   - Set rules
   - Set about page
   - Configure daily topic
   - Set message auto-delete times
3. **Test chat**: Join faculty rooms and send messages
4. **Monitor logs**: Check for any issues

## 🌐 Custom Domain (Optional)

1. Go to your Web Service in Render
2. Click **"Settings"** → **"Custom Domain"**
3. Add your domain and configure DNS:
   ```
   CNAME record: www → your-app.onrender.com
   ```

## 🔄 Updates

To deploy updates:
1. Push changes to GitHub `main` branch
2. Render will auto-deploy (if enabled)
3. Or manually deploy in Render Dashboard

---

**Need help?** Check Render documentation: https://render.com/docs
