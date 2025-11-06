# 🚀 How to Start the App

## Step 1: Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

**Expected output:**
```
Server running on port 3001
```

## Step 2: Start Frontend (Terminal 2)

```bash
npm run dev
```

**Expected output:**
```
VITE ready in XXX ms
Local: http://localhost:8080
```

## Step 3: Open Browser

Navigate to: **http://localhost:8080**

## Step 4: Test

1. **Register** a new user
2. **Login** with credentials
3. Try creating a **student**
4. Try **bulk import**

## ⚠️ If You See Errors

### 500 Internal Server Error
**Cause:** Backend not running

**Fix:**
```bash
cd backend
npm run dev
```

### Network Error / Failed to fetch
**Cause:** Wrong API URL

**Fix:** Check `.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### CORS Error
**Cause:** Backend CORS misconfigured

**Fix:** Check `backend/.env`:
```env
CORS_ORIGIN=http://localhost:8080
```

## 📝 Quick Test Commands

### Test Backend Health:
```bash
curl http://localhost:3001/health
```

### Test Backend API:
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","displayName":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## ✅ Everything Working?

You should be able to:
- ✅ Register/Login
- ✅ Create students
- ✅ View student list
- ✅ Upload documents
- ✅ Bulk import

## 🎉 Success!

Firebase is completely removed. Everything now runs through Supabase + Express backend!
