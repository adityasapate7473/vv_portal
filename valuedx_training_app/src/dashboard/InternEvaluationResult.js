import React, { useEffect, useState } from "react";
import {
    Box, Typography, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Button, TextField, Snackbar, Tooltip
} from "@mui/material";
import { Info, CheckCircle, ErrorOutline, Search } from "@mui/icons-material";
import config from "../config";
import Navbar from "../navbar/navbar";
import { motion } from "framer-motion";

const InternEvaluationResult = () => {
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const getUserId = () => {
        const cookie = document.cookie.split("; ").find(row => row.startsWith("userid="));
        return cookie ? cookie.split("=")[1] : null;
    };

    useEffect(() => {
        const userId = getUserId();
        if (!userId) return;

        fetch(`${config.API_BASE_URL}/api/intern/evaluation-result?userId=${userId}`)
            .then(res => res.json())
            .then(data => {
                setEvaluations(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch evaluation results:", err);
                setLoading(false);
            });
    }, []);

    const getStatusLabel = (evaluation) => {
        const pendingItems = [];
        if (evaluation.pending_technical) pendingItems.push("Technical");
        if (evaluation.pending_mcq) pendingItems.push("MCQ");
        if (evaluation.pending_oral) pendingItems.push("Oral");
        if (evaluation.pending_remark) pendingItems.push("Remark");

        return pendingItems.length > 0
            ? <Chip label={`Pending: ${pendingItems.join(", ")}`} color="warning" icon={<ErrorOutline />} size="small" />
            : <Chip label="Completed" color="success" icon={<CheckCircle />} size="small" />;
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    const filteredEvaluations = evaluations.filter((evaluation) =>
        evaluation.batch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evaluation.attempt.toString().includes(searchQuery)
    );

    return (
        <>
            <Navbar showLogoutButton={true} />
            <Box sx={{ mt: 10, px: { xs: 2, md: 5 }, pb: 6 }}>

                {loading ? (
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <CircularProgress color="secondary" size={50} />
                        <Typography mt={2} color="primary">Loading your evaluations...</Typography>
                    </Box>
                ) : (
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            boxShadow: 6,
                            backgroundColor: "#ffffff",
                            transition: "all 0.3s ease-in-out",
                            animation: "fadeIn 0.5s ease-in-out",
                            mt: 12
                        }}
                    >
                        <Typography
                            variant="h5"
                            fontWeight="bold"
                            sx={{
                                fontSize: { xs: "22px", md: "28px" },
                                color: "#2c387e",
                                textAlign: "center",
                                mb: 2
                            }}
                        >
                            Evaluation Results
                        </Typography>

                        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                            <TextField
                                variant="outlined"
                                size="small"
                                placeholder="Search by batch"
                                onChange={handleSearch}
                                value={searchQuery}
                                InputProps={{
                                    startAdornment: <Search sx={{ color: "#1976d2" }} />
                                }}
                                sx={{
                                    width: "50%",
                                    borderRadius: "5px",
                                    boxShadow: 1,
                                    backgroundColor: "#f1f8ff"
                                }}
                            />
                        </Box>

                        <TableContainer component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                            <Table sx={{ border: '1px solid #ccc', tableLayout: 'fixed', width: '100%' }}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: "#e3f2fd", position: "sticky", top: 0, zIndex: 1 }}>
                                        {["Sr. No.", "Batch", "Technical", "MCQ", "Oral", "Total", "Remark", "Status"].map((head, idx) => (
                                            <TableCell
                                                key={idx}
                                                sx={{
                                                    fontWeight: "bold",
                                                    border: "1px solid #ccc",
                                                    backgroundColor: "#e3f2fd",
                                                    textAlign: "center",
                                                    fontSize: "16px",
                                                    padding: "8px",
                                                    width: idx === 0 ? '5%' : 'auto',
                                                    width: idx === 7 ? '20%' : 'auto',
                                                }}
                                            >
                                                {head}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredEvaluations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} sx={{ textAlign: "center", fontStyle: "italic", color: "gray" }}>
                                                No evaluation data available.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEvaluations.map((evaluation, idx) => {
                                            const isPending =
                                                evaluation.pending_technical ||
                                                evaluation.pending_mcq ||
                                                evaluation.pending_oral ||
                                                evaluation.pending_remark;

                                            return (
                                                <TableRow
                                                    key={idx}
                                                    hover
                                                    sx={{
                                                        backgroundColor: isPending ? "#fff9c4" : "#fefefe",
                                                        "&:hover": {
                                                            backgroundColor: "#e3f2fd",
                                                        }
                                                    }}
                                                >
                                                    <TableCell sx={{ border: "1px solid #ccc", textAlign: "center", width: '5%' }}>
                                                        {idx + 1}
                                                    </TableCell>
                                                    <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                                                        {evaluation.batch_name}
                                                    </TableCell>
                                                    <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                                                        {evaluation.technical ?? "-"}
                                                    </TableCell>
                                                    <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                                                        {evaluation.mcq ?? "-"}
                                                    </TableCell>
                                                    <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                                                        {evaluation.oral ?? "-"}
                                                    </TableCell>
                                                    <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                                                        {evaluation.total ?? "-"}
                                                    </TableCell>
                                                    <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                                                        {evaluation.remark ?? "-"}
                                                    </TableCell>
                                                    <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                                                        {getStatusLabel(evaluation)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
            </Box>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                message={snackbarMessage}
                sx={{ bottom: 50 }}
            />
        </>
    );
};

export default InternEvaluationResult;
