import React, { useState } from "react";
import axios from "axios";
import API_BASE from "./api";
import { Link } from "react-router-dom";
import Layout from "./components/Layout";
import { useLanguage } from "./LanguageContext";
import {
    Container,
    TextField,
    Button,
    Typography,
    Paper,
    Box,
    Grid,
    Snackbar,
    Alert,
    Slider,
    MenuItem,
    Divider,
    CircularProgress
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function LoanForm() {
    const { t } = useLanguage();

    const [form, setForm] = useState({
        username: localStorage.getItem("username"),
        income: "",
        loanAmount: "",
        creditScore: "",
        loanType: "Personal",
        tenure: 5
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [applied, setApplied] = useState(false);
    const [docFile, setDocFile] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSliderChange = (e, newValue) => {
        setForm({ ...form, tenure: newValue });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setResult(null); // Reset previous result for animation
        try {
            const res = await axios.post(`${API_BASE}/predict`, form);
            setTimeout(() => {
                setResult(res.data);
                setLoading(false);
            }, 500); // Simulate short loading for effect
        } catch (error) {
            setLoading(false);
            const msg = error.response?.data?.error || "Prediction failed";
            setSnackbar({ open: true, message: msg, severity: "error" });
        }
    };

    const handleApply = async () => {
        if (!docFile) {
            setSnackbar({ open: true, message: "Please upload a supporting document (PDF, JPG, PNG)", severity: "warning" });
            return;
        }

        const formData = new FormData();
        formData.append("username", form.username);
        formData.append("income", form.income);
        formData.append("loanAmount", form.loanAmount);
        formData.append("creditScore", form.creditScore);
        formData.append("loanType", form.loanType);
        formData.append("tenure", form.tenure);
        formData.append("emi", result.emi);
        formData.append("prediction", result.prediction);
        formData.append("probability", result.probability);
        formData.append("riskLevel", result.risk_level);
        formData.append("document", docFile);

        try {
            await axios.post(`${API_BASE}/apply-loan`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setApplied(true);
            setSnackbar({ open: true, message: "Loan application submitted successfully!", severity: "success" });
        } catch (error) {
            const msg = error.response?.data?.error || "Failed to submit application";
            setSnackbar({ open: true, message: msg, severity: "error" });
        }
    };

    const getRiskColor = (level) => {
        if (level === "High Risk") return "#FF3B30";
        if (level === "Medium Risk") return "#FF9500";
        return "#34C759";
    };

    const isEligible = result?.prediction === "Eligible";

    return (
        <Layout role="user">
            <Container maxWidth="xl" sx={{ mt: 2 }}>
                <Grid container spacing={4}>
                    {/* LEFT: Loan Configuration */}
                    <Grid item xs={12} md={5}>
                        <Paper className="glass-panel" sx={{ p: 4, position: 'relative', overflow: 'hidden' }}>
                            <Box sx={{
                                position: 'absolute', top: -50, right: -50, width: 150, height: 150,
                                background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, rgba(0,0,0,0) 70%)',
                                borderRadius: '50%'
                            }} />

                            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
                                {t("loanPredictor")}
                            </Typography>

                            <Box display="flex" flexDirection="column" gap={3}>
                                <TextField
                                    label={t("monthlyIncome")}
                                    name="income"
                                    type="number"
                                    fullWidth
                                    value={form.income}
                                    onChange={handleChange}
                                    InputProps={{ startAdornment: <AttachMoneyIcon sx={{ color: 'text.secondary', mr: 1 }} /> }}
                                />

                                <TextField
                                    label={t("loanAmount")}
                                    name="loanAmount"
                                    type="number"
                                    fullWidth
                                    value={form.loanAmount}
                                    onChange={handleChange}
                                    InputProps={{ startAdornment: <AttachMoneyIcon sx={{ color: 'text.secondary', mr: 1 }} /> }}
                                />

                                <TextField
                                    label={t("creditScore")}
                                    name="creditScore"
                                    type="number"
                                    fullWidth
                                    value={form.creditScore}
                                    onChange={handleChange}
                                    InputProps={{ startAdornment: <CreditScoreIcon sx={{ color: 'text.secondary', mr: 1 }} /> }}
                                />

                                <TextField
                                    select
                                    label={t("loanType")}
                                    name="loanType"
                                    fullWidth
                                    value={form.loanType}
                                    onChange={handleChange}
                                    SelectProps={{ MenuProps: { PaperProps: { className: 'glass-panel' } } }}
                                >
                                    {["Personal", "Home", "Car", "Education"].map((option) => (
                                        <MenuItem key={option} value={option}>{option}</MenuItem>
                                    ))}
                                </TextField>

                                <Box sx={{ px: 1, mt: 1 }}>
                                    <Typography gutterBottom color="text.secondary">
                                        {t("loanTenure")}: {form.tenure} Years
                                    </Typography>
                                    <Slider
                                        value={form.tenure}
                                        min={1}
                                        max={30}
                                        step={1}
                                        onChange={handleSliderChange}
                                        valueLabelDisplay="auto"
                                        sx={{
                                            color: 'primary.main',
                                            '& .MuiSlider-thumb': { boxShadow: '0 0 10px rgba(0,212,255,0.5)' }
                                        }}
                                    />
                                </Box>

                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    sx={{ mt: 2, height: '56px', fontSize: '1.1rem', letterSpacing: 1 }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : "Run AI Prediction"}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* RIGHT: Results & Application */}
                    <Grid item xs={12} md={7}>
                        <AnimatePresence mode="wait">
                            {!result && !loading && (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ height: '100%' }}
                                >
                                    <Paper className="glass-panel" sx={{
                                        p: 4, height: '100%', display: 'flex', flexDirection: 'column',
                                        justifyContent: 'center', alignItems: 'center', opacity: 0.6
                                    }}>
                                        <Typography variant="h5" color="text.secondary" align="center">
                                            Fill out the form and run the AI prediction to see your eligibility and EMI breakdown here.
                                        </Typography>
                                    </Paper>
                                </motion.div>
                            )}

                            {loading && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ height: '100%' }}
                                >
                                    <Paper className="glass-panel" sx={{
                                        p: 4, height: '100%', display: 'flex', flexDirection: 'column',
                                        justifyContent: 'center', alignItems: 'center'
                                    }}>
                                        <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
                                        <Typography variant="h6" className="text-glow">Analyzing Financial Data...</Typography>
                                    </Paper>
                                </motion.div>
                            )}

                            {result && !loading && (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                >
                                    <Paper className="glass-panel" sx={{ p: 4, borderTop: `4px solid ${isEligible ? '#34C759' : '#FF3B30'}` }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                {isEligible ? "🎉 Eligible" : "🚫 Not Eligible"}
                                            </Typography>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="h3" color="primary.main" className="text-glow" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                                                    ₹{result.emi}
                                                </Typography>
                                                <Typography variant="subtitle2" color="text.secondary">Est. Monthly EMI</Typography>
                                            </Box>
                                        </Box>

                                        <Grid container spacing={3} sx={{ mb: 4 }}>
                                            <Grid item xs={6} sm={4}>
                                                <Typography variant="body2" color="text.secondary">Approval Probability</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{result.probability}</Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={4}>
                                                <Typography variant="body2" color="text.secondary">Risk Analysis</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: getRiskColor(result.risk_level) }}>
                                                    {result.risk_level}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={4}>
                                                <Typography variant="body2" color="text.secondary">Max Safe Loan</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>₹{result.max_safe_loan}</Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={4}>
                                                <Typography variant="body2" color="text.secondary">Credit Risk</Typography>
                                                <Typography variant="subtitle1">{result.credit_risk}</Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={4}>
                                                <Typography variant="body2" color="text.secondary">Financial Health</Typography>
                                                <Typography variant="subtitle1">{result.financial_health}</Typography>
                                            </Grid>
                                        </Grid>

                                        {(!isEligible && (result.rejection_reason || result.suggested_loan)) && (
                                            <Box sx={{ mb: 4, p: 3, bgcolor: 'rgba(255,59,48,0.1)', borderRadius: 2, border: '1px solid rgba(255,59,48,0.2)' }}>
                                                {result.rejection_reason && (
                                                    <Typography color="error.light" sx={{ mb: 1 }}><b>Reason:</b> {result.rejection_reason}</Typography>
                                                )}
                                                {result.suggested_loan && (
                                                    <Typography color="error.light"><b>Alternative:</b> Try lowering your request to ₹{result.suggested_loan}</Typography>
                                                )}
                                            </Box>
                                        )}

                                        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

                                        {/* Application Section */}
                                        {isEligible && !applied && (
                                            <Box>
                                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                                    Proceed with Application
                                                </Typography>

                                                <Grid container spacing={2} alignItems="center">
                                                    <Grid item xs={12} sm={8}>
                                                        <Button
                                                            variant="outlined"
                                                            component="label"
                                                            fullWidth
                                                            startIcon={<CloudUploadIcon />}
                                                            sx={{
                                                                height: '56px',
                                                                borderStyle: 'dashed',
                                                                borderWidth: 2,
                                                                color: docFile ? 'primary.main' : 'text.secondary',
                                                                borderColor: docFile ? 'primary.main' : 'rgba(255,255,255,0.2)'
                                                            }}
                                                        >
                                                            {docFile ? docFile.name : "Upload Document (PDF/JPG)"}
                                                            <input
                                                                type="file"
                                                                hidden
                                                                accept=".pdf,.jpg,.jpeg,.png"
                                                                onChange={(e) => setDocFile(e.target.files[0])}
                                                            />
                                                        </Button>
                                                    </Grid>
                                                    <Grid item xs={12} sm={4}>
                                                        <Button
                                                            variant="contained"
                                                            color="success"
                                                            fullWidth
                                                            onClick={handleApply}
                                                            sx={{ height: '56px', fontWeight: 'bold', background: 'linear-gradient(135deg, #34C759 0%, #248A3D 100%)' }}
                                                        >
                                                            Apply Now
                                                        </Button>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        )}

                                        {applied && (
                                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                                <Box sx={{ p: 3, background: 'linear-gradient(135deg, rgba(52,199,89,0.1) 0%, rgba(52,199,89,0.05) 100%)', border: '1px solid rgba(52,199,89,0.2)', borderRadius: 2, textAlign: 'center' }}>
                                                    <Typography variant="h6" sx={{ color: '#34C759', fontWeight: 'bold', mb: 1 }}>
                                                        Application Submitted Successfully!
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        You can track the status in <Link to="/my-applications" style={{ color: '#00D4FF', textDecoration: 'none' }}>Your Applications</Link>.
                                                    </Typography>
                                                </Box>
                                            </motion.div>
                                        )}
                                    </Paper>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Grid>
                </Grid>
            </Container>

            <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2, boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Layout>
    );
}

export default LoanForm;