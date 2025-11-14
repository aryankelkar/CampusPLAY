# 🚀 CampusPlay Deployment Guide

## Overview
CampusPlay is a full-stack sports ground booking system for college students with real-time admin management.

## Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS, Socket.io-client
- **Backend**: Node.js, Express, MongoDB, Socket.io, JWT Authentication
- **Deployment**: Render/Railway (Backend), Vercel/Netlify (Frontend)

---

## 📋 Pre-Deployment Checklist

### Backend Requirements
- [ ] MongoDB Atlas cluster created
- [ ] Environment variables configured
- [ ] Socket.io integrated for real-time updates
- [ ] All routes tested and working
- [ ] CORS configured for production domain

### Frontend Requirements
- [ ] API URL configured for production
- [ ] Build process tested locally
- [ ] All pages responsive and tested
- [ ] Socket.io client configured

---

## 🔧 Environment Variables

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/campusplay?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Admin
ADMIN_EMAIL=admin@vit.edu.in
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

---

## 🌐 Deployment Steps

### Option 1: Deploy to Render

#### Backend Deployment (Render)

1. **Create New Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   ```
   Name: campusplay-backend
   Region: Choose closest to your users
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

3. **Add Environment Variables**
   - Add all variables from `.env.example`
   - Set `NODE_ENV=production`
   - Set `CORS_ORIGIN` to your frontend URL

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://campusplay-backend.onrender.com`)

#### Frontend Deployment (Vercel)

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Configure:
     ```
     Framework Preset: Next.js
     Root Directory: frontend
     Build Command: npm run build
     Output Directory: .next
     Install Command: npm install
     ```

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://campusplay-backend.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Your app will be live at `https://your-project.vercel.app`

5. **Update Backend CORS**
   - Go back to Render
   - Update `CORS_ORIGIN` environment variable with your Vercel URL
   - Redeploy backend

---

### Option 2: Deploy to Railway

#### Backend Deployment (Railway)

1. **Create New Project**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure Service**
   - Railway auto-detects Node.js
   - Set root directory: `backend`
   - Add environment variables from `.env.example`

3. **Generate Domain**
   - Go to Settings → Generate Domain
   - Note your backend URL

4. **Deploy**
   - Railway automatically deploys on push
   - Monitor logs for any issues

#### Frontend Deployment (Netlify)

1. **Create New Site**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub repository

2. **Configure Build**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/.next
   ```

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app
   ```

4. **Deploy**
   - Click "Deploy site"
   - Update backend CORS with Netlify URL

---

## 🔍 Health Check

After deployment, verify:

1. **Backend Health**
   ```bash
   curl https://your-backend-url.com/api/health
   # Should return: {"status":"ok"}
   ```

2. **Frontend Access**
   - Visit your frontend URL
   - Check browser console for errors
   - Test login/register flow

3. **Socket.io Connection**
   - Open browser DevTools → Network → WS
   - Should see WebSocket connection established
   - Check console for "✅ Socket connected" message

---

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Failed**
```
Error: MongooseServerSelectionError
```
- Verify MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for cloud deployments)
- Check connection string format
- Ensure database user has correct permissions

**CORS Errors**
```
Access to XMLHttpRequest blocked by CORS policy
```
- Update `CORS_ORIGIN` in backend env variables
- Ensure frontend URL matches exactly (no trailing slash)
- Redeploy backend after changing CORS settings

**Socket.io Not Connecting**
```
WebSocket connection failed
```
- Check if hosting platform supports WebSockets
- Verify `NEXT_PUBLIC_API_URL` is correct
- Enable polling fallback in Socket.io config

### Frontend Issues

**API Requests Failing**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check if backend is running and accessible
- Inspect Network tab for actual error responses

**Build Errors**
```
Type error: Cannot find module
```
- Run `npm install` in frontend directory
- Check for missing dependencies
- Verify TypeScript types are correct

---

## 📊 Monitoring

### Render
- View logs: Dashboard → Service → Logs
- Monitor metrics: CPU, Memory usage
- Set up health check alerts

### Railway
- View logs: Project → Deployments → Logs
- Monitor usage: Project → Usage
- Set up webhooks for deployment notifications

### Vercel/Netlify
- View function logs in dashboard
- Monitor bandwidth and build minutes
- Set up deployment notifications

---

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong JWT secrets (32+ characters)
   - Rotate secrets periodically

2. **Database**
   - Enable MongoDB Atlas IP whitelist
   - Use strong database passwords
   - Enable audit logs

3. **API**
   - Rate limiting (consider adding express-rate-limit)
   - Input validation on all routes
   - Helmet.js for security headers (already included)

4. **Frontend**
   - Never expose API keys in client code
   - Use HTTPS only
   - Implement CSP headers

---

## 📝 Post-Deployment Tasks

- [ ] Test all user flows (register, login, booking)
- [ ] Test admin dashboard (approve, reject, revoke)
- [ ] Verify real-time updates work
- [ ] Test on mobile devices
- [ ] Set up monitoring/alerts
- [ ] Document any custom configurations
- [ ] Create admin user account
- [ ] Test email domain validation (@vit.edu.in)

---

## 🆘 Support

For issues or questions:
1. Check logs in your deployment platform
2. Review error messages in browser console
3. Verify all environment variables are set
4. Test API endpoints directly using Postman/curl

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Last Updated**: November 2024
**Version**: 1.0.0
