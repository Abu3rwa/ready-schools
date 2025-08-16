import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
	listAcademicPeriods,
	createAcademicPeriod,
	updateAcademicPeriod,
	deleteAcademicPeriod,
} from "../services/academicPeriodsService";
import { useAuth } from "./AuthContext";

const AcademicPeriodsContext = createContext();

export const useAcademicPeriods = () => {
	const ctx = useContext(AcademicPeriodsContext);
	if (!ctx) throw new Error("useAcademicPeriods must be used within AcademicPeriodsProvider");
	return ctx;
};

export const AcademicPeriodsProvider = ({ children }) => {
	const { currentUser } = useAuth();
	const [periods, setPeriods] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const refresh = async () => {
		try {
			setLoading(true);
			const data = await listAcademicPeriods();
			setPeriods(data);
		} catch (e) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (currentUser) {
			refresh();
		} else {
			setPeriods([]);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUser]);

	const years = useMemo(() => periods.map((p) => ({ id: p.id, name: p.name })), [periods]);

	const getSemestersForYear = (yearId) => {
		const period = periods.find((p) => p.id === yearId);
		return period?.semesters || [];
	};

	const getTermsForSemester = (yearId, semesterId) => {
		const period = periods.find((p) => p.id === yearId);
		const sem = period?.semesters?.find((s) => s.id === semesterId);
		return sem?.terms || [];
	};

	const addPeriod = async (payload) => {
		const created = await createAcademicPeriod(payload);
		setPeriods((prev) => [created, ...prev]);
		return created;
	};

	const updatePeriod = async (id, updates) => {
		await updateAcademicPeriod(id, updates);
		setPeriods((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
	};

	const removePeriod = async (id) => {
		await deleteAcademicPeriod(id);
		setPeriods((prev) => prev.filter((p) => p.id !== id));
	};

	const value = {
		periods,
		years,
		loading,
		error,
		refresh,
		getSemestersForYear,
		getTermsForSemester,
		addPeriod,
		updatePeriod,
		removePeriod,
	};

	return <AcademicPeriodsContext.Provider value={value}>{children}</AcademicPeriodsContext.Provider>;
};
