import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Tooltip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import {
  getMenuConfiguration,
  updateMenuConfiguration,
  createMenuItem,
  deleteMenuItem,
  FEATURE_STATUS,
  PERMISSION_LEVELS,
  getStatusBadge,
} from '../../services/menuConfigService';
import { useMenuConfig } from '../../contexts/MenuConfigContext';

const AdminMenuConfig = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { refreshMenuConfig } = useMenuConfig();

  const [formData, setFormData] = useState({
    label: '',
    icon: '',
    path: '',
    order: 0,
    enabled: true,
    status: FEATURE_STATUS.ACTIVE,
    permissions: [PERMISSION_LEVELS.USER],
    color: '#3498DB',
    description: '',
  });

  // Icon options for dropdown
  const iconOptions = [
    'DashboardIcon', 'PeopleIcon', 'AssessmentIcon', 'AssignmentIcon',
    'BookIcon', 'EventNoteIcon', 'PsychologyIcon', 'EmojiEventsIcon',
    'EmailIcon', 'SchoolIcon', 'AccountBoxIcon', 'CodeIcon',
    'SettingsIcon', 'AdminIcon'
  ];

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const items = await getMenuConfiguration();
      setMenuItems(items);
    } catch (error) {
      console.error('Error loading menu items:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load menu items',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuItems();
  }, []);

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData({
      label: item.label || '',
      icon: item.icon || '',
      path: item.path || '',
      order: item.order || 0,
      enabled: item.enabled || false,
      status: item.status || FEATURE_STATUS.ACTIVE,
      permissions: item.permissions || [PERMISSION_LEVELS.USER],
      color: item.color || '#3498DB',
      description: item.description || '',
    });
    setEditDialog(true);
  };

  const handleAdd = () => {
    setCurrentItem(null);
    setFormData({
      label: '',
      icon: 'DashboardIcon',
      path: '',
      order: menuItems.length + 1,
      enabled: true,
      status: FEATURE_STATUS.ACTIVE,
      permissions: [PERMISSION_LEVELS.USER],
      color: '#3498DB',
      description: '',
    });
    setEditDialog(true);
  };

  const handleSave = async () => {
    try {
      if (currentItem) {
        // Update existing item
        await updateMenuConfiguration(currentItem.id, formData);
        setSnackbar({
          open: true,
          message: 'Menu item updated successfully',
          severity: 'success',
        });
      } else {
        // Create new item
        await createMenuItem({
          ...formData,
          id: formData.label.toLowerCase().replace(/\s+/g, '-'),
        });
        setSnackbar({
          open: true,
          message: 'Menu item created successfully',
          severity: 'success',
        });
      }
      
      setEditDialog(false);
      loadMenuItems();
      refreshMenuConfig();
    } catch (error) {
      console.error('Error saving menu item:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save menu item',
        severity: 'error',
      });
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await deleteMenuItem(itemId);
      setSnackbar({
        open: true,
        message: 'Menu item deleted successfully',
        severity: 'success',
      });
      loadMenuItems();
      refreshMenuConfig();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete menu item',
        severity: 'error',
      });
    }
  };

  const handleToggleEnabled = async (item) => {
    try {
      await updateMenuConfiguration(item.id, { enabled: !item.enabled });
      loadMenuItems();
      refreshMenuConfig();
    } catch (error) {
      console.error('Error toggling menu item:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update menu item',
        severity: 'error',
      });
    }
  };

  const getStatusChip = (status, statusDate) => {
    const badge = getStatusBadge(status, statusDate);
    if (!badge) return <Chip label="Active" size="small" color="success" />;
    
    return (
      <Chip
        label={badge.text}
        size="small"
        color={badge.color}
        sx={{ fontWeight: 600 }}
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Menu Configuration</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadMenuItems}
            variant="outlined"
          >
            Refresh
          </Button>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAdd}
            variant="contained"
          >
            Add Menu Item
          </Button>
        </Box>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Label</TableCell>
                <TableCell>Path</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Enabled</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.order}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: item.color || '#3498DB',
                          borderRadius: '50%',
                        }}
                      />
                      {item.label}
                    </Box>
                  </TableCell>
                  <TableCell>{item.path}</TableCell>
                  <TableCell>{getStatusChip(item.status, item.statusDate)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {item.permissions?.map((perm) => (
                        <Chip
                          key={perm}
                          label={perm}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={item.enabled ? 'Click to disable' : 'Click to enable'}>
                      <IconButton
                        onClick={() => handleToggleEnabled(item)}
                        color={item.enabled ? 'success' : 'default'}
                      >
                        {item.enabled ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(item)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit/Add Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{currentItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Path"
              value={formData.path}
              onChange={(e) => setFormData({ ...formData, path: e.target.value })}
              fullWidth
              required
              placeholder="/example-path"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Icon</InputLabel>
                <Select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  label="Icon"
                >
                  {iconOptions.map((icon) => (
                    <MenuItem key={icon} value={icon}>
                      {icon}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                sx={{ width: 120 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  {Object.values(FEATURE_STATUS).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                type="color"
                sx={{ width: 120 }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Permissions
              </Typography>
              {Object.values(PERMISSION_LEVELS).map((perm) => (
                <FormControlLabel
                  key={perm}
                  control={
                    <Checkbox
                      checked={formData.permissions.includes(perm)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            permissions: [...formData.permissions, perm],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            permissions: formData.permissions.filter((p) => p !== perm),
                          });
                        }
                      }}
                    />
                  }
                  label={perm.toUpperCase()}
                />
              ))}
            </Box>

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                />
              }
              label="Enabled"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {currentItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminMenuConfig;