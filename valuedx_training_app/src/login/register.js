import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import BgImg from "../images/newloginbg.jpg";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LockIcon from "@mui/icons-material/Lock";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [contactNoError, setContactNoError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

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

  const validate = () => {
    let isValid = true;
    setNameError("");
    setEmailError("");
    setContactNoError("");
    setUsernameError("");
    setPasswordError("");

    if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      setEmailError("Invalid email address");
      isValid = false;
    }

    if (username.trim().length < 8) {
      setUsernameError("Username must be at least 8 characters long");
      isValid = false;
    }

    if (contactNo.length < 10) {
      setContactNoError("Contact number must be at least 10 digits long");
      isValid = false;
    }
    if (name.length > 25) {
      setNameError("Name cannot exceed 25 characters");
      isValid = false;
    }

    if (/[^A-Za-z\s]/.test(name)) {
      setNameError("Name can only contain letters and spaces");
      isValid = false;
    }

    if (!passwordPolicy(password)) {
      setPasswordError(
        "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character"
      );
      isValid = false;
    }

    return isValid;
  };

  const passwordPolicy = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setLoading(true);

    const formData = {
      name,
      email,
      contactNo,
      username,
      password,
    };

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setName("");
        setEmail("");
        setContactNo("");
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

  const handleLoginClick = () => {
    navigate("/");
  };

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show);
  };

  return (
    <Container
      maxWidth="xl"
      className="gradient-form p-6 d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <Grid container spacing={4}>
        <Grid item md={12} className="left-half">
          <Box className="d-flex flex-column justify-content-center h-100 mb-4">
            <Card
              sx={{
                maxWidth: 500,
                margin: "auto",
                p: 2,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
              }}
            >
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
                  sx={{ fontWeight: "bold" }}
                  className="card-title text-center mb-2"
                >
                  Student Registration
                </Typography>
                <form onSubmit={handleSubmit} style={{ width: "80%" }}>
                  <TextField
                    label="Name"
                    variant="outlined"
                    required
                    value={name}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^[A-Za-z\s]*$/.test(value) && value.length <= 25) {
                        setName(value);
                      }
                    }}
                    fullWidth
                    margin="dense"
                    error={!!nameError}
                    helperText={nameError}
                    placeholder="Name"
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Email"
                    variant="outlined"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    margin="dense"
                    error={!!emailError}
                    helperText={emailError}
                    placeholder="Email"
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Contact No"
                    variant="outlined"
                    required
                    value={contactNo}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value) && value.length <= 10) {
                        setContactNo(value);
                      }
                    }}
                    fullWidth
                    margin="dense"
                    error={!!contactNoError}
                    helperText={contactNoError}
                    placeholder="Contact Number"
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Username"
                    variant="outlined"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    fullWidth
                    margin="dense"
                    error={!!usernameError}
                    helperText={usernameError}
                    placeholder="Username"
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Password"
                    variant="outlined"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    margin="dense"
                    error={!!passwordError}
                    helperText={passwordError}
                    placeholder="Password"
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <div className="text-center pt-1 mb-3 pb-1">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      className="mb-2 w-100"
                      style={{ height: "40px", backgroundColor: "#3F00FF" }}
                      disabled={loading}
                    >
                      {loading ? "Registering..." : "Register"}
                    </Button>
                    {registerError && (
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{ mt: 2 }}
                        className="text-center"
                      >
                        {registerError}
                      </Typography>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        PaperProps={{
          style: {
            position: "absolute",
            top: "10%",
            margin: "auto",
            padding: "20px",
            borderRadius: "10px",
            background: "linear-gradient(to right, #e0f7fa, #e1bee7)",
          },
        }}
      >
        <DialogTitle sx={{ color: "green", textAlign: "center" }}>
          Registration Successful!
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ textAlign: "center" }}>
            Your registration was successful. You can now log in with your
            credentials.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            sx={{ justifyContent: "center" }}
            onClick={handleDialogClose}
            color="primary"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Register;
