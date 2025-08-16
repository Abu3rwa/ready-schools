import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Paper,
} from "@mui/material";
import { useBehavior } from "../../contexts/BehaviorContext";

const SkillPicker = ({ selectedSkills, onSkillChange }) => {
  const { getSkillsTaxonomy } = useBehavior();
  const skillsTaxonomy = getSkillsTaxonomy();

  const handleSkillClick = (skill, category) => {
    const existingSkillIndex = selectedSkills.findIndex(
      (s) => s.skill === skill
    );
    let newSkills = [...selectedSkills];

    if (existingSkillIndex > -1) {
      // Skill exists, remove it
      newSkills.splice(existingSkillIndex, 1);
    } else {
      // Add new skill with a default type of 'strength'
      newSkills.push({ skill, category, type: "strength" });
    }
    onSkillChange(newSkills);
  };

  const handleTypeChange = (skill, newType) => {
    const skillIndex = selectedSkills.findIndex((s) => s.skill === skill);
    if (skillIndex > -1 && newType) {
      let newSkills = [...selectedSkills];
      newSkills[skillIndex].type = newType;
      onSkillChange(newSkills);
    }
  };

  const isSkillSelected = (skill) => {
    return selectedSkills.some((s) => s.skill === skill);
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Observed Skills
      </Typography>
      {Object.entries(skillsTaxonomy).map(([category, skills]) => (
        <Paper key={category} variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            {category}
          </Typography>
          <Grid container spacing={1}>
            {skills.map((skill) => (
              <Grid item key={skill}>
                <Chip
                  label={skill}
                  onClick={() => handleSkillClick(skill, category)}
                  color={isSkillSelected(skill) ? "primary" : "default"}
                  variant={isSkillSelected(skill) ? "filled" : "outlined"}
                />
              </Grid>
            ))}
          </Grid>
          {selectedSkills.some((s) => s.category === category) && (
            <Box sx={{ mt: 2 }}>
              {selectedSkills
                .filter((s) => s.category === category)
                .map((s) => (
                  <Box
                    key={s.skill}
                    sx={{ display: "flex", alignItems: "center", mb: 1 }}
                  >
                    <Typography sx={{ mr: 2 }}>{s.skill}:</Typography>
                    <ToggleButtonGroup
                      value={s.type}
                      exclusive
                      onChange={(e, newType) => handleTypeChange(s.skill, newType)}
                      size="small"
                    >
                      <ToggleButton value="strength">Strength</ToggleButton>
                      <ToggleButton value="growth">Area for Growth</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                ))}
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default SkillPicker;
