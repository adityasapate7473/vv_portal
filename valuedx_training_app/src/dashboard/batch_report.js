import React, { useState, useEffect } from "react";
import Navbar from "../navbar/navbar";
import PartnerDashboard from "./partner_home";
import ResumeBuilder from "./profile_form";
import { Link, useNavigate } from "react-router-dom";
import AccessCardForm from "../AccessCard/accesscard";
import AccessCardDashboard from "../AccessCard/accesscarddashboard";
import config from "../config";
import {
    Container,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Box,
    styled,
    Grid,
    Pagination,
    TextField,
} from "@mui/material";

// Custom styles
const TableContainerStyled = styled(TableContainer)(({ theme }) => ({
    marginTop: theme.spacing(4),
    borderRadius: theme.shape.borderRadius,
    overflow: "hidden",
    boxShadow: theme.shadows[5],
}));

const TableHeaderCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: "#044f67", // Dark grey
    color: "white", // White
    fontWeight: "bold",
    textAlign: "center",
    padding: theme.spacing(1.5),
}));

const TableRowStyled = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(even)": {
        backgroundColor: "#F9F9F9", // Very light grey
    },
    "&:hover": {
        backgroundColor: "#E0E0E0", // Light grey on hover
    },
}));

const TotalRow = styled(TableRow)(({ theme }) => ({
    backgroundColor: "#F1F1F1", // Light grey
    fontWeight: "bold",
}));

const TotalCell = styled(TableCell)(({ theme }) => ({
    color: "#333", // Dark grey
    textAlign: "center",
}));

const LinkStyled = styled(Link)(({ theme }) => ({
    color: "#1976D2", // Blue
    textDecoration: "none",
    "&:hover": {
        textDecoration: "underline",
    },
}));

const Heading = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(4),
    color: "#1976D2", // Blue
    fontWeight: "bold",
}));

const BatchReport = () => {
    const [role, setRole] = useState("");
    const [name, setName] = useState("");
    const [batchDetails, setBatchDetails] = useState([]);
    const [showTable, setShowTable] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [page, setPage] = useState(1); // Current page
    const [batchesPerPage] = useState(5); // Batches per page
    const [searchTerm, setSearchTerm] = useState("");


    const navigate = useNavigate();

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    useEffect(() => {
        console.log("Fetching batch details...");
        fetchBatchDetails();
    }, []);



    const fetchBatchDetails = async () => {
        try {
            const response = await fetch(`${config.API_BASE_URL}/api/getBatchDetails`);
            if (!response.ok) {
                throw new Error("Failed to fetch batch details");
            }
            const data = await response.json();
            console.log("Batch Details:", data); // ✅ Log response

            // 🔹 Fetch attendance data
            const attendanceResponse = await fetch(`${config.API_BASE_URL}/api/getBatchAttendance`);
            if (!attendanceResponse.ok) {
                throw new Error("Failed to fetch attendance data");
            }
            const attendanceData = await attendanceResponse.json();
            console.log("Attendance Data:", attendanceData); // ✅ Log response

            // 🔹 Merge attendance percentage into batch details
            const updatedBatches = data.map(batch => {
                const attendance = attendanceData.find(a => a.batch_name === batch.batch_name);
                return {
                    ...batch,
                    attendance_percentage: attendance ? attendance.attendance_percentage : 0
                };
            });

            console.log("Updated Batches with Attendance:", updatedBatches); // ✅ Check if merging correctly
            setBatchDetails(updatedBatches);
        } catch (error) {
            console.error("Error fetching batch details:", error);
        }
    };



    const getRoleFromCookie = () => {
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
            const [name, value] = cookie.split("=");
            if (name === "role") {
                return value;
            }
        }
        return "";
    };

    const getNameFromCookie = () => {
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
            const [name, value] = cookie.split("=");
            if (name === "name") {
                return decodeURIComponent(value);
            }
        }
        return "";
    };

    const calculatePercentageBasedOnWeeks = (numOfWeeks, startDate) => {
        const startDateObj = new Date(startDate);
        const currentDate = new Date();
        const elapsedWeeks = Math.floor(
            (currentDate - startDateObj) / (7 * 24 * 60 * 60 * 1000)
        );
        const totalWeeks = parseInt(numOfWeeks);

        if (totalWeeks <= 0) return 0;

        let percentage = (elapsedWeeks / totalWeeks) * 100;

        if (percentage > 100) {
            percentage = 100;
        }

        return percentage.toFixed(0);
    };

    const calculateTotalStudents = () => {
        let total = 0;
        batchDetails.forEach((item) => {
            total += parseInt(item.total_students);
        });
        return total;
    };

    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    useEffect(() => {
        calculateTotalStudents();
    }, [batchDetails]);

    useEffect(() => {
        const userRole = getRoleFromCookie();
        setRole(userRole);

        const name = getNameFromCookie();
        setName(name);

        if (userRole === "admin" || userRole === "trainer" || userRole === 'manager') {
            fetchBatchDetails();
            setShowTable(true);
        }
    }, []);
    const handleViewResult = (batchName) => {
        setSelectedBatch(batchName);
        navigate(`/evaluation_result?batchName=${batchName}`);
    };

    const indexOfLastBatch = page * batchesPerPage;
    const indexOfFirstBatch = indexOfLastBatch - batchesPerPage;

    const filteredBatches = batchDetails.filter(batch =>
        batch.batch_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentBatches = filteredBatches.slice(indexOfFirstBatch, indexOfLastBatch);
    const totalPages = Math.ceil(filteredBatches.length / batchesPerPage);

    const calculateOverallAttendance = () => {
        if (batchDetails.length === 0) return 0;
        const totalAttendance = batchDetails.reduce((acc, batch) => acc + (batch.attendance_percentage || 0), 0);
        return (totalAttendance / batchDetails.length).toFixed(1); // ✅ Average attendance %
    };



    return (
        <>
            <Navbar showLogoutButton={true} />
            <Container>
                <Box mt={10} mb={1}>
                    {role === "intern" && <ResumeBuilder />}
                    {role === "partner" && <PartnerDashboard />}
                    {role === "ITAdmin" && < AccessCardDashboard />}
                    {(role === "admin" || role === "trainer" || role === 'manager') && showTable && (
                        <Box mt={1}>
                            <Heading variant="h5" gutterBottom sx={{ color: '#34495e' }}>
                                Reports
                            </Heading>

                            <TextField
                                label="Search Batch"
                                variant="outlined"
                                fullWidth
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />

                            <TableContainerStyled
                                component={Paper}
                                sx={{
                                    borderRadius: 3,
                                    overflow: "hidden",
                                    boxShadow: 3
                                }}
                            >
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableHeaderCell>Sr. No.</TableHeaderCell>
                                            <TableHeaderCell>Batch Name</TableHeaderCell>
                                            <TableHeaderCell>Students Count</TableHeaderCell>
                                            <TableHeaderCell>Syllabus Status</TableHeaderCell>
                                            <TableHeaderCell>Attendance %</TableHeaderCell>
                                            <TableHeaderCell>Evaluation Result</TableHeaderCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {currentBatches.length > 0 ? (
                                            currentBatches.map((item, index) => (
                                                <TableRowStyled key={index}>
                                                    <TableCell align="center">{indexOfFirstBatch + index + 1}</TableCell>
                                                    <TableCell align="center">
                                                        <LinkStyled to={`/batch_details/${item.batch_name}`}>
                                                            {item.batch_name}
                                                        </LinkStyled>
                                                    </TableCell>
                                                    <TableCell align="center">{item.total_students}</TableCell>
                                                    <TableCell align="center" style={{ color: "green" }}>
                                                        <b>{calculatePercentageBasedOnWeeks(item.numofweeks, item.batch_start_date)}%</b>
                                                    </TableCell>

                                                    {/* ✅ Attendance Percentage with Dynamic Color */}
                                                    <TableCell align="center"
                                                        sx={{
                                                            color: item.attendance_percentage >= 75 ? "green" :
                                                                item.attendance_percentage >= 50 ? "orange" : "red",
                                                            fontWeight: "bold"
                                                        }}>
                                                        {item.attendance_percentage}%
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        <LinkStyled
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleViewResult(item.batch_name);
                                                            }}
                                                        >
                                                            View Result
                                                        </LinkStyled>
                                                    </TableCell>
                                                </TableRowStyled>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" style={{ color: "red" }}>
                                                    No search match found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    <TableRow>
                                        <TableCell
                                            colSpan={2}
                                            align="right"
                                            style={{ color: "green", fontWeight: "bold" }}
                                        >
                                            Total Batches Students Count:
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            style={{ color: "green", fontWeight: "bold" }}
                                        >
                                            {calculateTotalStudents()}
                                        </TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                    </TableRow>

                                </Table>
                                <Box mt={2} display="flex" justifyContent="center">
                                    <Pagination
                                        count={totalPages}
                                        page={page}
                                        onChange={handlePageChange}
                                        color="primary"
                                    />
                                </Box><br />
                            </TableContainerStyled>
                        </Box>
                    )}

                </Box>
            </Container>
        </>
    );
};

export default BatchReport;
