import React from "react";
import { Chip, Tooltip } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

const getColorByLevel = (level) => {
  switch (level) {
    case "gold":
      return "warning";
    case "silver":
      return "default";
    case "bronze":
      return "secondary";
    default:
      return "primary";
  }
};

const SkillBadge = ({ skillName, level = "bronze", count = 0 }) => {
  const color = getColorByLevel(level);
  const icon = level === "gold" ? <EmojiEventsIcon fontSize="small" /> : <StarIcon fontSize="small" />;
  const label = `${skillName} • ${level}${count ? ` • ${count}` : ""}`;

  return (
    <Tooltip title={`Badge: ${skillName} (${level})`}>
      <Chip icon={icon} label={label} color={color} size="small" />
    </Tooltip>
  );
};

export default SkillBadge;

