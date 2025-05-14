import React, { useState, useEffect } from "react";
import { Container, Typography, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Button, TextField, Box, Snackbar, Alert, Tabs, Tab, Divider, Menu, IconButton } from "@mui/material";
import { styled } from "@mui/system";
import config from "../config";
import Navbar from '../navbar/navbar';
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import VisibilityIcon from "@mui/icons-material/Visibility";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as htmlToImage from "html-to-image";
import DownloadIcon from "@mui/icons-material/Download"; // ✅ Icon for download button
import axios from "axios";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

const StyledContainer = styled(Container)({
    marginTop: "20px",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.4)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
});
const FixedBox = styled(Box)({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "sticky",
    top: 0,
    backgroundColor: "#fff",
    padding: "15px",
    zIndex: 1000,
    width: "100%",
    boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)",
    borderRadius: "10px",
});
const StyledTableContainer = styled(TableContainer)({
    marginTop: "20px",
    borderRadius: "10px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    maxHeight: "400px",
    overflowY: "auto",
    width: "100%",
});
const StyledButton = styled(Button)({
    backgroundColor: "#1976D2",
    color: "white",
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "5px",
    '&:hover': {
        backgroundColor: "#125699",
    }
});
const AttendancePage = () => {
    const [tabValue, setTabValue] = useState(0);
    const [activeTab, setActiveTab] = useState("mark");
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState("");
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [date, setDate] = useState(() => {
        const today = new Date();
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
        return today.toISOString().split("T")[0];
    });
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [filterBatch, setFilterBatch] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterName, setFilterName] = useState("");
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // "error" or "success"
    const [selectAll, setSelectAll] = useState(false);
    const [lectureNo, setLectureNo] = useState(1); //Default to Lecture 1
    const [filterLectureNo, setFilterLectureNo] = useState('');
    const [tracks, setTracks] = useState([]);
    const [selectedTrack, setSelectedTrack] = useState("");
    const [editingRowIndex, setEditingRowIndex] = useState(null);
    const [editedStatus, setEditedStatus] = useState(null);

    useEffect(() => {
        fetch(`${config.API_BASE_URL}/api/getBatchNames`)
            .then(response => response.json())
            .then(data => setBatches(data));
        const today = new Date();
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
        setDate(today.toISOString().split("T")[0]);
        console.log("Today's Date:", date);

        fetchTracks();
    }, []);

    const handleTrackChange = (event) => {
        const track = event.target.value;
        setSelectedTrack(track);
        setSelectedBatch(""); // Reset batch selection when track changes
        fetchBatchesByTrack(track);
    };

    // Fetch Batches when Track is Selected
    const fetchTracks = async () => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/tracks`);
            setTracks(response.data);
        } catch (error) {
            console.error("Error fetching tracks:", error);
        }
    };

    const fetchBatchesByTrack = async (trackName) => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/getBatchesByTrack`, {
                params: { trackName },
            });
            setBatches(response.data);
        } catch (error) {
            console.error("Error fetching batches by track:", error);
            setBatches([]); // Reset batches if error occurs
        }
    };

    useEffect(() => {
        if (activeTab === "view") {
            let url = `${config.API_BASE_URL}/api/getAttendance`;
            const params = [];

            if (filterBatch) params.push(`batch=${filterBatch}`);
            if (filterDate) params.push(`date=${filterDate}`);
            if (filterStatus) params.push(`status=${filterStatus}`);
            if (filterName) params.push(`name=${filterName}`);
            if (filterLectureNo) params.push(`lecture_no=${filterLectureNo}`); // ✅ Add Lecture No filter

            if (params.length > 0) {
                url += "?" + params.join("&");
            }

            fetch(url)
                .then(response => response.json())
                .then(data => setAttendanceRecords(data))
                .catch(error => console.error("Error fetching attendance records:", error));
        }
    }, [activeTab, filterBatch, filterDate, filterStatus, filterName, filterLectureNo]); // ✅ Added filterLectureNo

    const isFilterApplied = filterBatch || filterDate || filterStatus || filterName || filterLectureNo;

    const handleBatchChange = (event) => {
        const batch = event.target.value;
        setSelectedBatch(batch);
        fetch(`${config.API_BASE_URL}/api/getstudents?batchName=${batch}`)
            .then(response => response.json())
            .then(data => {
                setStudents(data);
                setAttendance(data.reduce((acc, student) => {
                    acc[student.id] = false;
                    return acc;
                }, {}));
            });
    };

    const handleAttendanceChange = (id) => {
        setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getCookie = (name) => {
        const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
        return match ? decodeURIComponent(match[2]) : "";
    };

    const role = getCookie('role');
    const userid = getCookie("userid");

    const isTodayOrTomorrow = (dateString) => {
        const today = new Date();
        const selected = new Date(dateString);

        const isToday = today.toDateString() === selected.toDateString();

        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const isTomorrow = tomorrow.toDateString() === selected.toDateString();

        return isToday || isTomorrow;
    };

    const handleSaveAttendance = async (record, newStatus) => {
        try {
            await fetch(`${config.API_BASE_URL}/api/updateAttendance`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: record.student_id,
                    batch_name: record.batch_name,
                    lecture_no: record.lecture_no,
                    date: record.date.split("T")[0], // 💥 Format fixed here
                    status: newStatus,
                }),

            });
            console.log("🟢 Sending update payload:", {
                student_id: record.student_id,
                batch_name: record.batch_name,
                lecture_no: record.lecture_no,
                date: record.date,
                status: newStatus,
            });

            setEditingRowIndex(null); // Exit edit mode
            fetchAttendance(); // Refresh
            setSnackbar({ open: true, message: "Attendance updated", severity: "success" });
        } catch (error) {
            console.error("Update error:", error);
            setSnackbar({ open: true, message: "Failed to update", severity: "error" });
        }
    };

    const fetchAttendance = async () => {
        const queryParams = new URLSearchParams({
            track: selectedTrack,
            batch: filterBatch,
            date: filterDate,
            status: filterStatus,
            lecture_no: filterLectureNo,
            student_name: filterName
        });

        try {
            const response = await fetch(`${config.API_BASE_URL}/api/viewAttendance?${queryParams}`);
            const data = await response.json();
            setAttendanceRecords(data); // Set your state here
        } catch (err) {
            console.error("Failed to fetch attendance:", err);
        }
    };

    // const statusValue = record.status === true || record.status === "true";
    const submitAttendance = () => {
        const selected = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selected.setHours(0, 0, 0, 0);

        if (selected > today) {
            setSnackbarMessage("❌ Cannot mark attendance for future dates.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            return;
        }

        if (!selectedBatch || !date || !lectureNo) {
            setSnackbarMessage("❌ Please select Batch, Date, and Lecture No.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            return;
        }
        fetch(`${config.API_BASE_URL}/api/saveAttendance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                batch_name: selectedBatch,
                date,
                lecture_no: lectureNo,
                students,
                attendance,
                marked_by_userid: userid,
                marked_by_role: role
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    setSnackbarMessage(`${data.error}`);
                    setSnackbarSeverity("error");
                } else {
                    setSnackbarMessage("✅ Attendance saved successfully!");
                    setSnackbarSeverity("success");
                    fetchAttendance();
                    setActiveTab('view');
                    setSelectedTrack("");
                }
                setSnackbarOpen(true);
            })
            .catch(error => {
                console.error("❌ Error saving attendance:", error);
                setSnackbarMessage("❌ Failed to save attendance. Try again.");
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
            });
    };

    const formatDate = (dateString) => {
        if (!dateString) return ""; // Handle empty values

        const dateObj = new Date(dateString); // Convert string to Date object
        const day = String(dateObj.getDate()).padStart(2, "0"); // Ensure 2-digit format
        const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Months are 0-based
        const year = dateObj.getFullYear();

        return `${day}-${month}-${year}`; // Convert to DD-MM-YYYY
    };

    // 🔹 Export as Excel
    const downloadExcel = () => {
        if (attendanceRecords.length === 0) {
            alert("No attendance records available to download.");
            return;
        }
        // 🔹 Convert date to DD-MM-YYYY format & status to Present/Absent
        const formattedData = attendanceRecords.map(record => ({
            Batch_Name: record.batch_name,
            Student_ID: record.student_id,
            Student_Name: record.student_name,
            Date: formatDate(record.date), // ✅ Convert date to DD-MM-YYYY
            Status: record.status ? "Present" : "Absent" // ✅ Convert true/false to Present/Absent
        }));
        // 🔹 Create a new workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet([]);

        // 🔹 Create heading row based on filters
        const heading = `Attendance Report ${filterBatch ? `for Batch: ${filterBatch}` : ""
            } ${filterDate ? `on Date: ${formatDate(filterDate)}` : ""}
           ${filterStatus ? `with Status: ${filterStatus === "true" ? "Present" : "Absent"}` : ""}
           ${filterName ? `for Student: ${filterName}` : ""}`;

        XLSX.utils.sheet_add_aoa(ws, [[heading]], { origin: "A1" }); // ✅ Insert heading

        // 🔹 Insert column headers
        XLSX.utils.sheet_add_aoa(ws, [["Batch Name", "Student ID", "Student Name", "Date", "Status"]], { origin: "A3" });

        // 🔹 Insert attendance records
        XLSX.utils.sheet_add_json(ws, formattedData, { origin: "A4", skipHeader: true });

        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, "Attendance.xlsx");
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === "clickaway") return; // Prevent closing when clicking outside
        setSnackbarOpen(false);
    };

    return (
        <>
            <Navbar showLogoutButton={true} />
            <Container maxWidth="lg" sx={{ mt: 10 }}>
                <Box sx={{ mt: 10 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(event, newValue) => setActiveTab(newValue)}
                        centered
                        sx={{ minHeight: "40px" }} // ✅ Reduce tab height
                    >
                        <Tab
                            icon={<EventAvailableIcon/>} // ✅ Smaller icon
                            iconPosition="start"
                            label="Mark Attendance"
                            value="mark"
                            sx={{ minWidth: "auto", padding: "6px 12px", fontSize: "14px", fontWeight: "bold" }} // ✅ Reduce padding & size
                        />
                        <Divider
                            orientation="vertical"
                            flexItem
                            sx={{ height: "30px", mx: 1, borderColor: "primary.main", borderWidth: "2px", alignSelf: "center" }} // ✅ Smaller divider
                        />
                        <Tab
                            icon={<VisibilityIcon />} // ✅ Smaller icon
                            iconPosition="start"
                            label="View Attendance"
                            value="view"
                            sx={{ minWidth: "auto", padding: "6px 12px", fontSize: "14px", fontWeight: "bold" }} // ✅ Reduce padding & size
                        />
                    </Tabs>
                </Box>
                {activeTab === "mark" ? (
                    <>
                        <StyledContainer sx={{ mt: 1 }}>
                            <Typography
                                variant="h6"
                                gutterBottom
                                fontWeight="bold"
                                sx={{ textAlign: "left", alignSelf: "flex-start", mb: 2 }}
                            >
                                Batch-wise Attendance
                            </Typography>
                            <FixedBox sx={{ gap: 2 }}>
                                <FormControl fullWidth variant="outlined" sx={{ mb: 2, marginTop: '15px', width: "30%" }}>
                                    <InputLabel>Track Name *</InputLabel>
                                    <Select
                                        label="Track Name *"
                                        value={selectedTrack}
                                        onChange={handleTrackChange}
                                        fullWidth
                                    >
                                        <MenuItem value="">Select Track</MenuItem>
                                        {tracks.map((track) => (
                                            <MenuItem key={track.id} value={track.track_name}>
                                                {track.track_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl style={{ width: "25%" }}>
                                    <InputLabel>Select Batch</InputLabel>
                                    <Select
                                        label="Select Batch"
                                        value={selectedBatch}
                                        onChange={handleBatchChange}
                                    >
                                        {!selectedTrack ? (
                                            <MenuItem disabled>Please select a track first</MenuItem>
                                        ) : batches.length === 0 ? (
                                            <MenuItem disabled>No batches available</MenuItem>
                                        ) : (
                                            batches.map(batch => (
                                                <MenuItem key={batch.batch_name} value={batch.batch_name}>
                                                    {batch.batch_name}
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>
                                </FormControl>
                                <FormControl style={{ width: "25%" }}>
                                    <InputLabel>Select Lecture</InputLabel>
                                    <Select
                                        label="Select Lecture"
                                        value={lectureNo}
                                        onChange={(e) => setLectureNo(e.target.value)}
                                    >
                                        {[1, 2, 3, 4, 5, 6].map(num => (
                                            <MenuItem key={num} value={num}>Lecture {num}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Select Date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    style={{ width: "25%" }}
                                    inputProps={{
                                        max: new Date().toISOString().split("T")[0]
                                    }}
                                />
                                <StyledButton sx={{ width: "30%", height: "54px" }} onClick={submitAttendance}>Submit Attendance</StyledButton>
                            </FixedBox>

                            <Typography color="error" fontWeight="bold" sx={{ mt: 2 }}>
                                Please select students to mark present.
                            </Typography>

                            {students.length > 0 && (
                                <StyledTableContainer component={Paper} sx={{ maxHeight: 300 }}>

                                    <Table size="small">
                                        <TableHead sx={{ position: "sticky", top: 0, backgroundColor: "#1976D2", zIndex: 1 }}>
                                            <TableRow style={{ backgroundColor: "#34495e", color: "white" }}>
                                                <TableCell style={{ color: "white", textAlign: "center" }}>
                                                    <Checkbox
                                                        checked={selectAll}
                                                        onChange={() => {
                                                            setSelectAll(!selectAll);
                                                            setAttendance(students.reduce((acc, student) => {
                                                                acc[student.id] = !selectAll;
                                                                return acc;
                                                            }, {}));
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell style={{ color: "white" }}>Name</TableCell>
                                                <TableCell style={{ color: "white" }}>Email</TableCell>
                                                <TableCell style={{ color: "white" }}>Phone</TableCell>
                                                <TableCell style={{ color: "white" }}>Batch Name</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {students.map(student => (
                                                <TableRow key={student.id}>
                                                    <TableCell sx={{ textAlign: "center" }}>
                                                        <Checkbox checked={attendance[student.id]} onChange={() => handleAttendanceChange(student.id)} />
                                                    </TableCell>
                                                    <TableCell>{student.student_name}</TableCell>
                                                    <TableCell>{student.email_id}</TableCell>
                                                    <TableCell>{student.contact_no}</TableCell>
                                                    <TableCell>{student.batch_name}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </StyledTableContainer>
                            )}
                        </StyledContainer>
                    </>
                ) : (
                    <> {/* View Attendance Table */}
                        <StyledContainer sx={{ maxHeight: 490, mt: 1 }}>
                            <Box sx={{ display: "flex", justifyContent: "center", width: "100%", position: "relative" }}>
                                {/* 🔹 Center-Aligned Typography */}
                                <Typography variant="h6" fontWeight={"bold"} sx={{ textAlign: "left", flex: 1 }}>
                                    Attendance Records
                                </Typography>

                                {/* 🔹 Download Button (Aligned Right) */}
                                <Button
                                    color="success"
                                    variant="contained"
                                    startIcon={<DownloadIcon />}
                                    onClick={downloadExcel}  // ✅ Opens menu on click
                                    sx={{
                                        color: "white",
                                        position: "absolute",
                                        right: 0
                                    }}
                                >
                                    Download Excel
                                </Button>
                            </Box>
                            {/* 🔹 Filter Section */}
                            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2, width: "100%" }}>
                                <FormControl sx={{ width: "20%" }}>
                                    <InputLabel>Filter by Track</InputLabel>
                                    <Select
                                        label="Filter by Track"
                                        value={selectedTrack}
                                        onChange={(e) => {
                                            setSelectedTrack(e.target.value);
                                            setFilterBatch(""); // Reset batch when track changes
                                            fetchBatchesByTrack(e.target.value); // Re-fetch batches
                                        }}
                                    >
                                        <MenuItem value="">All Tracks</MenuItem>
                                        {tracks.map(track => (
                                            <MenuItem key={track.track_name} value={track.track_name}>
                                                {track.track_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl sx={{ width: "20%" }}>
                                    <InputLabel>Filter by Batch</InputLabel>
                                    <Select
                                        label="Filter by Batch"
                                        value={filterBatch}
                                        onChange={(e) => setFilterBatch(e.target.value)}
                                    >
                                        {/* Always show this default item */}
                                        <MenuItem value="">All Batches</MenuItem>

                                        {!selectedTrack ? (
                                            <MenuItem disabled>Please select a track first</MenuItem>
                                        ) : batches.length === 0 ? (
                                            <MenuItem disabled>No batches available</MenuItem>
                                        ) : (
                                            batches.map(batch => (
                                                <MenuItem key={batch.batch_name} value={batch.batch_name}>
                                                    {batch.batch_name}
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>
                                </FormControl>
                                <FormControl style={{ width: "20%" }}>
                                    <InputLabel>Select Lecture No</InputLabel>
                                    <Select label="Select Lecture No" value={filterLectureNo} onChange={(e) => setFilterLectureNo(e.target.value)}>
                                        <MenuItem value="">All</MenuItem> {/* Allows viewing all lectures */}
                                        {[1, 2, 3, 4, 5, 6].map(num => (
                                            <MenuItem key={num} value={num}>Lecture {num}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Filter by Date"
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ width: "20%" }}
                                    inputProps={{
                                        max: new Date().toISOString().split("T")[0]
                                    }}
                                />
                                <FormControl sx={{ width: "20%" }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                        <MenuItem value="">All</MenuItem>
                                        <MenuItem value="true">Present</MenuItem>
                                        <MenuItem value="false">Absent</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Search by Name"
                                    type="text"
                                    value={filterName}
                                    onChange={(e) => setFilterName(e.target.value)}
                                    sx={{ width: "20%" }}
                                />
                                {/* 🔹 Show Clear Filters button only when filters are applied */}
                                {isFilterApplied && (
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={() => {
                                            setFilterBatch("");
                                            setFilterDate("");
                                            setFilterStatus("");
                                            setFilterName("");
                                            setFilterLectureNo("");
                                        }}
                                        sx={{ width: "15%", height:"54px", backgroundColor: "secondary", color: "white", '&:hover': { backgroundColor: "#D84315" } }}
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </Box>
                            {(role === "admin" || role === "manager") && (
                                <Typography
                                    variant="subtitle2"
                                    sx={{ color: "#d84315", fontWeight: "bold", textAlign: "center", mt: 2 }}
                                >
                                    You have rights to edit today's marked attendance till tomorrow.
                                </Typography>
                            )}

                            {/* 🔹 Table Section */}
                            <StyledTableContainer id="attendanceTable" component={Paper} sx={{ mt: 3, width: "100%" }}>
                                <Table>
                                    <TableHead sx={{ position: "sticky", top: 0, backgroundColor: "#1976D2", zIndex: 1 }}>
                                        <TableRow style={{ backgroundColor: "#34495e" }}>
                                            <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Batch</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center", border: "1px solid black" }}>Lecture No</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center", border: "1px solid black" }}>Student</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center", border: "1px solid black" }}>Date</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: "bold", textAlign: "center", border: "1px solid black" }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {attendanceRecords.length > 0 ? (
                                            attendanceRecords.map((record, index) => {
                                                const isEditable = (role === "admin" || role === "manager") && isTodayOrTomorrow(record.date);
                                                const statusValue = record.status === true || record.status === "true";

                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell sx={{ textAlign: "center", border: "1px solid black" }}>
                                                            {record.batch_name}
                                                        </TableCell>
                                                        <TableCell sx={{ textAlign: "center", border: "1px solid black" }}>
                                                            {record.lecture_no}
                                                        </TableCell>
                                                        <TableCell sx={{ textAlign: "center", border: "1px solid black" }}>
                                                            {record.student_name}
                                                        </TableCell>
                                                        <TableCell sx={{ textAlign: "center", border: "1px solid black" }}>
                                                            {formatDate(record.date)}
                                                        </TableCell>
                                                        <TableCell sx={{ textAlign: "center", border: "1px solid black" }}>
                                                            {isEditable && editingRowIndex === index ? (
                                                                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                                                    <Select
                                                                        value={editedStatus}
                                                                        size="small"
                                                                        onChange={(e) => setEditedStatus(e.target.value === "true")}
                                                                    >
                                                                        <MenuItem value="true">Present</MenuItem>
                                                                        <MenuItem value="false">Absent</MenuItem>
                                                                    </Select>
                                                                    <IconButton onClick={() => handleSaveAttendance(record, editedStatus)} color="primary">
                                                                        <SaveIcon />
                                                                    </IconButton>
                                                                </Box>
                                                            ) : (
                                                                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                                                    <Typography fontWeight="bold" color={statusValue ? "green" : "red"}>
                                                                        {statusValue ? "Present" : "Absent"}
                                                                    </Typography>
                                                                    {isEditable && (
                                                                        <IconButton onClick={() => {
                                                                            setEditingRowIndex(index);
                                                                            setEditedStatus(statusValue);
                                                                        }}>
                                                                            <EditIcon />
                                                                        </IconButton>
                                                                    )}
                                                                </Box>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ fontWeight: "bold", color: "gray" }}>
                                                    No records found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>

                                </Table>
                            </StyledTableContainer>
                        </StyledContainer>
                    </>
                )}
            </Container>

            {/* Snackbar for Success/Error Messages */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}  // Closes after 3 seconds
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "top", horizontal: "center" }} // Position at center
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

        </>
    );
};
export default AttendancePage;