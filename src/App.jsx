import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import GmailCallback from "./components/email/GmailCallback";

// Pages
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import GradeBook from "./pages/GradeBook";
import Assignments from "./pages/Assignments";
import Attendance from "./pages/Attendance";
import Behavior from "./pages/Behavior";
import Communication from "./pages/Communication";
import Reports from "./pages/Reports";
import Standards from "./pages/Standards";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";

// Components
import Layout from "./components/common/Layout";
import OfflineIndicator from "./components/common/OfflineIndicator";
import GradeBookList from "./pages/GradeBookList";







const AppRoutes = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={currentUser ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route
        path="/students"
        element={currentUser ? <Students /> : <Navigate to="/login" />}
      />
      <Route
        path="/gradebooks"
        element={currentUser ? <GradeBookList /> : <Navigate to="/login" />}
      />
      <Route
        path="/gradebooks/:id"
        element={currentUser ? <GradeBook /> : <Navigate to="/login" />}
      />
      <Route
        path="/assignments"
        element={currentUser ? <Assignments /> : <Navigate to="/login" />}
      />
      <Route
        path="/attendance"
        element={currentUser ? <Attendance /> : <Navigate to="/login" />}
      />
      <Route
        path="/behavior"
        element={currentUser ? <Behavior /> : <Navigate to="/login" />}
      />
      <Route
        path="/communication"
        element={currentUser ? <Communication /> : <Navigate to="/login" />}
      />
      <Route
        path="/reports"
        element={currentUser ? <Reports /> : <Navigate to="/login" />}
      />
      <Route
        path="/standards"
        element={currentUser ? <Standards /> : <Navigate to="/login" />}
      />
      <Route
        path="/settings"
        element={currentUser ? <Settings /> : <Navigate to="/login" />}
      />
      <Route
        path="/admin/users"
        element={currentUser ? <AdminUsers /> : <Navigate to="/login" />}
      />
      <Route
        path="/auth/gmail/callback"
        element={currentUser ? <GmailCallback /> : <Navigate to="/login" />}
      />
    </Routes>
  );
};

function App() {
  return (
    <>
      <OfflineIndicator />
      <Layout>
        <AppRoutes />
      </Layout>
    </>
  );
}

export default App;
