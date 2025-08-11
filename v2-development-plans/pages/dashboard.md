 # Dashboard Page Implementation Plan

## Overview

The Dashboard page serves as the central hub for teachers and administrators, providing organization-specific metrics, quick access to key features, and real-time insights based on subscription tiers and user roles.

## Page Purpose

- **Primary**: Display organization-specific metrics and KPIs
- **Secondary**: Provide quick access to frequently used features
- **Tertiary**: Show subscription status and available features

## Multi-Tenancy Requirements

### Organization Context
- All data must be scoped to the current organization
- Metrics and KPIs are organization-specific
- Feature availability based on subscription tier
- Organization branding and customization

### Permission-Based Access
- **Teachers**: View assigned classes and students
- **Administrators**: View school-wide metrics
- **Super Admins**: View system-wide analytics

## Page Structure

### 1. Page Header
```jsx
<PageHeader>
  <OrganizationBanner 
    name={organization.name}
    logo={organization.branding.logoUrl}
    primaryColor={organization.branding.primaryColor}
  />
  <SubscriptionTierBanner 
    plan={organization.subscription.plan}
    status={organization.subscription.status}
    daysUntilRenewal={organization.subscription.daysUntilRenewal}
  />
  <QuickActions>
    <AddStudentButton />
    <RecordAttendanceButton />
    <SendDailyUpdateButton />
    <GenerateReportButton />
  </QuickActions>
</PageHeader>
```

### 2. Main Dashboard Grid
```jsx
<DashboardGrid>
  {/* Row 1: Key Metrics */}
  <MetricsRow>
    <MetricCard 
      title="Total Students"
      value={metrics.totalStudents}
      change={metrics.studentChange}
      icon={<PeopleIcon />}
      color="primary"
    />
    <MetricCard 
      title="Attendance Rate"
      value={`${metrics.attendanceRate}%`}
      change={metrics.attendanceChange}
      icon={<CheckCircleIcon />}
      color="success"
    />
    <MetricCard 
      title="Average Grade"
      value={metrics.averageGrade}
      change={metrics.gradeChange}
      icon={<SchoolIcon />}
      color="info"
    />
    <MetricCard 
      title="Active Classes"
      value={metrics.activeClasses}
      change={metrics.classChange}
      icon={<ClassIcon />}
      color="warning"
    />
  </MetricsRow>

  {/* Row 2: Charts and Analytics */}
  <ChartsRow>
    <ChartCard 
      title="Attendance Trends"
      component={<AttendanceChart data={attendanceData} />}
      subscriptionRequired="standard"
    />
    <ChartCard 
      title="Grade Distribution"
      component={<GradeDistributionChart data={gradeData} />}
      subscriptionRequired="basic"
    />
  </ChartsRow>

  {/* Row 3: Recent Activity */}
  <ActivityRow>
    <RecentActivityCard 
      title="Recent Activity"
      activities={recentActivities}
      subscriptionRequired="basic"
    />
    <UpcomingEventsCard 
      title="Upcoming Events"
      events={upcomingEvents}
      subscriptionRequired="standard"
    />
  </ActivityRow>
</DashboardGrid>
```

### 3. Sidebar Navigation
```jsx
<DashboardSidebar>
  <NavigationMenu>
    <NavItem icon={<DashboardIcon />} label="Dashboard" active />
    <NavItem icon={<PeopleIcon />} label="Students" />
    <NavItem icon={<CheckCircleIcon />} label="Attendance" />
    <NavItem icon={<SchoolIcon />} label="Grades" />
    <NavItem icon={<AssignmentIcon />} label="Assignments" />
    <NavItem icon={<ReportIcon />} label="Reports" />
    <NavItem icon={<MessageIcon />} label="Communication" />
  </NavigationMenu>
  
  <QuickStats>
    <QuickStat label="Today's Attendance" value="95%" />
    <QuickStat label="Pending Grades" value="12" />
    <QuickStat label="Unread Messages" value="3" />
  </QuickStats>
</DashboardSidebar>
```

## Component Implementation

### 1. Organization Banner Component
```jsx
const OrganizationBanner = ({ organization }) => {
  const theme = useOrganizationTheme(organization);
  
  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        color: 'white',
        p: 3,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}
    >
      {organization.branding.logoUrl && (
        <Avatar
          src={organization.branding.logoUrl}
          sx={{ width: 56, height: 56 }}
        />
      )}
      <Box>
        <Typography variant="h4" fontWeight="bold">
          {organization.name}
        </Typography>
        <Typography variant="body1" opacity={0.9}>
          Welcome back, {user.displayName}
        </Typography>
      </Box>
    </Box>
  );
};
```

### 2. Subscription Tier Banner
```jsx
const SubscriptionTierBanner = ({ subscription }) => {
  const getTierColor = (plan) => {
    switch (plan) {
      case 'premium': return 'success';
      case 'standard': return 'info';
      case 'basic': return 'warning';
      default: return 'default';
    }
  };

  const getTierFeatures = (plan) => {
    const features = {
      basic: ['Attendance', 'Grades', 'Basic Reports'],
      standard: ['Behavior Tracking', 'Communication', 'Advanced Reports'],
      premium: ['Analytics', 'API Access', 'Custom Branding', 'Priority Support']
    };
    return features[plan] || [];
  };

  return (
    <Alert 
      severity={getTierColor(subscription.plan)}
      sx={{ mb: 2 }}
      action={
        subscription.status === 'active' ? (
          <Button color="inherit" size="small">
            Upgrade Plan
          </Button>
        ) : (
          <Button color="inherit" size="small">
            Reactivate
          </Button>
        )
      }
    >
      <AlertTitle>
        {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
      </AlertTitle>
      {subscription.status === 'active' ? (
        <>
          <Typography variant="body2">
            Your plan includes: {getTierFeatures(subscription.plan).join(', ')}
          </Typography>
          {subscription.daysUntilRenewal <= 7 && (
            <Typography variant="body2" color="warning.main">
              Renews in {subscription.daysUntilRenewal} days
            </Typography>
          )}
        </>
      ) : (
        <Typography variant="body2">
          Your subscription is {subscription.status}. Please reactivate to continue.
        </Typography>
      )}
    </Alert>
  );
};
```

### 3. Metric Card Component
```jsx
const MetricCard = ({ title, value, change, icon, color }) => {
  const isPositive = change >= 0;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main` }}>
            {icon}
          </Avatar>
          <Box sx={{ ml: 'auto' }}>
            <Chip
              label={`${isPositive ? '+' : ''}${change}%`}
              color={isPositive ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </Box>
        
        <Typography variant="h4" component="div" fontWeight="bold">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};
```

### 4. Chart Card Component
```jsx
const ChartCard = ({ title, component, subscriptionRequired }) => {
  const { organization } = useOrganization();
  const hasAccess = useFeatureFlag(subscriptionRequired);
  
  if (!hasAccess) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <LockIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Available on {subscriptionRequired} plan and above
            </Typography>
            <Button variant="outlined" size="small">
              Upgrade Plan
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title={title} />
      <CardContent>
        {component}
      </CardContent>
    </Card>
  );
};
```

## Data Management

### 1. Dashboard Data Hook
```jsx
const useDashboardData = (organizationId) => {
  const [data, setData] = useState({
    metrics: {},
    charts: {},
    activities: [],
    events: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getDashboardData(organizationId);
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { data, loading, error, refetch: fetchDashboardData };
};
```

### 2. Real-Time Updates
```jsx
const useRealTimeUpdates = (organizationId) => {
  useEffect(() => {
    if (!organizationId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'organizations', organizationId, 'dashboard', 'realtime'),
      (doc) => {
        if (doc.exists()) {
          // Update real-time metrics
          updateRealTimeMetrics(doc.data());
        }
      }
    );

    return () => unsubscribe();
  }, [organizationId]);
};
```

## Responsive Design

### 1. Mobile-First Layout
```jsx
const DashboardGrid = ({ children }) => (
  <Grid container spacing={2} sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
    {React.Children.map(children, (child, index) => (
      <Grid item xs={12} sm={6} md={4} lg={3}>
        {child}
      </Grid>
    ))}
  </Grid>
);
```

### 2. Responsive Breakpoints
```jsx
const useResponsiveLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  return {
    isMobile,
    isTablet,
    columns: isMobile ? 1 : isTablet ? 2 : 4,
    spacing: isMobile ? 1 : 2
  };
};
```

## Performance Optimization

### 1. Lazy Loading
```jsx
const LazyChart = lazy(() => import('./ChartComponent'));

const Dashboard = () => (
  <Suspense fallback={<ChartSkeleton />}>
    <LazyChart data={chartData} />
  </Suspense>
);
```

### 2. Data Caching
```jsx
const useCachedDashboardData = (organizationId) => {
  const queryKey = ['dashboard', organizationId];
  
  return useQuery({
    queryKey,
    queryFn: () => dashboardService.getDashboardData(organizationId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

## Error Handling

### 1. Error Boundaries
```jsx
class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
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
const DashboardSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
    <Grid container spacing={2}>
      {[1, 2, 3, 4].map((i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
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
describe('Dashboard Components', () => {
  test('MetricCard displays correct values', () => {
    render(<MetricCard title="Test" value="100" change={5} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  test('SubscriptionBanner shows upgrade button for basic plan', () => {
    const subscription = { plan: 'basic', status: 'active' };
    render(<SubscriptionTierBanner subscription={subscription} />);
    expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests
```jsx
describe('Dashboard Integration', () => {
  test('loads dashboard data for organization', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Loading...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Total Students')).toBeInTheDocument();
  });
});
```

## Implementation Roadmap

### Week 1: Foundation
- Create basic dashboard layout
- Implement organization banner
- Add subscription tier banner
- Create metric card components

### Week 2: Data Integration
- Implement dashboard data hooks
- Add real-time updates
- Create chart components
- Implement feature flagging

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
- **Metric Accuracy**: 100% data consistency
- **Feature Flagging**: Proper subscription-based access
- **Responsiveness**: 100% mobile compatibility
- **User Engagement**: > 80% daily active users

## Dependencies

- **Frontend**: React 18+, Material-UI v5, React Query
- **Backend**: Dashboard service, metrics service, real-time updates
- **External**: Chart.js for visualizations, date-fns for date handling
- **Testing**: Jest, React Testing Library, MSW for API mocking
