# CampusPlay Deployment Information

## 🚀 Live Deployment URLs

### Backend (Render)
- **URL**: https://campusplay-4g0z.onrender.com
- **Health Check**: https://campusplay-4g0z.onrender.com/api/health
- **Status**: ✅ Live

### Frontend (Vercel)
- **URL**: [To be deployed]
- **Status**: ⏳ Pending deployment

## 🔐 Environment Variables

### Backend (Render)
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://admin:aryan1847@campusplay-cluster.ukkoffp.mongodb.net/?appName=campusplay-cluster
JWT_SECRET=dMD72NfVdPV1TSYSbCo2IfOvq452JaFQbyqW0fHtHpU=
CORS_ORIGIN=https://your-vercel-app.vercel.app
ADMIN_EMAIL=admin@vit.edu.in
ADMIN_PASSWORD=admin123
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://campusplay-4g0z.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://campusplay-4g0z.onrender.com
```

## 👤 Default Credentials

### Admin Account
- **Email**: admin@vit.edu.in
- **Password**: admin123

### Student Registration
- **Email Domain**: @vit.edu.in
- **Roll Format**: 24XX1C00XX (e.g., 24CS1C0001)

## 🧪 Testing Commands

### Backend Health Check
```bash
curl https://campusplay-4g0z.onrender.com/api/health
```

### Test Registration
```bash
curl -X POST https://campusplay-4g0z.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@vit.edu.in","password":"test123","roll":"24CS1C0001","name":"Test User"}'
```

## 📋 Deployment Checklist

- [x] Backend deployed to Render
- [x] Backend health check working
- [x] MongoDB connection configured
- [x] Environment variables set on Render
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables configured
- [ ] CORS updated on Render with Vercel URL
- [ ] User registration tested
- [ ] Admin login tested
- [ ] Booking creation tested
- [ ] Real-time updates tested

## � Local Development Setup

### Running Locally with Local Backend
**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

**Backend (.env):**
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Running Locally with Production Backend
**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://campusplay-4g0z.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://campusplay-4g0z.onrender.com
```

**Note:** This configuration allows local frontend to use the live backend.

## �🔧 Troubleshooting

### Authentication Issues
If login/register fails:
1. Check Vercel environment variables are set
2. Verify `NEXT_PUBLIC_API_URL` points to Render backend
3. Redeploy Vercel after setting environment variables
4. Check browser console for API call destinations

### CORS Issues
If CORS errors occur:
1. Update `CORS_ORIGIN` on Render to match Vercel URL
2. Redeploy Render backend
3. Clear browser cache

### Database Issues
If MongoDB connection fails:
1. Verify IP whitelist in MongoDB Atlas (0.0.0.0/0)
2. Check connection string format
3. Ensure database user has correct permissions

---

**Last Updated**: 2026-08-21
**Backend Status**: Live at https://campusplay-4g0z.onrender.com
