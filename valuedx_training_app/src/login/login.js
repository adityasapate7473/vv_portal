import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import config from "../config";
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
  Grid,
  Box,
  Typography,
  Container,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  FormLabel
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Visibility, VisibilityOff, Person } from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import LogoImage from "../images/vishvavidya_hd.jpeg";
import BgImg from "../images/newloginbg.jpg";

const theme = createTheme();

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      {new Date().getFullYear()} VishvaVidya All rights reserved.
    </Typography>
  );
}

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("intern");
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
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
    setUsernameError("");
    setPasswordError("");

    if (username.length < 8) {
      setUsernameError("Username must be at least 8 characters long");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
  
    setLoading(true);
  
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
  
      if (response.ok) {
        const data = await response.json();
  
        if (!data.token || !data.name || !data.role || !data.userid) {
          setLoginError("Invalid response from server. Please try again.");
          return;
        }
  
        const { token, name, role, userid, company_name, company_website } = data;
  
        // Store user details in cookies
        Cookies.set("sessionToken", token, { path: "/" });
        Cookies.set("username", username, { path: "/" });
        Cookies.set("name", name, { path: "/" });
        Cookies.set("role", role, { path: "/" });
        Cookies.set("userid", userid, { path: "/" });
  
        // Store company details only if available
        if (company_name && company_website) {
          Cookies.set("companyName", company_name, { path: "/" });
          Cookies.set("companyWebsite", company_website, { path: "/" });
        }
  
        navigate("/dashboard");
        onLogin();
      } else {
        const errorData = await response.json();
        setLoginError(errorData.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setLoginError("Login failed due to a network or server error.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box sx={{
          marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center",
          backgroundColor: "rgba(255, 255, 255, 0.8)", padding: "20px", borderRadius: "8px", boxShadow: 2
        }}
        >
          <img src={LogoImage} style={{ width: "200px", marginTop: "30px" }} alt="logo" />
          <br />
          {/* <FormLabel>Select Login Type:</FormLabel>
          <RadioGroup row value={role} onChange={(e) => setRole(e.target.value)}>
            <FormControlLabel value="employee" control={<Radio />} label="Employee Login" />
            <FormControlLabel value="intern" control={<Radio />} label="Intern Login" />
          </RadioGroup> */}
          <Typography component="h1" sx={{ fontWeight: "bold" }} variant="h5">
            Sign In
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField margin="normal" required fullWidth id="username" label="Username" name="username" placeholder="Username"
              autoComplete="username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} error={!!usernameError}
              helperText={usernameError}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />
            <TextField margin="normal" required fullWidth name="password" label="Password" placeholder="Password"
              type={showPassword ? "text" : "password"} id="password" autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} error={!!passwordError} helperText={passwordError}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {/* <Box display="flex" justifyContent="center" alignItems="center">
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
              />
            </Box> */}
            {loginError && (
              <Typography color="error" align="center" variant="body2">
                {loginError}
              </Typography>
            )}
            <Button type="submit" fullWidth variant="contained"
              sx={{ mt: 3, mb: 2, backgroundColor: "#3F00FF", color: "#fff",
                "&:hover": { backgroundColor: "#4a2c9b", color: "#fff"},
              }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <Grid container justifyContent="center" alignItems="center" spacing={2}>
              <Grid item>
                <Link href="/forget_username" sx={{ textDecoration: "none", fontStyle: "italic", "&:hover": { color: "red" }}}
                  variant="body2"
                >
                  Forgot Username?
                </Link>
              </Grid>
              <Grid item>
                <Link href="/forget_password" sx={{ textDecoration: "none", fontStyle: "italic", "&:hover": { color: "red" }}}
                  variant="body2"
                >
                  Forgot Password?
                </Link>
              </Grid>
              {/* <Grid item>
                <Link
                  sx={{ textDecoration: "none", color: '#3F00FF' }} href="/register" variant="body1"
                >
                  Student Registration
                </Link>
              </Grid> */}
              <Grid item>
                <Link sx={{ textDecoration: "none", color: '#3F00FF' }} href="/client_registration" variant="body1" >
                  Client Registration
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
        <Copyright sx={{ mt: 4, mb: 4 }} />
      </Container>
    </ThemeProvider>
  );
}

export default Login;