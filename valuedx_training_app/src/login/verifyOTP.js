import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Container,
    TextField,
    Button,
    Typography,
    Card,
    CardContent,
    CardActions
} from "@mui/material";
import config from "../config";

function VerifyOTP() {
    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    const storageKey = `otpExpiry_${email}`;

    useEffect(() => {
        if (!email) return;

        let expiryTime = sessionStorage.getItem(storageKey);

        if (!expiryTime) {
            expiryTime = Date.now() + 5 * 60 * 1000;
            sessionStorage.setItem(storageKey, expiryTime);
        } else {
            expiryTime = parseInt(expiryTime);
        }


        const interval = setInterval(() => {
            const secondsLeft = Math.floor((expiryTime - Date.now()) / 1000);
            if (secondsLeft <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
            } else {
                setTimeLeft(secondsLeft);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [email]);

    const formatTime = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec < 10 ? "0" : ""}${sec}`;
    };

    const handleVerifyOTP = async (event) => {
        event.preventDefault();
        if (timeLeft === 0) {
            setMessage("❌ OTP has expired. Please resend to try again.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(`${config.API_BASE_URL}/api/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: otp.trim() }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage("✅ OTP Verified! Redirecting...");
                sessionStorage.removeItem(storageKey);
                setTimeout(() => navigate("/reset-password", { state: { email } }), 1000);
            } else {
                setMessage(`❌ ${data.message || "Invalid OTP."}`);
            }
        } catch (error) {
            setMessage("⚠️ Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResending(true);
        setMessage("");

        try {
            const response = await fetch(`${config.API_BASE_URL}/api/forgetPassword`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (response.ok) {
                // Reset session storage and timer
                sessionStorage.removeItem(storageKey);
                const newExpiry = Date.now() + 5 * 60 * 1000;
                sessionStorage.setItem(storageKey, newExpiry);
                setTimeLeft(300); // reset timer to 5 minutes
                setMessage("✅ OTP resent successfully!");
            } else {
                setMessage(`❌ ${data.message || "Could not resend OTP."}`);
            }
        } catch (err) {
            setMessage("⚠️ Error while resending OTP.");
        } finally {
            setResending(false);
        }
    };

    if (!email) {
        return (
            <Container maxWidth="sm">
                <Typography color="error" align="center" sx={{ mt: 5 }}>
                    Invalid request. Please try again.
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Card sx={{ p: 3, mt: 5 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom align="center">
                        Verify OTP
                    </Typography>
                    <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                        Enter the OTP sent to <b>{email}</b>
                    </Typography>

                    <Typography
                        variant="body1"
                        color={timeLeft <= 60 ? "error" : "primary"}
                        align="center"
                    >
                        ⏳ OTP expires in: <strong>{formatTime(timeLeft)}</strong>
                    </Typography>

                    <form onSubmit={handleVerifyOTP}>
                        <TextField
                            label="Enter OTP"
                            variant="outlined"
                            fullWidth
                            required
                            autoFocus
                            margin="dense"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            disabled={timeLeft === 0}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ mt: 2 }}
                            disabled={loading || timeLeft === 0}
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </Button>
                    </form>

                    {timeLeft === 0 && (
                        <Button
                            variant="outlined"
                            color="secondary"
                            fullWidth
                            sx={{ mt: 2 }}
                            onClick={handleResendOtp}
                            disabled={resending}
                        >
                            {resending ? "Resending..." : "Resend OTP"}
                        </Button>
                    )}

                    {message && (
                        <Typography color="error" align="center" sx={{ mt: 2 }}>
                            {message}
                        </Typography>
                    )}
                </CardContent>

                <CardActions sx={{ justifyContent: "center" }}>
                    <Button variant="outlined" color="secondary" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                    <Button variant="contained" color="success" onClick={() => navigate("/")}>
                        Home
                    </Button>
                </CardActions>
            </Card>
        </Container>
    );
}

export default VerifyOTP;
