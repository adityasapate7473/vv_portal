import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BgImg from "../images/newloginbg.jpg";
import config from "../config";
import {
  Button,
  Container,
  Grid,
  TextField,
  Typography,
  Box,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import LanguageIcon from "@mui/icons-material/Language";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

function ClientRegistration() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!/^[a-zA-Z\s]+$/.test(name)) {
      newErrors.name = "Name must contain only letters and spaces.";
    } else if (name.length >= 25) {
      newErrors.name = "Name must be less than 25 characters.";
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid.";
    }

    if (!/^\d{10}$/.test(contactNo)) {
      newErrors.contactNo = "Contact number must be exactly 10 digits.";
    }

    if (!/^[a-zA-Z\s]+$/.test(companyName)) {
      newErrors.companyName =
        "Company name must contain only letters and spaces.";
    }

    if (
      companyWebsite &&
      !/^(https?:\/\/)?[^\s$.?#].[^\s]*$/.test(companyWebsite)
    ) {
      newErrors.companyWebsite = "Company website is invalid.";
    }

    if (!/^[a-zA-Z0-9._]{8,}$/.test(username)) {
      newErrors.username =
        "Username must be at least 8 characters long and contain only letters, numbers, underscores, and dots.";
    }

    if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(password)) {
      newErrors.password =
        "Password must be at least 8 characters long and contain both letters and numbers.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const formData = {
      name,
      email,
      contactNo,
      companyName,
      companyWebsite,
      username,
      password,
    };

    try {
      const response = await fetch(
        `${config.API_BASE_URL}/api/clientRegistration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setName("");
        setEmail("");
        setContactNo("");
        setCompanyName("");
        setCompanyWebsite("");
        setUsername("");
        setPassword("");
        setOpenDialog(true);
      } else {
        const data = await response.json();
        setRegisterError(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      setRegisterError("Registration failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    navigate("/");
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    document.body.style.backgroundImage = `url(${BgImg})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.margin = 0;
    document.body.style.height = "100vh";
    return () => {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
    };
  }, []);

  return (
    <Container
      maxWidth="xl"
      className="gradient-form p-6 d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <Grid container spacing={4}>
        <Grid item md={12} className="left-half">
          <Box className="d-flex flex-column justify-content-center h-100 mb-4">
            <Card sx={{ maxWidth: 600, margin: "auto", p: 2 }}>
              <CardContent
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="h5"
                  className="card-title text-center mb-2"
                  sx={{ wordWrap: "break-word", fontWeight: 'bold' }}
                >
                  Partner Registration
                </Typography>
                <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Name"
                        placeholder="Name"
                        variant="outlined"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        margin="dense"
                        autoFocus
                        required
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(
                            /[^a-zA-Z\s]/g,
                            ""
                          );
                        }}
                        error={!!errors.name}
                        helperText={errors.name}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email"
                        placeholder="Email"
                        variant="outlined"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        margin="dense"
                        required
                        error={!!errors.email}
                        helperText={errors.email}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Contact No"
                        placeholder="Contact Number"
                        variant="outlined"
                        value={contactNo}
                        onChange={(e) => setContactNo(e.target.value)}
                        fullWidth
                        margin="dense"
                        required
                        inputProps={{ maxLength: 10 }}
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(
                            /[^0-9]/g,
                            ""
                          );
                        }}
                        error={!!errors.contactNo}
                        helperText={errors.contactNo}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Company Name"
                        placeholder="Company Name"
                        variant="outlined"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        fullWidth
                        margin="dense"
                        required
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(
                            /[^a-zA-Z\s]/g,
                            ""
                          );
                        }}
                        error={!!errors.companyName}
                        helperText={errors.companyName}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BusinessIcon />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Company Website"
                        placeholder="Company Website"
                        variant="outlined"
                        required
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        fullWidth
                        margin="dense"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LanguageIcon />
                            </InputAdornment>
                          ),
                        }}
                        error={!!errors.companyWebsite}
                        helperText={errors.companyWebsite}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Username"
                        placeholder="Username"
                        variant="outlined"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        fullWidth
                        margin="dense"
                        required
                        error={!!errors.username}
                        helperText={errors.username}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AccountCircleIcon />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Password"
                        placeholder="Password"
                        variant="outlined"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        margin="dense"
                        required
                        error={!!errors.password}
                        helperText={errors.password}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                onClick={handleClickShowPassword}
                                aria-label="toggle password visibility"
                                sx={{ p: 0 }}
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={loading}
                      >
                        {loading ? "Registering..." : "Register"}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
                {registerError && (
                  <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                    {registerError}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleDialogClose}
              PaperProps={{
                style: {
                  position: "absolute",
                  top: "10%",
                  margin: "auto",
                  padding: "20px",
                  borderRadius: "10px",
                  background: "linear-gradient(to right, #e0f7fa, #e1bee7)",
                },
              }}>
        <DialogTitle sx={{ color: "green", textAlign: "center" }}>Registration Successful</DialogTitle>
        <DialogContent>
          <Typography sx={{ textAlign: "center" }}>
            Your registration was successful. You can now log in with your
            credentials.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ClientRegistration;
