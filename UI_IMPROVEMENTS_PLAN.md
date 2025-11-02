# UI Improvements Plan

## Issues Identified

### 1. Avatar/Profile Modal Not Functional
**Problem**: The "Profile" and "Settings" menu items in the navbar dropdown don't do anything
**Location**: 
- `frontend/src/pages/home/_components/navbar.tsx` (lines 168-173)
- `frontend/src/pages/creator-dashboard/_components/dashboard-navbar.tsx` (lines 85-90)

**What's Needed**:
- Create a Profile/Settings modal that allows:
  - Upload/change avatar/profile picture
  - Edit profile information (name, username, bio)
  - Change email
  - Change password
- Backend API endpoints:
  - `PATCH /api/viewer/profile` - Update profile info
  - `POST /api/viewer/upload-avatar` - Upload avatar
  - `PATCH /api/viewer/change-password` - Change password

### 2. Auth Pages UI Issues
**Problem**: Auth pages (signin/signup) are too big and don't fit well on screen, no navigation back to home
**Location**: 
- `frontend/src/pages/auth/signin.tsx`
- `frontend/src/pages/auth/signup.tsx`

**What's Needed**:
- Make the card more compact (reduce padding, field spacing)
- Add a simple navbar with logo that links back to home
- Make it responsive for smaller screens
- Reduce height of signup form (maybe make it scrollable or multi-step)

---

## Implementation Status

### Phase 1: Fix Auth Pages UI ✅ COMPLETED
- ✅ Created AuthNavbar component (`frontend/src/components/auth/auth-navbar.tsx`)
  - Logo links to home
  - Sign in/Sign up links
  - Transparent, minimal design
- ✅ Updated signin.tsx:
  - Added AuthNavbar
  - Reduced card padding (pb-4, pt-0)
  - Reduced field spacing (space-y-3)
  - Smaller inputs (h-10, h-9)
  - Smaller text (text-sm, text-xs)
  - Made form more compact
- ✅ Updated signup.tsx:
  - Added AuthNavbar
  - Reduced card padding
  - Made content scrollable (max-h-[calc(100vh-200px)] overflow-y-auto)
  - Smaller inputs and spacing
  - Now fits on screen properly

### Phase 2: Create Profile Settings Modal ⏳ PENDING
**Next Steps:**
1. Create a minimal auth navbar component with:
   - Logo (links to home)
   - Sign in/Sign up links (if on opposite page)
2. Update signin.tsx:
   - Add navbar
   - Reduce card padding and spacing
   - Make form more compact
3. Update signup.tsx:
   - Add navbar
   - Reduce card padding and spacing
   - Consider making it scrollable within the card

### Phase 2: Create Profile Settings Modal ✅
1. Create `frontend/src/components/ui/profile-settings-modal.tsx`
   - Tabs: Profile, Avatar, Security
   - Profile tab: name, username, bio
   - Avatar tab: upload/change avatar
   - Security tab: change password
2. Hook up modal to navbar dropdown menu items
3. Use existing FileUpload component for avatar

### Phase 3: Create Backend APIs ✅
1. Create viewer profile controller (`backend/src/controllers/viewer.controller.ts`):
   - `updateProfile` - Update name, username, bio
   - `uploadAvatar` - Upload and update avatar
   - `changePassword` - Change password
2. Add validation schemas (`backend/src/lib/validations/viewer.validation.ts`)
3. Add routes (`backend/src/routes/viewer.route.ts`)

### Phase 4: Integration ✅
1. Create React hooks for profile operations:
   - `useUpdateProfile`
   - `useUploadAvatar`
   - `useChangePassword`
2. Connect modal to hooks
3. Update session/user context after profile changes

---

## File Structure

### New Files to Create:
```
frontend/src/
  components/
    ui/
      profile-settings-modal.tsx    # Main modal component
    auth/
      auth-navbar.tsx                # Simple navbar for auth pages
  hooks/
    useProfileSettings.ts            # Profile operations hooks

backend/src/
  controllers/
    viewer.controller.ts             # Add profile update methods
  lib/validations/
    viewer.validation.ts             # Add validation schemas
```

### Files to Modify:
```
frontend/src/pages/
  auth/
    signin.tsx                       # Add navbar, make compact
    signup.tsx                       # Add navbar, make compact
  home/_components/
    navbar.tsx                       # Hook up profile/settings modal
  creator-dashboard/_components/
    dashboard-navbar.tsx             # Hook up profile/settings modal

backend/src/routes/
  viewer.route.ts                    # Add new routes
```

---

## API Endpoints to Add

### Backend Routes
```typescript
// Profile management
PATCH  /api/viewer/profile           // Update profile info
POST   /api/viewer/avatar            // Upload avatar
PATCH  /api/viewer/password          // Change password
GET    /api/viewer/profile           // Get current profile
```

---

## Component Specifications

### Profile Settings Modal
- **Tabs**: Profile | Avatar | Security
- **Profile Tab**:
  - Input: Name (text)
  - Input: Username (text, unique)
  - Textarea: Bio (optional, max 500 chars)
  - Button: Save Changes
- **Avatar Tab**:
  - Current avatar preview
  - FileUpload component
  - Button: Upload & Save
- **Security Tab**:
  - Input: Current Password
  - Input: New Password
  - Input: Confirm New Password
  - Button: Change Password

### Auth Navbar
- Logo (left) - links to `/`
- Sign in/Sign up links (right)
- Simple, minimal design
- Transparent or dark background

---

## Success Criteria
- [ ] Auth pages have navbar to navigate home
- [ ] Auth pages fit properly on screen (no overflow)
- [ ] Profile menu item opens settings modal
- [ ] Settings menu item opens settings modal
- [ ] Can upload/change avatar
- [ ] Can update profile info (name, username, bio)
- [ ] Can change password
- [ ] Backend APIs work correctly
- [ ] Session updates after profile changes
