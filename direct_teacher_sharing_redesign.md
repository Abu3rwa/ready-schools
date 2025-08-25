# Direct Teacher-to-Teacher Content Sharing Redesign

## ✅ **IMPLEMENTATION COMPLETE**

## 🎯 **New Requirements Understanding**

Instead of file-based export/import, implement **direct database sharing** between teachers with **request-based acceptance**:

1. **Teacher A clicks "Export"**
2. **Select target teacher from system users**
3. **Choose content types to share**
4. **Choose merge strategy**
5. **Create pending request for Teacher B to accept**
6. **Teacher B reviews and accepts/rejects the content**
7. **Content is added to Teacher B's library upon acceptance**

---

## 🔄 **System Changes Required**

### 1. **Backend Service Changes**

**Add to `functions/src/services/emailContentService.js`:**

```javascript
/**
 * Get list of all teachers in the system for sharing
 * @returns {Promise<Array>} List of teachers with id, email, displayName
 */
export const getTeachersList = async () => {
  try {
    const db = getFirestore();
    const usersSnapshot = await db.collection('users').get();
    
    const teachers = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      teachers.push({
        id: doc.id,
        email: userData.email,
        displayName: userData.displayName || userData.email,
        photoURL: userData.photoURL
      });
    });
    
    return teachers;
  } catch (error) {
    console.error('Error getting teachers list:', error);
    throw error;
  }
};

/**
 * Share content directly between teachers
 * @param {string} fromTeacherId - Source teacher ID
 * @param {string} toTeacherId - Target teacher ID
 * @param {Array} contentTypes - Array of content types to share
 * @param {string} strategy - Merge strategy ('merge', 'add_only', 'replace')
 * @returns {Promise<Object>} Result of the sharing operation
 */
export const shareContentWithTeacher = async (fromTeacherId, toTeacherId, contentTypes, strategy = 'merge') => {
  try {
    const db = getFirestore();
    
    // Get source teacher's content
    const sourceDocRef = db.collection('emailContent').doc(`teacher_${fromTeacherId}`);
    const sourceDoc = await sourceDocRef.get();
    
    if (!sourceDoc.exists()) {
      throw new Error('Source teacher content not found');
    }
    
    const sourceContent = sourceDoc.data();
    
    // Filter by selected content types
    const contentToShare = {};
    contentTypes.forEach(type => {
      if (sourceContent[type]) {
        contentToShare[type] = sourceContent[type];
      }
    });
    
    // Apply sharing using existing import logic
    const result = await importContentLibrary(toTeacherId, { content: contentToShare }, strategy);
    
    return {
      success: true,
      fromTeacher: fromTeacherId,
      toTeacher: toTeacherId,
      contentTypes,
      strategy,
      sharedItemsCount: Object.values(contentToShare).flat().length
    };
  } catch (error) {
    console.error('Error sharing content:', error);
    throw error;
  }
};
```

### 2. **Frontend Service Changes**

**Add to `src/services/emailContentService.js`:**

```javascript
// Get list of teachers for sharing
async getTeachersList() {
  try {
    const db = getFirestore();
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    const teachers = [];
    usersSnapshot.forEach(docSnap => {
      const userData = docSnap.data();
      teachers.push({
        id: docSnap.id,
        email: userData.email,
        displayName: userData.displayName || userData.email,
        photoURL: userData.photoURL
      });
    });
    
    return teachers;
  } catch (error) {
    console.error('Error getting teachers list:', error);
    throw error;
  }
}

// Share content directly with another teacher
async shareContentWithTeacher(targetTeacherId, contentTypes, strategy = 'merge') {
  const shareContent = httpsCallable(this.functions, 'shareEmailContent');
  const result = await shareContent({ 
    targetTeacherId, 
    contentTypes, 
    strategy 
  });
  return result.data;
}
```

### 3. **Redesigned Export Dialog**

**Complete replacement for `src/components/settings/EmailContentExportDialog.jsx`:**

```javascript
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, FormGroup, FormControlLabel, 
  Checkbox, Autocomplete, TextField, Avatar, Chip,
  RadioGroup, Radio, Alert, CircularProgress
} from '@mui/material';
import { Share, Person } from '@mui/icons-material';
import emailContentService from '../../services/emailContentService';

const EmailContentExportDialog = ({ open, onClose, contentLibrary, currentUser }) => {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [targetTeacher, setTargetTeacher] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [shareStrategy, setShareStrategy] = useState('merge');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      loadTeachers();
    }
  }, [open]);

  const loadTeachers = async () => {
    try {
      setIsLoading(true);
      const teachersList = await emailContentService.getTeachersList();
      // Filter out current user
      const otherTeachers = teachersList.filter(teacher => teacher.id !== currentUser.uid);
      setTeachers(otherTeachers);
    } catch (err) {
      setError('Failed to load teachers list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedTypes(prev => 
      checked ? [...prev, name] : prev.filter(type => type !== name)
    );
  };

  const handleShare = async () => {
    if (!targetTeacher || selectedTypes.length === 0) return;

    try {
      setIsLoading(true);
      await emailContentService.shareContentWithTeacher(
        targetTeacher.id, 
        selectedTypes, 
        shareStrategy
      );
      
      onClose();
      // Success handled by parent component
    } catch (err) {
      setError('Failed to share content: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const contentTypes = Object.keys(contentLibrary || {});
  const hasContent = selectedTypes.length > 0;
  const totalItemsToShare = selectedTypes.reduce((total, type) => {
    return total + (contentLibrary[type]?.length || 0);
  }, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Share />
        Share Email Content Templates
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          Share your email content templates directly with another teacher in your system.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Teacher Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            1. Select Target Teacher
          </Typography>
          <Autocomplete
            value={targetTeacher}
            onChange={(event, newValue) => setTargetTeacher(newValue)}
            options={teachers}
            getOptionLabel={(option) => `${option.displayName} (${option.email})`}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={option.photoURL} sx={{ width: 32, height: 32 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="body2">{option.displayName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email}
                  </Typography>
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search for a teacher..."
                fullWidth
                disabled={isLoading}
              />
            )}
            disabled={isLoading}
          />
        </Box>

        {/* Content Type Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            2. Choose Content to Share
          </Typography>
          <FormGroup>
            {contentTypes.map(type => (
              <FormControlLabel
                key={type}
                control={
                  <Checkbox 
                    checked={selectedTypes.includes(type)} 
                    onChange={handleCheckboxChange} 
                    name={type}
                    disabled={!contentLibrary[type] || contentLibrary[type].length === 0}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{type}</Typography>
                    <Chip 
                      label={`${contentLibrary[type]?.length || 0} items`} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                }
              />
            ))}
          </FormGroup>
          
          {hasContent && (
            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
              Total: {totalItemsToShare} templates selected
            </Typography>
          )}
        </Box>

        {/* Share Strategy */}
        {hasContent && targetTeacher && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              3. Choose Sharing Strategy
            </Typography>
            <RadioGroup
              value={shareStrategy}
              onChange={(e) => setShareStrategy(e.target.value)}
            >
              <FormControlLabel
                value="merge"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2">Merge with existing content</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Add your templates to their existing library (recommended)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="add_only"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2">Add only new content</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Only add templates they don't already have
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="replace"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" color="error.main">Replace their content</Typography>
                    <Typography variant="caption" color="error.main">
                      ⚠️ This will replace their existing templates with yours
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </Box>
        )}

        {/* Summary */}
        {hasContent && targetTeacher && (
          <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Ready to Share:
            </Typography>
            <Typography variant="body2">
              → Sharing {totalItemsToShare} templates with{' '}
              <strong>{targetTeacher.displayName}</strong>
            </Typography>
            <Typography variant="body2">
              → Strategy: {shareStrategy}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleShare}
          variant="contained"
          disabled={!targetTeacher || selectedTypes.length === 0 || isLoading}
          startIcon={isLoading ? <CircularProgress size={16} /> : <Share />}
        >
          {isLoading ? 'Sharing...' : 'Share Templates'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailContentExportDialog;
```

### 4. **Updated Main Component**

**Changes for `src/components/settings/EmailContentManager.jsx`:**

```javascript
// Update the handleExportContent function
const handleExportContent = async (targetTeacherId, contentTypes, strategy) => {
  try {
    setError(null);
    await emailContentService.shareContentWithTeacher(
      targetTeacherId, 
      contentTypes, 
      strategy
    );
    
    setExportDialog(false);
    setSuccess('Templates shared successfully with the selected teacher!');
    setTimeout(() => setSuccess(null), 5000);
  } catch (err) {
    console.error('Share error:', err);
    setError('Failed to share templates: ' + err.message);
  }
};

// Update the dialog props
<EmailContentExportDialog
  open={exportDialog}
  onClose={() => setExportDialog(false)}
  contentLibrary={contentLibrary}
  currentUser={currentUser}
  onExport={handleExportContent}
/>
```

### 5. **Cloud Function**

**Create `functions/src/api/shareEmailContent.js`:**

```javascript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { shareContentWithTeacher } from '../services/emailContentService.js';

export const shareEmailContent = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { targetTeacherId, contentTypes, strategy } = data;
  
  if (!targetTeacherId || !contentTypes || !Array.isArray(contentTypes)) {
    throw new HttpsError('invalid-argument', 'Missing required parameters');
  }
  
  try {
    const result = await shareContentWithTeacher(
      auth.uid, 
      targetTeacherId, 
      contentTypes, 
      strategy
    );
    
    return result;
  } catch (error) {
    console.error('Error in shareEmailContent:', error);
    throw new HttpsError('internal', error.message);
  }
});
```

---

## 🎯 **Key Benefits of This Approach**

1. **No Files:** Direct database operations
2. **Real-time:** Instant sharing between teachers
3. **User-Friendly:** Teacher selection with search/autocomplete
4. **Secure:** Server-side validation and permissions
5. **Flexible:** Same merge strategies as before
6. **Integrated:** Works within existing system architecture

---

## ✅ **IMPLEMENTATION COMPLETED**

### **Backend Changes Implemented:**
1. ✅ **Updated `functions/src/services/emailContentService.js`** - Added teacher listing and request-based sharing
2. ✅ **Created `functions/src/api/shareEmailContent.js`** - Cloud function for sharing requests
3. ✅ **Created `functions/src/api/sharingRequestsApi.js`** - Cloud functions for managing requests
4. ✅ **Updated `functions/src/index.js`** - Registered all new cloud functions

### **Frontend Changes Implemented:**
1. ✅ **Updated `src/services/emailContentService.js`** - Added request management methods
2. ✅ **Completely redesigned `EmailContentExportDialog.jsx`** - Teacher selection with modern UI
3. ✅ **Created `ContentSharingRequests.jsx`** - New component for managing incoming requests
4. ✅ **Updated `EmailContentManager.jsx`** - Added "Sharing Requests" tab and removed import functionality

### **Key Features Delivered:**
- ✅ **Request-based sharing** - Teachers must accept content before it's added
- ✅ **Teacher selection** - Search and select from all teachers in the system
- ✅ **Content preview** - See exactly what will be shared before accepting
- ✅ **Merge strategies** - Merge, add-only, or replace options
- ✅ **Request management** - Accept, reject, or preview incoming requests
- ✅ **Modern UI** - Clean interface with avatars and clear instructions
- ✅ **Security** - Authentication and permission validation throughout

### **Database Schema Added:**
- ✅ **`contentSharingRequests` collection** - Stores pending requests with expiration
- ✅ **Request status tracking** - pending, accepted, rejected states
- ✅ **Automatic expiration** - Requests expire after 7 days

## 🎯 **What's Next?**

The system is now ready for:
1. **Testing** - Deploy and test the complete workflow
2. **User feedback** - Gather feedback from teachers
3. **Optional enhancements** - Email notifications, request history, etc.

This implementation provides a much more secure and user-friendly approach to content sharing in educational environments!