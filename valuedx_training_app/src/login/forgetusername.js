import React, { useState, useEffect } from 'react';
import { Button, TextField, Typography, Container, Grid, Card, CardContent, Snackbar, Alert, CardActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import config from '../config';

function ForgotUsername() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    // Basic email validation regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateEmail(email)) {
      setError('Invalid email address');
      setMessage('');
      setOpen(true); // Show Snackbar on validation error
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/forgotUsername`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setError('');
        setOpen(true); // Show Snackbar on success
      } else {
        setError(data.message || 'An error occurred');
        setMessage('');
        setOpen(true); // Show Snackbar on error
      }
    } catch (err) {
      setError('An error occurred');
      setMessage('');
      setOpen(true); // Show Snackbar on catch error
    }
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  useEffect(() => {
    if (open) {
      // Clear the message and error after showing the Snackbar
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
        setOpen(false);
        navigate('/'); // Navigate to the login page
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [open, navigate]);

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center">
        <Grid item>
          <Card sx={{ width: '100%', textAlign:'center', boxShadow:2 }}>
            <CardContent>
              <Typography variant="h5" sx={{fontWeight:'bold'}} gutterBottom >
                Forgot Username
              </Typography>
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <TextField
                  label="Email"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!error}
                  helperText={error || ''}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Send Username
                </Button>
              </form>
              {message && (
                <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>
                  {message}
                </Typography>
              )}
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
        </Grid>
      </Grid>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // Position the Snackbar
      >
        <Alert onClose={handleClose} severity={error ? "error" : "success"} sx={{ width: '100%' }}>
          {error || message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ForgotUsername;
