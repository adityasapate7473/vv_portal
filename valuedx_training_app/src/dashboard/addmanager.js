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
import DeleteIcon from "@mui/icons-material/Delete";
import * as XLSX from 'xlsx-js-style';
import Navbar from "../navbar/navbar";
import config from "../config";

const AddManager = () => {
    const [managerName, setManagerName] = useState("");
    const [email, setEmail] = useState("");
    const [contact, setContact] = useState("");
    const [managers, setManagers] = useState([]);
    const [editingManagerId, setEditingManagerId] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState(0);
    const [filterName, setFilterName] = useState('');
    const [filterEmail, setFilterEmail] = useState('');

    const getCookie = (name) => {
        const match = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
        return match ? match.pop() : "";
    };

    const userid = getCookie("userid");
    const role = getCookie("role");

    useEffect(() => {
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        try {
            const res = await fetch(`${config.API_BASE_URL}/api/managerlist`);
            const data = await res.json();
            setManagers(data);
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };

    const validateForm = () => {
        const tempErrors = {};
        if (!managerName.trim()) tempErrors.managerName = "Manager Name is required";
        if (!email.trim()) tempErrors.email = "Email is required";
        if (!contact.trim() || contact.length !== 10) tempErrors.contact = "Valid 10-digit contact number required";
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const managerData = { name: managerName, email, contact, userid, role };
        const isEdit = Boolean(editingManagerId);
        const url = isEdit
            ? `${config.API_BASE_URL}/api/editManager/${editingManagerId}`
            : `${config.API_BASE_URL}/api/addManager`;

        try {
            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(managerData),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            fetchManagers();
            setManagerName(""); setEmail(""); setContact("");
            setEditingManagerId(null);
            setSnackbar({
                open: true,
                message: isEdit ? "Manager Updated Successfully!" : "Manager Saved Successfully!",
                severity: "success"
            });
            setActiveTab(1);
        } catch (error) {
            setSnackbar({ open: true, message: error.message || "Error", severity: "error" });
        }
    };

    const handleEdit = (manager) => {
        setManagerName(manager.name);
        setEmail(manager.email_id);
        setContact(manager.contact_no);
        setEditingManagerId(manager.userid);
        setActiveTab(0);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (managerId) => {
        if (window.confirm("Are you sure you want to delete this manager?")) {
            try {
                const res = await fetch(`${config.API_BASE_URL}/api/managers/${managerId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                setSnackbar({ open: true, message: "Manager deleted", severity: "success" });
                fetchManagers();
            } catch (err) {
                setSnackbar({ open: true, message: err.message, severity: "error" });
            }
        }
    };

    const exportToExcel = () => {
        const data = managers.map(m => ({
            "User ID": m.userid,
            "Manager Name": m.name || "Not Available",
            "Email": m.email_id || "Not Available",
            "Contact": m.contact || "Not Available",
            "Username": m.username || "Not Available",
            "Created At": new Date(m.created_at).toLocaleString() || "Not Available",
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Managers");
        XLSX.writeFile(wb, `manager_list_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <Box>
            <Navbar showLogoutButton />
            <Container maxWidth="lg" sx={{ mt: 10 }}>
                <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} centered sx={{ minHeight: 40, mb: 2 }}>
                    <Tab
                        icon={<PlaylistAddIcon sx={{ fontSize: 25 }} />}
                        iconPosition="start"
                        label="Add Manager"
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
                        label="View Managers"
                        value={1}
                        sx={{ fontSize: 15, fontWeight: "bold", textTransform: "none", px: 2 }}
                    />
                </Tabs>
                
                <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
                    {activeTab === 0 && (
                        <Box component="form" onSubmit={handleSubmit}>
                            <Typography variant="h6" fontWeight="bold" mb={3}>
                                {editingManagerId ? "Edit Manager" : "Add Manager"}
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Manager Name"
                                        value={managerName}
                                        onChange={(e) => setManagerName(e.target.value)}
                                        error={!!errors.managerName}
                                        helperText={errors.managerName}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        error={!!errors.email}
                                        helperText={errors.email}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Contact"
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                        error={!!errors.contact}
                                        helperText={errors.contact}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained" type="submit">
                                        {editingManagerId ? "Update" : "Submit"}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" fontWeight="bold">
                                    Manager List
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={exportToExcel}
                                >
                                    Export to Excel
                                </Button>
                            </Box>

                            <Grid container spacing={2} mb={2}>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Filter by Name"
                                        onChange={(e) => setFilterName(e.target.value.toLowerCase())}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Filter by Email"
                                        onChange={(e) => setFilterEmail(e.target.value.toLowerCase())}
                                    />
                                </Grid>
                            </Grid>

                            <TableContainer component={Paper} sx={{ maxHeight: 300, overflow: "auto", borderRadius: 2 }}>
                                <Table stickyHeader size="medium">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', backgroundColor: "#34495e", color: 'white' }}>
                                                <strong>Manager ID</strong>
                                            </TableCell>
                                            <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', backgroundColor: "#34495e", color: 'white' }}>
                                                <strong>Manager Name</strong>
                                            </TableCell>
                                            <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', backgroundColor: "#34495e", color: 'white' }}>
                                                <strong>Email</strong>
                                            </TableCell>
                                            <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', backgroundColor: "#34495e", color: 'white' }}>
                                                <strong>Contact</strong>
                                            </TableCell>
                                            <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', backgroundColor: "#34495e", color: 'white' }}>
                                                <strong>Created At</strong>
                                            </TableCell>
                                            <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', backgroundColor: "#34495e", color: 'white' }}>
                                                <strong>Actions</strong>
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {managers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                                                    No managers found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            managers
                                                .filter(
                                                    (manager) =>
                                                        manager.name?.toLowerCase().includes(filterName || "") &&
                                                        manager.email_id?.toLowerCase().includes(filterEmail || "")
                                                )
                                                .map((manager, index) => (
                                                    <TableRow key={manager.userid}>
                                                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                                                            {manager.userid}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                                                            {manager.name}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                                                            {manager.email_id}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                                                            {manager.contact_no}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                                                            {new Date(manager.created_at).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={() => handleEdit(manager)}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleDelete(manager.userid)}
                                                                >
                                                                    Delete
                                                                </Button>
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
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </Box>
    );
};

export default AddManager;
