# ✅ Pre-Deployment Checklist

## 🔍 Validation Steps

### 1️⃣ Environment Variables

#### Backend
```bash
cd backend
npm run test:deploy
```

**Expected Output:**
- ✅ All required environment variables set
- ✅ MongoDB connection successful
- ✅ CORS configuration valid

**Manual Check:**
- [ ] `MONGO_URI` - MongoDB Atlas connection string
- [ ] `JWT_SECRET` - At least 32 characters
- [ ] `PORT` - Set to 5000
- [ ] `NODE_ENV` - Set to production
- [ ] `CORS_ORIGIN` - Frontend URL (no trailing slash)
- [ ] `ADMIN_EMAIL` - Admin email address

#### Frontend
- [ ] `NEXT_PUBLIC_API_URL` - Backend URL (no trailing slash)

---

### 2️⃣ Health Endpoint Test

```bash
# Start backend locally
cd backend
npm start

# In another terminal, test health endpoint
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{"status":"ok"}
```

---

### 3️⃣ CORS Configuration

**Test CORS Headers:**
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:5000/api/auth/login -v
```

**Expected Headers:**
- `Access-Control-Allow-Origin: http://localhost:3000`
- `Access-Control-Allow-Credentials: true`

**Checklist:**
- [ ] CORS allows frontend domain
- [ ] CORS allows credentials
- [ ] CORS doesn't allow all origins in production

---

### 4️⃣ Socket.io Events Test

**Manual Test:**
1. Open two browser windows
2. Login as admin in window 1
3. Login as student in window 2
4. Create booking as student
5. Check admin window for real-time notification

**Events to Verify:**
- [ ] `booking:created` - Admin receives notification
- [ ] `booking:approved` - Student sees approval
- [ ] `booking:rejected` - Student sees rejection
- [ ] `booking:revoked` - Status updates in real-time

**Browser Console Check:**
- [ ] "✅ Socket connected" message appears
- [ ] WebSocket connection in Network tab
- [ ] No Socket.io errors

---

### 5️⃣ MongoDB Connection

**Test Connection:**
```bash
cd backend
npm run test:deploy
```

**Verify:**
- [ ] Connection successful
- [ ] Correct database name
- [ ] IP whitelist includes 0.0.0.0/0 (for cloud deployment)
- [ ] Database user has read/write permissions

**Error Handling:**
- [ ] Graceful error messages
- [ ] Reconnection on disconnect
- [ ] Connection pooling configured

---

### 6️⃣ Code Quality

#### Remove Unused Code
```bash
# Search for console.log (should be none in production)
grep -r "console.log" backend/controllers backend/routes
grep -r "console.log" frontend/components frontend/pages

# Search for TODO comments
grep -r "TODO" backend frontend
```

**Checklist:**
- [ ] No `console.log` in controllers/routes
- [ ] No `console.error` except in error handlers
- [ ] No commented-out code blocks
- [ ] No unused imports
- [ ] No dead CSS rules

#### Verify Imports
- [ ] All imports resolve correctly
- [ ] No circular dependencies
- [ ] No unused dependencies in package.json

---

### 7️⃣ Next.js Build

```bash
cd frontend
npm run build
```

**Expected Output:**
- ✅ Build completes without errors
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ Bundle size reasonable (<500KB first load JS)

**Check for:**
- [ ] No build warnings
- [ ] No font loading warnings
- [ ] No image optimization warnings
- [ ] All pages compile successfully

**Test Production Build:**
```bash
npm start
# Visit http://localhost:3000
```

---

### 8️⃣ Console & Server Warnings

#### Backend
```bash
cd backend
NODE_ENV=production npm start
```

**Check for:**
- [ ] No deprecation warnings
- [ ] No unhandled promise rejections
- [ ] No MongoDB warnings
- [ ] Clean startup logs

#### Frontend
```bash
cd frontend
npm run build && npm start
```

**Browser Console Check:**
- [ ] No React warnings
- [ ] No hydration errors
- [ ] No 404 errors for assets
- [ ] No CORS errors
- [ ] Socket.io connects successfully

---

### 9️⃣ Deployment Configuration Files

#### Backend Files Created
- [ ] `render.yaml` - Render configuration
- [ ] `railway.json` - Railway configuration
- [ ] `.env.example` - Environment template

#### Frontend Files Created
- [ ] `vercel.json` - Vercel configuration
- [ ] `netlify.toml` - Netlify configuration
- [ ] `.env.example` - Environment template

#### Verify Configurations
- [ ] Build commands correct
- [ ] Start commands correct
- [ ] Health check paths correct
- [ ] Environment variables listed

---

### 🔟 Full Deployment Simulation

#### Step 1: Set Production Environment Variables

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env with production values
```

**Frontend (.env.local):**
```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to backend URL
```

#### Step 2: Start Backend
```bash
cd backend
NODE_ENV=production npm start
```

**Verify:**
- [ ] Server starts on correct port
- [ ] MongoDB connects successfully
- [ ] Socket.io initializes
- [ ] Health endpoint responds

#### Step 3: Build & Start Frontend
```bash
cd frontend
npm run build
npm start
```

**Verify:**
- [ ] Build completes successfully
- [ ] Server starts on port 3000
- [ ] Can access homepage
- [ ] API requests work

#### Step 4: End-to-End Test

**Authentication Flow:**
- [ ] Register new student account
- [ ] Email validation works (@vit.edu.in)
- [ ] Login successful
- [ ] JWT cookie set
- [ ] Protected routes accessible

**Booking Flow:**
- [ ] Step 1: Select sport and ground
- [ ] Step 2: Choose date and slot
- [ ] Step 3: Add team members
- [ ] Validation works (max 10 players)
- [ ] Confirmation modal appears
- [ ] Booking created successfully
- [ ] Admin receives real-time notification

**Admin Flow:**
- [ ] Login as admin
- [ ] See all bookings
- [ ] Filter by status works
- [ ] Approve booking
- [ ] Student sees approval in real-time
- [ ] Reject booking with reason
- [ ] Revoke booking (back to pending)

**Settings & History:**
- [ ] View booking history
- [ ] Update profile settings
- [ ] Change password
- [ ] All changes persist

#### Step 5: Cross-Browser Test
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browser

#### Step 6: Performance Check
- [ ] Page load < 3 seconds
- [ ] API response < 500ms
- [ ] Socket.io connects < 1 second
- [ ] No memory leaks

---

## 🚀 Ready for Deployment

### Final Checks
- [ ] All tests pass
- [ ] No console errors
- [ ] Environment variables documented
- [ ] Deployment configs created
- [ ] MongoDB Atlas ready
- [ ] CORS configured for production
- [ ] Health endpoint working
- [ ] Socket.io events tested
- [ ] Build optimized
- [ ] Documentation complete

### Deployment Order
1. **Deploy Backend First** (Render/Railway)
   - Set all environment variables
   - Wait for deployment to complete
   - Test health endpoint
   - Note backend URL

2. **Deploy Frontend** (Vercel/Netlify)
   - Set `NEXT_PUBLIC_API_URL` to backend URL
   - Deploy
   - Test homepage loads

3. **Update Backend CORS**
   - Set `CORS_ORIGIN` to frontend URL
   - Redeploy backend

4. **Final Test**
   - Complete user flow
   - Verify real-time updates
   - Check all features work

---

## 📊 Success Criteria

### Backend
- ✅ Health endpoint returns 200
- ✅ MongoDB connected
- ✅ Socket.io running
- ✅ CORS configured
- ✅ No errors in logs

### Frontend
- ✅ Homepage loads
- ✅ API requests work
- ✅ Socket.io connects
- ✅ No console errors
- ✅ All pages accessible

### Integration
- ✅ Authentication works
- ✅ Booking flow complete
- ✅ Real-time updates work
- ✅ Admin dashboard functional
- ✅ Mobile responsive

---

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check MONGO_URI format
- Verify IP whitelist (0.0.0.0/0)
- Check database user permissions

**CORS Errors**
- Verify CORS_ORIGIN matches frontend URL exactly
- No trailing slash in URLs
- Redeploy backend after CORS change

**Socket.io Not Connecting**
- Check NEXT_PUBLIC_API_URL is correct
- Verify WebSocket support on hosting platform
- Check browser console for errors

**Build Failures**
- Run `npm install` to update dependencies
- Check for TypeScript errors
- Verify all imports resolve

**Environment Variables Not Loading**
- Restart server after .env changes
- Check variable names (case-sensitive)
- Verify NEXT_PUBLIC_ prefix for frontend

---

## ✅ Deployment Complete

Once all checks pass:
1. Monitor logs for 24 hours
2. Test all features in production
3. Set up monitoring/alerts
4. Document any issues
5. Create admin account
6. Share with users

**Status**: Ready for Production ✅
