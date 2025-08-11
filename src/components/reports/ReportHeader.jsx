import React from "react";
import { Box, Typography, Button } from "@mui/material";
import {
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Summarize as SummarizeIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";

const ReportHeader = ({
  title = "Reports",
  onClearFilters,
  onDownloadCSV,
  onPrint,
  onGenerateReport,
  datasetEmpty,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AssessmentIcon color="primary" />
        <Typography variant="h4">{title}</Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={onClearFilters}
        >
          Clear Filters
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={onDownloadCSV}
          disabled={datasetEmpty}
        >
          Download CSV
        </Button>
        <Button
          variant="outlined"
          startIcon={<PdfIcon />}
          onClick={onPrint}
          disabled={datasetEmpty}
        >
          Print (PDF)
        </Button>
        <Button
          variant="contained"
          startIcon={<SummarizeIcon />}
          onClick={onGenerateReport}
        >
          Generate Report
        </Button>
      </Box>
    </Box>
  );
};

export default ReportHeader;
