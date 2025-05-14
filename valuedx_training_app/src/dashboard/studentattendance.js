import React, { useState, useEffect } from 'react';
import {
    Container, Grid, Typography, Paper, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, LinearProgress, TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import Navbar from "../navbar/navbar";
import config from "../config";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function getCookie(name) {
    const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return cookieValue ? decodeURIComponent(cookieValue.pop()) : '';
}

const COLORS = ['#0088FE', '#FF8042'];

const StudentAttendancePage = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [presentCount, setPresentCount] = useState(0);
    const [absentCount, setAbsentCount] = useState(0);
    const [overallAttendance, setOverallAttendance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const name = getCookie('name');
    const userid = getCookie('userid');

    useEffect(() => {
        const fetchAttendanceData = async () => {
            setLoading(true);
            try {
                const data = await fetchAttendance();
                if (data && data.attendance) {
                    setAttendanceData(data.attendance);
                    processAttendanceData(data.attendance);
                }
            } catch (error) {
                console.error("Error fetching attendance data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendanceData();
    }, []);

    useEffect(() => {
        filterAttendance();
    }, [filterDate, filterStatus, attendanceData]);

    const fetchAttendance = async () => {
        try {
            const response = await fetch(`${config.API_BASE_URL}/api/intern/attendance`, {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" }
            });
    
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch attendance");
            }
    
            return {
                attendance: data.attendance.map(entry => ({
                    ...entry,
                    status: entry.status === true ? "Present" : "Absent", 
                    batch : entry.batch_name
                }))
            };
        } catch (error) {
            console.error("Error fetching attendance:", error);
            return { attendance: [] };
        }
    };
    
    const processAttendanceData = (attendance) => {
        const totalClasses = attendance.length;
        const present = attendance.filter(entry => entry.status === 'Present').length;
        const absent = totalClasses - present;

        setPresentCount(present);
        setAbsentCount(absent);
        setOverallAttendance(totalClasses ? ((present / totalClasses) * 100).toFixed(2) : 0);
        setFilteredData(attendance);
    };

    const filterAttendance = () => {
        let filtered = attendanceData;
        if (filterDate) {
            filtered = filtered.filter(attendance => {
                const recordDate = new Date(attendance.date);
                return recordDate.toLocaleDateString("en-CA") === filterDate;
            });
        }
        if (filterStatus) {
            filtered = filtered.filter(attendance => attendance.status === filterStatus);
        }
        setFilteredData(filtered);
    };

    const attendanceChartData = [
        { name: "Present", value: presentCount },
        { name: "Absent", value: absentCount }
    ];

    return (
        <>
            <Navbar showLogoutButton={true} />
            <Container
                maxWidth="lg"
                sx={{
                    mt: 12,
                    width: "95%",
                    backgroundColor: "#fff",
                    p: 3,
                    borderRadius: 2,
                    boxShadow: "0px 6px 18px rgba(0, 0, 0, 0.15)",
                    height: "82vh",
                }}
            >
                <Typography
                    variant="h4"
                    sx={{ fontWeight: "bold", color: "#444", textAlign: "center", mb: 2 }}
                >
                    Attendance Overview
                </Typography>

                {loading ? (
                    <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper
                                sx={{
                                    p: 3,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    borderRadius: 2,
                                    boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.20)",
                                    background: "linear-gradient(135deg, #ffffff, #f0f8ff)"
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "center", mb: 2 }}>
                                    Overall Attendance
                                </Typography>

                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={attendanceChartData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}
                                        >
                                            {attendanceChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>

                                <Box sx={{ mt: 2, width: "100%", textAlign: "center" }}>
                                    <Typography variant="h6">
                                        Attendance: {overallAttendance}%
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={overallAttendance}
                                        sx={{ height: 10, borderRadius: 5, mt: 1, backgroundColor: "#ddd" }}
                                    />
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3, height: "100%", borderRadius: 2, boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.20)" }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "center", mb: 2 }}>
                                    Date-wise Attendance
                                </Typography>

                                <Box display="flex" gap={2} sx={{ mb: 2 }}>
                                    <TextField type="date" label="Filter by Date" variant="outlined" fullWidth value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)} InputLabelProps={{ shrink: true }}
                                    />
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                            <MenuItem value="">All</MenuItem>
                                            <MenuItem value="Present">Present</MenuItem>
                                            <MenuItem value="Absent">Absent</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>

                                <TableContainer sx={{ maxHeight: 300, overflowY: "auto" }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><b>Date</b></TableCell>
                                                <TableCell><b>Status</b></TableCell>
                                                <TableCell><b>Batch</b></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredData.map((attendance, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{new Date(attendance.date).toLocaleDateString("en-GB")}</TableCell>
                                                    <TableCell sx={{ color: attendance.status === "Present" ? "green" : "red", fontWeight: "bold" }}>
                                                        {attendance.status}
                                                    </TableCell>
                                                    <TableCell>{attendance.batch}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Container>
        </>
    );
};

export default StudentAttendancePage;
