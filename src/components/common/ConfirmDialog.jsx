import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

/**
 * ConfirmDialog is a reusable dialog for confirming actions (delete/archive).
 * Props:
 * - open: boolean
 * - onClose: function
 * - onConfirm: function
 * - title: string
 * - message: string
 * - confirmText: string
 * - confirmColor: string ("error", "warning", etc)
 */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmColor,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Typography>{message}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} color={confirmColor} variant="contained">
        {confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
