# 🚀 Quick Deploy Guide - CampusPlay

## ⚡ 5-Minute Deployment

### Step 1: MongoDB Atlas (2 min)
```
1. Go to mongodb.com/cloud/atlas
2. Create free cluster
3. Database Access → Add User (username/password)
4. Network Access → Add IP: 0.0.0.0/0
5. Copy connection string
```

### Step 2: Backend - Render (2 min)
```
1. dashboard.render.com → New Web Service
2. Connect GitHub: CampusPLAY/backend
3. Settings:
   - Build: npm install
   - Start: npm start
   - Health: /api/health
4. Environment:
   NODE_ENV=production
   PORT=5000
   MONGO_URI=<your-atlas-string>
   JWT_SECRET=<generate-32-char-random>
   CORS_ORIGIN=http://localhost:3000 (temp)
   ADMIN_EMAIL=admin@vit.edu.in
5. Deploy → Copy URL
```

### Step 3: Frontend - Vercel (1 min)
```
1. vercel.com → New Project
2. Import: CampusPLAY/frontend
3. Environment:
   NEXT_PUBLIC_API_URL=<backend-url-from-step2>
4. Deploy → Copy URL
```

### Step 4: Update CORS (30 sec)
```
1. Render → Backend → Environment
2. CORS_ORIGIN=<frontend-url-from-step3>
3. Redeploy
```

### Step 5: Test (30 sec)
```
Visit: <frontend-url>
Register: test@vit.edu.in
Create booking
Login as admin: admin@campusplay.com / admin123
```

---

## 🔧 Environment Variables

### Backend (Render)
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/campusplay
JWT_SECRET=your_32_character_secret_key_here
CORS_ORIGIN=https://campusplay.vercel.app
ADMIN_EMAIL=admin@vit.edu.in
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://campusplay-backend.onrender.com
```

---

## ✅ Validation

```bash
# Backend health
curl https://your-backend.onrender.com/api/health
# Should return: {"status":"ok"}

# Frontend
Visit: https://your-frontend.vercel.app
# Should load homepage
```

---

## 🆘 Troubleshooting

**MongoDB Connection Failed**
- Check IP whitelist: 0.0.0.0/0
- Verify username/password
- Check connection string format

**CORS Errors**
- Update CORS_ORIGIN with exact frontend URL
- No trailing slash
- Redeploy backend

**Socket.io Not Connecting**
- Check NEXT_PUBLIC_API_URL
- Verify backend is running
- Check browser console

---

## 📚 Full Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete guide
- [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) - Validation
- [FINAL_DELIVERY_SUMMARY.md](./FINAL_DELIVERY_SUMMARY.md) - Overview

---

**Total Time**: ~5 minutes  
**Difficulty**: Easy  
**Status**: ✅ Ready
