import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Login from "./Login";
import Register from "./Register";
import LoanForm from "./LoanForm";
import AdminDashboard from "./AdminDashboard";
import AdminRegister from "./AdminRegister";
import AdminLogin from "./AdminLogin";
import MyApplications from "./MyApplications";
import UserAnalytics from "./UserAnalytics";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<LoanForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-register" element={<AdminRegister />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/my-applications" element={<MyApplications />} />
          <Route path="/user-analytics" element={<UserAnalytics />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;