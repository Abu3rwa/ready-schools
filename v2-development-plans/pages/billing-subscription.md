# Billing & Subscription Page Implementation Plan

## Overview

The Billing & Subscription page provides comprehensive billing management, subscription handling, and payment processing for multi-tenant organizations. It serves as the central hub for managing subscription plans, billing cycles, and payment methods within the SaaS platform.

## Page Purpose

- **Primary**: Manage subscription plans and billing
- **Secondary**: Handle payment methods and invoices
- **Tertiary**: Provide usage analytics and billing insights
- **Quaternary**: Manage subscription upgrades and downgrades

## Multi-Tenancy Requirements

### Organization Context
- All billing data scoped to current organization
- Organization-specific subscription plans
- Custom billing cycles and payment terms
- Organization-specific usage tracking

### Permission-Based Access
- **Organization Administrators**: Full billing access
- **Billing Managers**: Billing and payment management
- **Regular Users**: Read-only billing information
- **Super Admins**: System-wide billing oversight

## Page Structure

### 1. Page Header with Subscription Status
```jsx
const BillingHeader = ({ organization, subscription }) => {
  const getSubscriptionStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'info';
      case 'past_due': return 'warning';
      case 'canceled': return 'error';
      default: return 'default';
    }
  };
  
  const getDaysUntilRenewal = () => {
    if (!subscription.nextBillingDate) return null;
    const now = new Date();
    const nextBilling = new Date(subscription.nextBillingDate);
    const diffTime = nextBilling - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Billing & Subscription
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your {organization.name} subscription and billing
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <PermissionGate requiredPermissions={['manage_billing']}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddPaymentMethod(true)}
            >
              Add Payment Method
            </Button>
          </PermissionGate>
          
          <PermissionGate requiredPermissions={['manage_billing']}>
            <Button
              variant="outlined"
              startIcon={<ReceiptIcon />}
              onClick={() => setShowBillingHistory(true)}
            >
              Billing History
            </Button>
          </PermissionGate>
        </Box>
      </Box>
      
      {/* Current Subscription Status */}
      <Card sx={{ p: 3, bgcolor: 'background.paper' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <SubscriptionIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {subscription.plan.name} Plan
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {subscription.plan.description}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  ${subscription.plan.price}/month
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Billed {subscription.billingCycle}
                </Typography>
              </Box>
              
              <Chip
                label={subscription.status}
                color={getSubscriptionStatusColor(subscription.status)}
                variant="outlined"
                size="large"
              />
            </Box>
          </Grid>
        </Grid>
        
        {/* Subscription Details */}
        <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Current Period
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {format(new Date(subscription.currentPeriodStart), 'MMM dd')} - {format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy')}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Next Billing
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {format(new Date(subscription.nextBillingDate), 'MMM dd, yyyy')}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Days Until Renewal
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {getDaysUntilRenewal()} days
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Auto-Renewal
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {subscription.autoRenew ? 'Enabled' : 'Disabled'}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        {/* Trial Information */}
        {subscription.status === 'trial' && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <AlertTitle>Trial Period</AlertTitle>
            Your trial ends on {format(new Date(subscription.trialEnd), 'MMM dd, yyyy')}. 
            Add a payment method to continue using the service after the trial period.
          </Alert>
        )}
        
        {/* Past Due Warning */}
        {subscription.status === 'past_due' && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            <AlertTitle>Payment Required</AlertTitle>
            Your payment is past due. Please update your payment method to avoid service interruption.
          </Alert>
        )}
      </Card>
    </Box>
  );
};
```

### 2. Subscription Plans Comparison
```jsx
const SubscriptionPlans = ({ currentPlan, onPlanChange }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  
  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      description: 'Essential features for small schools',
      features: [
        'Up to 100 students',
        'Basic attendance tracking',
        'Simple grade management',
        'Email support',
        'Basic reports'
      ],
      limitations: [
        'No advanced analytics',
        'No custom branding',
        'No API access'
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 79,
      description: 'Comprehensive features for growing schools',
      features: [
        'Up to 500 students',
        'Advanced attendance tracking',
        'Comprehensive grade management',
        'Behavior tracking',
        'Advanced reporting',
        'Custom branding',
        'Priority email support'
      ],
      limitations: [
        'No API access',
        'No white-label options'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 199,
      description: 'Enterprise features for large institutions',
      features: [
        'Unlimited students',
        'All Standard features',
        'Advanced analytics',
        'API access',
        'White-label options',
        'Custom integrations',
        'Phone support',
        'Dedicated account manager'
      ],
      limitations: []
    }
  ];
  
  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowChangePlanDialog(true);
  };
  
  const handlePlanChange = async (planId, billingCycle) => {
    try {
      await subscriptionService.changePlan(currentPlan.id, planId, billingCycle);
      onPlanChange();
      setShowChangePlanDialog(false);
    } catch (error) {
      console.error('Error changing plan:', error);
    }
  };
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Available Plans
      </Typography>
      
      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card 
              sx={{ 
                height: '100%',
                position: 'relative',
                border: currentPlan.plan.id === plan.id ? 2 : 1,
                borderColor: currentPlan.plan.id === plan.id ? 'primary.main' : 'divider'
              }}
            >
              {currentPlan.plan.id === plan.id && (
                <Chip
                  label="Current Plan"
                  color="primary"
                  sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    right: 16 
                  }}
                />
              )}
              
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
                    ${plan.price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    per month
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {plan.description}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Features */}
                <Typography variant="h6" gutterBottom>
                  What's included:
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {plan.features.map((feature, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography variant="body2">{feature}</Typography>
                    </Box>
                  ))}
                </Box>
                
                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Limitations:
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      {plan.limitations.map((limitation, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <CancelIcon color="error" fontSize="small" />
                          <Typography variant="body2" color="text.secondary">{limitation}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
                
                {/* Action Button */}
                <Box sx={{ mt: 'auto' }}>
                  {currentPlan.plan.id === plan.id ? (
                    <Button
                      fullWidth
                      variant="outlined"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handlePlanSelect(plan)}
                    >
                      {currentPlan.plan.price > plan.price ? 'Downgrade' : 'Upgrade'} to {plan.name}
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Change Plan Dialog */}
      <ChangePlanDialog
        open={showChangePlanDialog}
        onClose={() => setShowChangePlanDialog(false)}
        plan={selectedPlan}
        currentPlan={currentPlan}
        onSubmit={handlePlanChange}
      />
    </Box>
  );
};
```

### 3. Payment Methods Management
```jsx
const PaymentMethods = ({ organizationId, onPaymentMethodUpdate }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  
  const { data: methodsData, loading: methodsLoading, refetch } = usePaymentMethods(organizationId);
  
  const handleAddPaymentMethod = async (paymentData) => {
    try {
      await paymentService.addPaymentMethod(organizationId, paymentData);
      refetch();
      setShowAddDialog(false);
      onPaymentMethodUpdate();
    } catch (error) {
      console.error('Error adding payment method:', error);
    }
  };
  
  const handleUpdatePaymentMethod = async (methodId, paymentData) => {
    try {
      await paymentService.updatePaymentMethod(organizationId, methodId, paymentData);
      refetch();
      setShowEditDialog(false);
      setSelectedMethod(null);
      onPaymentMethodUpdate();
    } catch (error) {
      console.error('Error updating payment method:', error);
    }
  };
  
  const handleDeletePaymentMethod = async (methodId) => {
    try {
      await paymentService.deletePaymentMethod(organizationId, methodId);
      refetch();
      onPaymentMethodUpdate();
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };
  
  const handleSetDefault = async (methodId) => {
    try {
      await paymentService.setDefaultPaymentMethod(organizationId, methodId);
      refetch();
      onPaymentMethodUpdate();
    } catch (error) {
      console.error('Error setting default payment method:', error);
    }
  };
  
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Payment Methods
        </Typography>
        
        <PermissionGate requiredPermissions={['manage_billing']}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDialog(true)}
          >
            Add Payment Method
          </Button>
        </PermissionGate>
      </Box>
      
      {methodsLoading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading payment methods...
          </Typography>
        </Box>
      ) : methodsData?.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <CreditCardIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Payment Methods
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add a payment method to manage your subscription and billing.
          </Typography>
          <PermissionGate requiredPermissions={['manage_billing']}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddDialog(true)}
            >
              Add Payment Method
            </Button>
          </PermissionGate>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {methodsData?.map((method) => (
            <Grid item xs={12} md={6} key={method.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <CreditCardIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight="medium">
                        {method.brand} •••• {method.last4}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Expires {method.expMonth}/{method.expYear}
                      </Typography>
                    </Box>
                    
                    {method.isDefault && (
                      <Chip label="Default" color="primary" size="small" />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <PermissionGate requiredPermissions={['manage_billing']}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedMethod(method);
                          setShowEditDialog(true);
                        }}
                      >
                        Edit
                      </Button>
                    </PermissionGate>
                    
                    {!method.isDefault && (
                      <PermissionGate requiredPermissions={['manage_billing']}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          Set Default
                        </Button>
                      </PermissionGate>
                    )}
                    
                    <PermissionGate requiredPermissions={['manage_billing']}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                      >
                        Remove
                      </Button>
                    </PermissionGate>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Add Payment Method Dialog */}
      <AddPaymentMethodDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAddPaymentMethod}
      />
      
      {/* Edit Payment Method Dialog */}
      <EditPaymentMethodDialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedMethod(null);
        }}
        paymentMethod={selectedMethod}
        onSubmit={handleUpdatePaymentMethod}
      />
    </Box>
  );
};
```

### 4. Billing History and Invoices
```jsx
const BillingHistory = ({ organizationId }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  
  const { data: invoicesData, loading: invoicesLoading, refetch } = useInvoices(organizationId);
  
  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const response = await invoiceService.downloadInvoice(organizationId, invoiceId);
      // Handle file download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };
  
  const getInvoiceStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'void': return 'default';
      default: return 'default';
    }
  };
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Billing History
      </Typography>
      
      {invoicesLoading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading billing history...
          </Typography>
        </Box>
      ) : invoicesData?.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Billing History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your billing history will appear here once you have active subscriptions.
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {invoicesData?.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      #{invoice.number}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(invoice.date), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      ${invoice.amount}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      color={getInvoiceStatusColor(invoice.status)}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {invoice.planName}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowInvoiceDialog(true);
                        }}
                      >
                        View
                      </Button>
                      
                      {invoice.status === 'paid' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                        >
                          Download
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Invoice Details Dialog */}
      <InvoiceDetailsDialog
        open={showInvoiceDialog}
        onClose={() => {
          setShowInvoiceDialog(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onDownload={handleDownloadInvoice}
      />
    </Box>
  );
};
```

## Component Implementation

### 1. Billing Data Hook
```jsx
const useBillingData = (organizationId) => {
  const [billingData, setBillingData] = useState({
    subscription: null,
    invoices: [],
    paymentMethods: [],
    usage: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);
      const [subscription, invoices, paymentMethods, usage] = await Promise.all([
        subscriptionService.getSubscription(organizationId),
        invoiceService.getInvoices(organizationId),
        paymentService.getPaymentMethods(organizationId),
        usageService.getUsage(organizationId)
      ]);
      
      setBillingData({
        subscription: subscription.data,
        invoices: invoices.data,
        paymentMethods: paymentMethods.data,
        usage: usage.data
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);
  
  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);
  
  return { 
    billingData, 
    loading, 
    error, 
    refetch: fetchBillingData 
  };
};
```

### 2. Subscription Management Hook
```jsx
const useSubscriptionManagement = (organizationId) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const changePlan = useCallback(async (currentPlanId, newPlanId, billingCycle) => {
    try {
      setLoading(true);
      const response = await subscriptionService.changePlan(
        currentPlanId, 
        newPlanId, 
        billingCycle
      );
      setSubscription(response.data);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const cancelSubscription = useCallback(async (planId, reason) => {
    try {
      setLoading(true);
      await subscriptionService.cancelSubscription(planId, reason);
      // Update local state
      setSubscription(prev => prev ? { ...prev, status: 'canceled' } : null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const reactivateSubscription = useCallback(async (planId) => {
    try {
      setLoading(true);
      const response = await subscriptionService.reactivateSubscription(planId);
      setSubscription(response.data);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    subscription,
    loading,
    changePlan,
    cancelSubscription,
    reactivateSubscription
  };
};
```

## Data Management

### 1. Payment Processing Service
```jsx
class PaymentService {
  constructor(organizationId) {
    this.organizationId = organizationId;
  }
  
  async addPaymentMethod(paymentData) {
    try {
      // Create payment method with Stripe
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: paymentData.cardNumber,
          exp_month: paymentData.expMonth,
          exp_year: paymentData.expYear,
          cvc: paymentData.cvc
        },
        billing_details: {
          name: paymentData.name,
          email: paymentData.email
        }
      });
      
      // Attach to customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: this.customerId
      });
      
      // Save to database
      const response = await this.api.post('/payment-methods', {
        organizationId: this.organizationId,
        stripePaymentMethodId: paymentMethod.id,
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
        isDefault: paymentData.isDefault
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add payment method: ${error.message}`);
    }
  }
  
  async updatePaymentMethod(methodId, paymentData) {
    try {
      // Update billing details in Stripe
      await stripe.paymentMethods.update(methodId, {
        billing_details: {
          name: paymentData.name,
          email: paymentData.email
        }
      });
      
      // Update in database
      const response = await this.api.put(`/payment-methods/${methodId}`, {
        organizationId: this.organizationId,
        name: paymentData.name,
        email: paymentData.email
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update payment method: ${error.message}`);
    }
  }
  
  async deletePaymentMethod(methodId) {
    try {
      // Detach from customer in Stripe
      await stripe.paymentMethods.detach(methodId);
      
      // Delete from database
      await this.api.delete(`/payment-methods/${methodId}`, {
        data: { organizationId: this.organizationId }
      });
      
      return true;
    } catch (error) {
      throw new Error(`Failed to delete payment method: ${error.message}`);
    }
  }
  
  async setDefaultPaymentMethod(methodId) {
    try {
      // Update customer default payment method in Stripe
      await stripe.customers.update(this.customerId, {
        invoice_settings: {
          default_payment_method: methodId
        }
      });
      
      // Update in database
      const response = await this.api.put(`/payment-methods/${methodId}/default`, {
        organizationId: this.organizationId
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to set default payment method: ${error.message}`);
    }
  }
}
```

### 2. Subscription Service
```jsx
class SubscriptionService {
  constructor(organizationId) {
    this.organizationId = organizationId;
  }
  
  async changePlan(currentPlanId, newPlanId, billingCycle = 'monthly') {
    try {
      // Get plan details
      const plan = await this.getPlan(newPlanId);
      
      // Create subscription in Stripe
      const subscription = await stripe.subscriptions.create({
        customer: this.customerId,
        items: [{ price: plan.stripePriceId }],
        billing_cycle_anchor: billingCycle === 'monthly' ? 'now' : 'now',
        proration_behavior: 'create_prorations',
        metadata: {
          organizationId: this.organizationId,
          planId: newPlanId
        }
      });
      
      // Cancel current subscription if exists
      if (currentPlanId) {
        await this.cancelSubscription(currentPlanId);
      }
      
      // Save to database
      const response = await this.api.post('/subscriptions', {
        organizationId: this.organizationId,
        stripeSubscriptionId: subscription.id,
        planId: newPlanId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        billingCycle: billingCycle
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to change plan: ${error.message}`);
    }
  }
  
  async cancelSubscription(planId, reason = '') {
    try {
      // Cancel in Stripe
      const subscription = await this.getStripeSubscription(planId);
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
        metadata: {
          cancellation_reason: reason
        }
      });
      
      // Update in database
      const response = await this.api.put(`/subscriptions/${planId}/cancel`, {
        organizationId: this.organizationId,
        reason: reason,
        cancelAtPeriodEnd: true
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }
  
  async reactivateSubscription(planId) {
    try {
      // Reactivate in Stripe
      const subscription = await this.getStripeSubscription(planId);
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false
      });
      
      // Update in database
      const response = await this.api.put(`/subscriptions/${planId}/reactivate`, {
        organizationId: this.organizationId
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to reactivate subscription: ${error.message}`);
    }
  }
}
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
    cardColumns: isMobile ? 1 : isTablet ? 2 : 3,
    spacing: isMobile ? 2 : 3
  };
};
```

### 2. Responsive Subscription Cards
```jsx
const ResponsiveSubscriptionCard = ({ plan, currentPlan, onSelect }) => {
  const { isMobile } = useResponsiveLayout();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        position: 'relative',
        border: currentPlan?.plan.id === plan.id ? 2 : 1,
        borderColor: currentPlan?.plan.id === plan.id ? 'primary.main' : 'divider',
        p: isMobile ? 2 : 3
      }}
    >
      {currentPlan?.plan.id === plan.id && (
        <Chip
          label="Current Plan"
          color="primary"
          size={isMobile ? 'small' : 'medium'}
          sx={{ 
            position: 'absolute', 
            top: isMobile ? 8 : 16, 
            right: isMobile ? 8 : 16 
          }}
        />
      )}
      
      <CardContent sx={{ p: isMobile ? 1 : 2 }}>
        <Box sx={{ textAlign: 'center', mb: isMobile ? 2 : 3 }}>
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold" gutterBottom>
            {plan.name}
          </Typography>
          <Typography variant={isMobile ? 'h4' : 'h3'} fontWeight="bold" color="primary" gutterBottom>
            ${plan.price}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            per month
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {plan.description}
          </Typography>
        </Box>
        
        <Divider sx={{ my: isMobile ? 1 : 2 }} />
        
        {/* Features */}
        <Typography variant={isMobile ? 'body1' : 'h6'} gutterBottom>
          What's included:
        </Typography>
        <Box sx={{ mb: isMobile ? 2 : 3 }}>
          {plan.features.slice(0, isMobile ? 3 : plan.features.length).map((feature, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircleIcon color="success" fontSize="small" />
              <Typography variant="body2">{feature}</Typography>
            </Box>
          ))}
          {isMobile && plan.features.length > 3 && (
            <Typography variant="caption" color="text.secondary">
              +{plan.features.length - 3} more features
            </Typography>
          )}
        </Box>
        
        {/* Action Button */}
        <Box sx={{ mt: 'auto' }}>
          {currentPlan?.plan.id === plan.id ? (
            <Button
              fullWidth
              variant="outlined"
              disabled
              size={isMobile ? 'small' : 'medium'}
            >
              Current Plan
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              onClick={() => onSelect(plan)}
              size={isMobile ? 'small' : 'medium'}
            >
              {currentPlan?.plan.price > plan.price ? 'Downgrade' : 'Upgrade'} to {plan.name}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
```

## Performance Optimization

### 1. Lazy Loading Components
```jsx
const LazyBillingHistory = lazy(() => import('./BillingHistory'));
const LazyPaymentMethods = lazy(() => import('./PaymentMethods'));
const LazySubscriptionPlans = lazy(() => import('./SubscriptionPlans'));

const BillingPage = () => (
  <Suspense fallback={<BillingSkeleton />}>
    <LazyBillingHistory />
  </Suspense>
);
```

### 2. Optimistic Updates
```jsx
const useOptimisticUpdates = () => {
  const [optimisticData, setOptimisticData] = useState({});
  
  const updateOptimistically = useCallback((key, updater) => {
    setOptimisticData(prev => ({
      ...prev,
      [key]: updater(prev[key])
    }));
  }, []);
  
  const clearOptimisticData = useCallback((key) => {
    setOptimisticData(prev => {
      const newData = { ...prev };
      delete newData[key];
      return newData;
    });
  }, []);
  
  return {
    optimisticData,
    updateOptimistically,
    clearOptimisticData
  };
};
```

## Error Handling

### 1. Error Boundaries
```jsx
class BillingErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Billing Error:', error, errorInfo);
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

### 2. Payment Error Handling
```jsx
const handlePaymentError = (error) => {
  let userMessage = 'An error occurred while processing your payment.';
  
  if (error.type === 'card_error') {
    switch (error.code) {
      case 'card_declined':
        userMessage = 'Your card was declined. Please try a different card.';
        break;
      case 'expired_card':
        userMessage = 'Your card has expired. Please update your card information.';
        break;
      case 'incorrect_cvc':
        userMessage = 'The security code (CVC) is incorrect. Please check and try again.';
        break;
      case 'insufficient_funds':
        userMessage = 'Your card has insufficient funds. Please try a different card.';
        break;
      default:
        userMessage = error.message;
    }
  } else if (error.type === 'validation_error') {
    userMessage = 'Please check your payment information and try again.';
  } else if (error.type === 'rate_limit_error') {
    userMessage = 'Too many requests. Please wait a moment and try again.';
  }
  
  return userMessage;
};
```

## Testing Strategy

### 1. Unit Tests
```jsx
describe('Billing Components', () => {
  test('SubscriptionPlans displays plan information correctly', () => {
    render(<SubscriptionPlans currentPlan={mockCurrentPlan} onPlanChange={jest.fn()} />);
    
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('$29')).toBeInTheDocument();
    expect(screen.getByText('Essential features for small schools')).toBeInTheDocument();
  });

  test('PaymentMethods shows add button for users with permissions', () => {
    render(<PaymentMethods organizationId="org123" onPaymentMethodUpdate={jest.fn()} />);
    
    expect(screen.getByText('Add Payment Method')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests
```jsx
describe('Billing Integration', () => {
  test('successful plan change updates subscription', async () => {
    const mockChangePlan = jest.fn();
    render(<SubscriptionPlans currentPlan={mockCurrentPlan} onPlanChange={mockChangePlan} />);
    
    const upgradeButton = screen.getByText('Upgrade to Standard');
    fireEvent.click(upgradeButton);
    
    await waitFor(() => {
      expect(mockChangePlan).toHaveBeenCalled();
    });
  });
});
```

## Implementation Roadmap

### Week 1: Foundation
- Create billing header and subscription status
- Implement subscription plans comparison
- Add basic payment methods management
- Create billing data hooks

### Week 2: Core Features
- Implement payment processing integration
- Add subscription management
- Create billing history display
- Add invoice management

### Week 3: Enhancement
- Add responsive design
- Implement error handling
- Add loading states
- Create usage analytics

### Week 4: Testing & Polish
- Write comprehensive tests
- Add accessibility features
- Performance testing
- User acceptance testing

## Success Metrics

- **Page Load Time**: < 2 seconds
- **Payment Success Rate**: > 98%
- **Subscription Changes**: 100% accuracy
- **Responsiveness**: 100% mobile compatibility
- **User Experience**: > 90% user satisfaction

## Dependencies

- **Frontend**: React 18+, Material-UI v5, React Query
- **Backend**: Billing service, subscription service, payment service
- **External**: Stripe for payment processing, webhook handling
- **Testing**: Jest, React Testing Library, MSW for API mocking
