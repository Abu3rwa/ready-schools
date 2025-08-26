import React, { useEffect, useMemo, useState } from "react";
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
  Tooltip,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import {
  AdminPanelSettings as AdminIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { db, functions } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { httpsCallable } from "firebase/functions";
import AdminMenuConfig from "../components/admin/AdminMenuConfig";

const AdminUsers = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, "users"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(data);
      if (currentUser) {
        const me = data.find((u) => u.uid === currentUser.uid || u.id === currentUser.uid);
        setIsAdmin(!!me?.admin);
      }
    } catch (e) {
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  const handleToggleAdmin = async (user) => {
    try {
      setUpdatingUserId(user.id);
      await updateDoc(doc(db, "users", user.id), { admin: !user.admin });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, admin: !user.admin } : u)));
      setSnackbar({ open: true, message: `Updated admin for ${user.email}`, severity: "success" });
      if (user.id === currentUser?.uid) {
        setIsAdmin(!user.admin);
      }
    } catch (e) {
      setSnackbar({ open: true, message: e.message || "Failed to update user", severity: "error" });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleResetGmailConfig = async (user) => {
    try {
      setUpdatingUserId(user.id);
      await updateDoc(doc(db, "users", user.id), {
        gmail_configured: false,
        gmail_access_token: null,
        gmail_refresh_token: null,
        gmail_token_expiry: null,
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, gmail_configured: false } : u)));
      setSnackbar({ open: true, message: `Reset Gmail settings for ${user.email}`, severity: "success" });
    } catch (e) {
      setSnackbar({ open: true, message: e.message || "Failed to reset Gmail settings", severity: "error" });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleBanToggle = async (user) => {
    try {
      setUpdatingUserId(user.id);
      const callable = httpsCallable(functions, "adminBanUser");
      const res = await callable({ uid: user.id, disabled: !user.banned });
      const banned = !!res.data?.banned;
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, banned } : u)));
      setSnackbar({ open: true, message: `${banned ? "Banned" : "Unbanned"} ${user.email}`, severity: "success" });
    } catch (e) {
      setSnackbar({ open: true, message: e.message || "Failed to update ban status", severity: "error" });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    try {
      setUpdatingUserId(user.id);
      const callable = httpsCallable(functions, "adminDeleteUser");
      await callable({ uid: user.id });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setSnackbar({ open: true, message: `Deleted ${user.email}`, severity: "success" });
    } catch (e) {
      setSnackbar({ open: true, message: e.message || "Failed to delete user", severity: "error" });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (!currentUser) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">Please sign in.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2">Loading users…</Typography>
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Admin Users
        </Typography>
        <Alert severity="warning">You do not have permission to view this page.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">Admin Panel</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={loadUsers} variant="outlined" size="small">
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert sx={{ mb: 2 }} severity="error">
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<SecurityIcon />} 
            label="User Management" 
            iconPosition="start"
          />
          <Tab 
            icon={<MenuIcon />} 
            label="Menu Configuration" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>Gmail</TableCell>
                  <TableCell>Banned</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.displayName || "—"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip
                        icon={<SecurityIcon />}
                        label={u.admin ? "Admin" : "User"}
                        color={u.admin ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<EmailIcon />}
                        label={u.gmail_configured ? "Configured" : "Not Configured"}
                        color={u.gmail_configured ? "primary" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.banned ? "Banned" : "Active"}
                        color={u.banned ? "error" : "success"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleString() : (u.createdAt || "—")}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={u.admin ? "Revoke admin" : "Make admin"}>
                        <span>
                          <IconButton
                            onClick={() => handleToggleAdmin(u)}
                            color={u.admin ? "warning" : "success"}
                            size="small"
                            disabled={updatingUserId === u.id}
                          >
                            <AdminIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={u.banned ? "Unban user" : "Ban user"}>
                        <span>
                          <IconButton
                            onClick={() => handleBanToggle(u)}
                            color={u.banned ? "success" : "error"}
                            size="small"
                            disabled={updatingUserId === u.id}
                          >
                            <SecurityIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete user">
                        <span>
                          <IconButton
                            onClick={() => handleDeleteUser(u)}
                            color="error"
                            size="small"
                            disabled={updatingUserId === u.id}
                          >
                            {/* Reuse AdminIcon for delete or create a Trash icon if available */}
                            <AdminIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Menu Configuration Tab */}
      {activeTab === 1 && (
        <AdminMenuConfig />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminUsers; 