import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Container,
    Divider,
    Grid,
    Snackbar,
    Tab,
    Tabs,
    TextField,
    Typography,
    Alert,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
} from "@mui/material";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import ListAltIcon from "@mui/icons-material/ListAlt";
import * as XLSX from 'xlsx-js-style';
import Navbar from "../navbar/navbar";
import config from "../config";
import DeleteIcon from '@mui/icons-material/Delete';

const AddAdmin = () => {
    const [adminName, setAdminName] = useState("");
    const [email, setEmail] = useState("");
    const [contact, setContact] = useState("");
    const [admins, setAdmins] = useState([]);
    const [editingAdminId, setEditingAdminId] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState(0); // Set default tab to "Add Admin" (index 0)
    const [filterName, setFilterName] = useState("");
    const [filterEmail, setFilterEmail] = useState("");

    const getCookie = (name) => {
        const match = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
        return match ? match.pop() : "";
    };

    const userid = getCookie("userid");
    const role = getCookie("role");

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const res = await fetch(`${config.API_BASE_URL}/api/adminlist`);
            const data = await res.json();
            console.log("Admin data fetched:", data);  // <-- Debug here
            setAdmins(data);
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };


    const validateForm = () => {
        const tempErrors = {};
        if (!adminName.trim()) tempErrors.adminName = "Admin Name is required";
        if (!email.trim()) tempErrors.email = "Email is required";
        if (!contact.trim() || contact.length !== 10) tempErrors.contact = "Valid 10-digit contact number required";
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const adminData = {
            name: adminName,
            email,
            contact,
            userid,
            role,
        };

        const isEditMode = Boolean(editingAdminId);
        const url = isEditMode
            ? `${config.API_BASE_URL}/api/editAdmin/${editingAdminId}`
            : `${config.API_BASE_URL}/api/addAdmin`;

        const method = isEditMode ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(adminData),
            });

            const result = await res.json();

            if (!res.ok) {
                setSnackbar({ open: true, message: result.message || "Error occurred", severity: "error" });
                return;
            }

            fetchAdmins(); // refresh list
            setAdminName("");
            setEmail("");
            setContact("");
            setEditingAdminId(null);
            setSnackbar({
                open: true,
                message: isEditMode ? "Admin Updated Successfully!" : "Admin Saved Successfully!",
                severity: "success"
            });
            setActiveTab(1); // Switch to "View Admins" tab after submitting
        } catch {
            setSnackbar({ open: true, message: "Error submitting form", severity: "error" });
        }
    };

    const handleEdit = (admin) => {
        setAdminName(admin.name);
        setEmail(admin.email_id);
        setContact(admin.contact);
        setEditingAdminId(admin.userid);
        setActiveTab(0);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const exportAdminsToExcel = () => {
        const data = admins.map((admin) => ({
            "User ID": admin.userid,
            "Admin Name": admin.name || "Not Available",
            "Email": admin.email_id || "Not Available",
            "Contact": admin.contact || "Not Available",
            "Username": admin.username || "Not Available",
            "Created At": new Date(admin.created_at).toLocaleString() || "Not Available",
        }));

        // Create worksheet from the data
        const ws = XLSX.utils.json_to_sheet(data);

        // Apply styles to the worksheet
        const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4F81BD" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
            }
        };

        const cellStyle = {
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
            },
            alignment: { horizontal: "center", vertical: "center" }
        };

        // Set column widths dynamically based on the longest data in each column
        const getMaxColumnWidths = (data) => {
            const maxWidths = [];

            // Loop through each row and column to determine the longest data
            data.forEach((row) => {
                Object.keys(row).forEach((key, index) => {
                    const cellValue = row[key];
                    const cellLength = cellValue ? cellValue.toString().length : 0;
                    if (!maxWidths[index] || cellLength > maxWidths[index]) {
                        maxWidths[index] = cellLength;
                    }
                });
            });

            // Adjust widths slightly (add some extra space)
            return maxWidths.map((width) => ({ wch: width + 2 }));
        };

        // Get max column widths and set them for the sheet
        const colWidths = getMaxColumnWidths(data);

        // Apply header styles
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })];
            if (cell) {
                cell.s = headerStyle;
            }
        }

        // Apply cell styles
        for (let row = 1; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
                if (cell) {
                    cell.s = cellStyle;
                }
            }
        }

        // Set the column widths dynamically
        ws['!cols'] = colWidths;

        // Create a new workbook and append the sheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Admins");

        // Generate the file name with today's date
        const date = new Date();
        const fileName = `admin_list_${date.toISOString().slice(0, 10)}.xlsx`;

        // Write the file to the user's computer
        XLSX.writeFile(wb, fileName);
    };

    const formatDateTime = (isoDate) => {
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const handleDelete = async (adminId) => {
        if (window.confirm("Are you sure you want to delete this admin?")) {
            try {
                const res = await fetch(`${config.API_BASE_URL}/api/admins/${adminId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await res.json();
                if (res.ok) {
                    setSnackbar({
                        open: true,
                        severity: 'success', // Success severity
                        message: data.message || 'Admin deleted successfully', // Success message
                    });
                    fetchAdmins(); // refresh the list
                } else {
                    throw new Error(data.message || 'Failed to delete admin');
                }
            } catch (err) {
                setSnackbar({
                    open: true,
                    severity: 'error', // Error severity
                    message: err.message, // Error message
                });
            }
        }
    };

    return (
        <Box>
            <Navbar showLogoutButton={true} />
            <Container maxWidth="lg" sx={{ mt: 10 }}>
                <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} centered sx={{ minHeight: 40, mb: 2 }}>
                    <Tab
                        icon={<PlaylistAddIcon sx={{ fontSize: 25 }} />}
                        iconPosition="start"
                        label="Add Admin"
                        value={0}
                        sx={{ fontSize: 15, fontWeight: "bold", textTransform: "none", px: 2 }}
                    />
                    <Divider
                        orientation="vertical"
                        flexItem
                        sx={{ height: "30px", mx: 1, borderColor: "primary.main", borderWidth: 2, alignSelf: "center" }}
                    />
                    <Tab
                        icon={<ListAltIcon sx={{ fontSize: 25 }} />}
                        iconPosition="start"
                        label="View Admins"
                        value={1}
                        sx={{ fontSize: 15, fontWeight: "bold", textTransform: "none", px: 2 }}
                    />
                </Tabs>


                <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
                    {activeTab === 0 && (
                        <Box component="form" onSubmit={handleSubmit}>
                            <Typography variant="h6" fontWeight="bold" mb={3}>
                                {editingAdminId ? "Edit Admin" : "Add New Admin"}
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Admin Name"
                                        value={adminName}
                                        onChange={(e) => setAdminName(e.target.value)}
                                        error={!!errors.adminName}
                                        helperText={errors.adminName}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        error={!!errors.email}
                                        helperText={errors.email}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Contact Number"
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value.replace(/\D/, "").slice(0, 10))}
                                        error={!!errors.contact}
                                        helperText={errors.contact}
                                    />
                                </Grid>
                                <Grid item xs={12} display="flex" justifyContent="center">
                                    <Button type="submit" variant="contained" color="primary">
                                        {editingAdminId ? "Update" : "Submit"}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box>
                            <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={2}
                            >
                                <Typography variant="h6" fontWeight="bold">
                                    Admin List
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={exportAdminsToExcel}
                                >
                                    Download Excel
                                </Button>
                            </Box>

                            <Grid container spacing={2} mb={2}>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Filter by Name"
                                        onChange={(e) =>
                                            setFilterName(e.target.value.toLowerCase())
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Filter by Email"
                                        onChange={(e) =>
                                            setFilterEmail(e.target.value.toLowerCase())
                                        }
                                    />
                                </Grid>
                            </Grid>

                            <TableContainer component={Paper} sx={{ maxHeight: 300, overflow: "auto", borderRadius: 2 }}>
                                <Table stickyHeader size="medium">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', backgroundColor: "#34495e", color: 'white' }}>
                                                <strong>User ID</strong>
                                            </TableCell>
                                            <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', backgroundColor: "#34495e", color: 'white' }}>
                                                <strong>Name</strong>
                                            </TableCell>
                                            <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', backgroundColor: "#34495e", color: 'white' }}>
                                                <strong>Email</strong>
                                            </TableCell>
                                            <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', backgroundColor: "#34495e", color: 'white' }}>
                                                <strong>Contact</strong>
                                            </TableCell>
                                            <TableCell align="center" sx={{ minWidth: 150, border: '1px solid rgba(224, 224, 224, 1)', backgroundColor: "#34495e", color: 'white' }}>
                                                <strong>Created At</strong>
                                            </TableCell>
                                            <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', backgroundColor: "#34495e", color: 'white' }}>
                                                <strong>Actions</strong>
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {admins.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                                                    No admins found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            admins
                                                .filter(
                                                    (admin) =>
                                                        admin.name?.toLowerCase().includes(filterName || "") &&
                                                        admin.email_id?.toLowerCase().includes(filterEmail || "")
                                                )
                                                .map((admin) => (
                                                    <TableRow key={admin.userid}>
                                                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                                                            {admin.userid}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                                                            {admin.name}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                                                            {admin.email_id}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                                                            {admin.contact}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                                                            {formatDateTime(admin.created_at)}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={() => handleEdit(admin)}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                {/* <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleDelete(admin.userid)}
                                                                >
                                                                    Delete
                                                                </Button> */}
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                        </Box>
                    )}

                </Paper>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'center', horizontal: 'center' }} // <-- Centered
                >
                    <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </Box>
    );
};

export default AddAdmin;