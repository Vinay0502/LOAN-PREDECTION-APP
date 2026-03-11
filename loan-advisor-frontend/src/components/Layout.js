import React, { useState, useEffect } from "react";
import { Box, AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, IconButton, useTheme, Badge, Menu, MenuItem } from "@mui/material";
import axios from "axios";
import API_BASE from "../api";
import { useNavigate, useLocation } from "react-router-dom";
import Chatbot from "../Chatbot";
import { useLanguage } from "../LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import LogoutIcon from '@mui/icons-material/Logout';
import LanguageIcon from '@mui/icons-material/Language';
import NotificationsIcon from '@mui/icons-material/Notifications';

const drawerWidth = 240;

function Layout({ children, role }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { language, toggleLanguage, t } = useLanguage();
    const theme = useTheme();

    const [notifications, setNotifications] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const username = localStorage.getItem("username");

    useEffect(() => {
        if (role === "user" && username) {
            fetchNotifications();
        }
    }, [role, username]);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`${API_BASE}/notifications?username=${username}`);
            setNotifications(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenNotifications = (e) => {
        setAnchorEl(e.currentTarget);
    };

    const handleCloseNotifications = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
    };

    const isActive = (path) => location.pathname === path;

    const navItems = role === "admin" ? [
        { text: t("adminDashboard"), icon: <DashboardIcon />, path: "/admin" }
    ] : [
        { text: t("loanDashboard"), icon: <DashboardIcon />, path: "/dashboard" },
        { text: t("myApplications"), icon: <ReceiptIcon />, path: "/my-applications" },
        { text: t("myAnalytics"), icon: <AnalyticsIcon />, path: "/user-analytics" }
    ];

    return (
        <Box sx={{ display: "flex", minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Header */}
            <AppBar
                position="fixed"
                sx={{
                    width: `calc(100% - ${drawerWidth}px)`,
                    ml: `${drawerWidth}px`,
                    background: 'rgba(10, 10, 10, 0.65)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: 'none'
                }}
            >
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main', textShadow: '0 0 10px rgba(0,212,255,0.3)' }}>
                        {t("appTitle") || "Loan Advisor PRO"}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {role === "user" && (
                            <>
                                <IconButton color="inherit" onClick={handleOpenNotifications}>
                                    <Badge badgeContent={notifications.length} color="error">
                                        <NotificationsIcon />
                                    </Badge>
                                </IconButton>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleCloseNotifications}
                                    PaperProps={{ sx: { background: 'rgba(20,20,20,0.9)', backdropFilter: 'blur(10px)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', minWidth: 250, mt: 1 } }}
                                >
                                    {notifications.length === 0 ? (
                                        <MenuItem onClick={handleCloseNotifications}>No new notifications</MenuItem>
                                    ) : (
                                        notifications.map((notif, index) => (
                                            <MenuItem key={index} onClick={() => { handleCloseNotifications(); navigate('/my-applications'); }}>
                                                {notif.message}
                                            </MenuItem>
                                        ))
                                    )}
                                </Menu>
                            </>
                        )}
                        <Button
                            color="inherit"
                            onClick={toggleLanguage}
                            startIcon={<LanguageIcon />}
                            sx={{
                                fontWeight: "bold",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 3,
                                px: 2,
                                '&:hover': {
                                    background: 'rgba(255,255,255,0.05)',
                                    borderColor: 'primary.main'
                                }
                            }}
                        >
                            {language === "en" ? "हिंदी" : "English"}
                        </Button>
                        <Button
                            color="error"
                            variant="outlined"
                            onClick={handleLogout}
                            endIcon={<LogoutIcon />}
                            sx={{ borderRadius: 3, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                        >
                            {t("logout")}
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: drawerWidth,
                        boxSizing: "border-box",
                        background: 'rgba(15, 15, 15, 0.85)',
                        backdropFilter: 'blur(20px)',
                        borderRight: '1px solid rgba(255,255,255,0.05)',
                        color: 'text.primary'
                    },
                }}
            >
                <Toolbar sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'linear-gradient(180deg, rgba(0,212,255,0.05) 0%, transparent 100%)',
                    py: 2
                }}>
                    {/* Placeholder for Logo */}
                    <Box sx={{
                        width: 40, height: 40, borderRadius: 2,
                        background: 'linear-gradient(135deg, #00D4FF 0%, #B13CFF 100%)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        boxShadow: '0 0 15px rgba(0, 212, 255, 0.5)'
                    }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>L</Typography>
                    </Box>
                </Toolbar>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                <List sx={{ mt: 2, px: 2 }}>
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <ListItem
                                button
                                key={item.text}
                                onClick={() => navigate(item.path)}
                                sx={{
                                    borderRadius: 3,
                                    mb: 1,
                                    background: active ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                                    backdropFilter: active ? 'blur(10px)' : 'none',
                                    border: active ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid transparent',
                                    boxShadow: active ? '0 4px 12px rgba(0, 212, 255, 0.1)' : 'none',
                                    color: active ? 'primary.main' : 'text.primary',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        transform: 'translateX(4px)'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ color: active ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontWeight: active ? 'bold' : 'medium',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </Drawer>

            {/* Content Body */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, md: 4 },
                    marginTop: "64px",
                    position: 'relative',
                    overflowX: 'hidden'
                }}
            >
                {/* Page Transitions Wrap */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="page-wrapper"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </Box>

            {/* Floating Chatbot Component */}
            <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
                <Chatbot />
            </Box>
        </Box>
    );
}

export default Layout;