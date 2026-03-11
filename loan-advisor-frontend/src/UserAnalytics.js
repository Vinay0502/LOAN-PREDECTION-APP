import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "./api";
import Layout from "./components/Layout";
import { Pie, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
} from "chart.js";

import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress
} from "@mui/material";

import { motion } from "framer-motion";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function UserAnalytics() {
    const [data, setData] = useState(null);
    const username = localStorage.getItem("username");

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await axios.get(
                `${API_BASE}/user-analytics?username=${username}`
            );
            setData(res.data);
        } catch {
            console.error("Error fetching analytics");
        }
    };

    if (!data) {
        return (
            <Layout role="user">
                <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress size={60} thickness={4} />
                </Container>
            </Layout>
        );
    }

    const statCards = [
        { label: "Total Applications", value: data.totalApplications, color: "#00D4FF", icon: <ReceiptLongIcon fontSize="large" sx={{ color: '#00D4FF' }} /> },
        { label: "Approved", value: data.approved, color: "#34C759", icon: <CheckCircleIcon fontSize="large" sx={{ color: '#34C759' }} /> },
        { label: "Rejected", value: data.rejected, color: "#FF3B30", icon: <CancelIcon fontSize="large" sx={{ color: '#FF3B30' }} /> },
        { label: "Pending", value: data.pending, color: "#FF9500", icon: <PendingIcon fontSize="large" sx={{ color: '#FF9500' }} /> }
    ];

    const pieData = {
        labels: Object.keys(data.applicationsByType),
        datasets: [{
            data: Object.values(data.applicationsByType),
            backgroundColor: [
                "rgba(0, 212, 255, 0.8)",    // Cyan
                "rgba(177, 60, 255, 0.8)",   // Purple
                "rgba(255, 149, 0, 0.8)",    // Orange
                "rgba(52, 199, 89, 0.8)"     // Green
            ],
            borderColor: [
                "#00D4FF",
                "#B13CFF",
                "#FF9500",
                "#34C759"
            ],
            borderWidth: 1
        }]
    };

    const pieOptions = {
        plugins: {
            legend: { labels: { color: '#fff' } }
        }
    };

    const barData = {
        labels: data.recentApplications.map((a, i) => `${a.loanType} #${i + 1}`),
        datasets: [{
            label: "Loan Amount (₹)",
            data: data.recentApplications.map((a) => a.loanAmount),
            backgroundColor: data.recentApplications.map((a) =>
                a.status === "Approved" ? "rgba(52, 199, 89, 0.8)" :
                    a.status === "Rejected" ? "rgba(255, 59, 48, 0.8)" :
                        "rgba(255, 149, 0, 0.8)"
            ),
            borderColor: data.recentApplications.map((a) =>
                a.status === "Approved" ? "#34C759" :
                    a.status === "Rejected" ? "#FF3B30" :
                        "#FF9500"
            ),
            borderWidth: 1,
            borderRadius: 8
        }]
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(20, 20, 20, 0.9)',
                titleColor: '#00D4FF',
                bodyColor: '#fff',
                borderColor: 'rgba(0, 212, 255, 0.3)',
                borderWidth: 1,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#ccc', callback: (v) => `₹${v.toLocaleString()}` },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
                ticks: { color: '#ccc' },
                grid: { display: false }
            }
        }
    };

    return (
        <Layout role="user">
            <Container maxWidth="xl" sx={{ mt: 2 }}>
                <Box mb={4}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', textShadow: '0 0 10px rgba(0,212,255,0.3)' }} color="primary">
                        My Analytics Overview
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Track your loan applications and financial statistics.
                    </Typography>
                </Box>

                {/* Stat Cards */}
                <Grid container spacing={4} sx={{ mb: 6 }}>
                    {statCards.map((card, idx) => (
                        <Grid item xs={12} sm={6} md={3} key={idx}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                            >
                                <Card className="glass-panel" sx={{ textAlign: "center", py: 3, position: 'relative', overflow: 'hidden' }}>
                                    {/* Decorative background glow */}
                                    <Box sx={{
                                        position: 'absolute', top: -30, right: -30, width: 100, height: 100,
                                        borderRadius: '50%', background: `radial-gradient(circle, ${card.color} 0%, transparent 70%)`, opacity: 0.15
                                    }} />
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                            {card.icon}
                                        </Box>
                                        <Typography variant="h3" sx={{ fontWeight: 'bold', color: card.color, textShadow: `0 0 15px ${card.color}80` }}>
                                            {card.value}
                                        </Typography>
                                        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1, fontWeight: 'medium' }}>
                                            {card.label}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>

                {/* Summary Row */}
                <Grid container spacing={4} sx={{ mb: 6 }}>
                    <Grid item xs={12} md={6}>
                        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                            <Card className="glass-panel" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(0, 212, 255, 0.1)', mr: 3 }}>
                                    <AccountBalanceWalletIcon sx={{ fontSize: 40, color: '#00D4FF' }} />
                                </Box>
                                <CardContent sx={{ p: '0 !important' }}>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fff' }}>
                                        ₹{Number(data.totalLoanAmount).toLocaleString()}
                                    </Typography>
                                    <Typography color="text.secondary" variant="body1">Total Loan Amount Applied</Typography>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
                            <Card className="glass-panel" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(177, 60, 255, 0.1)', mr: 3 }}>
                                    <TrendingUpIcon sx={{ fontSize: 40, color: '#B13CFF' }} />
                                </Box>
                                <CardContent sx={{ p: '0 !important' }}>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fff' }}>
                                        ₹{Number(data.averageEMI).toLocaleString()}
                                    </Typography>
                                    <Typography color="text.secondary" variant="body1">Average Monthly EMI</Typography>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Grid>
                </Grid>

                {/* Charts */}
                <Grid container spacing={4}>
                    {Object.keys(data.applicationsByType).length > 0 && (
                        <Grid item xs={12} md={5}>
                            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} style={{ height: '100%' }}>
                                <Card className="glass-panel" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 'bold', width: '100%' }}>
                                            Applications by Loan Type
                                        </Typography>
                                        <Box sx={{ width: '100%', maxWidth: 320, mt: 'auto', mb: 'auto' }}>
                                            <Pie data={pieData} options={pieOptions} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>
                    )}

                    {data.recentApplications.length > 0 && (
                        <Grid item xs={12} md={7}>
                            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} style={{ height: '100%' }}>
                                <Card className="glass-panel" sx={{ height: '100%', pt: 2 }}>
                                    <CardContent>
                                        <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                                            Recent Loan Amounts
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 3 }}>
                                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#ccc' }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#34C759' }} /> Approved
                                            </Typography>
                                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#ccc' }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FF3B30' }} /> Rejected
                                            </Typography>
                                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#ccc' }}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FF9500' }} /> Pending
                                            </Typography>
                                        </Box>
                                        <Bar data={barData} options={barOptions} height={200} />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>
                    )}
                </Grid>

                {data.totalApplications === 0 && (
                    <Box sx={{ mt: 8, textAlign: "center" }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                            <Card className="glass-panel" sx={{ p: 6, maxWidth: 600, mx: 'auto' }}>
                                <ReceiptLongIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                                <Typography color="text.secondary" variant="h5" gutterBottom>
                                    No Applications Yet
                                </Typography>
                                <Typography color="text.secondary" variant="body1">
                                    Apply for a loan to see your personalized analytics dashboard here.
                                </Typography>
                            </Card>
                        </motion.div>
                    </Box>
                )}
            </Container>
        </Layout>
    );
}

export default UserAnalytics;
