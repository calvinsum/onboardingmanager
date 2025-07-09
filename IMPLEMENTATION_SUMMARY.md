# Implementation Summary: Training Schedule Fixes

## Issues Addressed

### Issue 1: Training Schedule Date Must Be 1 Working Day After Installation Confirmation

**Problem**: Training schedule date should only be available from the next working day after installation is confirmed.

**Example**: If installation is confirmed on July 14, 2025, training should be available from July 15, 2025 onwards (excluding weekends and holidays).

**Solution Implemented**:
- Enhanced `calculateMinTrainingDate()` function in `frontend/src/utils/constants.ts`
- Uses `addWorkingDays()` utility that properly excludes weekends and Malaysian public holidays
- Integrated with holiday API endpoint `/schedule/holidays/{year}?state={state}`
- Applied in `MerchantSchedulePage.tsx` via `getMinTrainingDate()` function

**Key Code Changes**:
```typescript
// Calculate minimum training date (next working day after installation confirmation)
const getMinTrainingDate = (): Date | undefined => {
  if (!installationConfirmed || !hardwareInstallationDate) {
    return undefined;
  }
  // Training must be scheduled at least 1 working day after the actual installation date
  return calculateMinTrainingDate(hardwareInstallationDate, holidays);
};
```

### Issue 2: Training Slot Availability Checking

**Problem**: The system showed all predefined time slots without checking if trainers were actually available for the merchant's location and language preferences.

**Solution Implemented**:
- Enhanced `MobileDatePicker` component with slot availability checking
- Added `checkSlotAvailability()` function that calls `/api/training-slots/available` endpoint
- Only shows time slots that have available trainers matching:
  - Training type (remote/onsite)
  - Location (for onsite training)
  - Language preferences
- Provides meaningful error messages:
  - "No training slots available for the selected date. Please choose another date."
  - "No trainers available for your location and language preferences. Please contact your onboarding manager."

**Key Code Changes**:
```typescript
const checkSlotAvailability = async (date: Date) => {
  // ... implementation details
  const trainingType = hasOnsiteTraining && !hasRemoteTraining ? 'onsite_training' : 'remote_training';
  const location = trainingType === 'onsite_training' ? onboardingRecord?.trainingState : undefined;
  const languages = onboardingRecord?.trainingPreferenceLanguages?.join(',') || '';
  
  const slots = await getAvailableTrainingSlots(dateStr, trainingType, location, languages);
  setAvailableSlots(slots);
};
```

### Issue 3: Training Date Validation Fix (Latest Update)

**Problem**: Merchants could book training dates before their installation date, violating the business rule that training must be at least 1 working day after installation.

**Root Cause**: The `getMinTrainingDate()` function was using `installationConfirmedDate` (when user clicked confirm) instead of `hardwareInstallationDate` (the actual scheduled installation date).

**Solution Implemented**:
- Fixed `getMinTrainingDate()` to use `hardwareInstallationDate` instead of `installationConfirmedDate`
- Added `isTrainingDateValid()` validation function
- Added validation to `handleTrainingConfirm()` and `handleSaveSchedule()` functions
- Enhanced date picker with `getTrainingDisabledDays()` to disable invalid dates
- Added visual validation error message for invalid training dates
- Updated help text to clarify the business rule

**Key Code Changes**:
```typescript
// Fixed minimum training date calculation
const getMinTrainingDate = (): Date | undefined => {
  if (!installationConfirmed || !hardwareInstallationDate) {
    return undefined;
  }
  // Training must be scheduled at least 1 working day after the actual installation date
  return calculateMinTrainingDate(hardwareInstallationDate, holidays);
};

// Added validation function
const isTrainingDateValid = (trainingDate: Date | undefined): boolean => {
  if (!trainingDate || !hardwareInstallationDate) {
    return true;
  }
  
  const minTrainingDate = getMinTrainingDate();
  if (!minTrainingDate) {
    return true;
  }
  
  return trainingDate >= minTrainingDate;
};

// Added validation to save and confirm functions
const handleTrainingConfirm = async () => {
  if (!isTrainingDateValid(trainingDate)) {
    toast.error('Training date must be at least one working day after the installation date.');
    return;
  }
  // ... rest of function
};
```

### Issue 4: Merchant UX Fix - Prevent Login Redirect on No Trainers Available

**Problem**: When merchants selected a training schedule but no trainers were available, they were redirected to the login page instead of staying on the same page with a helpful error message.

**Root Cause**: The API service interceptor was only checking for `authToken` but merchants use `merchantAccessToken`. When booking failed, the interceptor incorrectly handled the error as an authentication failure.

**Solution Implemented**:
- Fixed API service to handle both `authToken` (managers) and `merchantAccessToken` (for merchants)
- Prevented automatic login redirect for merchant users on 401 errors
- Improved error messages for training booking failures
- Added specific handling for "No trainers available" errors
- Only redirect merchants to login on explicit 401 token expiry
- Prevent training confirmation when booking fails
- Provide clear guidance to contact onboarding manager

**Key Code Changes**:
```typescript
// Fixed API service interceptor
this.api.interceptors.request.use(
  (config) => {
    // Check for both authToken (for managers) and merchantAccessToken (for merchants)
    const token = localStorage.getItem('authToken') || localStorage.getItem('merchantAccessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// Improved error handling
this.api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only auto-redirect for manager authentication, not for merchant
      const userType = localStorage.getItem('userType');
      if (userType === 'manager') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        window.location.href = '/login';
      }
      // For merchants, let the component handle the error
    }
    return Promise.reject(error);
  }
);

// Enhanced error messages in merchant schedule page
if (errorMessage.includes('No trainers available')) {
  toast.error('No trainers available for your location and language preferences. Please contact your onboarding manager for assistance.');
}
```

## Technical Implementation Details

### Frontend Components Modified
- `frontend/src/pages/MerchantSchedulePage.tsx`
  - Enhanced `MobileDatePicker` component with availability checking
  - Added slot availability validation and error handling
  - Fixed training date validation logic
  - Added visual validation feedback

### Backend API Endpoints Used
- `GET /api/training-slots/available` - Check available training slots
- `GET /api/schedule/holidays/{year}?state={state}` - Get public holidays
- `POST /api/merchant-training-schedules/book-auto-assign` - Book training slot

### Business Rules Enforced
- Training slots only show if trainers are available for:
  - Merchant's location (for onsite training)
  - Merchant's language preferences
  - Selected date and time
- Training date must be at least 1 working day after installation date
- Weekends and public holidays are excluded from working day calculations

### Error Handling
- Graceful handling of no available trainers
- Clear error messages for different scenarios
- Validation prevents invalid date selection
- Visual feedback for validation errors

## Deployment Status
- ✅ Frontend changes committed and pushed to production
- ✅ Backend API endpoints already available
- ✅ Working day calculations implemented
- ✅ Training date validation enforced
- ✅ Merchant UX improved for training booking errors
- ✅ API service authentication handling fixed
- ✅ Build successful with no errors

## Testing Recommendations
1. Test training date selection with various installation dates
2. Verify slot availability checking works correctly
3. Test error messages for different scenarios
4. Confirm working day calculations exclude weekends and holidays
5. Test validation prevents booking training before installation
6. **Test merchant UX when no trainers are available** - should stay on page with helpful error message
7. **Test that merchants are not redirected to login** when booking fails due to no trainers
8. **Verify error messages guide users to contact onboarding manager** 