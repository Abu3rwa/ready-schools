# Login & Auth Page Implementation Plan

## Overview

The Login & Auth page provides multi-tenant authentication with organization selection, secure login mechanisms, and comprehensive user onboarding. It serves as the entry point for all users and handles organization context establishment.

## Page Purpose

- **Primary**: Multi-tenant user authentication
- **Secondary**: Organization selection and validation
- **Tertiary**: User onboarding and account setup
- **Quaternary**: Password reset and account recovery

## Multi-Tenancy Requirements

### Organization Context
- Users must select organization before authentication
- Organization validation during login process
- Multi-organization user support
- Organization-specific branding and customization

### Permission-Based Access
- **All Users**: Basic authentication and organization selection
- **Organization Admins**: User invitation and management
- **Super Admins**: System-wide access and organization management

## Page Structure

### 1. Organization Selection Screen
```jsx
const OrganizationSelection = ({ onOrganizationSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { data: orgsData, loading: orgsLoading } = useOrganizations();
  
  const filteredOrganizations = useMemo(() => {
    if (!searchTerm) return orgsData || [];
    
    return (orgsData || []).filter(org => 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orgsData, searchTerm]);
  
  const handleOrganizationSelect = (organization) => {
    onOrganizationSelect(organization);
  };
  
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default',
      p: 2
    }}>
      <Card sx={{ maxWidth: 600, width: '100%', p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Welcome to Teacher Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select your organization to continue
          </Typography>
        </Box>
        
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search for your organization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ mb: 3 }}
        />
        
        {/* Organization List */}
        {orgsLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading organizations...
            </Typography>
          </Box>
        ) : filteredOrganizations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm ? 'No organizations found' : 'No organizations available'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Contact your administrator to get started'
              }
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredOrganizations.map((org) => (
              <Card
                key={org.id}
                sx={{ 
                  mb: 2, 
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background-color 0.2s'
                }}
                onClick={() => handleOrganizationSelect(org)}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {org.branding?.logoUrl ? (
                    <img 
                      src={org.branding.logoUrl} 
                      alt={`${org.name} logo`}
                      style={{ width: 48, height: 48, borderRadius: '4px' }}
                    />
                  ) : (
                    <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                      {org.name.charAt(0)}
                    </Avatar>
                  )}
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="medium">
                      {org.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {org.type} • {org.address?.city}, {org.address?.state}
                    </Typography>
                    {org.subdomain && (
                      <Typography variant="caption" color="primary">
                        {org.subdomain}.teacherdashboard.com
                      </Typography>
                    )}
                  </Box>
                  
                  <ChevronRightIcon color="action" />
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
        
        {/* Organization Not Listed */}
        <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Don't see your organization?
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateOrgDialog(true)}
          >
            Create New Organization
          </Button>
        </Box>
      </Card>
    </Box>
  );
};
```

### 2. Login Form with Organization Context
```jsx
const LoginForm = ({ organization, onLogin, onBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateLoginForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    try {
      await onLogin(formData.email, formData.password, organization.id);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default',
      p: 2
    }}>
      <Card sx={{ maxWidth: 500, width: '100%', p: 4 }}>
        {/* Organization Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ position: 'absolute', left: 16, top: 16 }}
          >
            Back
          </Button>
          
          {organization.branding?.logoUrl ? (
            <img 
              src={organization.branding.logoUrl} 
              alt={`${organization.name} logo`}
              style={{ width: 80, height: 80, marginBottom: 16 }}
            />
          ) : (
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
              {organization.name.charAt(0)}
            </Avatar>
          )}
          
          <Typography variant="h4" gutterBottom fontWeight="bold">
            {organization.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to your account
          </Typography>
        </Box>
        
        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            error={!!errors.email}
            helperText={errors.email}
            required
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            error={!!errors.password}
            helperText={errors.password}
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: (
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              )
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                />
              }
              label="Remember me"
            />
            
            <Button
              variant="text"
              onClick={() => setShowForgotPassword(true)}
              sx={{ textTransform: 'none' }}
            >
              Forgot password?
            </Button>
          </Box>
          
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.submit}
            </Alert>
          )}
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mb: 3 }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          
          {/* Alternative Sign-in Options */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Or sign in with
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <IconButton
                onClick={() => handleGoogleSignIn(organization.id)}
                sx={{ 
                  border: 1, 
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <GoogleIcon />
              </IconButton>
              
              <IconButton
                onClick={() => handleMicrosoftSignIn(organization.id)}
                sx={{ 
                  border: 1, 
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <MicrosoftIcon />
              </IconButton>
            </Box>
          </Box>
          
          {/* Sign Up Link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Don't have an account?
            </Typography>
            <Button
              variant="text"
              onClick={() => setShowSignUpDialog(true)}
              sx={{ textTransform: 'none' }}
            >
              Contact your administrator
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};
```

### 3. Forgot Password Dialog
```jsx
const ForgotPasswordDialog = ({ open, onClose, organizationId }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    try {
      await authService.sendPasswordResetEmail(email, organizationId);
      setSuccess(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Reset Password
      </DialogTitle>
      
      <DialogContent>
        {!success ? (
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
            
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!error}
              helperText={error}
              required
              sx={{ mb: 3 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Reset Link Sent
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              We've sent a password reset link to {email}. Please check your email and follow the instructions.
            </Typography>
            <Button variant="contained" onClick={onClose}>
              Close
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
```

### 4. Create Organization Dialog
```jsx
const CreateOrganizationDialog = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'school',
    subdomain: '',
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    adminPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateCreateOrgForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubdomainChange = (value) => {
    const subdomain = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, subdomain }));
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Create New Organization
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={step - 1} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Organization Details</StepLabel>
          </Step>
          <Step>
            <StepLabel>Admin Account</StepLabel>
          </Step>
          <Step>
            <StepLabel>Review & Create</StepLabel>
          </Step>
        </Stepper>
        
        <Box component="form" onSubmit={handleSubmit}>
          {step === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Organization Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Organization Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Organization Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <MenuItem value="school">School</MenuItem>
                    <MenuItem value="district">School District</MenuItem>
                    <MenuItem value="network">School Network</MenuItem>
                    <MenuItem value="university">University</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subdomain"
                  value={formData.subdomain}
                  onChange={(e) => handleSubdomainChange(e.target.value)}
                  error={!!errors.subdomain}
                  helperText={errors.subdomain || 'This will be your unique URL (e.g., yourschool.teacherdashboard.com)'}
                  required
                  InputProps={{
                    endAdornment: <Typography variant="body2" color="text.secondary">.teacherdashboard.com</Typography>
                  }}
                />
              </Grid>
            </Grid>
          )}
          
          {step === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Administrator Account
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  This will be your account for managing the organization.
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.adminFirstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminFirstName: e.target.value }))}
                  error={!!errors.adminFirstName}
                  helperText={errors.adminFirstName}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.adminLastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminLastName: e.target.value }))}
                  error={!!errors.adminLastName}
                  helperText={errors.adminLastName}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                  error={!!errors.adminEmail}
                  helperText={errors.adminEmail}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                  error={!!errors.adminPassword}
                  helperText={errors.adminPassword}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  required
                />
              </Grid>
            </Grid>
          )}
          
          {step === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Review Your Organization
              </Typography>
              
              <Card sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Organization Name
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formData.name}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Organization Type
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formData.type}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Subdomain
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formData.subdomain}.teacherdashboard.com
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Administrator
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formData.adminFirstName} {formData.adminLastName} ({formData.adminEmail})
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Important</AlertTitle>
                By creating this organization, you agree to our terms of service and privacy policy. 
                You will be the administrator with full control over the organization.
              </Alert>
            </Box>
          )}
          
          {errors.submit && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {errors.submit}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              disabled={loading}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              {step < 3 && (
                <Button
                  variant="contained"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceedToNextStep()}
                >
                  Next
                </Button>
              )}
              
              {step === 3 && (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Organization'}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
```

## Component Implementation

### 1. Multi-Tenant Authentication Hook
```jsx
const useMultiTenantAuth = () => {
  const [authState, setAuthState] = useState({
    user: null,
    organization: null,
    loading: true,
    error: null
  });
  
  const [currentStep, setCurrentStep] = useState('organization-selection');
  
  const login = async (email, password, organizationId) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Verify organization membership
      const membership = await verifyOrganizationMembership(
        userCredential.user.uid, 
        organizationId
      );
      
      if (!membership) {
        throw new Error('User not authorized for this organization');
      }
      
      // Set organization context
      setAuthState({
        user: { ...userCredential.user, ...membership.user },
        organization: membership.organization,
        loading: false,
        error: null
      });
      
      // Store in localStorage for persistence
      localStorage.setItem('currentOrganization', organizationId);
      localStorage.setItem('authUser', JSON.stringify(userCredential.user));
      
      return { user: userCredential.user, organization: membership.organization };
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      await signOut(auth);
      setAuthState({
        user: null,
        organization: null,
        loading: false,
        error: null
      });
      
      // Clear localStorage
      localStorage.removeItem('currentOrganization');
      localStorage.removeItem('authUser');
      
      // Reset to organization selection
      setCurrentStep('organization-selection');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const verifyOrganizationMembership = async (userId, organizationId) => {
    const userDoc = await getDoc(
      doc(db, `organizations/${organizationId}/users`, userId)
    );
    
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data();
    const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
    
    if (!orgDoc.exists()) return null;
    
    return {
      user: userData,
      organization: orgDoc.data()
    };
  };
  
  const createOrganization = async (orgData) => {
    try {
      // Create organization document
      const orgRef = await addDoc(collection(db, 'organizations'), {
        ...orgData,
        createdAt: serverTimestamp(),
        status: 'active',
        subscription: {
          plan: 'trial',
          status: 'active',
          trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });
      
      // Create admin user
      const adminUser = await createUserWithEmailAndPassword(
        auth, 
        orgData.adminEmail, 
        orgData.adminPassword
      );
      
      // Add user to organization
      await setDoc(
        doc(db, `organizations/${orgRef.id}/users`, adminUser.user.uid),
        {
          firstName: orgData.adminFirstName,
          lastName: orgData.adminLastName,
          email: orgData.adminEmail,
          role: 'org_admin',
          permissions: ['manage_organization', 'manage_users', 'manage_students'],
          status: 'active',
          createdAt: serverTimestamp()
        }
      );
      
      return { organizationId: orgRef.id, userId: adminUser.user.uid };
    } catch (error) {
      throw error;
    }
  };
  
  return {
    ...authState,
    currentStep,
    setCurrentStep,
    login,
    logout,
    createOrganization
  };
};
```

### 2. Organization Context Provider
```jsx
const OrganizationContext = createContext();

const OrganizationProvider = ({ children }) => {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const setCurrentOrganization = useCallback((org) => {
    setOrganization(org);
    // Apply organization branding
    applyOrganizationBranding(org);
  }, []);
  
  const applyOrganizationBranding = useCallback((org) => {
    if (org.branding) {
      // Update CSS custom properties
      document.documentElement.style.setProperty(
        '--primary-color', 
        org.branding.primaryColor || '#3f51b5'
      );
      document.documentElement.style.setProperty(
        '--secondary-color', 
        org.branding.secondaryColor || '#f50057'
      );
      document.documentElement.style.setProperty(
        '--font-family', 
        org.branding.fontFamily || 'Roboto, sans-serif'
      );
      
      // Apply custom CSS if provided
      if (org.branding.customCSS) {
        const styleId = 'organization-custom-css';
        let styleElement = document.getElementById(styleId);
        
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = org.branding.customCSS;
      }
    }
  }, []);
  
  return (
    <OrganizationContext.Provider value={{
      organization,
      setCurrentOrganization,
      loading,
      setLoading
    }}>
      {children}
    </OrganizationContext.Provider>
  );
};

const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};
```

## Data Management

### 1. Organizations Data Hook
```jsx
const useOrganizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await organizationService.getPublicOrganizations();
      setOrganizations(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);
  
  return { 
    organizations, 
    loading, 
    error, 
    refetch: fetchOrganizations 
  };
};
```

### 2. Authentication State Management
```jsx
const useAuthState = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  return { user, loading };
};
```

## Responsive Design

### 1. Mobile-First Layout
```jsx
const useResponsiveLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  return {
    isMobile,
    isTablet,
    cardWidth: isMobile ? '100%' : isTablet ? '90%' : '600px',
    padding: isMobile ? 2 : 4
  };
};
```

### 2. Responsive Organization Cards
```jsx
const ResponsiveOrganizationCard = ({ organization, onClick }) => {
  const { isMobile } = useResponsiveLayout();
  
  return (
    <Card
      sx={{ 
        cursor: 'pointer',
        '&:hover': { bgcolor: 'action.hover' },
        transition: 'background-color 0.2s',
        p: isMobile ? 2 : 3
      }}
      onClick={onClick}
    >
      <CardContent sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? 1 : 2,
        p: isMobile ? 1 : 2
      }}>
        {organization.branding?.logoUrl ? (
          <img 
            src={organization.branding.logoUrl} 
            alt={`${organization.name} logo`}
            style={{ 
              width: isMobile ? 40 : 48, 
              height: isMobile ? 40 : 48, 
              borderRadius: '4px' 
            }}
          />
        ) : (
          <Avatar sx={{ 
            width: isMobile ? 40 : 48, 
            height: isMobile ? 40 : 48, 
            bgcolor: 'primary.main' 
          }}>
            {organization.name.charAt(0)}
          </Avatar>
        )}
        
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography 
            variant={isMobile ? 'body1' : 'h6'} 
            fontWeight="medium"
            noWrap
          >
            {organization.name}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            noWrap
          >
            {organization.type} • {organization.address?.city}, {organization.address?.state}
          </Typography>
          {organization.subdomain && (
            <Typography 
              variant="caption" 
              color="primary"
              noWrap
            >
              {organization.subdomain}.teacherdashboard.com
            </Typography>
          )}
        </Box>
        
        <ChevronRightIcon color="action" />
      </CardContent>
    </Card>
  );
};
```

## Performance Optimization

### 1. Lazy Loading Components
```jsx
const LazyLoginForm = lazy(() => import('./LoginForm'));
const LazyForgotPassword = lazy(() => import('./ForgotPasswordDialog'));
const LazyCreateOrganization = lazy(() => import('./CreateOrganizationDialog'));

const AuthPage = () => (
  <Suspense fallback={<AuthSkeleton />}>
    <LazyLoginForm />
  </Suspense>
);
```

### 2. Debounced Search
```jsx
const useDebouncedSearch = (searchTerm, delay = 300) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);
  
  return debouncedTerm;
};
```

## Error Handling

### 1. Error Boundaries
```jsx
class AuthErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Auth Error:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          resetError={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}
```

### 2. Validation and Error Display
```jsx
const validateLoginForm = (data) => {
  const errors = {};
  
  if (!data.email.trim()) {
    errors.email = 'Email address is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!data.password) {
    errors.password = 'Password is required';
  }
  
  return errors;
};

const validateCreateOrgForm = (data) => {
  const errors = {};
  
  if (!data.name.trim()) {
    errors.name = 'Organization name is required';
  }
  
  if (!data.subdomain.trim()) {
    errors.subdomain = 'Subdomain is required';
  } else if (!/^[a-z0-9-]+$/.test(data.subdomain)) {
    errors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
  }
  
  if (!data.adminEmail.trim()) {
    errors.adminEmail = 'Admin email is required';
  } else if (!isValidEmail(data.adminEmail)) {
    errors.adminEmail = 'Please enter a valid email address';
  }
  
  if (!data.adminFirstName.trim()) {
    errors.adminFirstName = 'First name is required';
  }
  
  if (!data.adminLastName.trim()) {
    errors.adminLastName = 'Last name is required';
  }
  
  if (!data.adminPassword) {
    errors.adminPassword = 'Password is required';
  } else if (data.adminPassword.length < 8) {
    errors.adminPassword = 'Password must be at least 8 characters long';
  }
  
  if (data.adminPassword !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return errors;
};
```

## Testing Strategy

### 1. Unit Tests
```jsx
describe('Authentication Components', () => {
  test('OrganizationSelection filters organizations correctly', () => {
    render(<OrganizationSelection onOrganizationSelect={jest.fn()} />);
    
    const searchInput = screen.getByPlaceholderText('Search for your organization...');
    fireEvent.change(searchInput, { target: { value: 'Test School' } });
    
    expect(screen.getByText('Test School')).toBeInTheDocument();
  });

  test('LoginForm validates required fields', () => {
    render(<LoginForm organization={mockOrganization} onLogin={jest.fn()} />);
    
    const submitButton = screen.getByText('Sign In');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Email address is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests
```jsx
describe('Authentication Integration', () => {
  test('successful login sets organization context', async () => {
    const mockLogin = jest.fn();
    render(<LoginForm organization={mockOrganization} onLogin={mockLogin} />);
    
    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByText('Sign In');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        mockOrganization.id
      );
    });
  });
});
```

## Implementation Roadmap

### Week 1: Foundation
- Create organization selection screen
- Implement basic login form
- Add organization context provider
- Create authentication hooks

### Week 2: Core Features
- Implement multi-tenant authentication
- Add password reset functionality
- Create organization creation flow
- Add social authentication

### Week 3: Enhancement
- Add responsive design
- Implement error handling
- Add loading states
- Create validation system

### Week 4: Testing & Polish
- Write comprehensive tests
- Add accessibility features
- Performance testing
- User acceptance testing

## Success Metrics

- **Page Load Time**: < 2 seconds
- **Authentication Success Rate**: > 95%
- **Organization Selection**: 100% accuracy
- **Responsiveness**: 100% mobile compatibility
- **User Experience**: > 90% user satisfaction

## Dependencies

- **Frontend**: React 18+, Material-UI v5, Firebase Auth
- **Backend**: Authentication service, organization service
- **External**: Firebase Authentication, social login providers
- **Testing**: Jest, React Testing Library, MSW for API mocking
