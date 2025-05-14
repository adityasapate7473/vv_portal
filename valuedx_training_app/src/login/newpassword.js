import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import config from '../config';
import {
  Button, TextField, Typography, Container, Grid, Box, Card, CardContent, CardActions,
  Snackbar, Alert
} from '@mui/material';

const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    errors: {
      length: password.length >= minLength,
      upperCase: hasUpperCase,
      lowerCase: hasLowerCase,
      number: hasNumber,
      specialChar: hasSpecialChar,
    },
  };
};

function ResetPassword() {
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password policy
    const { isValid, errors } = validatePassword(password);

    if (!isValid) {
      setPasswordErrors(errors);
      setError('Password does not meet the requirements');
      setSuccess('');
      setOpen(true);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setSuccess('');
      setOpen(true);
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/resetPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Password has been reset successfully');
        setError('');
        setPasswordErrors({});
        setOpen(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000); // Redirect after 2 seconds
      } else {
        setError(data.message);
        setSuccess('');
        setOpen(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Password reset failed. Please try again later.');
      setSuccess('');
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Container maxWidth="sm">
      <Grid container justifyContent="center" alignItems="center" style={{ minHeight: '100vh' }}>
        <Grid item xs={12} sm={10} md={8}>
          <Card variant="outlined" sx={{ boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }} gutterBottom align="center">
                Reset Password
              </Typography>
              <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                Enter the OTP sent to your email and set a new password.
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  label="Enter OTP"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <TextField
                  label="New Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <TextField
                  label="Confirm Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Box mt={2}>
                  <Typography variant="body2" color={passwordErrors.length ? "error" : "textSecondary"}>
                    {passwordErrors.length ? '• Password must be at least 8 characters long' : '• Password meets length requirement'}
                  </Typography>
                  <Typography variant="body2" color={passwordErrors.upperCase ? "error" : "textSecondary"}>
                    {passwordErrors.upperCase ? '• Must include at least one uppercase letter' : '• Includes uppercase letter'}
                  </Typography>
                  <Typography variant="body2" color={passwordErrors.lowerCase ? "error" : "textSecondary"}>
                    {passwordErrors.lowerCase ? '• Must include at least one lowercase letter' : '• Includes lowercase letter'}
                  </Typography>
                  <Typography variant="body2" color={passwordErrors.number ? "error" : "textSecondary"}>
                    {passwordErrors.number ? '• Must include at least one number' : '• Includes number'}
                  </Typography>
                  <Typography variant="body2" color={passwordErrors.specialChar ? "error" : "textSecondary"}>
                    {passwordErrors.specialChar ? '• Must include at least one special character' : '• Includes special character'}
                  </Typography>
                </Box>
                {success && <Typography color="success" align="center" sx={{ mt: 2, color: 'green' }}>{success}</Typography>}
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Reset Password
                </Button>
              </form>
            </CardContent>
            {/* Home & Back Buttons */}
            <CardActions sx={{ justifyContent: "center" }}>
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
        </Grid>
      </Grid>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={error ? "error" : "success"} sx={{ width: '100%' }}>
          {error || success}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ResetPassword;
