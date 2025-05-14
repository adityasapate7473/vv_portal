import React, { useState, useEffect } from "react";
import {
    Box,
    TextField,
    Typography,
    Button,
    Avatar,
    Paper,
    CircularProgress,
    Snackbar,
    Alert,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Autocomplete,
} from "@mui/material";
import config from "../config";
import Navbar from "../navbar/navbar";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

// Options for dropdowns
const qualificationOptions = [
    "Diploma", "BE", "ME", "BCA", "MCA", "BCS", "MCS", "B.Tech", "M.Tech", "MBA", "BSC", "MSC"
];
const experienceOptions = [
    "Fresher", "Below 6 Months", "6 Months - 1 Year", "1 Year", "2 Years", "3 Years", "4 Years", "5-7 years", "7-10 years", "10+ years"
];

// Generate Passout Year options (Current Year to Next 5 years)
const currentYear = new Date().getFullYear();

// Generate an array of 11 years, including 5 previous years, the current year, and 5 future years
const passoutYearOptions = Array.from({ length: 26 }, (_, index) => currentYear - 20 + index);

const ProfilePage = () => {
    const [role, setRole] = useState("");
    const [user, setUser] = useState({});
    const [editMode, setEditMode] = useState(false);
    const [updatedUser, setUpdatedUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [emailInfoOpen, setEmailInfoOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showEmailPassword, setShowEmailPassword] = useState(false);
    const [showPasswordField, setShowPasswordField] = useState(false);


    useEffect(() => {
        const userid = getCookie("userid");

        if (userid) {
            fetch(`${config.API_BASE_URL}/api/profile?userid=${userid}`)
                .then((res) => res.json())
                .then((data) => {
                    console.log("Profile data received:", data);
                    setRole(data.role);

                    // Set username as id only for intern or trainer
                    if (data.role === "intern" || data.role === "trainer") {
                        data.username = data.id || data._id || userid;  // fallback to cookie value if id is missing
                        console.log("Fetched role:", data.role);
                    }

                    setUser(data);
                    setUpdatedUser(data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching profile:", err);
                    setLoading(false);
                });
        }
    }, []);

    const getCookie = (name) => {
        const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
        return match ? decodeURIComponent(match[2]) : "";
    };

    const username = getCookie("username");

    const handleInputChange = (e) => {
        setUpdatedUser({ ...updatedUser, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        // Email password validation: Must be 16 characters if present
        if (
            role !== "intern" &&
            updatedUser.email_password &&
            updatedUser.email_password.length !== 16
        ) {
            setSnackbar({
                open: true,
                message: "Email password must be exactly 16 characters!",
                severity: "error",
            });
            return;
        }

        try {
            const response = await fetch(`${config.API_BASE_URL}/api/update-profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedUser),
            });

            if (response.ok) {
                setUser(updatedUser);
                setEditMode(false);
                setSnackbar({ open: true, message: "Profile updated successfully!", severity: "success" });
            } else {
                setSnackbar({ open: true, message: "Failed to update profile", severity: "error" });
            }
        } catch (error) {
            console.error("Update error:", error);
            setSnackbar({ open: true, message: "An error occurred while updating", severity: "error" });
        }
    };

    const renderFields = () => {
        if (loading) return <CircularProgress />;

        const commonFields = {
            developer: [
                { label: "Email", name: "email" },
                { label: "Username", name: "username" },
                { label: "Password", name: "password" },
                { label: "Email Password", name: "email_password" },
            ],
            manager: [
                { label: "Email", name: "email" },
                { label: "Username", name: "username", disabled: true },
                { label: "Password", name: "password" },
                { label: "Email Password", name: "email_password" },
            ],
            admin: [
                { label: "Email", name: "email", disabled: true },
                { label: "Username", name: "username", disabled: true },
                { label: "Password", name: "password" },
                { label: "Email Password", name: "email_password" },
            ],
            trainer: [
                { label: "Full Name", name: "instructor_name" },
                { label: "Email", name: "email" },
                { label: "Contact", name: "contact" },
                { label: "Technology", name: "technology", disabled: true },
                { label: "Username", name: "username", disabled: true },
                { label: "Password", name: "password" },
                { label: "Email Password", name: "email_password" },
            ],
            intern: [
                { label: "Full Name", name: "student_name" },
                { label: "Email", name: "email_id", disabled: true },
                { label: "Contact", name: "contact_no" },
                { label: "Passout Year", name: "passout_year" },
                { label: "Batch", name: "batch_name", disabled: true },
                { label: "Highest Qualification", name: "highest_qualification" },
                { label: "Skillset", name: "skillset" },
                { label: "Certification", name: "certification" },
                { label: "Location", name: "current_location" },
                { label: "Experience", name: "experience" },
                { label: "Username", name: "username", disabled: true },
                { label: "Password", name: "password" },
                // Email password not included for intern
            ],
        };

        const fields = commonFields[role] || [];

        return fields.map((field) => {
            if (field.name === "passout_year") {
                return (
                    <Box key={field.name} sx={{ position: "relative" }}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Passout Year</InputLabel>
                            <Select
                                value={editMode ? updatedUser.passout_year || "" : user.passout_year || ""}
                                onChange={handleInputChange}
                                name="passout_year"
                                label="Passout Year"
                                disabled={!editMode}
                            >
                                {passoutYearOptions.map((year) => (
                                    <MenuItem key={year} value={year}>
                                        {year}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                );
            }

            if (field.name === "highest_qualification") {
                return (
                    <Box key={field.name} sx={{ position: "relative" }}>
                        <Autocomplete
                            freeSolo // Allows typing custom input
                            options={qualificationOptions}
                            value={editMode ? updatedUser.highest_qualification || "" : user.highest_qualification || ""}
                            onChange={(e, newValue) => {
                                setUpdatedUser({
                                    ...updatedUser,
                                    highest_qualification: newValue || "", // In case of clearing
                                });
                            }}
                            onInputChange={(e, newInputValue) => {
                                if (editMode) {
                                    setUpdatedUser({
                                        ...updatedUser,
                                        highest_qualification: newInputValue,
                                    });
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Highest Qualification"
                                    margin="normal"
                                    fullWidth
                                    disabled={!editMode}
                                />
                            )}
                        />
                    </Box>
                );
            }

            if (field.name === "experience") {
                return (
                    <Box key={field.name} sx={{ position: "relative" }}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Experience</InputLabel>
                            <Select
                                value={editMode ? updatedUser.experience || "" : user.experience || ""}
                                onChange={handleInputChange}
                                name="experience"
                                label="Experience"
                                disabled={!editMode}
                            >
                                {experienceOptions.map((exp) => (
                                    <MenuItem key={exp} value={exp}>
                                        {exp}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                );
            }

            const isEmailPasswordField = field.name === "email_password";
            const isPasswordField = field.name === "password";

            const showPasswordToggle = isEmailPasswordField || isPasswordField;
            const showValue = isEmailPasswordField ? showEmailPassword : showPasswordField;
            const setShowValue = isEmailPasswordField ? setShowEmailPassword : setShowPasswordField;

            // Password validation logic
            const password = updatedUser[field.name] || "";

            const minLength = 8;
            const hasLetters = /[a-zA-Z]/.test(password); // Checks for any letter
            const hasUppercase = /[A-Z]/.test(password); // Checks for at least one uppercase letter
            const hasNumbers = /\d/.test(password); // Checks for at least one number
            const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password); // Checks for special characters

            const passwordValid =
                password.length >= minLength &&
                hasLetters &&
                hasUppercase &&
                hasNumbers &&
                hasSpecialChars;

            const passwordError =
                isPasswordField && !passwordValid;

            const passwordHelperText = isPasswordField
                ? !passwordValid
                    ? "Password must be at least 8 characters long, contain at least one letter, one uppercase letter, one number, and one special character."
                    : ""
                : "";

            const emailPasswordHelperText = isEmailPasswordField && editMode && updatedUser[field.name] && updatedUser[field.name].length !== 16
                ? "App password must be exactly 16 characters"
                : "";

            return (
                <Box key={field.name} sx={{ position: "relative" }}>
                    <TextField
                        fullWidth
                        label={field.label}
                        name={field.name}
                        type={showPasswordToggle && !showValue ? "password" : "text"}
                        value={editMode ? updatedUser[field.name] || "" : user[field.name] || ""}
                        onChange={handleInputChange}
                        margin="normal"
                        disabled={!editMode || field.disabled}
                        inputProps={isEmailPasswordField ? { maxLength: 16 } : {}}
                        error={passwordError || (isEmailPasswordField && editMode && updatedUser[field.name] && updatedUser[field.name].length !== 16)} // Error state for both password and email_password
                        helperText={passwordHelperText || emailPasswordHelperText} // Display helper text for password or email_password
                        sx={{
                            '& .MuiOutlinedInput-root.Mui-error': {
                                borderColor: 'red', // Red border when error is triggered
                            },
                            '& .MuiFormHelperText-root': {
                                textAlign: 'center', // Change alignment of helper text
                            },
                        }}
                    />

                    {showPasswordToggle && (
                        <>
                            {isEmailPasswordField && (
                                <>
                                    <Tooltip title="How to get your email password">
                                        <IconButton
                                            size="small"
                                            onClick={() => setEmailInfoOpen(true)}
                                            sx={{ position: "absolute", right: 60, top: 30 }}
                                        >
                                            <InfoOutlinedIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={showValue ? "Hide" : "Show"}>
                                        <IconButton
                                            size="small"
                                            onClick={() => setShowValue((prev) => !prev)}
                                            sx={{ position: "absolute", right: 10, top: 30 }}
                                        >
                                            {showValue ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </Tooltip>
                                    {/* Typography for instruction below the email_password field */}
                                    <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>
                                        Follow the steps in the info to generate the email password.
                                    </Typography>
                                </>
                            )}
                            <Tooltip title={showValue ? "Hide" : "Show"}>
                                <IconButton
                                    size="small"
                                    onClick={() => setShowValue((prev) => !prev)}
                                    sx={{ position: "absolute", right: 10, top: 30 }}
                                >
                                    {showValue ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>
            );
        });

    };

    return (
        <>
            <Navbar showLogoutButton={true} />
            <Box sx={{ display: "flex", justifyContent: "center", mt: 11, px: 2 }}>
                <Paper
                    elevation={4}
                    sx={{
                        padding: 4,
                        width: "100%",
                        maxWidth: 900,
                        borderRadius: "16px",
                        background: "#f9f9f9",
                    }}
                >
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                        <Avatar sx={{ width: 60, height: 60, bgcolor: "#1976d2", fontSize: 32 }}>
                            {(username || "U").charAt(0).toUpperCase()}
                        </Avatar>
                    </Box>

                    <Typography variant="h5" align="center" gutterBottom fontWeight={600}>
                        {role ? (role === 'trainer' ? 'Instructor' : role.charAt(0).toUpperCase() + role.slice(1)) : 'User'} Profile
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                gap: 1,
                                mt: 3,
                            }}
                        >
                            {renderFields()}
                        </Box>
                    )}

                    {(role === "trainer" || role === "intern" || role === "admin" || role === "manager" || role === "developer") && !loading && (
                        <Box
                            sx={{
                                mt: 2,
                                display: "flex",
                                flexDirection: { xs: "column", sm: "row" },
                                gap: 1,
                                justifyContent: "center",
                            }}
                        >
                            {editMode ? (
                                <>
                                    <Button variant="contained" color="success" onClick={handleSave}>
                                        Save
                                    </Button>
                                    <Button variant="outlined" color="error" onClick={() => { setEditMode(false); window.location.reload(); }}>
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <Button variant="contained" onClick={() => setEditMode(true)}>
                                    Edit Profile
                                </Button>
                            )}
                        </Box>
                    )}
                </Paper>
            </Box>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <Dialog open={emailInfoOpen} onClose={() => setEmailInfoOpen(false)}>
                <DialogTitle>Email App Password Setup</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To send emails through your Gmail account, you need to generate an App Password:
                        <ol style={{ paddingLeft: "1.5rem", marginTop: "1rem" }}>
                            <li>Visit <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">Google Account Security</a>.</li>
                            <li>Enable <strong>2-Step Verification</strong>.</li>
                            <li>Once enabled, scroll down and click on <strong>App Passwords</strong>.</li>
                            <li>Select <em>Mail</em> and <em>Other</em> as the app name.</li>
                            <li>Click <strong>Generate</strong> and copy the 16-character password.</li>
                            <li>Paste it into the <strong>Email Password</strong> field here.</li>
                        </ol>
                        <br />
                        <strong>Note:</strong> This password is used only for sending emails securely. Keep it confidential.
                    </DialogContentText>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ProfilePage;