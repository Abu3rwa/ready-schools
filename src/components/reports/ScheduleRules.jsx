import React, { useState } from "react";
import {
  Box,
  Card,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Chip,
  IconButton,
  Button,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import dayjs from "dayjs";

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const RULE_TYPES = {
  weekday: "Specific Days",
  date: "Specific Dates",
  holiday: "Holiday Rules",
  custom: "Custom Rules",
};

export default function ScheduleRules({ rules = [], onChange }) {
  const [newRule, setNewRule] = useState({
    type: "weekday",
    enabled: true,
    config: {
      days: [],
      dates: [],
      skipHolidays: true,
      skipWeekends: true,
      customCondition: "",
    },
  });

  const handleAddRule = () => {
    const rule = {
      ...newRule,
      id: Date.now().toString(),
    };
    onChange([...rules, rule]);
    // Reset form
    setNewRule({
      type: "weekday",
      enabled: true,
      config: {
        days: [],
        dates: [],
        skipHolidays: true,
        skipWeekends: true,
        customCondition: "",
      },
    });
  };

  const handleDeleteRule = (ruleId) => {
    onChange(rules.filter((r) => r.id !== ruleId));
  };

  const handleToggleRule = (ruleId) => {
    onChange(
      rules.map((r) =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      )
    );
  };

  const renderRuleConfig = (type, config, setConfig) => {
    switch (type) {
      case "weekday":
        return (
          <FormControl fullWidth>
            <InputLabel>Select Days</InputLabel>
            <Select
              multiple
              value={config.days}
              label="Select Days"
              onChange={(e) => setConfig({ ...config, days: e.target.value })}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={WEEKDAYS.find((d) => d.value === value)?.label}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            >
              {WEEKDAYS.map((day) => (
                <MenuItem key={day.value} value={day.value}>
                  {day.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case "date":
        return (
          <Box>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <TextField
                  type="date"
                  fullWidth
                  label="Add Date"
                  InputLabelProps={{ shrink: true }}
                  value=""
                  onChange={(e) => {
                    const newDate = e.target.value;
                    if (newDate && !config.dates.includes(newDate)) {
                      setConfig({
                        ...config,
                        dates: [...config.dates, newDate].sort(),
                      });
                    }
                  }}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
              {config.dates.map((date) => (
                <Chip
                  key={date}
                  label={dayjs(date).format("MMM D, YYYY")}
                  onDelete={() =>
                    setConfig({
                      ...config,
                      dates: config.dates.filter((d) => d !== date),
                    })
                  }
                  size="small"
                />
              ))}
            </Box>
          </Box>
        );

      case "holiday":
        return (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={config.skipHolidays}
                  onChange={(e) =>
                    setConfig({ ...config, skipHolidays: e.target.checked })
                  }
                />
              }
              label="Skip on Holidays"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={config.skipWeekends}
                  onChange={(e) =>
                    setConfig({ ...config, skipWeekends: e.target.checked })
                  }
                />
              }
              label="Skip on Weekends"
            />
          </Box>
        );

      case "custom":
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Custom Rule Condition"
            placeholder="e.g., date => !isExamDay(date) && hasClasses(date)"
            value={config.customCondition}
            onChange={(e) =>
              setConfig({ ...config, customCondition: e.target.value })
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Schedule Rules
      </Typography>

      {/* Add New Rule */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Add New Rule
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Rule Type</InputLabel>
              <Select
                value={newRule.type}
                label="Rule Type"
                onChange={(e) =>
                  setNewRule({ ...newRule, type: e.target.value })
                }
              >
                {Object.entries(RULE_TYPES).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            {renderRuleConfig(
              newRule.type,
              newRule.config,
              (config) => setNewRule({ ...newRule, config })
            )}
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddRule}
              startIcon={<AddIcon />}
            >
              Add Rule
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Active Rules */}
      {rules.map((rule) => (
        <Card key={rule.id} sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <Typography variant="subtitle1">
                {RULE_TYPES[rule.type]}
              </Typography>
            </Grid>
            <Grid item>
              <Switch
                checked={rule.enabled}
                onChange={() => handleToggleRule(rule.id)}
              />
            </Grid>
            <Grid item>
              <IconButton
                color="error"
                onClick={() => handleDeleteRule(rule.id)}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, opacity: rule.enabled ? 1 : 0.5 }}>
            {renderRuleConfig(
              rule.type,
              rule.config,
              (config) =>
                onChange(
                  rules.map((r) =>
                    r.id === rule.id ? { ...r, config } : r
                  )
                )
            )}
          </Box>
        </Card>
      ))}

      {rules.length === 0 && (
        <Typography color="textSecondary" align="center">
          No rules configured. Add a rule to customize the schedule.
        </Typography>
      )}
    </Box>
  );
}
