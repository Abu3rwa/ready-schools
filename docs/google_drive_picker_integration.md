# Google Drive Picker Integration Plan

## Current Implementation
- Custom GoogleDrivePicker component using Material-UI
- Backend OAuth flow and Drive API integration
- File browsing with search, pagination, and error handling

## Migration Plan to react-google-drive-picker

### Required Changes

1. Frontend Changes:
   - Install react-google-drive-picker package
   - Replace current GoogleDrivePicker.jsx with new implementation
   - Update any components that use the picker to handle new response format
   - Configure Google OAuth client ID and developer key
   - Configure Cross-Origin-Opener-Policy settings

2. Backend Changes:
   - Simplify driveApi.js since OAuth flow will be handled by the picker
   - Remove unused Drive API endpoints
   - Keep user Drive token storage for other features if needed
   - Configure proper CORS and security headers

### Implementation Steps

1. Package Installation
```bash
npm install react-google-drive-picker
```

2. Configuration Requirements
- Google OAuth Client ID (existing)
- Google Developer Key (new requirement)
- Update environment variables
- Configure security headers:
  ```
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  ```

3. Component Updates
- Create new GoogleDrivePicker component using the package
- Implement callback handling for selected files
- Handle authentication and errors
- Preserve existing UX features where possible
- Implement proper window handling for popup blockers

4. Security Configuration
- Update server/hosting configuration to set proper COOP headers
- For Firebase Hosting, add security headers in firebase.json:
  ```json
  {
    "hosting": {
      "headers": [
        {
          "source": "**",
          "headers": [
            {
              "key": "Cross-Origin-Opener-Policy",
              "value": "same-origin-allow-popups"
            }
          ]
        }
      ]
    }
  }
  ```

5. Testing Plan
- Test OAuth flow
- Test file selection
- Test error scenarios
- Test integration with existing components
- Test popup behavior across different browsers
- Verify security headers are properly set

### Benefits
- Simplified implementation
- Official Google Drive UI
- Reduced maintenance overhead
- Native Google Drive features

### Risks and Mitigations
1. Risk: Breaking changes for existing users
   - Mitigation: Thorough testing and graceful fallbacks

2. Risk: New authentication requirements
   - Mitigation: Clear documentation for developer key setup

3. Risk: Different file selection behavior
   - Mitigation: Update documentation and UI to reflect changes

4. Risk: Cross-origin security policies blocking picker
   - Mitigation: Proper security header configuration
   - Fallback to alternative authentication flow if needed

### Dependencies
- Google OAuth Client ID
- Google Developer Key
- react-google-drive-picker ^1.0.0
- Proper security header configuration

### Security Considerations
1. Cross-Origin-Opener-Policy (COOP)
   - Configure COOP header to allow popups
   - Test across different hosting environments
   - Document header requirements for different deployment scenarios

2. Popup Handling
   - Implement proper window.opener handling
   - Add user guidance for popup blockers
   - Consider fallback for environments where popups are blocked