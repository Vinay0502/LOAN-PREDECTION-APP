import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "./api";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Layout from "./components/Layout";
import { useLanguage } from "./LanguageContext";

import {
    Grid,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    TextField,
    Chip,
    Box,
    Snackbar,
    Alert,
    IconButton,
    Tooltip as MuiTooltip
} from "@mui/material";

import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import { motion } from "framer-motion";

ChartJS.register(ArcElement, Tooltip, Legend);

function AdminDashboard() {
    const { t } = useLanguage();
    const [applications, setApplications] = useState([]);
    const [approved, setApproved] = useState(0);
    const [rejected, setRejected] = useState(0);
    const [accuracy, setAccuracy] = useState("");
    const [importance, setImportance] = useState({});

    // Loan Applications state
    const [loanApplications, setLoanApplications] = useState([]);
    const [remarks, setRemarks] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    useEffect(() => {
        fetchApplications();
        fetchModelInfo();
        fetchLoanApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await axios.get(`${API_BASE}/applications`);
            setApplications(res.data);

            let approveCount = 0;
            let rejectCount = 0;

            res.data.forEach((app) => {
                if (app[5] === "Eligible") approveCount++;
                else rejectCount++;
            });

            setApproved(approveCount);
            setRejected(rejectCount);
        } catch {
            console.error("Error fetching applications");
        }
    };

    const fetchModelInfo = async () => {
        try {
            const res = await axios.get(`${API_BASE}/model-info`);
            setAccuracy(res.data.accuracy);
            setImportance(res.data.feature_importance);
        } catch { }
    };

    const fetchLoanApplications = async () => {
        try {
            const res = await axios.get(`${API_BASE}/all-loan-applications`);
            setLoanApplications(res.data);
        } catch {
            console.error("Error fetching loan applications");
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.put(`${API_BASE}/update-application-status`, {
                id: id,
                status: status,
                admin_remarks: remarks[id] || ""
            });
            setSnackbar({
                open: true,
                message: `Application ${status} successfully!`,
                severity: status === "Approved" ? "success" : "error"
            });
            fetchLoanApplications();
        } catch {
            setSnackbar({ open: true, message: "Failed to update status", severity: "error" });
        }
    };

    const StatusChip = ({ status }) => {
        if (status === "Approved") return (
            <Chip icon={<CheckCircleIcon sx={{ color: '#000 !important' }} />} label="Approved" sx={{ backgroundColor: '#34C759', color: '#000', fontWeight: 'bold', boxShadow: '0 0 10px rgba(52,199,89,0.5)' }} />
        );
        if (status === "Rejected") return (
            <Chip icon={<CancelIcon sx={{ color: '#fff !important' }} />} label="Rejected" sx={{ backgroundColor: '#FF3B30', color: '#fff', fontWeight: 'bold', boxShadow: '0 0 10px rgba(255,59,48,0.5)' }} />
        );
        return (
            <Chip icon={<PendingIcon sx={{ color: '#fff !important' }} />} label="Pending" sx={{ backgroundColor: '#FF9500', color: '#fff', fontWeight: 'bold', boxShadow: '0 0 10px rgba(255,149,0,0.5)' }} />
        );
    };

    const chartData = {
        labels: ["Approved", "Rejected"],
        datasets: [
            {
                data: [approved, rejected],
                backgroundColor: ["rgba(52,199,89,0.8)", "rgba(255,59,48,0.8)"],
                borderColor: ["#34C759", "#FF3B30"],
                borderWidth: 1,
            }
        ]
    };

    const chartOptions = {
        plugins: {
            legend: { labels: { color: '#fff' } }
        }
    };

    return (
        <Layout role="admin">
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', textShadow: '0 0 10px rgba(255,149,0,0.3)' }} color="primary">
                {t("adminDashboard")}
            </Typography>

            {/* Prediction Analytics Section */}
            <Grid container spacing={4}>
                {/* Pie Chart */}
                <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                        <Card className="glass-panel" sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    {t("approvalAnalytics")}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                    <div style={{ maxWidth: '200px' }}>
                                        <Pie data={chartData} options={chartOptions} />
                                    </div>
                                </Box>
                                <Typography align="center" variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    Total AI Predictions: <b>{applications.length}</b>
                                </Typography>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>

                {/* Prediction Records Table */}
                <Grid item xs={12} md={8}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                        <Card className="glass-panel" sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    {t("predictionRecords")}
                                </Typography>
                                <TableContainer sx={{ maxHeight: 300, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,149,0,0.5)', borderRadius: '4px' } }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ bgcolor: 'rgba(255,149,0,0.1)', color: 'primary.main', fontWeight: 'bold' }}>ID</TableCell>
                                                <TableCell sx={{ bgcolor: 'rgba(255,149,0,0.1)', color: 'primary.main', fontWeight: 'bold' }}>User</TableCell>
                                                <TableCell sx={{ bgcolor: 'rgba(255,149,0,0.1)', color: 'primary.main', fontWeight: 'bold' }}>Income / Loan</TableCell>
                                                <TableCell sx={{ bgcolor: 'rgba(255,149,0,0.1)', color: 'primary.main', fontWeight: 'bold' }}>Credit</TableCell>
                                                <TableCell sx={{ bgcolor: 'rgba(255,149,0,0.1)', color: 'primary.main', fontWeight: 'bold' }}>Status</TableCell>
                                                <TableCell sx={{ bgcolor: 'rgba(255,149,0,0.1)', color: 'primary.main', fontWeight: 'bold' }}>Prob.</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {applications.map((app, index) => (
                                                <TableRow key={index} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <TableCell sx={{ color: 'text.secondary' }}>#{app[0]}</TableCell>
                                                    <TableCell fontWeight="bold">{app[1]}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">₹{app[2]}</Typography>
                                                        <Typography variant="caption" color="text.secondary">Req: ₹{app[3]}</Typography>
                                                    </TableCell>
                                                    <TableCell>{app[4]}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ color: app[5] === "Eligible" ? '#34C759' : '#FF3B30', fontWeight: 'bold' }}>
                                                            {app[5]}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{app[6]}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>
            </Grid>

            {/* Loan Applications Management Section */}
            <Typography variant="h5" sx={{ mt: 6, mb: 3, fontWeight: 'bold', textShadow: '0 0 10px rgba(255,149,0,0.3)' }} color="primary">
                {t("loanAppMgmt")}
            </Typography>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                <Card className="glass-panel" sx={{ overflow: 'hidden' }}>
                    <CardContent sx={{ p: 0 }}>
                        {loanApplications.length === 0 ? (
                            <Box sx={{ p: 6, textAlign: 'center' }}>
                                <Typography color="text.secondary">No loan applications pending review.</Typography>
                            </Box>
                        ) : (
                            <TableContainer sx={{ maxHeight: 500, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,149,0,0.5)', borderRadius: '4px' } }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ bgcolor: 'rgba(20,20,20,0.95)', color: 'primary.main', fontWeight: 'bold', borderBottom: '2px solid rgba(255,149,0,0.3)' }}>User / ID</TableCell>
                                            <TableCell sx={{ bgcolor: 'rgba(20,20,20,0.95)', color: 'primary.main', fontWeight: 'bold', borderBottom: '2px solid rgba(255,149,0,0.3)' }}>Loan Details</TableCell>
                                            <TableCell sx={{ bgcolor: 'rgba(20,20,20,0.95)', color: 'primary.main', fontWeight: 'bold', borderBottom: '2px solid rgba(255,149,0,0.3)' }}>User Profile</TableCell>
                                            <TableCell sx={{ bgcolor: 'rgba(20,20,20,0.95)', color: 'primary.main', fontWeight: 'bold', borderBottom: '2px solid rgba(255,149,0,0.3)' }}>Status</TableCell>
                                            <TableCell sx={{ bgcolor: 'rgba(20,20,20,0.95)', color: 'primary.main', fontWeight: 'bold', borderBottom: '2px solid rgba(255,149,0,0.3)', minWidth: 200 }}>Admin Remarks</TableCell>
                                            <TableCell sx={{ bgcolor: 'rgba(20,20,20,0.95)', color: 'primary.main', fontWeight: 'bold', borderBottom: '2px solid rgba(255,149,0,0.3)' }}>Doc</TableCell>
                                            <TableCell sx={{ bgcolor: 'rgba(20,20,20,0.95)', color: 'primary.main', fontWeight: 'bold', borderBottom: '2px solid rgba(255,149,0,0.3)', minWidth: 180, textAlign: 'center' }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {loanApplications.map((app) => (
                                            <TableRow key={app.id} sx={{ '&:hover': { bgcolor: 'rgba(255,149,0,0.05)' }, transition: 'background-color 0.2s', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <TableCell>
                                                    <Typography variant="body1" fontWeight="bold">{app.username}</Typography>
                                                    <Typography variant="caption" color="text.secondary">ID: #{app.id}</Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="body2"><b>{app.loanType}</b></Typography>
                                                    <Typography variant="body2" color="text.secondary">Req: ₹{app.loanAmount}</Typography>
                                                    <Typography variant="body2" color="text.secondary">EMI: ₹{app.emi}</Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="body2">Inc: ₹{app.income}</Typography>
                                                    <Typography variant="body2" sx={{ color: app.riskLevel === "High Risk" ? "#FF3B30" : "#34C759", fontWeight: 'bold' }}>
                                                        {app.riskLevel}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <StatusChip status={app.status} />
                                                </TableCell>

                                                <TableCell>
                                                    {app.status === "Pending" ? (
                                                        <TextField
                                                            size="small"
                                                            placeholder="Add remarks for user..."
                                                            value={remarks[app.id] || ""}
                                                            onChange={(e) => setRemarks({ ...remarks, [app.id]: e.target.value })}
                                                            fullWidth
                                                            variant="standard"
                                                            sx={{ input: { color: 'text.primary', borderBottom: '1px solid rgba(255,255,255,0.3)' } }}
                                                        />
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {app.adminRemarks || "—"}
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    {app.documentFilename ? (
                                                        <MuiTooltip title="View Document">
                                                            <IconButton component="a" href={`${API_BASE}/uploads/${app.documentFilename}`} target="_blank" size="small" sx={{ color: 'primary.main', bgcolor: 'rgba(255,149,0,0.1)' }}>
                                                                <DescriptionIcon fontSize="small" />
                                                            </IconButton>
                                                        </MuiTooltip>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">—</Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell align="center">
                                                    {app.status === "Pending" ? (
                                                        <Box display="flex" justifyContent="center" gap={1}>
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                onClick={() => handleStatusUpdate(app.id, "Approved")}
                                                                sx={{ minWidth: '40px', px: 1, bgcolor: '#34C759', '&:hover': { bgcolor: '#248A3D' } }}
                                                            >
                                                                <CheckCircleIcon fontSize="small" />
                                                            </Button>
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                onClick={() => handleStatusUpdate(app.id, "Rejected")}
                                                                sx={{ minWidth: '40px', px: 1, bgcolor: '#FF3B30', '&:hover': { bgcolor: '#B22222' } }}
                                                            >
                                                                <CancelIcon fontSize="small" />
                                                            </Button>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                                                            Processed
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2, boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Layout>
    );
}

export default AdminDashboard;
