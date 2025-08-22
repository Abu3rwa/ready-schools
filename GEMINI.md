# AI Prompt: Optimize Assignments Page for Mobile & Chromebook Responsiveness

## Context
You are working with a React-based assignment management system that uses Material-UI (MUI) components. The Assignments page and its related components need to be optimized for mobile phones and Chromebooks, which are the primary devices used by teachers. The existing code uses MUI's responsive design system but needs significant improvements for better mobile usability.

## Current Tech Stack
- React with Material-UI (MUI) components
- Responsive breakpoints: xs (0px), sm (600px), md (900px), lg (1200px)
- Current components: 
  - `Assignments.js` (main page)
  - `AssignmentGradingDialog.jsx`
  - `AssignmentTemplates.jsx`
  - `CategoryManager.jsx`
  - `EnhancedAssignmentCard.jsx`
  - `EnhancedAssignmentForm.jsx`
  - And other related components

## Target Devices & Requirements
1. **Mobile Phones (320px - 599px)**
   - Touch-friendly interface with larger tap targets (minimum 44px)
   - Simplified navigation and reduced visual clutter
   - Stack components vertically
   - Hide/collapse non-essential information
   - Optimize for portrait orientation
   - Use bottom sheets and floating action buttons

2. **Chromebooks (600px - 1024px)**
   - Balance between mobile and desktop layouts
   - Utilize available screen real estate efficiently
   - Support both touch and keyboard/mouse interaction
   - Maintain functionality while optimizing space

## Specific Areas to Optimize

### 1. Main Assignments Page (Assignments.js)
**Mobile Optimizations:**
- Convert complex table layout to card-based layout on mobile
- Implement swipeable tabs for subject filtering
- Use bottom navigation for primary actions
- Stack search/filter controls vertically
- Collapse stats chips into an expandable summary
- Implement pull-to-refresh functionality

**Tablet/Chromebook:**
- Use 2-column card layout
- Maintain table view but with responsive columns
- Optimize toolbar spacing and button sizes

```jsx
// Example responsive layout pattern
<Box sx={{ 
  display: { xs: 'block', md: 'flex' },
  flexDirection: { xs: 'column', md: 'row' },
  gap: { xs: 2, md: 3 }
}}>
```

### 2. Assignment Cards (EnhancedAssignmentCard.jsx)
**Mobile:**
- Increase card padding and minimum height
- Stack header information vertically
- Make action buttons larger and more touch-friendly
- Use swipe gestures for quick actions (edit/delete)
- Implement expandable sections with proper animation

**Key Changes:**
```jsx
// Touch-friendly button sizing
<IconButton 
  size="large" // Change from "small" to "large" on mobile
  sx={{ 
    minHeight: { xs: 44, sm: 32 },
    minWidth: { xs: 44, sm: 32 }
  }}
>
```

### 3. Assignment Forms (EnhancedAssignmentForm.jsx)
**Mobile:**
- Convert to single-column layout
- Group related fields in collapsible sections
- Use native mobile date/time pickers
- Implement step-by-step wizard for complex forms
- Add form progress indicator
- Use bottom sheet for secondary actions

**Tablet/Chromebook:**
- Use 2-column layout for forms
- Maintain accordion-style organization

```jsx
// Responsive form layout
<Grid container spacing={{ xs: 2, sm: 3 }}>
  <Grid item xs={12} sm={6} md={4}>
    // Form fields with proper spacing
  </Grid>
</Grid>
```

### 4. Grading Dialog (AssignmentGradingDialog.jsx)
**Mobile:**
- Convert table to card-based list
- Stack grading statistics vertically
- Use larger input fields with better touch targets
- Implement swipe navigation between students
- Add quick-grade buttons (A, B, C, D, F)
- Use sticky header for context

**Critical Mobile Changes:**
```jsx
// Replace table with mobile-friendly list
<List sx={{ width: '100%' }}>
  {students.map((student) => (
    <ListItem key={student.id} sx={{ 
      flexDirection: 'column',
      alignItems: 'stretch',
      p: { xs: 2, sm: 1 }
    }}>
      // Student grading interface
    </ListItem>
  ))}
</List>
```

### 5. Templates Dialog (AssignmentTemplates.jsx)
**Mobile:**
- Use full-screen modal on mobile
- Convert grid to single-column card layout
- Implement bottom sheet for template customization
- Add search functionality with autocomplete
- Use larger tap targets for template selection

### 6. Category Manager (CategoryManager.jsx)
**Mobile:**
- Stack form and list vertically
- Use accordion-style organization
- Implement drag-and-drop for reordering (with fallback buttons)
- Add floating action button for quick category addition

## Enhanced Mobile Features to Implement

### 1. Touch Gestures
```jsx
// Add swipe-to-delete functionality
import { Swiper, SwiperSlide } from 'swiper/react';

// Implement swipe actions on assignment cards
<SwipeableListItem
  leftActions={[editAction]}
  rightActions={[deleteAction]}
>
  <AssignmentCard />
</SwipeableListItem>
```

### 2. Bottom Navigation
```jsx
// Add bottom navigation for primary actions
<Paper 
  sx={{ 
    position: 'fixed', 
    bottom: 0, 
    left: 0, 
    right: 0,
    display: { xs: 'block', md: 'none' },
    zIndex: 1000
  }}
>
  <BottomNavigation>
    <BottomNavigationAction label="Create" icon={<AddIcon />} />
    <BottomNavigationAction label="Grade" icon={<GradeIcon />} />
    <BottomNavigationAction label="Filter" icon={<FilterIcon />} />
  </BottomNavigation>
</Paper>
```

### 3. Floating Action Button
```jsx
// Add FAB for primary action
<Fab
  color="primary"
  sx={{
    position: 'fixed',
    bottom: { xs: 80, sm: 16 }, // Account for bottom nav
    right: 16,
    display: { xs: 'flex', md: 'none' }
  }}
  onClick={onCreateAssignment}
>
  <AddIcon />
</Fab>
```

### 4. Mobile-Specific Layouts
```jsx
// Responsive table to card conversion
const MobileAssignmentList = ({ assignments }) => (
  <Box sx={{ display: { xs: 'block', md: 'none' } }}>
    {assignments.map(assignment => (
      <Card key={assignment.id} sx={{ mb: 2 }}>
        <CardContent>
          // Mobile-optimized assignment display
        </CardContent>
        <CardActions>
          // Touch-friendly action buttons
        </CardActions>
      </Card>
    ))}
  </Box>
);

const DesktopAssignmentTable = ({ assignments }) => (
  <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
    // Existing table layout
  </TableContainer>
);
```

## Performance Optimizations

### 1. Lazy Loading
- Implement virtualization for large assignment lists
- Lazy load assignment details and grades
- Use skeleton loading states

### 2. Optimistic Updates
- Show immediate UI feedback for actions
- Handle offline scenarios gracefully
- Implement retry mechanisms

### 3. Touch Response
- Add haptic feedback for actions (where supported)
- Implement proper loading states
- Use transitions for smooth interactions

## Accessibility Improvements

### 1. Touch Targets
- Ensure all interactive elements meet 44px minimum
- Add proper spacing between touch targets
- Implement focus management for keyboard navigation

### 2. Screen Readers
- Add proper ARIA labels for all interactive elements
- Implement semantic markup for tables/lists
- Provide status announcements for actions

## Form Enhancements

### 1. Mobile Form Patterns
```jsx
// Step-by-step form wizard
const MobileAssignmentWizard = () => {
  const steps = ['Basic Info', 'Details', 'Grading', 'Review'];
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MobileStepper steps={steps.length} position="top" />
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {renderCurrentStep()}
      </Box>
      <Paper sx={{ p: 2 }}>
        <Button fullWidth variant="contained">
          {isLastStep ? 'Create Assignment' : 'Next'}
        </Button>
      </Paper>
    </Box>
  );
};
```

### 2. Smart Input Methods
- Use appropriate input types (number, date, email)
- Implement autocomplete for common fields
- Add input validation with real-time feedback

## Testing Requirements

### 1. Device Testing
- Test on iPhone SE (375px width)
- Test on various Android devices (360px-414px)
- Test on iPad and Android tablets (768px-1024px)
- Test on Chromebooks (various screen sizes)

### 2. Interaction Testing
- Verify all touch targets are accessible
- Test form submission on virtual keyboards
- Validate swipe gestures work properly
- Ensure pinch-to-zoom doesn't break layout

### 3. Performance Testing
- Measure load times on 3G connections
- Test with large datasets (100+ assignments)
- Verify smooth scrolling and animations
- Check memory usage on lower-end devices

## Implementation Priorities

### Phase 1: Critical Mobile Fixes
1. Convert assignment table to mobile-friendly cards
2. Make grading dialog mobile-responsive
3. Fix form layouts for mobile screens
4. Implement proper touch targets

### Phase 2: Enhanced Mobile Features
1. Add bottom navigation
2. Implement swipe gestures
3. Add floating action buttons
4. Optimize search and filtering

### Phase 3: Advanced Features
1. Implement offline support
2. Add advanced touch interactions
3. Optimize for PWA capabilities
4. Add haptic feedback

## Success Criteria
- All functionality accessible on 320px screens
- Sub-3 second load times on mobile networks
- No horizontal scrolling required
- Touch targets meet accessibility guidelines
- Forms are easily completable on mobile keyboards
- Grading workflow is intuitive on touch devices
- Maintains professional appearance across all devices

Please implement these optimizations while preserving existing functionality and maintaining code quality standards. Focus especially on the assignment grading workflow as it's the most frequently used feature by teachers on mobile devices.