import React, { useMemo, useState } from "react";
import {
	Box,
	Paper,
	Typography,
	Grid,
	Button,
	IconButton,
	TextField,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Divider,
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	Collapse,
	Alert,
} from "@mui/material";
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { useAcademicPeriods } from "../../contexts/AcademicPeriodsContext";

const AcademicPeriodsManager = () => {
	const { periods, addPeriod, updatePeriod, removePeriod, loading, error } = useAcademicPeriods();
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState({ name: "", semesters: [] });
	const [expanded, setExpanded] = useState({});
	const [editId, setEditId] = useState(null);

	const resetForm = () => {
		setForm({ name: "", semesters: [] });
		setEditId(null);
	};

	const handleAddSemester = () => {
		setForm((prev) => ({
			...prev,
			semesters: [
				...prev.semesters,
				{ id: `sem-${Date.now()}`, name: "Semester", startDate: "", endDate: "", terms: [] },
			],
		}));
	};

	const handleRemoveSemester = (idx) => {
		setForm((prev) => ({
			...prev,
			semesters: prev.semesters.filter((_, i) => i !== idx),
		}));
	};

	const handleAddTerm = (sidx) => {
		setForm((prev) => ({
			...prev,
			semesters: prev.semesters.map((s, i) =>
				i === sidx ? { ...s, terms: [...(s.terms || []), { id: `term-${Date.now()}`, name: "Term", startDate: "", endDate: "" }] } : s
			),
		}));
	};

	const handleRemoveTerm = (sidx, tidx) => {
		setForm((prev) => ({
			...prev,
			semesters: prev.semesters.map((s, i) =>
				i === sidx ? { ...s, terms: s.terms.filter((_, j) => j !== tidx) } : s
			),
		}));
	};

	const openCreate = () => {
		resetForm();
		setOpen(true);
	};

	const openEdit = (period) => {
		setForm({ name: period.name, startDate: period.startDate || "", endDate: period.endDate || "", semesters: period.semesters || [] });
		setEditId(period.id);
		setOpen(true);
	};

	const submit = async () => {
		if (!form.name.trim()) return;
		if (editId) {
			await updatePeriod(editId, { ...form });
		} else {
			await addPeriod({ ...form });
		}
		setOpen(false);
		resetForm();
	};

	return (
		<Paper sx={{ p: 2 }}>
			<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
				<Typography variant="h6">Academic Periods</Typography>
				<Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
					New School Year
				</Button>
			</Box>
			{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
			<List>
				{periods.map((p) => (
					<>
						<ListItem key={p.id} sx={{ bgcolor: "background.paper", borderRadius: 1, mb: 1 }}>
							<ListItemText primary={p.name} secondary={`${p.semesters?.length || 0} semesters`} />
							<IconButton onClick={() => openEdit(p)}>
								<EditIcon />
							</IconButton>
							<IconButton color="error" onClick={() => removePeriod(p.id)}>
								<DeleteIcon />
							</IconButton>
							<IconButton onClick={() => setExpanded((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}>
								{expanded[p.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
							</IconButton>
						</ListItem>
						<Collapse in={!!expanded[p.id]} timeout="auto" unmountOnExit>
							<Box sx={{ pl: 4, py: 1 }}>
								{(p.semesters || []).map((s) => (
									<Box key={s.id} sx={{ mb: 1 }}>
										<Typography variant="subtitle2">{s.name}</Typography>
										<Typography variant="caption" color="text.secondary">{(s.terms || []).length} terms</Typography>
									</Box>
								))}
							</Box>
						</Collapse>
					</>
				))}
			</List>

			<Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>{editId ? "Edit School Year" : "New School Year"}</DialogTitle>
				<DialogContent>
					<Box sx={{ py: 1 }}>
						<TextField fullWidth label="School Year (e.g., 2024-2025)" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} sx={{ mb: 2 }} />
						<Grid container spacing={2}>
							<Grid item xs={12}>
								<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
									<Typography variant="subtitle1">Semesters</Typography>
									<Button size="small" startIcon={<AddIcon />} onClick={handleAddSemester}>Add Semester</Button>
								</Box>
								<Divider sx={{ my: 1 }} />
							</Grid>
							{form.semesters.map((s, sidx) => (
								<Grid item xs={12} key={s.id}>
									<Paper sx={{ p: 2 }} variant="outlined">
										<Grid container spacing={2} alignItems="center">
											<Grid item xs={12} md={4}>
												<TextField fullWidth label="Semester Name" value={s.name} onChange={(e) => setForm((prev) => ({ ...prev, semesters: prev.semesters.map((it, i) => (i === sidx ? { ...it, name: e.target.value } : it)) }))} />
											</Grid>
											<Grid item xs={6} md={3}>
												<TextField fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }} value={s.startDate} onChange={(e) => setForm((prev) => ({ ...prev, semesters: prev.semesters.map((it, i) => (i === sidx ? { ...it, startDate: e.target.value } : it)) }))} />
											</Grid>
											<Grid item xs={6} md={3}>
												<TextField fullWidth label="End Date" type="date" InputLabelProps={{ shrink: true }} value={s.endDate} onChange={(e) => setForm((prev) => ({ ...prev, semesters: prev.semesters.map((it, i) => (i === sidx ? { ...it, endDate: e.target.value } : it)) }))} />
											</Grid>
											<Grid item xs={12} md={2}>
												<IconButton color="error" onClick={() => handleRemoveSemester(sidx)}>
													<DeleteIcon />
												</IconButton>
											</Grid>
											<Grid item xs={12}>
												<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
													<Typography variant="subtitle2">Terms</Typography>
													<Button size="small" startIcon={<AddIcon />} onClick={() => handleAddTerm(sidx)}>Add Term</Button>
												</Box>
												{(s.terms || []).map((t, tidx) => (
													<Grid container spacing={2} key={t.id} sx={{ my: 1 }}>
														<Grid item xs={12} md={4}>
															<TextField fullWidth label="Term Name" value={t.name} onChange={(e) => setForm((prev) => ({ ...prev, semesters: prev.semesters.map((sem, i) => (i === sidx ? { ...sem, terms: sem.terms.map((it, j) => (j === tidx ? { ...it, name: e.target.value } : it)) } : sem)) }))} />
														</Grid>
														<Grid item xs={6} md={3}>
															<TextField fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }} value={t.startDate} onChange={(e) => setForm((prev) => ({ ...prev, semesters: prev.semesters.map((sem, i) => (i === sidx ? { ...sem, terms: sem.terms.map((it, j) => (j === tidx ? { ...it, startDate: e.target.value } : it)) } : sem)) }))} />
														</Grid>
														<Grid item xs={6} md={3}>
															<TextField fullWidth label="End Date" type="date" InputLabelProps={{ shrink: true }} value={t.endDate} onChange={(e) => setForm((prev) => ({ ...prev, semesters: prev.semesters.map((sem, i) => (i === sidx ? { ...sem, terms: sem.terms.map((it, j) => (j === tidx ? { ...it, endDate: e.target.value } : it)) } : sem)) }))} />
														</Grid>
														<Grid item xs={12} md={2}>
															<IconButton color="error" onClick={() => handleRemoveTerm(sidx, tidx)}>
																<DeleteIcon />
															</IconButton>
														</Grid>
													</Grid>
												))}
											</Grid>
										</Grid>
									</Paper>
								</Grid>
							))}
						</Grid>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Cancel</Button>
					<Button variant="contained" onClick={submit}>{editId ? "Save" : "Create"}</Button>
				</DialogActions>
			</Dialog>
		</Paper>
	);
};

export default AcademicPeriodsManager;
