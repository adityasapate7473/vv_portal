import React, { useState, useEffect } from "react";
import Navbar from "../navbar/navbar";
import { useParams } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import config from "../config";
import axios from "axios";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Box,
  Container,
  Button,
  Table,
  Link,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Snackbar,
  Select,
  InputLabel,
  FormControl,
  DialogContent,
  DialogContentText,
  DialogActions,
  DialogTitle,
  Dialog,
  TextField,
  MenuItem,
} from "@mui/material";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { keyframes } from "@mui/system";
import { styled } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";


const StyledContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const StyledCircularProgressbar = styled(CircularProgressbar)(({ theme }) => ({
  width: 200,
  height: 200,
}));

const fadeInAnimation = keyframes`
    from {
      opacity: 0;
      transform: scale(0.5);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  `;

const StyledCard = styled(Card)(({ theme }) => ({
  transition: "0.3s ease",
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[5],
  "&:hover": {
    boxShadow: theme.shadows[10],
    transform: "translateY(-5px)",
  },
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
}));

const HeadingCell = styled(TableCell)(({ theme }) => ({
  fontWeight: "bold",
  backgroundColor: theme.palette.grey[200],
  padding: theme.spacing(1.5),
}));

const DataCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1.5),
}));

const BatchDetails = () => {
  const { batchName } = useParams();
  const [batchDetails, setBatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [students, setStudents] = useState([]);
  const [isStudentListVisible, setIsStudentListVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [trackName, setTrackName] = useState("");
  const [attendanceData, setAttendanceData] = useState({ attendance_percentage: 0 });
  const [moveReason, setMoveReason] = useState("");
  const [currentBatch, setCurrentBatch] = useState("");
  const [batchWarning, setBatchWarning] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);


  const getCookie = (name) => {
    const match = document.cookie.match(
      "(^|;)\\s*" + name + "\\s*=\\s*([^;]+)"
    );
    return match ? match.pop() : "";
  };

  const role = getCookie("role");
  const userid = getCookie("userid");

  useEffect(() => {

    const fetchBatchDetails = async () => {
      try {
        const response = await fetch(`${config.API_BASE_URL}/api/getBatchDetails`);
        if (!response.ok) {
          throw new Error("Failed to fetch batch details");
        }
        const data = await response.json();
        const selectedBatch = data.find(batch => batch.batch_name === batchName);
        setBatchDetails(selectedBatch);
      } catch (error) {
        setError("Error fetching batch details: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchAttendance = async () => {
      try {
        console.log(`Fetching attendance for batch: ${batchName}`);
        const response = await fetch(`${config.API_BASE_URL}/api/getBatchAttendance/${batchName}`);

        if (!response.ok) throw new Error(`Failed to fetch attendance. Status: ${response.status}`);

        const data = await response.json();
        console.log("Attendance API Response:", data); // ✅ Debugging log

        setAttendanceData(data);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    };


    const fetchStudents = async () => {
      try {
        const response = await axios.get("/api/getstudents", {
          params: { batchName },
        });
        setStudents(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
        setLoading(false);
      }
    };

    fetchBatchDetails();
    fetchAttendance();
    fetchTracks();
  }, [batchName]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/api/getstudents?batchName=${batchName}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      const data = await response.json();
      setStudents(data);
      setIsStudentListVisible(!isStudentListVisible);
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Error fetching students: " + error.message);
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/api/deleteStudent/${selectedStudentId}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        throw new Error("Failed to delete student");
      }
      setSnackbarMessage("Student deleted successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      fetchStudents();
    } catch (error) {
      setSnackbarMessage("Error deleting student: " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      handleCloseConfirmDialog();
    }
  };


  const handleOpenConfirmDialog = (studentId) => {
    setSelectedStudentId(studentId);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setSelectedStudentId(null);
  };


  // Open Dialog and Fetch Tracks
  const handleOpenMoveDialog = async (student) => {
    if (!student || !student.id) {
      console.error("Error: Student data is missing", student);
      return;
    }

    setSelectedStudent(student);
    setSelectedStudentId(student.id);
    setCurrentBatch(student.batch_name);
    setMoveDialogOpen(true);

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/getTracks`);
      const data = await response.json();
      setTracks(data);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    }
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

  const handleTrackChange = (event) => {
    const track = event.target.value;
    setSelectedTrack(track);
    setSelectedBatch(""); // Reset batch selection when track changes
    fetchBatchesByTrack(track);
  };

  const handleBatchChange = (newBatch) => {
    setSelectedBatch(newBatch);

    if (newBatch === currentBatch) {
      setBatchWarning("Student is already in this batch."); // Show warning
    } else {
      setBatchWarning(""); // Clear warning if batch is different
    }
  };
  const checkEmailCredentials = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/check-profile-completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, userid }),
      });

      const data = await response.json();

      if (!data.email || !data.email_password) {
        setSnackbarMessage("Email or Email Password is missing. Please update your profile to proceed.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Credential check error:", err);
      setSnackbarMessage("Unable to validate sender email credentials.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return false;
    }
  };

  // Move Student API Call
  const handleMoveStudent = async () => {
    if (!selectedTrack) {
      setSnackbarMessage("Please select track");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    if (!selectedBatch) {
      setSnackbarMessage("Please select batch");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    if (!moveReason) {
      setSnackbarMessage("Please enter the reason");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    if (!selectedStudentId) {
      console.error("Error: No student selected!");
      setSnackbarMessage("Error: No student selected!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    // No need to set warning here since it's handled in the UI
    if (selectedBatch === currentBatch) {
      return;
    }

    // ✅ Check email credentials before sending
    const isMailValid = await checkEmailCredentials();
    if (!isMailValid) return;

    try {
      const response = await fetch(
        `${config.API_BASE_URL}/api/moveStudent/${selectedStudentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batch: selectedBatch,
            moveReason,
            role: role || "",
            userid: userid,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to move student");
      }

      setSnackbarMessage("Student moved successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setMoveDialogOpen(false);

      // ✅ Reload window after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setSnackbarMessage("Error moving student: " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const paginatedStudents = students.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

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

  if (loading)
    return (
      <CircularProgress
        sx={{ display: "block", margin: "auto", marginTop: 4 }}
      />
    );
  if (error)
    return (
      <Alert severity="error" sx={{ marginTop: 4 }}>
        {error}
      </Alert>
    );

  const percentage = batchDetails
    ? calculatePercentageBasedOnWeeks(
      batchDetails.numofweeks,
      batchDetails.batch_start_date
    )
    : 0;

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleInputChange = (event) => {
    setTrackName(event.target.value);
  };


  const COLORS = ["#0088FE", "#FF0000", "#FFBB28", "#00C49F", "#A020F0"]; // Color mapping
  // Count occurrences of each training status
  const statusCounts = students.reduce((acc, student) => {
    acc[student.training_status] = (acc[student.training_status] || 0) + 1;
    return acc;
  }, {});

  // Prepare Pie Chart data
  const pieChartData = [
    { name: "Placed", value: statusCounts["Placed"] || 0 },
    { name: "Absconding", value: statusCounts["Absconding"] || 0 },
    { name: "In Training", value: statusCounts["In Training"] || 0 },
    { name: "Completed", value: statusCounts["Completed"] || 0 },
    { name: "Shadowed", value: statusCounts["Shadowed"] || 0 },
  ];

  return (
    <>
      <Navbar showLogoutButton={true} />
      <br />
      <br />
      <br />
      <StyledContainer maxWidth="lg">
        {batchDetails ? (
          <StyledCard
            elevation={3}
            sx={{ animation: `${fadeInAnimation} 1s ease-out` }}
          >
            <Grid container spacing={4} justifyContent="space-between">
              <Grid item xs={12} md={4}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <HeadingCell>Batch Name</HeadingCell>
                        <DataCell>{batchDetails.batch_name}</DataCell>
                      </TableRow>
                      <TableRow>
                        <HeadingCell>Batch Type</HeadingCell>
                        <DataCell>{batchDetails.batch_type}</DataCell>
                      </TableRow>
                      <TableRow>
                        <HeadingCell>Instructor Name</HeadingCell>
                        <DataCell>{batchDetails.instructor_name}</DataCell>
                      </TableRow>
                      <TableRow>
                        <HeadingCell>Total Students</HeadingCell>
                        <DataCell>
                          {batchDetails.total_students}
                          <Link
                            component="button"
                            variant="contained"
                            size="small"
                            onClick={fetchStudents}
                            color="primary"
                            sx={{ marginLeft: 2, cursor: "pointer" }}
                          >
                            {isStudentListVisible
                              ? "Hide Student List"
                              : "Show Student List"}
                          </Link>
                        </DataCell>
                      </TableRow>
                      <TableRow>
                        <HeadingCell>Track Name</HeadingCell>
                        <DataCell>{batchDetails.track_name}</DataCell>
                      </TableRow>
                      <TableRow>
                        <HeadingCell>Start Date</HeadingCell>
                        <DataCell>
                          {new Date(
                            batchDetails.batch_start_date
                          ).toLocaleDateString("en-GB")}
                        </DataCell>
                      </TableRow>
                      <TableRow>
                        <HeadingCell>Number of Weeks</HeadingCell>
                        <DataCell>{batchDetails.numofweeks}</DataCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid
                item
                xs={12}
                md={4}
                container
                alignItems="center"
                justifyContent="center"
              >
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Typography
                    variant="h5"
                    sx={{ marginBottom: "30px" }}
                    gutterBottom
                  >
                  </Typography>
                  <StyledCircularProgressbar
                    value={percentage}
                    text={`${percentage}%`}
                    styles={buildStyles({
                      pathColor:
                        percentage > 80
                          ? "green"
                          : percentage > 50
                            ? "orange"
                            : "red",
                      textColor: "#333",
                      trailColor: "#d6d6d6",
                      strokeWidth: 15,
                      pathTransitionDuration: 0.5,
                    })}
                  />
                  <b style={{ color: '#34495e', marginTop: '20px' }}>{batchName} Status</b>

                </Box>
              </Grid>
              <Grid item xs={12} md={4} container justifyContent="center">

                <PieChart width={400} height={300}>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </Grid>

              {/* 🔹 Overall Attendance Section */}
              {/* <Grid item xs={12} md={4} container justifyContent="center">
                <StyledCard elevation={3} sx={{ padding: "20px", textAlign: "center" }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Overall Attendance 📊
                  </Typography>

                  <Box display="flex" flexDirection="column" alignItems="center">
                    <StyledCircularProgressbar
                      value={attendanceData?.attendance_percentage || 0}
                      text={`${attendanceData?.attendance_percentage || 0}%`}
                      styles={buildStyles({
                        pathColor:
                          attendanceData?.attendance_percentage >= 75
                            ? "green"
                            : attendanceData?.attendance_percentage >= 50
                              ? "orange"
                              : "red",
                        textColor: "#333",
                        trailColor: "#d6d6d6",
                        strokeWidth: 12,
                        pathTransitionDuration: 0.5,
                      })}
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        color: attendanceData?.attendance_percentage >= 75
                          ? "green"
                          : attendanceData?.attendance_percentage >= 50
                            ? "orange"
                            : "red",
                        fontWeight: "bold",
                        marginTop: "10px"
                      }}
                    >
                      {attendanceData?.attendance_percentage >= 75
                        ? "Excellent Attendance 🎉"
                        : attendanceData?.attendance_percentage >= 50
                          ? "Moderate Attendance 📉"
                          : "Low Attendance 🚨"}
                    </Typography>
                  </Box>
                </StyledCard>
              </Grid> */}

            </Grid>
          </StyledCard>
        ) : (
          <Alert severity="info" sx={{ marginTop: 4 }}>
            No details available for this batch.
          </Alert>
        )}

        {isStudentListVisible && (
          <StyledCard
            elevation={3}
            sx={{ animation: `${fadeInAnimation} 1s ease-out`, marginTop: 4 }}
          >
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Sr. No.</TableCell>
                      <TableCell sx={{ fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Intern ID</TableCell>
                      <TableCell sx={{ fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: "bold", border: "1px solid #ccc", textAlign: "center" }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedStudents.map((student, index) => (
                      <TableRow key={student._id}>
                        <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                          {index + 1 + (page - 1) * rowsPerPage}
                        </TableCell>
                        <TableCell sx={{ border: "1px solid #ccc", textAlign: 'center' }}>{student.id}</TableCell>
                        <TableCell sx={{ border: "1px solid #ccc" }}>{student.student_name}</TableCell>
                        <TableCell sx={{ border: "1px solid #ccc" }}>{student.email_id}</TableCell>
                        <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{student.contact_no}</TableCell>
                        <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>{student.training_status}</TableCell>
                        <TableCell sx={{ border: "1px solid #ccc", textAlign: "center" }}>
                          <Button
                            onClick={() => handleOpenConfirmDialog(student.id)}
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                          >
                            Delete
                          </Button>

                          <Button
                            onClick={() => handleOpenMoveDialog(student)}
                            size="small"
                            startIcon={<SwapHorizIcon />}
                            sx={{ color: "#1976D2" }}
                          >
                            Move
                          </Button>

                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box display="flex" justifyContent="center" marginTop={2}>
                <Pagination
                  count={Math.ceil(students.length / rowsPerPage)}
                  page={page}
                  onChange={handleChangePage}
                />
              </Box>
            </CardContent>
          </StyledCard>
        )}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={snackbarMessage}
          severity={snackbarSeverity}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </StyledContainer>

      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this student? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{ fontWeight: "bold", fontSize: "1.5rem", textAlign: "center" }}
        >
          Move Student
        </DialogTitle>

        <DialogContent sx={{ padding: "24px" }}>
          {/* Student Info Display */}
          {selectedStudent && (
            <Box sx={{ marginBottom: 3, background: "#f5f5f5", padding: 2, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: "bold", mb: 1 }}>Student Details</Typography>
              <Typography>Name: {selectedStudent.student_name}</Typography>
              <Typography>Email: {selectedStudent.email_id}</Typography>
              <Typography>Current Batch: {selectedStudent.batch_name}</Typography>
            </Box>
          )}

          {/* Track Dropdown */}
          <FormControl fullWidth variant="outlined" sx={{ mb: 2, marginTop: '15px' }}>
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

          {/* Batch Dropdown */}
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Batch Name *</InputLabel>
            <Select
              label="Batch Name *"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              fullWidth
              disabled={!batches.length}
            >
              <MenuItem value="">Select Batch</MenuItem>
              {batches.map((batch, index) => (
                <MenuItem key={index} value={batch.batch_name}>
                  {batch.batch_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Reason TextField */}
          <TextField
            label="Reason for Move"
            variant="outlined"
            fullWidth
            margin="normal"
            value={moveReason}
            onChange={(e) => setMoveReason(e.target.value)}
            required
          />
        </DialogContent>

        <DialogActions
          sx={{ justifyContent: "center", padding: "16px", flexDirection: "column" }}
        >
          <Box sx={{ display: "flex", gap: "10px" }}>
            <Button
              onClick={() => setMoveDialogOpen(false)}
              variant="outlined"
              color="secondary"
              sx={{ borderRadius: "8px", padding: "8px 20px" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMoveStudent}
              variant="contained"
              color="primary"
              sx={{ borderRadius: "8px", padding: "8px 20px" }}
              disabled={selectedBatch === currentBatch}
            >
              Move
            </Button>
          </Box>

          {selectedBatch === currentBatch && (
            <Typography
              sx={{
                color: "red",
                marginTop: "8px",
                fontSize: "0.9rem",
                textAlign: "center",
              }}
            >
              Student is already in this batch.
            </Typography>
          )}
        </DialogActions>
      </Dialog>


    </>
  );
};

export default BatchDetails;
