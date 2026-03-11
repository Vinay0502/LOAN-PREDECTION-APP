import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import API_BASE from "./api";
import {
    Box,
    IconButton,
    TextField,
    Typography,
    Paper,
    Fab,
    Slide
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";

function Chatbot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { from: "bot", text: "Hello! 👋 I'm your Loan Advisor Assistant. Ask me about EMI, eligibility, loan types, or anything else!" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        const msg = input.trim();
        if (!msg) return;

        setMessages((prev) => [...prev, { from: "user", text: msg }]);
        setInput("");
        setLoading(true);

        try {
            const res = await axios.post(`${API_BASE}/chatbot`, { message: msg });
            setMessages((prev) => [...prev, { from: "bot", text: res.data.reply }]);
        } catch {
            setMessages((prev) => [...prev, { from: "bot", text: "Sorry, I'm having trouble connecting. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Chat Button */}
            <Fab
                color="primary"
                onClick={() => setOpen(!open)}
                sx={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    zIndex: 1300,
                    width: 60,
                    height: 60,
                    boxShadow: "0 4px 20px rgba(25,118,210,0.4)"
                }}
            >
                {open ? <CloseIcon /> : <ChatIcon />}
            </Fab>

            {/* Chat Panel */}
            <Slide direction="up" in={open} mountOnEnter unmountOnExit>
                <Paper
                    elevation={10}
                    sx={{
                        position: "fixed",
                        bottom: 96,
                        right: 24,
                        width: 370,
                        height: 480,
                        zIndex: 1300,
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 3,
                        overflow: "hidden"
                    }}
                >
                    {/* Header */}
                    <Box sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        px: 2,
                        py: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            🤖 Loan Advisor Bot
                        </Typography>
                        <IconButton size="small" sx={{ color: "white" }} onClick={() => setOpen(false)}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Messages */}
                    <Box sx={{
                        flex: 1,
                        overflowY: "auto",
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                        bgcolor: "#f5f5f5"
                    }}>
                        {messages.map((msg, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    alignSelf: msg.from === "user" ? "flex-end" : "flex-start",
                                    maxWidth: "80%"
                                }}
                            >
                                <Paper
                                    sx={{
                                        px: 2,
                                        py: 1,
                                        borderRadius: 2,
                                        bgcolor: msg.from === "user" ? "primary.main" : "white",
                                        color: msg.from === "user" ? "white" : "text.primary",
                                        boxShadow: 1
                                    }}
                                >
                                    <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                                        {msg.text}
                                    </Typography>
                                </Paper>
                            </Box>
                        ))}
                        {loading && (
                            <Box sx={{ alignSelf: "flex-start" }}>
                                <Paper sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: "white" }}>
                                    <Typography variant="body2" color="textSecondary">
                                        Typing...
                                    </Typography>
                                </Paper>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input */}
                    <Box sx={{ display: "flex", p: 1, borderTop: "1px solid #e0e0e0", bgcolor: "white" }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            variant="outlined"
                            sx={{ mr: 1 }}
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Paper>
            </Slide>
        </>
    );
}

export default Chatbot;
