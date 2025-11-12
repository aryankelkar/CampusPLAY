# 🚀 Start Testing CampusPlay - Quick Guide

## 📋 **PRE-FLIGHT CHECK**

Before you start, ensure:
- ✅ Backend server is running (check README for backend setup)
- ✅ Database is connected
- ✅ Node.js installed (v14+ recommended)
- ✅ npm installed

---

## 🎯 **STEP 1: START THE APPLICATION**

### Open Terminal:
```bash
cd c:\CampusPLAY\frontend

# Install dependencies if you haven't already
npm install

# Start development server
npm run dev
```

**Expected Output:**
```
> campusplay-frontend@1.0.0 dev
> next dev -p 3000

ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## 🌐 **STEP 2: OPEN IN BROWSER**

1. Open your browser (Chrome recommended)
2. Go to: **http://localhost:3000**
3. Open DevTools (Press **F12**)
4. Check Console tab for errors

---

## ✅ **STEP 3: QUICK FUNCTIONALITY TEST (5 minutes)**

### Test 1: Home Page
- [ ] Page loads without errors
- [ ] Navbar displays correctly
- [ ] Green line visible at bottom of navbar
- [ ] Hero section displays
- [ ] "Book Ground Now" button visible

### Test 2: Login
- [ ] Click "Login" in navbar
- [ ] Try invalid email → Should show error
- [ ] Try valid login:
  - Email: `admin@campusplay.com`
  - Password: `admin123`
- [ ] Should redirect to Home page (/)
- [ ] Navbar should show user avatar

### Test 3: Navigation
- [ ] Click each navbar link:
  - Home → Works
  - Book → Works
  - History → Works
  - Availability → Works
  - About → Works
  - Settings icon → Goes to /settings

### Test 4: Settings Page
- [ ] 4 tabs visible: Profile, Security, Preferences, Account Info
- [ ] Click Profile tab:
  - Email and Roll display in cards
  - Hover over email → Copy button appears
  - Click copy → Toast shows "Email copied!"
- [ ] Click Security tab:
  - Type in "New Password" field
  - Password strength meter appears
  - Bar changes color as you type
- [ ] Try switching tabs with unsaved changes:
  - Edit something in Profile
  - Click Security tab
  - Modal pops up: "Unsaved Changes"
  - Click "Stay Here" → Stays on Profile
  - Click "Leave Anyway" → Goes to Security

### Test 5: Booking Flow
- [ ] Click "Book Ground" in navbar
- [ ] Form displays with fields
- [ ] Fill out form
- [ ] Submit booking
- [ ] Success message appears
- [ ] Go to History page
- [ ] New booking shows in list

### Test 6: History Page
- [ ] Search bar displays correctly
- [ ] Search icon visible (not overlapping text)
- [ ] Type in search box
- [ ] Clear button (✕) appears
- [ ] Search filters bookings
- [ ] Filter tabs work (All, Approved, Pending, etc.)

---

## 🔴 **CRITICAL ISSUES TO REPORT**

If you encounter any of these, **STOP AND REPORT IMMEDIATELY**:
- ❌ Can't login
- ❌ Page crashes/white screen
- ❌ Console shows red errors
- ❌ Can't create booking
- ❌ Data doesn't save

---

## ⚠️ **MINOR ISSUES TO NOTE**

These can be fixed later:
- ⚠️ Slow performance
- ⚠️ Styling glitches
- ⚠️ Typos
- ⚠️ Unclear error messages

---

## 📱 **MOBILE TESTING**

### Option 1: Browser DevTools
1. Press **F12** in browser
2. Click device icon (top-left of DevTools)
3. Select "iPhone 12 Pro" or similar
4. Refresh page
5. Test navigation and features

### Option 2: Real Device
1. Find your computer's local IP:
   ```bash
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   ```
2. On phone, open browser
3. Go to: `http://YOUR_IP:3000`
4. Test mobile experience

---

## 🧪 **COMPREHENSIVE TEST (20 minutes)**

### User Registration & Authentication
1. **Register New Student Account**
   - Click "Register" in navbar
   - Fill form with @vit.edu.in email
   - Try weak password → Should show requirements
   - Use strong password
   - Select Branch, Division, Year
   - Submit
   - Should redirect to login

2. **Login as Student**
   - Login with new account
   - Should redirect to home
   - Avatar should show in navbar

3. **Update Profile**
   - Click Settings icon
   - Go to Profile tab
   - Add phone number (10 digits, starts with 6-9)
   - Add bio (max 200 chars)
   - Update Branch/Division/Year
   - Click Save → Success message

4. **Change Password**
   - Go to Security tab
   - Enter current password
   - Type new password
   - Watch strength meter:
     - "password" → Red (Weak)
     - "Password1" → Orange (Fair)
     - "Password123" → Yellow (Good)
     - "Password123!" → Green (Strong)
   - Confirm new password
   - Click Update → Success

5. **Create Booking**
   - Click "Book" in navbar
   - Select Game (e.g., Cricket)
   - Select Ground (e.g., Main Field)
   - Select Date (tomorrow)
   - Select Time slot
   - Submit
   - Confirm success message

6. **View History**
   - Click "History" in navbar
   - New booking should appear
   - Status should be "Pending"
   - Search for your booking (type game name)
   - Filter by "Pending"

7. **Check Availability**
   - Click "Availability" in navbar
   - Select ground
   - View available slots
   - Check your booked slot shows as unavailable

8. **Admin Actions** (if admin)
   - Login as admin (`admin@campusplay.com` / `admin123`)
   - Go to Admin Dashboard
   - Find pending booking
   - Click "Approve"
   - Confirm approval
   - Check History → Status should be "Approved"

---

## 📊 **PERFORMANCE CHECK**

### Use Chrome DevTools:
1. Press **F12**
2. Go to "Performance" tab
3. Click Record
4. Navigate through site
5. Stop recording
6. Check:
   - Page load time < 3 seconds
   - No red errors
   - Smooth scrolling

### Lighthouse Audit:
1. Press **F12**
2. Go to "Lighthouse" tab
3. Click "Analyze page load"
4. Wait for results
5. Target scores:
   - Performance: >70
   - Accessibility: >90
   - Best Practices: >80

---

## 🐛 **HOW TO REPORT ISSUES**

### Format:
```
**Issue:** Brief description
**Page:** Where it happened
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3
**Expected:** What should happen
**Actual:** What actually happened
**Console Errors:** Copy any red errors from console
**Screenshot:** (if applicable)
**Priority:** Critical / High / Medium / Low
```

### Example:
```
**Issue:** Can't submit booking form
**Page:** /bookings
**Steps to Reproduce:**
1. Fill out booking form
2. Select time slot
3. Click Submit
**Expected:** Booking created, success message shown
**Actual:** Nothing happens, button stays disabled
**Console Errors:** "TypeError: Cannot read property 'date' of undefined"
**Priority:** Critical
```

---

## ✅ **SUCCESS CRITERIA**

Your testing session is successful if:
- ✅ All pages load without errors
- ✅ Login/logout works
- ✅ Can create and view bookings
- ✅ Settings page fully functional
- ✅ Search and filters work
- ✅ Mobile experience acceptable
- ✅ No critical bugs found

---

## 📞 **NEED HELP?**

### Check These First:
1. **FEATURE_VERIFICATION_CHECKLIST.md** - Full feature list
2. **QUICK_VERIFICATION_REPORT.md** - Status summary
3. **README.md** - Setup instructions
4. **Console errors** (F12) - Usually tells you what's wrong

### Common Issues:
- **Port 3000 already in use:** Stop other servers or use different port
- **Module not found:** Run `npm install`
- **Backend not responding:** Check backend server is running
- **Login fails:** Check backend database connection

---

## 🎉 **READY TO TEST!**

**Now run:**
```bash
npm run dev
```

**Then open:** http://localhost:3000

**Good luck! Report any issues you find!** 🚀

---

**Testing Team:** _____________  
**Date Started:** _____________  
**Status:** _____________
