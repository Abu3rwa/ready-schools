import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  getFrameworks,
  createFramework,
  updateFramework,
  deleteFramework,
  initializeDefaultFrameworks,
} from "../../services/frameworkService";

const FrameworksManager = () => {
  const [frameworks, setFrameworks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFramework, setEditingFramework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadFrameworks();
  }, []);

  const loadFrameworks = async () => {
    setLoading(true);
    try {
      const list = await getFrameworks();
      setFrameworks(list);
      setLoading(false);

      if (list.length === 0) {
        setSnackbar({
          open: true,
          message:
            "No frameworks found. Would you like to initialize default frameworks?",
          severity: "info",
          action: (
            <Button color="inherit" size="small" onClick={initializeDefaults}>
              Initialize
            </Button>
          ),
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error loading frameworks. Please try again.",
        severity: "error",
      });
      setLoading(false);
    }
  };

  const initializeDefaults = async () => {
    try {
      await initializeDefaultFrameworks();
      await loadFrameworks();
      setSnackbar({
        open: true,
        message: "Default frameworks initialized successfully!",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error initializing default frameworks. Please try again.",
        severity: "error",
      });
    }
  };

  const handleOpenDialog = (framework = null) => {
    if (framework) {
      setEditingFramework(framework);
      setFormData({
        code: framework.code,
        name: framework.name,
        description: framework.description || "",
      });
    } else {
      setEditingFramework(null);
      setFormData({
        code: "",
        name: "",
        description: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFramework(null);
    setFormData({
      code: "",
      name: "",
      description: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFramework) {
        await updateFramework(editingFramework.id, formData);
        setSnackbar({
          open: true,
          message: "Framework updated successfully",
          severity: "success",
        });
      } else {
        await createFramework(formData);
        setSnackbar({
          open: true,
          message: "Framework created successfully",
          severity: "success",
        });
      }
      handleCloseDialog();
      loadFrameworks();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error ${
          editingFramework ? "updating" : "creating"
        } framework: ${error.message}`,
        severity: "error",
      });
    }
  };

  const handleDelete = async (framework) => {
    try {
      await deleteFramework(framework.id);
      setSnackbar({
        open: true,
        message: "Framework deleted successfully",
        severity: "success",
      });
      loadFrameworks();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting framework: ${error.message}`,
        severity: "error",
      });
    }
  };

  const renderFrameworkList = () => (
    <List>
      {frameworks.map((framework) => (
        <ListItem key={framework.id} divider>
          <ListItemText
            primary={framework.name}
            secondary={
              <>
                <Typography
                  component="span"
                  variant="body2"
                  color="text.primary"
                >
                  {framework.code}
                </Typography>
                {framework.description && (
                  <>
                    <br />
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      {framework.description}
                    </Typography>
                  </>
                )}
              </>
            }
          />
          <ListItemSecondaryAction>
            <IconButton
              edge="end"
              aria-label="edit"
              onClick={() => handleOpenDialog(framework)}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => handleDelete(framework)}
            >
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  const renderDialog = () => (
    <Dialog
      open={dialogOpen}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {editingFramework ? "Edit Framework" : "Add Framework"}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Framework Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            sx={{ mb: 2 }}
            helperText="e.g., CCSS, NGSS"
          />
          <TextField
            fullWidth
            label="Framework Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            sx={{ mb: 2 }}
            helperText="e.g., Common Core State Standards"
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            multiline
            rows={3}
            helperText="Optional description of the framework"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {editingFramework ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Paper sx={{ p: 2 }}>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Educational Frameworks</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Framework
            </Button>
          </Box>
          {renderFrameworkList()}
          {renderDialog()}
        </>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default FrameworksManager;
