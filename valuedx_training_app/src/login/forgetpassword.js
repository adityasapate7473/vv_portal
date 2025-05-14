import React, { useState } from "react";
import {
  TextField, Button, Container, Typography, Box, Card, CardContent,
  CardActions, Snackbar, Alert
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import config from "../config";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateEmail(email)) {
      setError("Invalid email address");
      setMessage("");
      setOpen(true);
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/forgetPassword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("OTP has been sent to your email.");
        setError("");
        setOpen(true);
        setTimeout(() => {
          navigate("/verify-otp", { state: { email } });
        }, 1500); // Redirect after showing message
      } else {
        setMessage("");
        setError(data.message);
        setOpen(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("");
      setError("Failed to send OTP. Please try again later.");
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Box mt={5} display="flex" justifyContent="center" sx={{ boxShadow: 2 }}>
        <Card variant="outlined" style={{ width: "100%" }}>
          <CardContent>
            <Typography variant="h5" align="center" sx={{ fontWeight: "bold" }} gutterBottom>
              Forgot Password
            </Typography>
            <Typography variant="body2" align="center" sx={{ mb: 2 }}>
              Enter your email to receive an OTP for password reset.
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                error={Boolean(error)}
                helperText={error}
              />
              <CardActions>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth                  
                >
                  Send OTP
                </Button>
              </CardActions>
            </form>
          </CardContent>
          {/* Home & Back Buttons */}
          <CardActions sx={{ justifyContent: "center"}}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => navigate("/")}
            >
              Home
            </Button>
          </CardActions>
        </Card>
      </Box>
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleClose} severity={error ? "error" : "success"} sx={{ width: "100%" }}>
          {error || message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ForgetPassword;
