import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";

const AMLY_TRAITS = {
  // Primary: Confidence - Asserting my unique identity
  Humility: {
    description: "Inner humility that overflows into purpose",
    primary: "Confidence",
    primaryDescription: "Asserting my unique identity",
    months: []
  },
  Purpose: {
    description: "Understanding our special calling",
    primary: "Confidence", 
    primaryDescription: "Asserting my unique identity",
    months: []
  },
  Courage: {
    description: "Extending confidence to bold action",
    primary: "Confidence",
    primaryDescription: "Asserting my unique identity", 
    months: []
  },
  
  // Primary: Hope - Believing good comes from bad
  Persistence: {
    description: "Inner persistence that overflows into compassion",
    primary: "Hope",
    primaryDescription: "Believing good comes from bad",
    months: []
  },
  Compassion: {
    description: "Caring for others with understanding",
    primary: "Hope",
    primaryDescription: "Believing good comes from bad",
    months: []
  },
  Service: {
    description: "Extending hope through helping others",
    primary: "Hope", 
    primaryDescription: "Believing good comes from bad",
    months: []
  },
  
  // Primary: Wisdom - Knowing what is right
  Curiosity: {
    description: "Inner curiosity that overflows into connection",
    primary: "Wisdom",
    primaryDescription: "Knowing what is right",
    months: []
  },
  Connection: {
    description: "Building meaningful relationships",
    primary: "Wisdom",
    primaryDescription: "Knowing what is right", 
    months: []
  },
  Discernment: {
    description: "Applying truth carefully to daily decisions",
    primary: "Wisdom",
    primaryDescription: "Knowing what is right",
    months: []
  }
};

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
];

const CharacterTraitsManager = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [traits, setTraits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrait, setEditingTrait] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    months: [],
    quotes: "",
    challenges: ""
  });

  useEffect(() => {
    loadTraits();
  }, [currentUser]);

  const loadTraits = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      // Load traits from user document instead of separate collection
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const traitsData = userData.characterTraits || [];
        setTraits(traitsData);
      } else {
        setTraits([]);
      }
    } catch (error) {
      console.error("Error loading traits:", error);
      setMessage({ type: "error", text: "Failed to load character traits" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.months.length === 0) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    try {
      const traitData = {
        id: editingTrait ? editingTrait.id : Date.now().toString(), // Use timestamp as ID
        name: formData.name,
        months: formData.months.sort((a, b) => a - b),
        quotes: formData.quotes.split(",").map(q => q.trim()).filter(Boolean),
        challenges: formData.challenges.split(",").map(c => c.trim()).filter(Boolean),
        description: AMLY_TRAITS[formData.name]?.description || "",
        primary: AMLY_TRAITS[formData.name]?.primary || "",
        primaryDescription: AMLY_TRAITS[formData.name]?.primaryDescription || "",
        createdAt: editingTrait ? editingTrait.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const userRef = doc(db, "users", currentUser.uid);
      let updatedTraits = [...traits];
      
      if (editingTrait) {
        // Update existing trait
        const index = updatedTraits.findIndex(t => t.id === editingTrait.id);
        if (index !== -1) {
          updatedTraits[index] = traitData;
        }
      } else {
        // Add new trait
        updatedTraits.push(traitData);
      }

      await updateDoc(userRef, {
        characterTraits: updatedTraits
      });

      setMessage({ type: "success", text: editingTrait ? "Character trait updated successfully" : "Character trait created successfully" });
      setDialogOpen(false);
      setEditingTrait(null);
      setFormData({ name: "", months: [], quotes: "", challenges: "" });
      loadTraits();
    } catch (error) {
      console.error("Error saving trait:", error);
      setMessage({ type: "error", text: "Failed to save character trait" });
    }
  };

  const handleEdit = (trait) => {
    setEditingTrait(trait);
    setFormData({
      name: trait.name,
      months: trait.months,
      quotes: trait.quotes.join(", "),
      challenges: trait.challenges.join(", ")
    });
    setDialogOpen(true);
  };

  const handleDelete = async (traitId) => {
    if (window.confirm("Are you sure you want to delete this character trait?")) {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const updatedTraits = traits.filter(t => t.id !== traitId);
        
        await updateDoc(userRef, {
          characterTraits: updatedTraits
        });
        
        setMessage({ type: "success", text: "Character trait deleted successfully" });
        loadTraits();
      } catch (error) {
        console.error("Error deleting trait:", error);
        setMessage({ type: "error", text: "Failed to delete character trait" });
      }
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTrait(null);
    setFormData({ name: "", months: [], quotes: "", challenges: "" });
  };

  const getCurrentMonthTrait = () => {
    const currentMonth = new Date().getMonth() + 1;
    return traits.find(trait => trait.months.includes(currentMonth));
  };

  const currentTrait = getCurrentMonthTrait();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        AMLY Character Traits Manager
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure the 9 secondary character traits for each month. Each trait belongs to one of the 3 primary AMLY values.
      </Typography>

      {currentTrait && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Current Month's Trait:</strong> {currentTrait.name} - {currentTrait.description}
          <br />
          <strong>Primary Value:</strong> {currentTrait.primary} - {currentTrait.primaryDescription}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Character Trait
        </Button>
      </Box>

      <Grid container spacing={2}>
        {traits.map((trait) => (
          <Grid item xs={12} md={6} lg={4} key={trait.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {trait.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {trait.description}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Primary Value:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`${trait.primary} - ${trait.primaryDescription}`}
                    size="small"
                    color="primary"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Months:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {trait.months.map((month) => (
                    <Chip
                      key={month}
                      label={MONTHS.find(m => m.value === month)?.label}
                      size="small"
                      color="primary"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Quotes: {trait.quotes.length}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Challenges: {trait.challenges.length}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton onClick={() => handleEdit(trait)} size="small">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(trait.id)} size="small" color="error">
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTrait ? "Edit Character Trait" : "Add Character Trait"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Character Trait</InputLabel>
                <Select
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  label="Character Trait"
                >
                  {Object.entries(AMLY_TRAITS).map(([traitName, traitData]) => (
                    <MenuItem key={traitName} value={traitName}>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {traitName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {traitData.description}
                        </Typography>
                        <Typography variant="caption" display="block" color="primary.main">
                          {traitData.primary}: {traitData.primaryDescription}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Months</InputLabel>
                <Select
                  multiple
                  value={formData.months}
                  onChange={(e) => setFormData({ ...formData, months: e.target.value })}
                  label="Months"
                >
                  {MONTHS.map((month) => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quotes (comma separated)"
                value={formData.quotes}
                onChange={(e) => setFormData({ ...formData, quotes: e.target.value })}
                multiline
                rows={3}
                helperText="Enter motivational quotes separated by commas"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Challenges (comma separated)"
                value={formData.challenges}
                onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                multiline
                rows={3}
                helperText="Enter daily challenges separated by commas"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTrait ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {message && (
        <Alert sx={{ mt: 2 }} severity={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}
    </Box>
  );
};

export default CharacterTraitsManager;
