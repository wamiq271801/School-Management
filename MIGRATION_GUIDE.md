# Firebase to Supabase Migration Guide

Complete guide for migrating SmartSchool from Firebase to Supabase with proper backend architecture.

## Overview

This migration replaces Firebase with Supabase and introduces a proper backend API layer instead of direct database access from the frontend.

### What Changed

**Before (Firebase)**:
- Frontend directly accessed Firestore
- Firebase Auth for authentication
- Client-side security rules
- Real-time listeners in components

**After (Supabase + Backend)**:
- Frontend calls REST API endpoints
- Supabase Auth via backend
- Server-side validation and security
- Polling or WebSocket for real-time updates

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend  │ ──HTTP─>│  Backend API │ ──SQL──>│   Supabase   │
│  (React)    │ <─JSON──│  (Express)   │ <─Data──│ (PostgreSQL) │
└─────────────┘         └──────────────┘         └──────────────┘
```

## Migration Steps

### Step 1: Setup Supabase Database

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Note your project URL and keys

2. **Run Database Schema**
   ```bash
   # In Supabase SQL Editor, run:
   supabase/schema.sql
   ```

3. **Verify Tables Created**
   - Check Tables section in Supabase dashboard
   - Verify all 12 tables are created
   - Check indexes and functions

### Step 2: Setup Backend API

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Start Backend Server**
   ```bash
   npm run dev
   ```

4. **Test API**
   ```bash
   curl http://localhost:3001/health
   ```

### Step 3: Update Frontend

1. **Install Axios** (if not already installed)
   ```bash
   npm install axios
   ```

2. **Update Environment Variables**
   ```env
   # .env
   VITE_API_URL=http://localhost:3001/api
   ```

3. **Replace Firebase Services**
   - Use new API service files (see below)
   - Update components to call API instead of Firebase
   - Replace AuthContext with API-based auth

### Step 4: Data Migration (If Needed)

If you have existing data in Firebase:

1. **Export Firebase Data**
   ```bash
   # Use Firebase Admin SDK or Firestore export
   ```

2. **Transform Data**
   - Convert Firestore document structure to SQL rows
   - Handle nested objects → JSONB columns
   - Map Firebase IDs to UUIDs

3. **Import to Supabase**
   ```javascript
   // Use Supabase client to bulk insert
   const { data, error } = await supabase
     .from('students')
     .insert(transformedData);
   ```

## Code Changes

### Authentication

**Before (Firebase)**:
```javascript
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const { user } = await signInWithEmailAndPassword(auth, email, password);
```

**After (API)**:
```javascript
import { api } from '@/lib/api';

const { data } = await api.post('/auth/login', { email, password });
const { user, session } = data;
// Store session token
localStorage.setItem('token', session.access_token);
```

### Student CRUD

**Before (Firebase)**:
```javascript
import { createStudent, getStudents } from '@/lib/firestore';

// Create
const studentId = await createStudent(studentData);

// Read
const students = await getStudents({ class: '10', section: 'A' });
```

**After (API)**:
```javascript
import { api } from '@/lib/api';

// Create
const { data } = await api.post('/students', studentData);
const student = data.student;

// Read
const { data } = await api.get('/students', {
  params: { class: '10', section: 'A' }
});
const students = data.students;
```

### Real-time Updates

**Before (Firebase)**:
```javascript
import { subscribeToStudents } from '@/lib/firestore';

const unsubscribe = subscribeToStudents((students) => {
  setStudents(students);
});
```

**After (Polling)**:
```javascript
import { api } from '@/lib/api';

// Option 1: Polling
useEffect(() => {
  const fetchStudents = async () => {
    const { data } = await api.get('/students');
    setStudents(data.students);
  };
  
  fetchStudents();
  const interval = setInterval(fetchStudents, 5000); // Poll every 5s
  
  return () => clearInterval(interval);
}, []);

// Option 2: Supabase Realtime (if needed)
import { supabase } from '@/lib/supabase';

const channel = supabase
  .channel('students-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'students' },
    (payload) => {
      // Handle change
      fetchStudents();
    }
  )
  .subscribe();
```

## API Service Layer

Create `src/lib/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { api };
```

## Feature Mapping

### Students Module

| Firebase Function | API Endpoint | Method |
|-------------------|--------------|--------|
| `createStudent()` | `/students` | POST |
| `getStudent(id)` | `/students/:id` | GET |
| `getStudents()` | `/students` | GET |
| `updateStudent()` | `/students/:id` | PUT |
| `deleteStudent()` | `/students/:id` | DELETE |
| `searchStudents()` | `/students?search=...` | GET |
| `bulkUpdateStudents()` | `/students/bulk` | PUT |
| `subscribeToStudents()` | Polling or Realtime | - |

### Authentication

| Firebase Function | API Endpoint | Method |
|-------------------|--------------|--------|
| `signInWithEmailAndPassword()` | `/auth/login` | POST |
| `createUserWithEmailAndPassword()` | `/auth/register` | POST |
| `signOut()` | `/auth/logout` | POST |
| `sendPasswordResetEmail()` | `/auth/reset-password` | POST |
| `updateProfile()` | `/auth/profile` | PUT |
| `onAuthStateChanged()` | `/auth/me` | GET |

### Teachers Module

| Firebase Function | API Endpoint | Method |
|-------------------|--------------|--------|
| `createTeacher()` | `/teachers` | POST |
| `getTeacher(id)` | `/teachers/:id` | GET |
| `getTeachers()` | `/teachers` | GET |
| `updateTeacher()` | `/teachers/:id` | PUT |
| `deleteTeacher()` | `/teachers/:id` | DELETE |

### Fees Module

| Firebase Function | API Endpoint | Method |
|-------------------|--------------|--------|
| `createFeeTransaction()` | `/fees` | POST |
| `getFeeTransactions()` | `/fees` | GET |
| `getStudentFeeSummary()` | `/fees/student/:id/summary` | GET |

### Attendance Module

| Firebase Function | API Endpoint | Method |
|-------------------|--------------|--------|
| `markAttendance()` | `/attendance` | POST |
| `getAttendance()` | `/attendance` | GET |
| `getAttendanceSummary()` | `/attendance/student/:id/summary` | GET |

### Exams Module

| Firebase Function | API Endpoint | Method |
|-------------------|--------------|--------|
| `createExam()` | `/exams` | POST |
| `getExams()` | `/exams` | GET |
| `enterMarks()` | `/exams/:id/marks` | POST |
| `getStudentPerformance()` | `/exams/student/:id/performance` | GET |

## Testing

### Backend API Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@school.com","password":"test123","displayName":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@school.com","password":"test123"}'

# Get students (with token)
curl http://localhost:3001/api/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Frontend Testing

1. **Login Flow**
   - Test registration
   - Test login
   - Test logout
   - Test password reset

2. **Student Management**
   - Create student
   - View student list
   - Edit student
   - Delete student
   - Search students

3. **Other Modules**
   - Test each module similarly
   - Verify data persistence
   - Check error handling

## Rollback Plan

If migration fails:

1. **Keep Firebase Code**
   - Don't delete Firebase files immediately
   - Keep them in a separate branch

2. **Switch Back**
   ```bash
   git checkout firebase-version
   npm install
   npm run dev
   ```

3. **Gradual Migration**
   - Migrate one module at a time
   - Run both systems in parallel
   - Gradually switch users

## Performance Considerations

### Caching

Add caching to reduce API calls:

```javascript
// React Query example
import { useQuery } from '@tanstack/react-query';

const { data: students } = useQuery({
  queryKey: ['students'],
  queryFn: () => api.get('/students').then(res => res.data.students),
  staleTime: 30000, // Cache for 30 seconds
});
```

### Pagination

Always use pagination for large datasets:

```javascript
const { data } = await api.get('/students', {
  params: { limit: 50, offset: 0 }
});
```

### Batch Operations

Use bulk endpoints when possible:

```javascript
// Instead of multiple requests
for (const student of students) {
  await api.put(`/students/${student.id}`, updates);
}

// Use bulk update
await api.put('/students/bulk', {
  student_ids: students.map(s => s.id),
  updates
});
```

## Security Improvements

### Before (Firebase)
- Client-side security rules
- Direct database access
- Limited validation

### After (Supabase + Backend)
- Server-side validation
- API rate limiting
- Row Level Security (RLS)
- Audit logging
- Role-based access control
- Input sanitization

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Update `CORS_ORIGIN` in backend `.env`
   - Ensure frontend URL matches

2. **Authentication Fails**
   - Check token is being sent
   - Verify token format: `Bearer <token>`
   - Check token expiry

3. **Data Not Loading**
   - Check API endpoint URL
   - Verify backend is running
   - Check network tab in browser DevTools

4. **Slow Performance**
   - Add indexes to frequently queried columns
   - Implement caching
   - Use pagination

## Next Steps

1. ✅ Database schema created
2. ✅ Backend API implemented
3. ⏳ Frontend API integration (in progress)
4. ⏳ Bulk import system update
5. ⏳ Remove Firebase dependencies
6. ⏳ Testing and QA
7. ⏳ Production deployment

## Support

For issues or questions:
- Check backend logs: `backend/logs/`
- Check Supabase logs in dashboard
- Review API documentation in `backend/README.md`

## Conclusion

This migration provides:
- ✅ Better separation of concerns
- ✅ Improved security
- ✅ Easier testing
- ✅ Better scalability
- ✅ Proper backend architecture
- ✅ Comprehensive audit logging
- ✅ Role-based access control

The new architecture follows industry best practices and provides a solid foundation for future growth.
