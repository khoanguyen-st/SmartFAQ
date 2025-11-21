# Mock API Testing Guide

## Quick Start

### 1. Enable Mock Mode

Create or edit `.env.local` file:

```env
VITE_USE_MOCK_API=true
```

### 2. Start Dev Server

```bash
yarn dev
```

### 3. Access Application

Open http://localhost:5174 (or whatever port Vite assigns)

**No backend needed!** All API calls will use mock data.

## Mock Features

### Pre-loaded Data
- 5 mock users with different roles and statuses
- Realistic Vietnamese addresses and phone numbers
- Mix of Active and Locked accounts

### Supported Operations
- ✅ View all users
- ✅ Create new user
- ✅ Edit user (email only)
- ✅ Lock/Unlock user
- ✅ Reset password
- ✅ Search and filter users
- ✅ Pagination

### Mock Data Behavior
- Changes persist during session
- Data resets on page refresh
- Realistic 500ms API delay
- Proper validation (duplicate email check, etc.)

## Switch to Real API

Edit `.env.local`:

```env
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:8000
```

Then restart dev server.

## Mock Data Structure

### Default Users
1. **admin** - SuperAdmin - Active
2. **john.doe** - Admin - Active  
3. **jane.smith** - Admin - Locked
4. **bob.wilson** - Admin - Active
5. **alice.nguyen** - Admin - Active

## Testing Scenarios

### Create User
- Email: `test@greenwich.edu.vn`
- Password: `Test123456`
- Will auto-generate username from email

### Lock/Unlock
- Try locking active users
- Try unlocking locked users
- Check status badge updates

### Search & Filter
- Search by username or email
- Filter by Active/Locked status
- Test pagination with 10/25/50 items per page

### Reset Password
- Click reset on any user
- Check alert message with email

## Files Structure

```
src/
  lib/
    api.ts              # Real API client
    api.mock.ts         # Mock API implementation
    api.client.ts       # Wrapper (switches between real/mock)
  pages/
    Users.tsx           # Uses api.client
  components/users/
    CreateUserDialog.tsx
    EditUserDialog.tsx
```

## Tips

1. **Check Console**: Mock API logs all operations
2. **Browser DevTools**: Network tab shows no real requests
3. **State Reset**: Refresh page to reset to initial mock data
4. **Error Testing**: Try creating duplicate emails to test validation

## Troubleshooting

**Mock not working?**
- Check `.env.local` has `VITE_USE_MOCK_API=true`
- Restart dev server after changing env file
- Clear browser cache

**Still seeing API errors?**
- Make sure you saved `.env.local`
- Check browser console for any import errors
- Verify `api.client.ts` is being imported, not `api.ts`

## Demo Credentials (not needed for mock)

When you switch back to real API:
- Username: `admin`
- Password: `admin`
