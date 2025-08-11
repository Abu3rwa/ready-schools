import React from "react";
import {
  Paper,
  Box,
  Typography,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";

const RecentReportsTable = ({ reports, onRefresh, onDownload, onInfo }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="h6">Recent Reports</Typography>
        <Button size="small" startIcon={<RefreshIcon />} onClick={onRefresh}>
          Refresh
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Format</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="textSecondary">
                    No reports yet. Generate one to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((rpt) => (
                <TableRow key={rpt.id} hover>
                  <TableCell>{rpt.name}</TableCell>
                  <TableCell>
                    <Chip size="small" label={rpt.type} />
                  </TableCell>
                  <TableCell>
                    {new Date(rpt.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={rpt.status === "Ready" ? "success" : "default"}
                      label={rpt.status}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={<PdfIcon />}
                      label={rpt.format}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        onClick={() => onDownload?.(rpt.id)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default RecentReportsTable;
