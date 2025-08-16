import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
} from "@mui/material";
import { useAssignments } from "../../contexts/AssignmentContext";

const CategoryManager = ({ open, onClose }) => {
  const { categories, addCategory, getCategoriesWithWeights } = useAssignments();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  const handleAddCategory = () => {
    if (newCategoryName && selectedGroup) {
      addCategory(selectedGroup, newCategoryName);
      setNewCategoryName("");
      // Keep selectedGroup for potentially adding more to the same group
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage Assignment Categories</DialogTitle>
      <DialogContent>
        <Grid container spacing={4} sx={{ mt: 1 }}>
          {/* Column for adding new categories */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Add New Category
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Category Group</InputLabel>
                <Select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  label="Category Group"
                >
                  {Object.keys(categories).map((group) => (
                    <MenuItem key={group} value={group}>
                      {group} ({categories[group].defaultWeight}%)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="New Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                variant="outlined"
                fullWidth
                required
              />
              <Button
                onClick={handleAddCategory}
                variant="contained"
                disabled={!newCategoryName || !selectedGroup}
              >
                Add Category
              </Button>
            </Box>
          </Grid>

          {/* Column for displaying existing categories */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Existing Categories
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: 400, overflow: "auto" }}>
              <List>
                {Object.entries(categories).map(([group, groupData]) => (
                  <React.Fragment key={group}>
                    <ListItem>
                      <ListItemText
                        primary={`${group} (${groupData.defaultWeight}%)`}
                        secondary={groupData.description}
                        primaryTypographyProps={{ fontWeight: "bold" }}
                      />
                    </ListItem>
                    <List component="div" disablePadding>
                      {groupData.subcategories.map((category) => (
                        <ListItem key={category} sx={{ pl: 4 }}>
                          <ListItemText primary={category} />
                        </ListItem>
                      ))}
                    </List>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryManager;
