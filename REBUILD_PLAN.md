# School Assessment System - Complete Rebuild Plan

## Overview
Building a complete role-based school assessment system with registration, authentication, and full CRUD operations.

## System Architecture

### 1. User Roles & Hierarchy
```
Admin (Super User)
  └─ Manages Organizations
      └─ Organization
          ├─ Creates Teachers
          ├─ Creates Students  
          ├─ Manages Classes
          └─ Manages Subjects
              └─ Teacher
                  ├─ Creates Questions
                  ├─ Creates Tests
                  ├─ Creates Assignments
                  └─ Views Submissions
                      └─ Student
                          ├─ Takes Tests
                          ├─ Submits Assignments
                          └─ Views Results
```

### 2. Database Schema (Using Drizzle ORM)

#### Core Tables
- **users** - All users (admin, org, teacher, student)
- **organizations** - School/college organizations
- **classes** - Class/grade levels
- **subjects** - Subject definitions
- **questions** - Question bank (MCQ, long answer)
- **tests** - Test/exam definitions
- **assignments** - Assignment definitions
- **test_attempts** - Student test submissions
- **assignment_submissions** - Student assignment submissions
- **test_results** - Graded test results

### 3. Authentication Flow

#### Registration
1. **Admin Registration** - First user, creates admin account
2. **Organization Registration** - Admin creates organization
3. **Teacher Registration** - Organization creates teacher accounts
4. **Student Registration** - Organization creates student accounts

#### Login
- Single login page with role dropdown
- User selects role: Admin | Organization | Teacher | Student
- System validates role matches user's actual role
- JWT token with role embedded
- Redirect to role-specific dashboard

### 4. API Structure

```
/api/auth
  POST /register - Register new user (role-based)
  POST /login - Login with role selection
  POST /logout - Logout
  GET /me - Get current user
  POST /forgot-password - Password reset

/api/admin
  GET /organizations - List all organizations
  POST /organizations - Create organization
  GET /users - List all users
  DELETE /users/:id - Delete user

/api/organization
  POST /teachers - Create teacher account
  POST /students - Create student account
  GET /teachers - List teachers
  GET /students - List students
  POST /classes - Create class
  GET /classes - List classes
  POST /subjects - Create subject
  GET /subjects - List subjects

/api/teacher
  POST /questions - Create question
  GET /questions - List questions
  POST /tests - Create test
  GET /tests - List tests
  POST /assignments - Create assignment
  GET /submissions - View submissions

/api/student
  GET /tests - Available tests
  POST /tests/:id/attempt - Start test
  POST /tests/:id/submit - Submit test
  GET /results - View results
  POST /assignments/:id/submit - Submit assignment
  GET /assignments - View assignments
```

### 5. Frontend Pages

#### Public
- `/login` - Login with role selection
- `/register` - Initial admin registration
- `/forgot-password` - Password reset

#### Admin Dashboard (`/admin`)
- `/admin/dashboard` - Overview stats
- `/admin/organizations` - Manage organizations
- `/admin/users` - Manage all users

#### Organization Dashboard (`/organization`)
- `/organization/dashboard` - Overview
- `/organization/teachers` - Manage teachers
- `/organization/students` - Manage students
- `/organization/classes` - Manage classes
- `/organization/subjects` - Manage subjects

#### Teacher Dashboard (`/teacher`)
- `/teacher/dashboard` - Overview
- `/teacher/questions` - Question bank
- `/teacher/tests` - Create/manage tests
- `/teacher/assignments` - Create/manage assignments
- `/teacher/submissions` - View submissions

#### Student Dashboard (`/student`)
- `/student/dashboard` - Overview
- `/student/tests` - Available tests
- `/student/test/:id` - Take test
- `/student/results` - View results
- `/student/assignments` - View/submit assignments

### 6. Security Features

- ✅ bcrypt password hashing (10 rounds)
- ✅ JWT access tokens (7 days)
- ✅ HTTP-only cookies
- ✅ Role-based middleware
- ✅ CORS protection
- ✅ Input validation (Zod)
- ✅ Rate limiting on auth endpoints
- ✅ No sensitive data in responses

### 7. Implementation Steps

#### Phase 1: Core Setup ✅
- Database schema
- Authentication system
- Role-based middleware

#### Phase 2: Registration Flow
- Admin registration (first user)
- Organization creation by admin
- Teacher creation by organization
- Student creation by organization

#### Phase 3: Organization Features
- Class management
- Subject management
- User management (teachers/students)

#### Phase 4: Teacher Features
- Question bank (MCQ, long answer)
- Test creation
- Assignment creation
- View submissions

#### Phase 5: Student Features
- View available tests
- Take tests
- Submit assignments
- View results

#### Phase 6: UI Polish
- Modern, clean design
- Responsive layout
- Loading states
- Error handling
- Toast notifications

### 8. Key Changes from Current System

1. **No Dummy Data** - All data created through registration
2. **Role Selection at Login** - Dropdown to select role
3. **Strict Role Validation** - Cannot login as wrong role
4. **Complete CRUD** - Full create, read, update, delete
5. **Question Types** - MCQ and long answer support
6. **Assignments** - Separate from tests
7. **Submissions** - Teacher can view and grade

### 9. Next Steps

1. Update database schema for new requirements
2. Implement registration flow
3. Update login page with role selector
4. Create organization management pages
5. Create teacher question/test pages
6. Create student test-taking interface
7. Implement grading system

This plan ensures a complete, production-ready system with proper user management and role-based access control.
