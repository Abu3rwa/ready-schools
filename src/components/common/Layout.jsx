import React, { useState, useEffect } from "react";
import {
	Box,
	Toolbar,
	useMediaQuery,
	useTheme,
	CssBaseline,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
} from "@mui/material";
import Header from "./Header";
import Sidebar from "./Sidebar";
import BreadcrumbNav from "./BreadcrumbNav";
import { useAuth } from "../../contexts/AuthContext";
import { useGmail } from "../../contexts/GmailContext";

const Layout = ({ children }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
	const { currentUser } = useAuth();
	const { shouldPrompt, setShouldPrompt, setupGmail, checkGmailConfiguration } = useGmail();
	const [openPrompt, setOpenPrompt] = useState(false);

	useEffect(() => {
		if (currentUser) {
			checkGmailConfiguration();
		}
	}, [currentUser, checkGmailConfiguration]);

	useEffect(() => {
		setOpenPrompt(!!currentUser && shouldPrompt);
	}, [currentUser, shouldPrompt]);

	const handleDismiss = () => {
		setOpenPrompt(false);
		setShouldPrompt(false);
	};

	const toggleSidebar = () => {
		setSidebarOpen(!sidebarOpen);
	};

	return (
		<Box sx={{ display: "flex", height: "100vh" }}>
			<CssBaseline />
			<Header toggleSidebar={toggleSidebar} />
			<Sidebar
				open={sidebarOpen}
				variant={isMobile ? "temporary" : "persistent"}
				onClose={toggleSidebar}
			/>
			<Box
				component="main"
				sx={{
					flexGrow: 1,
					p: 3,
					transition: theme.transitions.create("margin", {
						easing: theme.transitions.easing.sharp,
						duration: theme.transitions.duration.leavingScreen,
					}),
					marginLeft: `-${240}px`,
					...(sidebarOpen &&
						!isMobile && {
							transition: theme.transitions.create("margin", {
								easing: theme.transitions.easing.easeOut,
								duration: theme.transitions.duration.enteringScreen,
							}),
							marginLeft: 0,
						}),
					...(isMobile && {
						marginLeft: 0,
					}),
				}}
			>
				<Toolbar /> {/* This creates space for the AppBar */}
				<BreadcrumbNav />
				{children}
			</Box>

			<Dialog open={openPrompt} onClose={handleDismiss} maxWidth="xs" fullWidth>
				<DialogTitle>Connect Gmail</DialogTitle>
				<DialogContent>
					<Typography variant="body2">
						To send emails from your own address, please connect your Gmail account.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDismiss}>Maybe later</Button>
					<Button variant="contained" onClick={setupGmail} autoFocus>
						Connect Gmail
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default Layout;
