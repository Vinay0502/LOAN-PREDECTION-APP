import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "./api";
import Layout from "./components/Layout";
import { useLanguage } from "./LanguageContext";
import {
    Container,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Box,
    CircularProgress,
    IconButton,
    Tooltip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import PaymentIcon from '@mui/icons-material/Payment';

function MyApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [paymentResult, setPaymentResult] = useState("");
    const username = localStorage.getItem("username");
    const { t } = useLanguage();

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await axios.get(
                `${API_BASE}/my-applications?username=${username}`
            );
            setApplications(res.data);
            setLoading(false);
        } catch {
            setLoading(false);
        }
    };

    const StatusChip = ({ status }) => {
        if (status === "Approved") {
            return (
                <Chip
                    icon={<CheckCircleIcon sx={{ color: '#000 !important' }} />}
                    label="Approved"
                    sx={{ backgroundColor: '#34C759', color: '#000', fontWeight: 'bold', boxShadow: '0 0 10px rgba(52,199,89,0.5)' }}
                />
            );
        } else if (status === "Rejected") {
            return (
                <Chip
                    icon={<CancelIcon sx={{ color: '#fff !important' }} />}
                    label="Rejected"
                    sx={{ backgroundColor: '#FF3B30', color: '#fff', fontWeight: 'bold', boxShadow: '0 0 10px rgba(255,59,48,0.5)' }}
                />
            );
        } else {
            return (
                <Chip
                    icon={<PendingIcon sx={{ color: '#fff !important' }} />}
                    label="Pending"
                    sx={{ backgroundColor: '#FF9500', color: '#fff', fontWeight: 'bold', boxShadow: '0 0 10px rgba(255,149,0,0.5)' }}
                />
            );
        }
    };

    return (
        <Layout role="user">
            <Container maxWidth="xl" sx={{ mt: 2 }}>
                <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" sx={{ fontWeight: 'bold', textShadow: '0 0 10px rgba(0,212,255,0.3)' }}>
                        {t("myLoanApplications")}
                    </Typography>
                </Box>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                                <CircularProgress size={60} thickness={4} />
                            </Box>
                        </motion.div>
                    ) : applications.length === 0 ? (
                        <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Paper className="glass-panel" sx={{ p: 6, textAlign: 'center' }}>
                                <Typography variant="h5" color="text.secondary" gutterBottom>
                                    {t("noAppsYet")}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Head over to the Loan Predictor to submit your first application.
                                </Typography>
                            </Paper>
                        </motion.div>
                    ) : (
                        <motion.div key="table" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <TableContainer component={Paper} className="glass-panel" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                                <Table sx={{ minWidth: 800 }}>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: 'rgba(0, 212, 255, 0.1)', borderBottom: '2px solid rgba(0,212,255,0.3)' }}>
                                            <TableCell sx={{ color: "primary.main", fontWeight: "bold", fontSize: '1rem' }}>ID</TableCell>
                                            <TableCell sx={{ color: "primary.main", fontWeight: "bold", fontSize: '1rem' }}>Loan Details</TableCell>
                                            <TableCell sx={{ color: "primary.main", fontWeight: "bold", fontSize: '1rem' }}>Amount / EMI</TableCell>
                                            <TableCell sx={{ color: "primary.main", fontWeight: "bold", fontSize: '1rem' }}>Profile</TableCell>
                                            <TableCell sx={{ color: "primary.main", fontWeight: "bold", fontSize: '1rem' }}>Status</TableCell>
                                            <TableCell sx={{ color: "primary.main", fontWeight: "bold", fontSize: '1rem' }}>Remarks</TableCell>
                                            <TableCell sx={{ color: "primary.main", fontWeight: "bold", fontSize: '1rem' }}>Date</TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {applications.map((app, index) => (
                                            <motion.tr
                                                key={app.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                style={{ display: "table-row", borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                            >
                                                <TableCell sx={{ fontWeight: 'bold' }}>#{app.id}</TableCell>

                                                <TableCell>
                                                    <Typography variant="body1" fontWeight="bold">{app.loanType}</Typography>
                                                    <Typography variant="body2" color="text.secondary">{app.tenure} Years</Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="body1">₹{app.loanAmount}</Typography>
                                                    <Typography variant="body2" color="text.secondary">EMI: ₹{app.emi}</Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="body2">Score: <b>{app.creditScore}</b></Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ color: app.riskLevel === "High Risk" ? "#FF3B30" : "#34C759" }}
                                                    >
                                                        {app.riskLevel}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Box display="flex" flexDirection="column" gap={1}>
                                                        <StatusChip status={app.status} />
                                                        {app.status === "Approved" && (
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                startIcon={<PaymentIcon />}
                                                                onClick={async () => {
                                                                    try {
                                                                        const now = new Date();
                                                                        const res = await axios.post(`${API_BASE}/create-billplz-bill`, {
                                                                            username: username,
                                                                            loan_id: app.id,
                                                                            amount: app.emi,
                                                                            month: now.getMonth() + 1,
                                                                            year: now.getFullYear()
                                                                        });
                                                                        if (res.data.url) {
                                                                            window.location.href = res.data.url;
                                                                        }
                                                                    } catch (err) {
                                                                        alert(err.response?.data?.error || "Payment Gateway Error");
                                                                    }
                                                                }}
                                                                sx={{ mt: 1, color: 'primary.main', borderColor: 'primary.main', minWidth: '100px' }}
                                                            >
                                                                Pay EMI
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </TableCell>

                                                <TableCell>
                                                    {app.adminRemarks ? (
                                                        <Tooltip title={app.adminRemarks} arrow placement="top">
                                                            <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,0.3)' }}>
                                                                {app.adminRemarks}
                                                            </Typography>
                                                        </Tooltip>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">—</Typography>
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Typography variant="body2">
                                                            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "—"}
                                                        </Typography>
                                                        {app.documentFilename && (
                                                            <Tooltip title="View Document">
                                                                <IconButton size="small" sx={{ color: 'primary.main', bgcolor: 'rgba(0,212,255,0.1)' }}>
                                                                    <DescriptionIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </motion.tr>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </motion.div>
                    )}
                </AnimatePresence>

            </Container>
        </Layout>
    );
}

export default MyApplications;
