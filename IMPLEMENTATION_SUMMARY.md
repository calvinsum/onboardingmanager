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
export const calculateMinTrainingDate = (
  installationConfirmedDate: Date,
  holidays: Date[] = []
): Date => {
  return addWorkingDays(installationConfirmedDate, 1, holidays);
};
```

### Issue 2: Training Slot Availability Checking

**Problem**: The system was showing all predefined time slots (09:30, 12:00, 14:30, 17:00) without checking if trainers are actually available for those slots.

**Solution Implemented**:
- Enhanced `MobileDatePicker` component with dynamic slot availability checking
- Added `checkAvailability` prop to enable/disable availability checking
- Integrated with `/training-slots/availability` API endpoint
- Shows only available time slots based on:
  - Trainer availability
  - Location matching (for onsite training)
  - Language preferences
  - Existing bookings

**Key Features**:
1. **Real-time availability checking**: When a date is selected, the system checks available trainers
2. **Smart error messages**:
   - "No training slots available for the selected date. Please choose another date." (when no slots available for any trainer)
   - "No trainers available for your location and language preferences. Please contact your onboarding manager." (when trainers exist but none match criteria)
3. **Loading states**: Shows spinner while checking availability
4. **Fallback handling**: Graceful error handling if API fails

**Key Code Changes**:
```typescript
const checkSlotAvailability = async (date: Date) => {
  // Determine training type based on onboarding record
  const trainingType = hasOnsiteTraining && !hasRemoteTraining ? 'onsite_training' : 'remote_training';
  const location = trainingType === 'onsite_training' ? onboardingRecord?.trainingState : undefined;
  const languages = onboardingRecord?.trainingPreferenceLanguages?.join(',') || '';

  const slots = await getAvailableTrainingSlots(dateStr, trainingType, location, languages);
  
  if (slots.length === 0) {
    // Check if it's due to no trainers matching the criteria
    const allSlots = await getAvailableTrainingSlots(dateStr, trainingType);
    if (allSlots.length === 0) {
      setSlotError('No training slots available for the selected date. Please choose another date.');
    } else {
      setSlotError('No trainers available for your location and language preferences. Please contact your onboarding manager.');
    }
  }
};
```

## Implementation Details

### Files Modified

1. **`frontend/src/pages/MerchantSchedulePage.tsx`**:
   - Enhanced `MobileDatePicker` component with slot availability checking
   - Added props: `onboardingRecord`, `checkAvailability`
   - Fixed training type values to match backend enum
   - Added loading states and error handling

2. **`frontend/src/utils/constants.ts`**:
   - Enhanced working day calculation logic
   - Added test function for verification
   - Proper holiday integration

3. **`frontend/src/services/api.ts`**:
   - Already had `getAvailableTrainingSlots` function
   - Integrated with backend availability endpoint

### Backend Integration

The implementation leverages existing backend endpoints:
- `/training-slots/availability` - Check available slots for a date
- `/schedule/holidays/{year}?state={state}` - Get public holidays
- `/merchant-training-schedules/book-auto-assign` - Book training slots

### Business Rules Enforced

1. **Working Day Calculation**: 
   - Excludes weekends (Saturday, Sunday)
   - Excludes Malaysian public holidays
   - Properly handles state-specific holidays

2. **Trainer Matching**:
   - Location matching for onsite training
   - Language preference matching
   - Availability checking (no double bookings)

3. **User Experience**:
   - Clear error messages for different scenarios
   - Loading states during API calls
   - Fallback to contact onboarding manager when needed

## Testing

### Manual Testing Scenarios

1. **Working Day Calculation**:
   - Install on Friday → Training available Monday
   - Install on Monday with Tuesday holiday → Training available Wednesday
   - Install on Wednesday → Training available Thursday

2. **Slot Availability**:
   - Select date with available trainers → Show available time slots
   - Select date with no trainers → Show "no slots available" message
   - Select date with trainers but wrong location → Show "contact manager" message

### Console Testing

Added `testWorkingDayCalculation()` function that can be run in browser console to verify working day logic.

## Deployment Notes

- All changes are backward compatible
- No database migrations required
- Frontend-only implementation using existing backend APIs
- Holiday data is fetched dynamically from backend

## Future Enhancements

1. **Caching**: Cache availability results for better performance
2. **Batch Loading**: Load availability for multiple dates at once
3. **Real-time Updates**: WebSocket integration for real-time slot updates
4. **Advanced Filtering**: More granular trainer filtering options 