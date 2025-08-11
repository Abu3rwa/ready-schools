# Organization Management Page Implementation Plan

## Overview

The Organization Management page provides comprehensive control over organization settings, user management, subscription handling, and branding customization. It serves as the administrative hub for managing all aspects of the organization within the multi-tenant SaaS platform.

## Page Purpose

- **Primary**: Manage organization profile and settings
- **Secondary**: Handle user roles and permissions
- **Tertiary**: Manage subscription and billing
- **Quaternary**: Customize organization branding

## Multi-Tenancy Requirements

### Organization Context
- All operations scoped to current organization
- Organization-specific settings and configurations
- User management within organization boundaries
- Subscription management per organization

### Permission-Based Access
- **Organization Administrators**: Full access to organization settings
- **Super Admins**: System-wide organization management
- **Regular Users**: Read-only access to organization profile

## Page Structure

### 1. Page Header with Organization Info
```jsx
<PageHeader>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Box>
      <Typography variant="h4" gutterBottom>
        Organization Management
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Manage {organization.name} settings and configuration
      </Typography>
    </Box>
    
    <Box sx={{ display: 'flex', gap: 2 }}>
      <PermissionGate requiredPermissions={['manage_organization']}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveAll}
          disabled={!hasUnsavedChanges}
        >
          Save All Changes
        </Button>
      </PermissionGate>
      
      <Button
        variant="outlined"
        startIcon={<HistoryIcon />}
        onClick={() => setShowChangeHistory(true)}
      >
        Change History
      </Button>
    </Box>
  </Box>
</PageHeader>
```

### 2. Tabbed Interface
```jsx
<TabbedInterface>
  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
    <Tabs 
      value={activeTab} 
      onChange={(event, newValue) => setActiveTab(newValue)}
      variant="scrollable"
      scrollButtons="auto"
    >
      <Tab label="Profile" icon={<BusinessIcon />} />
      <Tab label="Users" icon={<PeopleIcon />} />
      <Tab label="Billing" icon={<PaymentIcon />} />
      <Tab label="Branding" icon={<PaletteIcon />} />
      <Tab label="Settings" icon={<SettingsIcon />} />
      <Tab label="Security" icon={<SecurityIcon />} />
      <Tab label="Integrations" icon={<IntegrationIcon />} />
      <Tab label="Analytics" icon={<AnalyticsIcon />} />
    </Tabs>
  </Box>
  
  {/* Tab Content */}
  {activeTab === 0 && <OrganizationProfile organization={organization} onUpdate={handleProfileUpdate} />}
  {activeTab === 1 && <UserManagement organizationId={organization.id} />}
  {activeTab === 2 && <BillingManagement organization={organization} />}
  {activeTab === 3 && <BrandingSettings organization={organization} onUpdate={handleBrandingUpdate} />}
  {activeTab === 4 && <OrganizationSettings organization={organization} onUpdate={handleSettingsUpdate} />}
  {activeTab === 5 && <SecuritySettings organization={organization} onUpdate={handleSecurityUpdate} />}
  {activeTab === 6 && <IntegrationSettings organization={organization} onUpdate={handleIntegrationUpdate} />}
  {activeTab === 7 && <OrganizationAnalytics organizationId={organization.id} />}
</TabbedInterface>
```

## Tab Implementations

### 1. Organization Profile Tab
```jsx
const OrganizationProfile = ({ organization, onUpdate }) => {
  const [profileData, setProfileData] = useState({
    name: organization.name || '',
    type: organization.type || 'school',
    subdomain: organization.subdomain || '',
    customDomain: organization.customDomain || '',
    address: organization.address || {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US'
    },
    phone: organization.phone || '',
    website: organization.website || '',
    timezone: organization.timezone || 'America/New_York',
    dateFormat: organization.dateFormat || 'MM/DD/YYYY',
    academicYear: organization.academicYear || {
      start: null,
      end: null
    }
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateProfileForm(profileData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    try {
      await onUpdate(profileData);
      // Show success message
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Organization Name"
            value={profileData.name}
            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Organization Type</InputLabel>
            <Select
              value={profileData.type}
              onChange={(e) => setProfileData(prev => ({ ...prev, type: e.target.value }))}
            >
              <MenuItem value="school">School</MenuItem>
              <MenuItem value="district">School District</MenuItem>
              <MenuItem value="network">School Network</MenuItem>
              <MenuItem value="university">University</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Subdomain"
            value={profileData.subdomain}
            onChange={(e) => setProfileData(prev => ({ ...prev, subdomain: e.target.value }))}
            error={!!errors.subdomain}
            helperText={errors.subdomain || 'Will be used for custom URLs (e.g., yourschool.teacherdashboard.com)'}
            InputProps={{
              endAdornment: <Typography variant="body2" color="text.secondary">.teacherdashboard.com</Typography>
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Custom Domain (Optional)"
            value={profileData.customDomain}
            onChange={(e) => setProfileData(prev => ({ ...prev, customDomain: e.target.value }))}
            error={!!errors.customDomain}
            helperText={errors.customDomain || 'e.g., portal.yourschool.edu'}
          />
        </Grid>
        
        {/* Address Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Address Information
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address Line 1"
            value={profileData.address.line1}
            onChange={(e) => setProfileData(prev => ({ 
              ...prev, 
              address: { ...prev.address, line1: e.target.value } 
            }))}
            error={!!errors.address?.line1}
            helperText={errors.address?.line1}
            required
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address Line 2 (Optional)"
            value={profileData.address.line2}
            onChange={(e) => setProfileData(prev => ({ 
              ...prev, 
              address: { ...prev.address, line2: e.target.value } 
            }))}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="City"
            value={profileData.address.city}
            onChange={(e) => setProfileData(prev => ({ 
              ...prev, 
              address: { ...prev.address, city: e.target.value } 
            }))}
            error={!!errors.address?.city}
            helperText={errors.address?.city}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="State/Province"
            value={profileData.address.state}
            onChange={(e) => setProfileData(prev => ({ 
              ...prev, 
              address: { ...prev.address, state: e.target.value } 
            }))}
            error={!!errors.address?.state}
            helperText={errors.address?.state}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Postal Code"
            value={profileData.address.postalCode}
            onChange={(e) => setProfileData(prev => ({ 
              ...prev, 
              address: { ...prev.address, postalCode: e.target.value } 
            }))}
            error={!!errors.address?.postalCode}
            helperText={errors.address?.postalCode}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Country</InputLabel>
            <Select
              value={profileData.address.country}
              onChange={(e) => setProfileData(prev => ({ 
                ...prev, 
                address: { ...prev.address, country: e.target.value } 
              }))}
            >
              <MenuItem value="US">United States</MenuItem>
              <MenuItem value="CA">Canada</MenuItem>
              <MenuItem value="GB">United Kingdom</MenuItem>
              <MenuItem value="AU">Australia</MenuItem>
              {/* Add more countries */}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Contact Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Contact Information
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={profileData.phone}
            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            error={!!errors.phone}
            helperText={errors.phone}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Website"
            value={profileData.website}
            onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
            error={!!errors.website}
            helperText={errors.website}
          />
        </Grid>
        
        {/* Regional Settings */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Regional Settings
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Timezone</InputLabel>
            <Select
              value={profileData.timezone}
              onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
            >
              <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
              <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
              <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
              <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
              <MenuItem value="Europe/London">London (GMT)</MenuItem>
              <MenuItem value="Europe/Paris">Paris (CET)</MenuItem>
              <MenuItem value="Asia/Tokyo">Tokyo (JST)</MenuItem>
              {/* Add more timezones */}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Date Format</InputLabel>
            <Select
              value={profileData.dateFormat}
              onChange={(e) => setProfileData(prev => ({ ...prev, dateFormat: e.target.value }))}
            >
              <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (US)</MenuItem>
              <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (UK)</MenuItem>
              <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Academic Year */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Academic Year
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Academic Year Start"
            value={profileData.academicYear.start}
            onChange={(date) => setProfileData(prev => ({ 
              ...prev, 
              academicYear: { ...prev.academicYear, start: date } 
            }))}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Academic Year End"
            value={profileData.academicYear.end}
            onChange={(date) => setProfileData(prev => ({ 
              ...prev, 
              academicYear: { ...prev.academicYear, end: date } 
            }))}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
        <Button variant="outlined" onClick={() => setProfileData(organization)}>
          Reset Changes
        </Button>
      </Box>
    </Box>
  );
};
```

### 2. User Management Tab
```jsx
const UserManagement = ({ organizationId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const { data: usersData, loading: usersLoading, refetch } = useUsers(organizationId);
  
  const handleInviteUsers = async (inviteData) => {
    try {
      await userService.inviteUsers(organizationId, inviteData);
      refetch();
      setInviteDialogOpen(false);
    } catch (error) {
      console.error('Error inviting users:', error);
    }
  };
  
  const handleBulkRoleUpdate = async (newRole) => {
    try {
      await userService.updateUserRoles(organizationId, selectedUsers, newRole);
      refetch();
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error updating user roles:', error);
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Users ({usersData?.length || 0})
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <PermissionGate requiredPermissions={['manage_users']}>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setInviteDialogOpen(true)}
            >
              Invite Users
            </Button>
          </PermissionGate>
          
          {selectedUsers.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setBulkRoleDialogOpen(true)}
            >
              Bulk Update ({selectedUsers.length})
            </Button>
          )}
        </Box>
      </Box>
      
      {/* User List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedUsers.length === usersData?.length}
                  indeterminate={selectedUsers.length > 0 && selectedUsers.length < usersData?.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(usersData?.map(u => u.id) || []);
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                />
              </TableCell>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {usersData?.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(prev => [...prev, user.id]);
                      } else {
                        setSelectedUsers(prev => prev.filter(id => id !== user.id));
                      }
                    }}
                  />
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={user.avatarUrl}>
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <RoleChip role={user.role} />
                </TableCell>
                
                <TableCell>
                  <StatusChip status={user.status} />
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditUser(user)}
                      title="Edit User"
                    >
                      <EditIcon />
                    </IconButton>
                    
                    <PermissionGate requiredPermissions={['manage_users']}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeactivateUser(user)}
                        title="Deactivate User"
                      >
                        <BlockIcon />
                      </IconButton>
                    </PermissionGate>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Invite Users Dialog */}
      <InviteUsersDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onSubmit={handleInviteUsers}
        organizationId={organizationId}
      />
    </Box>
  );
};
```

### 3. Branding Settings Tab
```jsx
const BrandingSettings = ({ organization, onUpdate }) => {
  const [brandingData, setBrandingData] = useState({
    logoUrl: organization.branding?.logoUrl || '',
    primaryColor: organization.branding?.primaryColor || '#3f51b5',
    secondaryColor: organization.branding?.secondaryColor || '#f50057',
    fontFamily: organization.branding?.fontFamily || 'Roboto',
    customCSS: organization.branding?.customCSS || ''
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  const handleLogoUpload = async (file) => {
    try {
      const uploadedUrl = await uploadService.uploadLogo(organization.id, file);
      setBrandingData(prev => ({ ...prev, logoUrl: uploadedUrl }));
    } catch (error) {
      console.error('Error uploading logo:', error);
    }
  };
  
  const handlePreview = () => {
    setPreviewMode(true);
    // Apply branding to preview
  };
  
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Logo Upload */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Logo & Branding
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box sx={{ textAlign: 'center', p: 3, border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
            {brandingData.logoUrl ? (
              <Box>
                <img 
                  src={brandingData.logoUrl} 
                  alt="Organization Logo" 
                  style={{ maxWidth: '200px', maxHeight: '100px' }}
                />
                <Button
                  variant="outlined"
                  onClick={() => setLogoFile(null)}
                  sx={{ mt: 2 }}
                >
                  Remove Logo
                </Button>
              </Box>
            ) : (
              <Box>
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Upload your organization logo
                </Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setLogoFile(file);
                      handleLogoUpload(file);
                    }
                  }}
                  style={{ display: 'none' }}
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button variant="outlined" component="span">
                    Choose File
                  </Button>
                </label>
              </Box>
            )}
          </Box>
        </Grid>
        
        {/* Color Scheme */}
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" gutterBottom>
            Color Scheme
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Primary Color
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <input
                  type="color"
                  value={brandingData.primaryColor}
                  onChange={(e) => setBrandingData(prev => ({ ...prev, primaryColor: e.target.value }))}
                  style={{ width: '50px', height: '40px', border: 'none', borderRadius: '4px' }}
                />
                <TextField
                  value={brandingData.primaryColor}
                  onChange={(e) => setBrandingData(prev => ({ ...prev, primaryColor: e.target.value }))}
                  size="small"
                />
              </Box>
            </Box>
            
            <Box>
              <Typography variant="body2" gutterBottom>
                Secondary Color
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <input
                  type="color"
                  value={brandingData.secondaryColor}
                  onChange={(e) => setBrandingData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  style={{ width: '50px', height: '40px', border: 'none', borderRadius: '4px' }}
                />
                <TextField
                  value={brandingData.secondaryColor}
                  onChange={(e) => setBrandingData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        </Grid>
        
        {/* Typography */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Typography
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Font Family</InputLabel>
            <Select
              value={brandingData.fontFamily}
              onChange={(e) => setBrandingData(prev => ({ ...prev, fontFamily: e.target.value }))}
            >
              <MenuItem value="Roboto">Roboto (Default)</MenuItem>
              <MenuItem value="Open Sans">Open Sans</MenuItem>
              <MenuItem value="Lato">Lato</MenuItem>
              <MenuItem value="Montserrat">Montserrat</MenuItem>
              <MenuItem value="Source Sans Pro">Source Sans Pro</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Custom CSS */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Custom CSS (Advanced)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={8}
            value={brandingData.customCSS}
            onChange={(e) => setBrandingData(prev => ({ ...prev, customCSS: e.target.value }))}
            placeholder="/* Add custom CSS rules here */"
            helperText="Add custom CSS to further customize your organization's appearance"
          />
        </Grid>
        
        {/* Preview */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={handlePreview}
            >
              Preview Changes
            </Button>
            
            <Button
              variant="contained"
              onClick={() => onUpdate(brandingData)}
            >
              Save Branding
            </Button>
          </Box>
        </Grid>
      </Grid>
      
      {/* Preview Modal */}
      <Dialog
        open={previewMode}
        onClose={() => setPreviewMode(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Branding Preview
          <IconButton
            onClick={() => setPreviewMode(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ 
            p: 3, 
            bgcolor: 'background.paper',
            '--primary-color': brandingData.primaryColor,
            '--secondary-color': brandingData.secondaryColor,
            '--font-family': brandingData.fontFamily
          }}>
            {/* Preview content with applied branding */}
            <PreviewContent branding={brandingData} />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
```

## Data Management

### 1. Organization Data Hook
```jsx
const useOrganization = (organizationId) => {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchOrganization = useCallback(async () => {
    try {
      setLoading(true);
      const response = await organizationService.getOrganization(organizationId);
      setOrganization(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);
  
  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);
  
  const updateOrganization = useCallback(async (updateData) => {
    try {
      const response = await organizationService.updateOrganization(organizationId, updateData);
      setOrganization(response.data);
      return response.data;
    } catch (err) {
      throw err;
    }
  }, [organizationId]);
  
  return { 
    organization, 
    loading, 
    error, 
    refetch: fetchOrganization,
    updateOrganization 
  };
};
```

### 2. Change Tracking Hook
```jsx
const useChangeTracking = (initialData) => {
  const [currentData, setCurrentData] = useState(initialData);
  const [originalData] = useState(initialData);
  
  const hasChanges = useMemo(() => {
    return JSON.stringify(currentData) !== JSON.stringify(originalData);
  }, [currentData, originalData]);
  
  const resetChanges = useCallback(() => {
    setCurrentData(originalData);
  }, [originalData]);
  
  const applyChanges = useCallback((newData) => {
    setCurrentData(newData);
  }, []);
  
  return {
    currentData,
    hasChanges,
    resetChanges,
    applyChanges
  };
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
    tabOrientation: isMobile ? 'vertical' : 'horizontal',
    spacing: isMobile ? 2 : 3
  };
};
```

### 2. Responsive Tabs
```jsx
const ResponsiveTabs = ({ children, value, onChange }) => {
  const { isMobile } = useResponsiveLayout();
  
  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {React.Children.map(children, (child, index) => (
          <Accordion 
            expanded={value === index}
            onChange={() => onChange(null, index)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              {child.props.label}
            </AccordionSummary>
            <AccordionDetails>
              {child}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  }
  
  return (
    <Tabs value={value} onChange={onChange} variant="scrollable">
      {children}
    </Tabs>
  );
};
```

## Performance Optimization

### 1. Lazy Loading Tabs
```jsx
const LazyTabContent = ({ tabIndex, children }) => {
  const [loadedTabs, setLoadedTabs] = useState(new Set([0]));
  
  useEffect(() => {
    if (!loadedTabs.has(tabIndex)) {
      setLoadedTabs(prev => new Set([...prev, tabIndex]));
    }
  }, [tabIndex, loadedTabs]);
  
  if (!loadedTabs.has(tabIndex)) {
    return <TabSkeleton />;
  }
  
  return children;
};
```

### 2. Debounced Updates
```jsx
const useDebouncedUpdate = (updateFunction, delay = 1000) => {
  const timeoutRef = useRef();
  
  const debouncedUpdate = useCallback((data) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateFunction(data);
    }, delay);
  }, [updateFunction, delay]);
  
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);
  
  return debouncedUpdate;
};
```

## Error Handling

### 1. Error Boundaries
```jsx
class OrganizationManagementErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Organization Management Error:', error, errorInfo);
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
const validateProfileForm = (data) => {
  const errors = {};
  
  if (!data.name.trim()) {
    errors.name = 'Organization name is required';
  }
  
  if (data.subdomain && !/^[a-z0-9-]+$/.test(data.subdomain)) {
    errors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
  }
  
  if (data.customDomain && !isValidDomain(data.customDomain)) {
    errors.customDomain = 'Please enter a valid domain';
  }
  
  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }
  
  if (data.website && !isValidUrl(data.website)) {
    errors.website = 'Please enter a valid website URL';
  }
  
  return errors;
};
```

## Testing Strategy

### 1. Unit Tests
```jsx
describe('Organization Management Components', () => {
  test('OrganizationProfile validates required fields', () => {
    render(<OrganizationProfile organization={mockOrganization} onUpdate={jest.fn()} />);
    
    const submitButton = screen.getByText('Save Profile');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Organization name is required')).toBeInTheDocument();
  });

  test('BrandingSettings updates color values', () => {
    render(<BrandingSettings organization={mockOrganization} onUpdate={jest.fn()} />);
    
    const colorInput = screen.getByDisplayValue('#3f51b5');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });
    
    expect(colorInput.value).toBe('#ff0000');
  });
});
```

### 2. Integration Tests
```jsx
describe('Organization Management Integration', () => {
  test('saves organization profile changes', async () => {
    const mockUpdate = jest.fn();
    render(<OrganizationProfile organization={mockOrganization} onUpdate={mockUpdate} />);
    
    const nameInput = screen.getByLabelText('Organization Name');
    fireEvent.change(nameInput, { target: { value: 'New School Name' } });
    
    const submitButton = screen.getByText('Save Profile');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New School Name' })
      );
    });
  });
});
```

## Implementation Roadmap

### Week 1: Foundation
- Create basic tabbed interface
- Implement organization profile form
- Add basic validation
- Create organization data hooks

### Week 2: Core Features
- Implement user management
- Add branding settings
- Create subscription management
- Add security settings

### Week 3: Enhancement
- Add responsive design
- Implement change tracking
- Add preview functionality
- Create integration settings

### Week 4: Testing & Polish
- Write comprehensive tests
- Add accessibility features
- Performance testing
- User acceptance testing

## Success Metrics

- **Page Load Time**: < 2 seconds
- **Form Validation**: 100% field validation
- **Change Tracking**: Accurate change detection
- **Responsiveness**: 100% mobile compatibility
- **User Experience**: > 90% user satisfaction

## Dependencies

- **Frontend**: React 18+, Material-UI v5, React Query
- **Backend**: Organization service, user service, billing service
- **External**: date-fns for date handling, color-picker for color selection
- **Testing**: Jest, React Testing Library, MSW for API mocking
