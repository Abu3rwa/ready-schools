import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import { createSubject, deleteSubject, getSubjects, updateSubject } from "../../services/subjectsService";

const SubjectDialog = ({ open, onClose, onSave, initial }) => {
  const [name, setName] = useState(initial?.name || "");
  const [code, setCode] = useState(initial?.code || "");

  useEffect(() => {
    setName(initial?.name || "");
    setCode(initial?.code || "");
  }, [initial]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{initial ? "Edit Subject" : "Add Subject"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Code" fullWidth value={code} onChange={(e) => setCode(e.target.value)} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => onSave({ name: name.trim(), code: code.trim() })}
          variant="contained"
          disabled={!name.trim()}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SubjectsManager = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await getSubjects();
      setSubjects(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (data) => {
    if (editing) {
      await updateSubject(editing.id, data);
    } else {
      await createSubject(data);
    }
    setDialogOpen(false);
    setEditing(null);
    await load();
  };

  const handleDelete = async (id) => {
    await deleteSubject(id);
    await load();
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Subjects</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setDialogOpen(true)}>
          Add Subject
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subjects.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.code}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton onClick={() => { setEditing(s); setDialogOpen(true); }} size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => handleDelete(s.id)} size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {subjects.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" color="text.secondary">
                    No subjects yet. Click "Add Subject" to create your first one.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <SubjectDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} onSave={handleSave} initial={editing} />
    </Paper>
  );
};

export default SubjectsManager;


