import React, { useState } from "react";
import axios from "axios";
import API_BASE from "./api";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "./LanguageContext";
import {
    TextField,
    Button,
    Typography,
    Paper,
    Box,
    Grid,
    CircularProgress
} from "@mui/material";
import { motion } from "framer-motion";

function Register() {
    const [user, setUser] = useState({
        username: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleRegister = async () => {
        if (!user.username || !user.password) {
            alert("Please fill all fields");
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE}/register`, user);
            alert("Registration Successful");
            navigate("/");
        } catch (error) {
            alert("Username already exists");
            setLoading(false);
        }
    };

    return (
        <Grid container sx={{ minHeight: "100vh" }}>
            {/* Left side: Graphic/Branding */}
            <Grid item xs={12} md={6} sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(177, 60, 255, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%)',
                position: 'relative',
                overflow: 'hidden',
                p: 4
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <Box sx={{ textAlign: 'center', zIndex: 1 }}>
                        <Typography variant="h2" gutterBottom className="text-glow" sx={{ fontWeight: 'bold' }}>
                            Ready to Apply?
                        </Typography>
                        <Typography variant="h5" color="text.secondary">
                            Create your account and start your journey.
                        </Typography>
                    </Box>
                </motion.div>

                {/* Decorative Elements */}
                <Box sx={{
                    position: 'absolute', top: '20%', right: '-10%', width: '400px', height: '400px',
                    background: 'radial-gradient(circle, rgba(177,60,255,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%'
                }} />
                <Box sx={{
                    position: 'absolute', bottom: '10%', left: '-10%', width: '300px', height: '300px',
                    background: 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%'
                }} />
            </Grid>

            {/* Right side: Register Form */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, zIndex: 1 }}>
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ width: '100%', maxWidth: '450px' }}
                >
                    <Paper className="glass-panel" sx={{ p: { xs: 4, md: 6 }, borderRadius: 4 }}>
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
                            {t("registerTitle")}
                        </Typography>

                        <Box display="flex" flexDirection="column" gap={3}>
                            <TextField
                                label={t("username")}
                                name="username"
                                fullWidth
                                variant="outlined"
                                onChange={handleChange}
                            />

                            <TextField
                                label={t("password")}
                                name="password"
                                type="password"
                                fullWidth
                                variant="outlined"
                                onChange={handleChange}
                            />

                            <Button
                                variant="contained"
                                color="secondary"
                                size="large"
                                onClick={handleRegister}
                                disabled={loading}
                                sx={{ mt: 2, height: '56px', fontSize: '1.1rem' }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : t("register")}
                            </Button>

                            <Typography align="center" variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                {t("alreadyAccount")}{" "}
                                <Link to="/" style={{ color: '#B13CFF', textDecoration: 'none', fontWeight: 'bold' }}>{t("loginHere")}</Link>
                            </Typography>
                        </Box>
                    </Paper>
                </motion.div>
            </Grid>
        </Grid>
    );
}

export default Register;