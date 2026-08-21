# CampusPlay Deployment Guide
## Vercel (Frontend) + Render (Backend)

This guide will help you deploy CampusPlay to production using **Vercel** for the frontend and **Render** for the backend.

---

## 📋 Prerequisites

- GitHub account with project pushed to repository
- MongoDB Atlas account (free tier available)
- Vercel account (free tier available)
- Render account (free tier available)
- Domain name (optional, for custom URLs)

---

## 🔐 Security Setup

### 1. Generate Secure JWT Secret
```bash
# Generate a secure 32-character secret
openssl rand -base64 32
```
Save this for your Render environment variables.

### 2. MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create database user with strong password
4. Whitelist IP addresses (use `0.0.0.0/0` for cloud deployment)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/campusplay`

---

## 🚀 Backend Deployment (Render)

### Step 1: Prepare Backend Code
Your backend is already configured with:
- ✅ `Procfile` created
- ✅ Environment validation
- ✅ Health check endpoint

### Step 2: Deploy to Render
1. Go to [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure deployment settings:

**Build & Deploy Settings:**
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

**Environment Variables:**
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/campusplay?retryWrites=true&w=majority
JWT_SECRET=your_generated_32_char_secret
CORS_ORIGIN=https://your-vercel-app.vercel.app
ADMIN_EMAIL=admin@vit.edu.in
ADMIN_PASSWORD=admin123
```

5. Click "Deploy Web Service"
6. Wait for deployment (2-3 minutes)
7. Copy your Render URL: `https://your-app.onrender.com`

### Step 3: Test Backend
```bash
curl https://your-app.onrender.com/api/health
# Should return: {"status":"ok"}
```

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend Code
Your frontend is already configured with:
- ✅ `next.config.js` created
- ✅ `.npmrc` cleaned up
- ✅ Environment variables documented

### Step 2: Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project settings:

**Framework Preset:** Next.js

**Build & Output Settings:**
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://your-app.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://your-app.onrender.com
```

5. Click "Deploy"
6. Wait for deployment (1-2 minutes)
7. Copy your Vercel URL: `https://your-app.vercel.app`

### Step 3: Update CORS on Render
1. Go back to your Render dashboard
2. Edit your web service
3. Update `CORS_ORIGIN` to your Vercel URL
4. Save and redeploy

---

## 🔄 Complete Deployment Flow

### Deployment Order:
1. **Deploy Backend First** (Render) → Get URL
2. **Deploy Frontend Second** (Vercel) → Use Backend URL
3. **Update CORS** on Render with Frontend URL

### Post-Deployment Checklist:
- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] User registration works (@vit.edu.in email)
- [ ] Admin login works
- [ ] Booking creation works
- [ ] Real-time updates work (Socket.io)
- [ ] MongoDB data persists

---

## 🧪 Testing Production Deployment

### 1. Test Backend
```bash
# Health check
curl https://your-app.onrender.com/api/health

# Test registration endpoint
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@vit.edu.in","password":"test123","roll":"24CS1C0001","name":"Test User"}'
```

### 2. Test Frontend
1. Open your Vercel URL
2. Try registering a new account
3. Login with admin credentials
4. Create a booking request
5. Check real-time updates

---

## 📝 Environment Variables Reference

### Backend (Render):
| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (Render provides automatically) |
| `NODE_ENV` | Yes | Set to `production` |
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | 32+ character secret key |
| `CORS_ORIGIN` | Yes | Your Vercel frontend URL |
| `ADMIN_EMAIL` | Yes | Admin email for seeding |
| `ADMIN_PASSWORD` | Yes | Admin password for seeding |

### Frontend (Vercel):
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (Render) |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | Socket.io server URL (Render) |

---

## 🛠️ Troubleshooting

### Common Issues:

**1. CORS Errors**
- Ensure `CORS_ORIGIN` on Render matches your Vercel URL exactly
- Check for trailing slashes in URLs

**2. MongoDB Connection Failed**
- Verify IP whitelist in MongoDB Atlas (0.0.0.0/0)
- Check connection string format
- Ensure database user has correct permissions

**3. Socket.io Connection Issues**
- Verify `NEXT_PUBLIC_SOCKET_URL` matches backend URL
- Check that backend Socket.io is running
- Ensure no firewall blocks WebSocket connections

**4. Build Failures**
- Check Node.js version (requires 18+)
- Verify all dependencies are installed
- Check build logs for specific errors

---

## 🔄 CI/CD Setup

Both Vercel and Render automatically deploy when you push to GitHub:

### Automatic Deployments:
- **Vercel**: Deploys on push to main branch
- **Render**: Deploys on push to main branch

### To Deploy Changes:
1. Make changes locally
2. Commit and push to GitHub
3. Both platforms auto-deploy
4. Monitor deployment logs

---

## 📊 Monitoring

### Vercel:
- Dashboard shows build logs
- Analytics for performance
- Domain management

### Render:
- Dashboard shows deployment logs
- Metrics for CPU, memory, response time
- Database connection status

---

## 💰 Cost Estimation

### Free Tier Limits:
- **Vercel**: Free tier sufficient for most projects
- **Render**: Free tier (512MB RAM, 0.1 CPU)
- **MongoDB Atlas**: Free tier (512MB storage)

### When to Upgrade:
- High traffic (1000+ daily users)
- Complex database queries
- Need custom domain
- Require faster build times

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Already handled by `.gitignore`
2. **Use strong secrets** - Generate random JWT secrets
3. **Enable HTTPS** - Both platforms provide SSL certificates
4. **Regular updates** - Keep dependencies updated
5. **Monitor logs** - Check for suspicious activity

---

## 📞 Support

If you encounter issues:
1. Check deployment logs on Vercel/Render
2. Verify environment variables are set correctly
3. Test endpoints individually
4. Check MongoDB Atlas status
5. Review this guide's troubleshooting section

---

## ✅ Deployment Complete!

Your CampusPlay application is now live:
- **Frontend**: Your Vercel URL
- **Backend**: Your Render URL
- **Database**: MongoDB Atlas cluster

Users can now book sports grounds in real-time! 🎾
