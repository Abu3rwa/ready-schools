# Students Page Implementation Plan

## Overview

The Students page provides comprehensive student management capabilities with multi-tenant data isolation, advanced filtering and search, bulk operations, and role-based access control. It serves as the central hub for all student-related activities within an organization.

## Page Purpose

- **Primary**: Manage student information and records
- **Secondary**: Handle student enrollment and guardian relationships
- **Tertiary**: Provide student analytics and insights

## Multi-Tenancy Requirements

### Organization Context
- All student data scoped to current organization
- Student records include organizationId for data isolation
- Guardian information scoped to organization
- Student analytics organization-specific

### Permission-Based Access
- **Teachers**: View and manage assigned students only
- **Administrators**: Full access to all students in organization
- **Super Admins**: System-wide student access

## Page Structure

### 1. Page Header
```jsx
<PageHeader>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Box>
      <Typography variant="h4" gutterBottom>
        Students - {organization.name}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Manage {students.length} students across {classes.length} classes
      </Typography>
    </Box>
    
    <Box sx={{ display: 'flex', gap: 2 }}>
      <PermissionGate requiredPermissions={['manage_students']}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddStudentDialogOpen(true)}
        >
          Add Student
        </Button>
      </PermissionGate>
      
      <PermissionGate requiredPermissions={['manage_students']}>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => setBulkImportDialogOpen(true)}
        >
          Bulk Import
        </Button>
      </PermissionGate>
      
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleExportStudents}
      >
        Export
      </Button>
    </Box>
  </Box>
</PageHeader>
```

### 2. Advanced Filters and Search
```jsx
<AdvancedFilters>
  <Grid container spacing={2} sx={{ mb: 3 }}>
    {/* Search Bar */}
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        placeholder="Search students by name, ID, or email..."
        value={filters.searchTerm}
        onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
        }}
      />
    </Grid>
    
    {/* Grade Level Filter */}
    <Grid item xs={12} sm={6} md={2}>
      <FormControl fullWidth>
        <InputLabel>Grade Level</InputLabel>
        <Select
          value={filters.gradeLevel}
          onChange={(e) => setFilters(prev => ({ ...prev, gradeLevel: e.target.value }))}
        >
          <MenuItem value="">All Grades</MenuItem>
          {gradeLevels.map(grade => (
            <MenuItem key={grade.id} value={grade.id}>
              {grade.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
    
    {/* Status Filter */}
    <Grid item xs={12} sm={6} md={2}>
      <FormControl fullWidth>
        <InputLabel>Status</InputLabel>
        <Select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
          <MenuItem value="graduated">Graduated</MenuItem>
          <MenuItem value="transferred">Transferred</MenuItem>
        </Select>
      </FormControl>
    </Grid>
    
    {/* Class Filter */}
    <Grid item xs={12} sm={6} md={2}>
      <FormControl fullWidth>
        <InputLabel>Class</InputLabel>
        <Select
          value={filters.classId}
          onChange={(e) => setFilters(prev => ({ ...prev, classId: e.target.value }))}
        >
          <MenuItem value="">All Classes</MenuItem>
          {classes.map(cls => (
            <MenuItem key={cls.id} value={cls.id}>
              {cls.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
    
    {/* Advanced Filters Toggle */}
    <Grid item xs={12} sm={6} md={2}>
      <Button
        fullWidth
        variant="outlined"
        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        endIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      >
        Advanced
      </Button>
    </Grid>
  </Grid>
  
  {/* Advanced Filters Panel */}
  {showAdvancedFilters && (
    <Collapse in={showAdvancedFilters}>
      <Grid container spacing={2} sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Special Programs</InputLabel>
            <Select
              multiple
              value={filters.specialPrograms}
              onChange={(e) => setFilters(prev => ({ ...prev, specialPrograms: e.target.value }))}
            >
              <MenuItem value="special_education">Special Education</MenuItem>
              <MenuItem value="english_language_learner">English Language Learner</MenuItem>
              <MenuItem value="gifted_talented">Gifted & Talented</MenuItem>
              <MenuItem value="free_reduced_lunch">Free/Reduced Lunch</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Enrollment Date Range</InputLabel>
            <Select
              value={filters.enrollmentRange}
              onChange={(e) => setFilters(prev => ({ ...prev, enrollmentRange: e.target.value }))}
            >
              <MenuItem value="">All Time</MenuItem>
              <MenuItem value="this_year">This Year</MenuItem>
              <MenuItem value="last_year">Last Year</MenuItem>
              <MenuItem value="last_30_days">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Min Age"
            type="number"
            value={filters.minAge}
            onChange={(e) => setFilters(prev => ({ ...prev, minAge: e.target.value }))}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Max Age"
            type="number"
            value={filters.maxAge}
            onChange={(e) => setFilters(prev => ({ ...prev, maxAge: e.target.value }))}
          />
        </Grid>
      </Grid>
    </Collapse>
  )}
</AdvancedFilters>
```

### 3. Student List with Bulk Actions
```jsx
<StudentList>
  {/* Bulk Actions Bar */}
  {selectedStudents.length > 0 && (
    <BulkActionsBar>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'primary.light', color: 'white' }}>
        <Typography variant="body2">
          {selectedStudents.length} students selected
        </Typography>
        
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={() => setSelectedStudents([])}
        >
          Clear Selection
        </Button>
        
        <Divider orientation="vertical" flexItem />
        
        <PermissionGate requiredPermissions={['manage_students']}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<EditIcon />}
            onClick={() => setBulkEditDialogOpen(true)}
          >
            Bulk Edit
          </Button>
        </PermissionGate>
        
        <PermissionGate requiredPermissions={['manage_students']}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<DeleteIcon />}
            onClick={() => setBulkDeleteDialogOpen(true)}
          >
            Bulk Delete
          </Button>
        </PermissionGate>
        
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<EmailIcon />}
          onClick={() => setBulkEmailDialogOpen(true)}
        >
          Send Email
        </Button>
      </Box>
    </BulkActionsBar>
  )}
  
  {/* Student Table */}
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox">
            <Checkbox
              checked={selectedStudents.length === students.length}
              indeterminate={selectedStudents.length > 0 && selectedStudents.length < students.length}
              onChange={handleSelectAll}
            />
          </TableCell>
          <TableCell>Student</TableCell>
          <TableCell>Student ID</TableCell>
          <TableCell>Grade Level</TableCell>
          <TableCell>Classes</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Guardian</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      
      <TableBody>
        {paginatedStudents.map((student) => (
          <TableRow key={student.id} hover>
            <TableCell padding="checkbox">
              <Checkbox
                checked={selectedStudents.includes(student.id)}
                onChange={() => handleSelectStudent(student.id)}
              />
            </TableCell>
            
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={student.avatarUrl} sx={{ width: 40, height: 40 }}>
                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {student.firstName} {student.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {student.email}
                  </Typography>
                </Box>
              </Box>
            </TableCell>
            
            <TableCell>
              <Typography variant="body2" fontFamily="monospace">
                {student.studentId}
              </Typography>
            </TableCell>
            
            <TableCell>
              <Chip 
                label={student.gradeLevel.name} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </TableCell>
            
            <TableCell>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {student.enrolledClasses.map(cls => (
                  <Chip 
                    key={cls.id} 
                    label={cls.name} 
                    size="small" 
                    variant="outlined"
                  />
                ))}
              </Box>
            </TableCell>
            
            <TableCell>
              <StatusChip status={student.status} />
            </TableCell>
            
            <TableCell>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {student.guardians.map(guardian => (
                  <Typography key={guardian.id} variant="body2">
                    {guardian.firstName} {guardian.lastName}
                  </Typography>
                ))}
              </Box>
            </TableCell>
            
            <TableCell>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => handleViewStudent(student)}
                  title="View Details"
                >
                  <VisibilityIcon />
                </IconButton>
                
                <PermissionGate requiredPermissions={['manage_students']}>
                  <IconButton
                    size="small"
                    onClick={() => handleEditStudent(student)}
                    title="Edit Student"
                  >
                    <EditIcon />
                  </IconButton>
                </PermissionGate>
                
                <PermissionGate requiredPermissions={['manage_students']}>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteStudent(student)}
                    title="Delete Student"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </PermissionGate>
                
                <Menu
                  anchorEl={studentMenuAnchor}
                  open={studentMenuAnchor === student.id}
                  onClose={() => setStudentMenuAnchor(null)}
                >
                  <MenuItem onClick={() => handleViewGrades(student)}>
                    <ListItemIcon><GradeIcon /></ListItemIcon>
                    View Grades
                  </MenuItem>
                  <MenuItem onClick={() => handleViewAttendance(student)}>
                    <ListItemIcon><CheckCircleIcon /></ListItemIcon>
                    View Attendance
                  </MenuItem>
                  <MenuItem onClick={() => handleViewBehavior(student)}>
                    <ListItemIcon><ReportIcon /></ListItemIcon>
                    View Behavior
                  </MenuItem>
                  <MenuItem onClick={() => handleSendMessage(student)}>
                    <ListItemIcon><MessageIcon /></ListItemIcon>
                    Send Message
                  </MenuItem>
                </Menu>
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
</StudentList>
```

### 4. Pagination and Results Summary
```jsx
<TablePagination
  component="div"
  count={filteredStudents.length}
  page={page}
  onPageChange={(event, newPage) => setPage(newPage)}
  rowsPerPage={rowsPerPage}
  onRowsPerPageChange={(event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }}
  rowsPerPageOptions={[10, 25, 50, 100]}
  labelRowsPerPage="Students per page:"
  labelDisplayedRows={({ from, to, count }) => 
    `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
  }
/>

<ResultsSummary>
  <Typography variant="body2" color="text.secondary">
    Showing {filteredStudents.length} of {totalStudents} students
    {filters.searchTerm && ` matching "${filters.searchTerm}"`}
    {filters.gradeLevel && ` in ${getGradeLevelName(filters.gradeLevel)}`}
    {filters.status && ` with status "${filters.status}"`}
  </Typography>
</ResultsSummary>
```

## Component Implementation

### 1. Student Card Component
```jsx
const StudentCard = ({ student, onSelect, selected, onEdit, onDelete }) => {
  const { organization } = useOrganization();
  const theme = useOrganizationTheme(organization);
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid',
        borderColor: selected ? 'primary.main' : 'divider'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Checkbox
            checked={selected}
            onChange={() => onSelect(student.id)}
          />
          
          <Avatar 
            src={student.avatarUrl} 
            sx={{ width: 56, height: 56 }}
          >
            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              {student.firstName} {student.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {student.studentId}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" onClick={() => onEdit(student)}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => onDelete(student)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Grade Level
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {student.gradeLevel.name}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <StatusChip status={student.status} />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Classes
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {student.enrolledClasses.slice(0, 3).map(cls => (
                <Chip 
                  key={cls.id} 
                  label={cls.name} 
                  size="small" 
                  variant="outlined"
                />
              ))}
              {student.enrolledClasses.length > 3 && (
                <Chip 
                  label={`+${student.enrolledClasses.length - 3} more`} 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
```

### 2. Add/Edit Student Dialog
```jsx
const StudentDialog = ({ open, student, onSave, onClose }) => {
  const { organization } = useOrganization();
  const [formData, setFormData] = useState({
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    email: student?.email || '',
    dateOfBirth: student?.dateOfBirth || null,
    gender: student?.gender || '',
    gradeLevelId: student?.gradeLevelId || '',
    specialPrograms: student?.specialPrograms || [],
    guardianEmails: student?.guardianEmails || [''],
    notes: student?.notes || ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateStudentForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    try {
      const studentData = {
        ...formData,
        organizationId: organization.id,
        guardianEmails: formData.guardianEmails.filter(email => email.trim())
      };
      
      if (student) {
        await studentService.updateStudent(student.id, studentData);
      } else {
        await studentService.createStudent(studentData);
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving student:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {student ? 'Edit Student' : 'Add New Student'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
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
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Date of Birth"
                value={formData.dateOfBirth}
                onChange={(date) => setFormData(prev => ({ ...prev, dateOfBirth: date }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                  <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Grade Level</InputLabel>
                <Select
                  value={formData.gradeLevelId}
                  onChange={(e) => setFormData(prev => ({ ...prev, gradeLevelId: e.target.value }))}
                  required
                >
                  {gradeLevels.map(grade => (
                    <MenuItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Guardian Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Guardian Information
              </Typography>
            </Grid>
            
            {formData.guardianEmails.map((email, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <TextField
                  fullWidth
                  label={`Guardian ${index + 1} Email`}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const newEmails = [...formData.guardianEmails];
                    newEmails[index] = e.target.value;
                    setFormData(prev => ({ ...prev, guardianEmails: newEmails }));
                  }}
                />
              </Grid>
            ))}
            
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  guardianEmails: [...prev.guardianEmails, ''] 
                }))}
              >
                Add Another Guardian
              </Button>
            </Grid>
            
            {/* Special Programs */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Special Programs
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.specialPrograms.includes('special_education')}
                        onChange={(e) => {
                          const programs = e.target.checked
                            ? [...formData.specialPrograms, 'special_education']
                            : formData.specialPrograms.filter(p => p !== 'special_education');
                          setFormData(prev => ({ ...prev, specialPrograms: programs }));
                        }}
                      />
                    }
                    label="Special Education"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.specialPrograms.includes('english_language_learner')}
                        onChange={(e) => {
                          const programs = e.target.checked
                            ? [...formData.specialPrograms, 'english_language_learner']
                            : formData.specialPrograms.filter(p => p !== 'english_language_learner');
                          setFormData(prev => ({ ...prev, specialPrograms: programs }));
                        }}
                      />
                    }
                    label="English Language Learner"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.specialPrograms.includes('gifted_talented')}
                        onChange={(e) => {
                          const programs = e.target.checked
                            ? [...formData.specialPrograms, 'gifted_talented']
                            : formData.specialPrograms.filter(p => p !== 'gifted_talented');
                          setFormData(prev => ({ ...prev, specialPrograms: programs }));
                        }}
                      />
                    }
                    label="Gifted & Talented"
                  />
                </FormGroup>
              </FormControl>
            </Grid>
            
            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the student..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Saving...' : (student ? 'Update Student' : 'Add Student')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
```

## Data Management

### 1. Students Data Hook
```jsx
const useStudents = (organizationId, filters) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await studentService.getStudents(organizationId, filters);
      setStudents(response.data);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId, filters]);
  
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);
  
  return { students, loading, error, totalCount, refetch: fetchStudents };
};
```

### 2. Advanced Filtering Hook
```jsx
const useAdvancedFilters = (students) => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    gradeLevel: '',
    status: '',
    classId: '',
    specialPrograms: [],
    enrollmentRange: '',
    minAge: '',
    maxAge: ''
  });
  
  const filteredStudents = useMemo(() => {
    let filtered = students;
    
    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.firstName.toLowerCase().includes(term) ||
        student.lastName.toLowerCase().includes(term) ||
        student.studentId.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term)
      );
    }
    
    // Grade level filter
    if (filters.gradeLevel) {
      filtered = filtered.filter(student => 
        student.gradeLevelId === filters.gradeLevel
      );
    }
    
    // Status filter
    if (filters.status) {
      filtered = filtered.filter(student => 
        student.status === filters.status
      );
    }
    
    // Class filter
    if (filters.classId) {
      filtered = filtered.filter(student => 
        student.enrolledClasses.some(cls => cls.id === filters.classId)
      );
    }
    
    // Special programs filter
    if (filters.specialPrograms.length > 0) {
      filtered = filtered.filter(student => 
        filters.specialPrograms.some(program => 
          student.specialPrograms.includes(program)
        )
      );
    }
    
    // Age filter
    if (filters.minAge || filters.maxAge) {
      filtered = filtered.filter(student => {
        const age = calculateAge(student.dateOfBirth);
        if (filters.minAge && age < parseInt(filters.minAge)) return false;
        if (filters.maxAge && age > parseInt(filters.maxAge)) return false;
        return true;
      });
    }
    
    return filtered;
  }, [students, filters]);
  
  return { filters, setFilters, filteredStudents };
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
    viewMode: isMobile ? 'cards' : 'table',
    columns: isMobile ? 1 : isTablet ? 2 : 3,
    spacing: isMobile ? 1 : 2
  };
};
```

### 2. Responsive Table
```jsx
const ResponsiveTable = ({ students, onSelect, selectedStudents }) => {
  const { isMobile } = useResponsiveLayout();
  
  if (isMobile) {
    return (
      <Grid container spacing={2}>
        {students.map(student => (
          <Grid item xs={12} key={student.id}>
            <StudentCard
              student={student}
              selected={selectedStudents.includes(student.id)}
              onSelect={onSelect}
            />
          </Grid>
        ))}
      </Grid>
    );
  }
  
  return (
    <TableContainer component={Paper}>
      <Table>
        {/* Table implementation */}
      </Table>
    </TableContainer>
  );
};
```

## Performance Optimization

### 1. Virtual Scrolling for Large Lists
```jsx
const VirtualizedStudentList = ({ students, itemHeight = 80 }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef();
  
  const visibleCount = Math.ceil(containerRef.current?.clientHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount, students.length);
  
  const visibleStudents = students.slice(startIndex, endIndex);
  
  return (
    <div
      ref={containerRef}
      style={{ height: '600px', overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: students.length * itemHeight }}>
        <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
          {visibleStudents.map(student => (
            <StudentRow key={student.id} student={student} height={itemHeight} />
          ))}
        </div>
      </div>
    </div>
  );
};
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
class StudentListErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Student List Error:', error, errorInfo);
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

### 2. Loading States
```jsx
const StudentListSkeleton = () => (
  <Box sx={{ p: 2 }}>
    <Grid container spacing={2}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Skeleton variant="circular" width={56} height={56} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
              </Box>
              <Skeleton variant="rectangular" height={60} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
);
```

## Testing Strategy

### 1. Unit Tests
```jsx
describe('Student Components', () => {
  test('StudentCard displays student information correctly', () => {
    const student = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      studentId: 'S123',
      gradeLevel: { name: '10th Grade' },
      status: 'active'
    };
    
    render(<StudentCard student={student} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('S123')).toBeInTheDocument();
    expect(screen.getByText('10th Grade')).toBeInTheDocument();
  });

  test('Advanced filters work correctly', () => {
    render(<AdvancedFilters filters={filters} onFiltersChange={setFilters} />);
    
    fireEvent.change(screen.getByLabelText('Grade Level'), { target: { value: '10' } });
    expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ gradeLevel: '10' }));
  });
});
```

### 2. Integration Tests
```jsx
describe('Student List Integration', () => {
  test('loads and displays students for organization', async () => {
    render(<StudentList />);
    
    await waitFor(() => {
      expect(screen.getByText('Loading...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Students - Test School')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

## Implementation Roadmap

### Week 1: Foundation
- Create basic student list layout
- Implement student card and table views
- Add basic filtering and search
- Create student data hooks

### Week 2: Advanced Features
- Implement advanced filtering system
- Add bulk operations
- Create add/edit student dialog
- Implement pagination

### Week 3: Enhancement
- Add responsive design
- Implement performance optimizations
- Add error handling
- Create loading states

### Week 4: Testing & Polish
- Write comprehensive tests
- Add accessibility features
- Performance testing
- User acceptance testing

## Success Metrics

- **Page Load Time**: < 2 seconds
- **Search Performance**: < 100ms for filtered results
- **Bulk Operations**: Support for 100+ students
- **Responsiveness**: 100% mobile compatibility
- **Data Accuracy**: 100% organization isolation

## Dependencies

- **Frontend**: React 18+, Material-UI v5, React Query
- **Backend**: Student service, guardian service, enrollment service
- **External**: date-fns for date handling, react-window for virtualization
- **Testing**: Jest, React Testing Library, MSW for API mocking
