import React, { useState, useEffect } from "react";
import Navbar from "../navbar/navbar";
import config from "../config";
import * as XLSX from 'xlsx-js-style';
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import BatchReport from "./batch_report";

import {
  Container, TextField, Button, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Autocomplete, FormControl, Divider, InputLabel, Select, MenuItem, Tabs, Tab, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Snackbar, Alert, IconButton, Tooltip
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faUserTie, faLayerGroup, faRoute, faDownload } from "@fortawesome/free-solid-svg-icons";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import HistoryIcon from "@mui/icons-material/History";
import SyncAltIcon from "@mui/icons-material/SyncAlt"; // You can change icon as preferred
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import Pagination from '@mui/material/Pagination';

const skillsetOptions = ["C", "C++", "Python", "HTML", "PHP", "JAVA", "Nodejs", "SQL", "MONGODB", "JavaScript", "TypeScript", "CSS", "Angular", "ML", "React", "Data Analysis"];
const qualificationOptions = ["BE", "ME", "BCA", "MCA", "BCS", "MCS", "B.Tech", "M.Tech", "MBA", "BSC", "MSC"];
const passoutYearOptions = ["2001", "2002", "2003", "2004", "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030"];
const statusOptions = ["Placed", "Absconding", "In Training", "Completed", "Shadowed", "pip", "On Leave", "Training Closed"];

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [batchNames, setBatchNames] = useState([]);
  const [selectedTab, setSelectedTab] = useState("students");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    skillset: [], passoutYear: [], qualification: [], status: [], batchName: ""
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [studentHistory, setStudentHistory] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [moveDialogOpen, setMoveDialogOpen] = useState(false); const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [trackName, setTrackName] = useState("");
  const [attendanceData, setAttendanceData] = useState({ attendance_percentage: 0 });
  const [moveReason, setMoveReason] = useState("");
  const [currentBatch, setCurrentBatch] = useState("");
  const [batchWarning, setBatchWarning] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [evaluationHistory, setEvaluationHistory] = useState([]);
  const [statusChangeHistory, setStatusChangeHistory] = useState([]);

  const getCookie = (name) => {
    const match = document.cookie.match(
      "(^|;)\\s*" + name + "\\s*=\\s*([^;]+)"
    );
    return match ? match.pop() : "";
  };

  const role = getCookie("role");
  const userid = getCookie("userid");

  useEffect(() => {
    fetchBatches();
    fetchData(selectedTab);
  }, [selectedTab]); // Fetch data when tab changes

  const fetchBatches = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/getBatchNames`);
      const data = await response.json();
      setBatchNames(data.map(batch => batch.batch_name));
    } catch (error) {
      console.error("Error fetching batch names:", error);
    }
  };

  const fetchData = async (category) => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/filter_reports?category=${category}`);
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error(`Error fetching ${category} reports:`, error);
    }
    setLoading(false);
  };

  const handleTabChange = (event, newTab) => {
    setSelectedTab(newTab);
    setFilters({ skillset: [], passoutYear: [], qualification: [], status: [], batchName: "" });
    setCurrentPage(1);
  };

  const handleChange = (name, value) => {
    setFilters({ ...filters, [name]: value });
  };

  useEffect(() => {
    fetchFilteredData();
  }, [filters.skillset, filters.passoutYear, filters.qualification, filters.status, filters.batchName, selectedTab]);

  const handleViewHistory = async (student) => {
    setSelectedStudent(student);
    setHistoryModalOpen(true);
    setStudentHistory([]);
    setEvaluationHistory([]);
    setStatusChangeHistory([]);

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/getStudentDetails/${student.student_id}`);
      const data = await response.json();

      if (response.ok) {
        setStudentHistory(data.history);
        setEvaluationHistory(data.evaluations);
        setStatusChangeHistory(data.statusHistory);
      } else {
        console.error("Error fetching student history:", data.error);
      }
    } catch (error) {
      console.error("Error fetching student history:", error);
    }
  };


  const handleCloseModal = () => {
    setHistoryModalOpen(false);
    setSelectedStudent(null);
    setStudentHistory([]); // Clear history when closing
  };

  const handleDownloadHistory = () => {
    if (!selectedStudent) return;

    const formattedDate = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).replace(/\//g, "-");

    const filename = `Student_History_${selectedStudent.student_id}_${selectedStudent.name}.xlsx`;

    const borderStyle = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };

    const sectionTitleStyle = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      fill: { fgColor: { rgb: "D9E1F2" } },
      border: borderStyle,
    };

    const headerStyle = {
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      fill: { fgColor: { rgb: "BDD7EE" } },
      border: borderStyle,
    };

    const cellStyle = {
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border: borderStyle,
    };

    const studentInfo = [
      [{ v: "Student History Report", s: sectionTitleStyle }],
      [""],
      [{ v: "Generated On", s: headerStyle }, { v: formattedDate, s: cellStyle }],
      [""],
      [{ v: "Student ID", s: headerStyle }, { v: selectedStudent.student_id, s: cellStyle }],
      [{ v: "Name", s: headerStyle }, { v: selectedStudent.name, s: cellStyle }],
      [{ v: "Email", s: headerStyle }, { v: selectedStudent.email_id || "N/A", s: cellStyle }],
      [{ v: "Contact", s: headerStyle }, { v: selectedStudent.contact_no || "N/A", s: cellStyle }],
      [{ v: "Current Batch", s: headerStyle }, { v: selectedStudent.batch_name || "N/A", s: cellStyle }],
      [{ v: "Passout Year", s: headerStyle }, { v: selectedStudent.passout_year || "N/A", s: cellStyle }],
      [{ v: "Skillset", s: headerStyle }, { v: selectedStudent.skillset || "N/A", s: cellStyle }],
      [{ v: "Certifications", s: headerStyle }, { v: selectedStudent.certification || "N/A", s: cellStyle }],
      [{ v: "Experience", s: headerStyle }, { v: selectedStudent.experience || "N/A", s: cellStyle }],
      [{ v: "Status", s: headerStyle }, { v: selectedStudent.status || "N/A", s: cellStyle }],
      [""],
    ];

    const section = (title) => [[{ v: title, s: sectionTitleStyle }], [""]];

    const formatTable = (headers, data) => [
      headers.map(h => ({ v: h, s: headerStyle })),
      ...data.map(row => row.map(cell => ({ v: cell || "N/A", s: cellStyle }))),
      [""]
    ];

    const batchData = studentHistory.length > 0 ? studentHistory.map(r => [
      r.new_batch, r.old_batch, new Date(r.moved_at).toLocaleString(),
      r.move_reason, r.created_by_role, r.created_by_userid
    ]) : [["No data"]];

    const evaluationData = evaluationHistory.length > 0 ? evaluationHistory.map(ev => [
      ev.batch_name, ev.attempt, ev.attempt_name, ev.technical, ev.mcq, ev.oral, ev.total, ev.remark
    ]) : [["No data"]];

    const statusData = statusChangeHistory.length > 0 ? statusChangeHistory.map(st => [
      st.old_status, st.new_status, st.reason,
      new Date(st.changed_at).toLocaleString(), st.created_by_role, st.created_by_userid
    ]) : [["No data"]];

    const finalSheetData = [
      ...studentInfo,
      ...section("Batch Movement History"),
      ...formatTable(
        ["New Batch", "Old Batch", "Moved At", "Reason", "Created By Role", "User ID"],
        batchData
      ),
      ...section("Evaluation History"),
      ...formatTable(
        ["Batch Name", "Attempt", "Attempt Name", "Technical", "MCQ", "Oral", "Total", "Remark"],
        evaluationData
      ),
      ...section("Status Change History"),
      ...formatTable(
        ["Old Status", "New Status", "Reason", "Changed At", "By Role", "User ID"],
        statusData
      )
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(finalSheetData);

    // Auto-adjust column width based on longest content
    const colWidths = finalSheetData.reduce((acc, row) => {
      row.forEach((cell, idx) => {
        const len = cell?.v?.toString().length || 10;
        acc[idx] = Math.max(acc[idx] || 10, len + 5); // extra padding
      });
      return acc;
    }, []);

    worksheet["!cols"] = colWidths.map(width => ({ wch: width }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student History");

    XLSX.writeFile(workbook, filename);
  };

  const fetchFilteredData = async () => {
    const queryParams = new URLSearchParams();
    queryParams.append("category", selectedTab);

    if (filters.skillset.length) queryParams.append("skillset", filters.skillset.join(","));
    if (filters.passoutYear.length) queryParams.append("passoutYear", filters.passoutYear.join(","));
    if (filters.qualification.length) queryParams.append("qualification", filters.qualification.join(","));
    if (filters.status.length) queryParams.append("status", filters.status.join(","));
    if (filters.batchName) queryParams.append("batchName", filters.batchName);

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/filter_reports?${queryParams.toString()}`);
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error("Error fetching filtered reports:", error);
    }
  };

  const filteredReports = Array.isArray(reports)
    ? reports.filter(student =>
      student.name && student.name.toLowerCase().includes(searchName.toLowerCase())
    )
    : [];

  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);


  //Move student dialog box
  const handleTrackChange = (event) => {
    const track = event.target.value;
    setSelectedTrack(track);
    setSelectedBatch(""); // Reset batch selection when track changes
    fetchBatchesByTrack(track);
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

  const handleMoveStudent = async () => {
    if (!selectedTrack || !selectedBatch) {
      setSnackbarMessage("Please select both track and batch");
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

    // ✅ Check email credentials before proceeding
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
    } catch (error) {
      setSnackbarMessage("Error moving student: " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };


  const handleOpenMoveDialog = async (student) => {

    if (!student || !student.student_id) {
      console.error("Error: Student data is missing", student);
      return;
    }

    setSelectedStudentId(student.student_id);
    setCurrentBatch(student.batch_name);
    setSelectedStudent(student);
    setMoveDialogOpen(true);

    try {
      const response = await fetch(`${config.API_BASE_URL}/getTracks`);
      const data = await response.json();
      setTracks(data);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    }
  };

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



  const handleOpenDialog = () => {
    setMoveDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setMoveDialogOpen(false);
  };

  const handleChangeStatus = (student) => {
    setSelectedStudent(student);
    setStatusModalOpen(true);
  };

  const updateStudentStatus = async (student_id, new_status, reason, onSuccess, onError) => {
    const isMailValid = await checkEmailCredentials();
    if (!isMailValid) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/changeStudentStatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id,
          new_status,
          reason,
          role: role || "",
          userid: userid,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Backend error:", result);
        if (onError) onError(result.error || "Failed to update status");
        return;
      }

      if (onSuccess) onSuccess(result.message || "Status updated");
    } catch (error) {
      console.error("Request error:", error);
      if (onError) onError("Something went wrong. Please try again.");
    }
  };

  const clearFilters = () => {
    setFilters({
      skillset: [],
      passoutYear: [],
      qualification: [],
      status: [],
      batchName: ""
    });
    setSearchName(""); // Reset search name
  };

  const showClearButton =
    filters.skillset.length > 0 ||
    filters.passoutYear.length > 0 ||
    filters.batchName !== "" ||
    searchName.trim() !== "";

  // 📤 Excel download function
  const exportToExcel = (data, fileName) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  // 🧾 Shared Table Header Generator
  const TableHeaders = ({ tab }) => {
    const headers = {
      students: ["SR NO", "Intern ID", "Intern Name", "Email", "Batch Name", "Status", "Actions"],
      instructors: ["SR NO", "Trainer ID", "Trainer Name", "Technology", "Email", "Contact"],
      tracks: ["SR NO", "Track Name", "Recognition Code", "Start Date"],
      batches: []
    };

    return (
      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
        {headers[tab].map((header, idx) => (
          <TableCell
            key={idx}
            sx={{
              fontWeight: "bold",
              textAlign: "center",
              border: "1px solid #ccc",
              py: 1,
              px: 2
            }}
          >
            {header}
          </TableCell>
        ))}
      </TableRow>
    );
  };


  // 🧍 Student Row
  const StudentRow = ({ student, index, indexOfFirstItem, onView, onMove, onStatus }) => (
    <TableRow hover>
      <TableCell align="center" sx={cellStyle}>{indexOfFirstItem + index + 1}</TableCell>
      <TableCell align="center" sx={cellStyle}>{student.student_id}</TableCell>
      <TableCell sx={cellStyle}>{student.name}</TableCell>
      <TableCell sx={cellStyle}>{student.email_id}</TableCell>
      <TableCell sx={cellStyle}>{student.batch_name || "-"}</TableCell>
      <TableCell align="center" sx={cellStyle}>{student.status}</TableCell>
      <TableCell align="center" sx={cellStyle}>
        <Tooltip title="View History"><IconButton color="info" onClick={() => onView(student)}><HistoryIcon /></IconButton></Tooltip>
        <Tooltip title="Move Student"><IconButton onClick={() => onMove(student)} sx={{ color: "#1976D2" }}><SwapHorizIcon /></IconButton></Tooltip>
        <Tooltip title="Change Status"><IconButton color="secondary" onClick={() => onStatus(student)}><PublishedWithChangesIcon /></IconButton></Tooltip>
      </TableCell>
    </TableRow>
  );


  // 👨‍🏫 Instructor Row
  const InstructorRow = ({ instructor, index, indexOfFirstItem }) => (
    <TableRow hover>
      <TableCell align="center" sx={cellStyle}>{indexOfFirstItem + index + 1}</TableCell>
      <TableCell align="center" sx={cellStyle}>{instructor.id}</TableCell>
      <TableCell sx={cellStyle}>{instructor.name}</TableCell>
      <TableCell align="center" sx={cellStyle}>{instructor.technology}</TableCell>
      <TableCell sx={cellStyle}>{instructor.email}</TableCell>
      <TableCell align="center" sx={cellStyle}>{instructor.contact}</TableCell>
    </TableRow>
  );


  // 🛤️ Track Row
  const TrackRow = ({ track, index, indexOfFirstItem }) => (
    <TableRow hover>
      <TableCell align="center" sx={cellStyle}>{indexOfFirstItem + index + 1}</TableCell>
      <TableCell sx={cellStyle}>{track.name}</TableCell>
      <TableCell align="center" sx={cellStyle}>{track.recognition_code}</TableCell>
      <TableCell align="center" sx={cellStyle}>{new Date(track.start_date).toLocaleDateString()}</TableCell>
    </TableRow>
  );

  const cellStyle = {
    border: "1px solid #ccc",
    py: 1,
    px: 2,
  };


  return (
    <>
      <Navbar showLogoutButton={true} /><br /><br /><br />
      <Container>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }} gutterBottom>
          Reports
        </Typography>

        <Tabs value={selectedTab} onChange={handleTabChange} centered>
          <Tab sx={{ fontWeight: "bold" }} icon={<FontAwesomeIcon icon={faUsers} />} label="INTERNS" value="students" />
          <Tab sx={{ fontWeight: "bold" }} icon={<FontAwesomeIcon icon={faUserTie} />} label="INSTRUCTORS" value="instructors" />
          {/* <Tab sx={{fontWeight: "bold"}} icon={<FontAwesomeIcon icon={faLayerGroup} />} label="Batches" value="batches" /> */}
          <Tab sx={{ fontWeight: "bold" }} icon={<FontAwesomeIcon icon={faRoute} />} label="TRACKS" value="tracks" />
        </Tabs>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>


        <Box component="div">
          <Grid container spacing={1} mt={1} alignItems="center" sx={{ flexWrap: "nowrap" }}>
            {selectedTab === "students" && (
              <>
                <Grid item sx={{ width: showClearButton ? "20%" : "25%" }}>
                  <TextField
                    label="Search Name"
                    variant="outlined"
                    fullWidth
                    size="small"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                </Grid>

                <Grid item sx={{ width: showClearButton ? "20%" : "25%" }}>
                  <Autocomplete
                    multiple
                    options={skillsetOptions}
                    value={filters.skillset}
                    size="small"
                    onChange={(e, v) => handleChange("skillset", v)}
                    renderInput={(params) => <TextField {...params} label="Skillset" fullWidth size="small" />}
                  />
                </Grid>

                <Grid item sx={{ width: showClearButton ? "20%" : "25%" }}>
                  <Autocomplete
                    multiple
                    options={passoutYearOptions}
                    value={filters.passoutYear}
                    size="small"
                    onChange={(e, v) => handleChange("passoutYear", v)}
                    renderInput={(params) => <TextField {...params} label="Passout Year" fullWidth size="small" />}
                  />
                </Grid>

                <Grid item sx={{ width: showClearButton ? "20%" : "25%" }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Batch Name</InputLabel>
                    <Select
                      label="Batch Name"
                      value={filters.batchName}
                      onChange={(e) => handleChange("batchName", e.target.value)}
                    >
                      <MenuItem value="">All Batches</MenuItem>
                      {batchNames.map((batch, index) => (
                        <MenuItem key={index} value={batch}>{batch}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {showClearButton && (
                  <Grid item sx={{ width: "20%" }}>
                    <Button variant="contained" color="secondary" fullWidth onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </Box>

      </Container>

      <Container>
        {selectedTab === "batches" && (
          <BatchReport />
        )}
        {loading ? (
          <CircularProgress sx={{ display: "block", margin: "auto", mt: 1 }} />
        ) : (
          <>
            <Box display="flex" justifyContent="flex-end" sx={{ m: 2 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<FontAwesomeIcon icon={faDownload} />}
                onClick={() =>
                  exportToExcel(
                    filteredReports,
                    `${selectedTab === "instructors"
                      ? "Trainers"
                      : selectedTab === "students"
                        ? "Interns"
                        : selectedTab
                    }_report`
                  )
                }
              >
                Download{" "}
                {selectedTab === "instructors"
                  ? "Trainers"
                  : selectedTab === "students"
                    ? "Interns"
                    : selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}{" "}
                Report
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead><TableHeaders tab={selectedTab} /></TableHead>
                <TableBody>
                  {currentItems.length > 0 ? (
                    currentItems.map((item, index) => {
                      if (selectedTab === "students") {
                        return <StudentRow
                          key={item.student_id}
                          student={item}
                          index={index}
                          indexOfFirstItem={indexOfFirstItem}
                          onView={handleViewHistory}
                          onMove={handleOpenMoveDialog}
                          onStatus={handleChangeStatus}
                        />;
                      } else if (selectedTab === "instructors") {
                        return <InstructorRow key={item.id} instructor={item} index={index} indexOfFirstItem={indexOfFirstItem} />;
                      } else if (selectedTab === "tracks") {
                        return <TrackRow key={item.id} track={item} index={index} indexOfFirstItem={indexOfFirstItem} />;
                      }
                      return null;
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: "center" }}>
                        No results found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Pagination
              count={Math.ceil(filteredReports.length / itemsPerPage)}
              page={currentPage}
              onChange={(event, value) => setCurrentPage(value)}
              color="primary"
              sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
            />

          </>
        )}
      </Container>

      {/* History Modal */}
      <Dialog open={isHistoryModalOpen} onClose={handleCloseModal} fullWidth maxWidth="md" scroll="paper">
        <DialogTitle
          sx={{
            backgroundColor: "#005D73", // A more modern color
            color: "white",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "1.5rem", // Increased font size for better readability
            py: 3,
            borderBottom: "2px solid #1976d2", // Subtle border for a sleek touch
          }}
        >
          Student History
        </DialogTitle>

        <DialogContent dividers sx={{ px: 4, py: 3, backgroundColor: "#f4f7fc" }}>
          {selectedStudent ? (
            <>
              {/* Student Details */}
              <Box mb={3}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {selectedStudent.name}
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1"><strong>Student ID:</strong> {selectedStudent.student_id}</Typography>
                    <Typography variant="body1"><strong>Batch Name:</strong> {selectedStudent.batch_name || "N/A"}</Typography>
                    <Typography variant="body1"><strong>Passout Year:</strong> {selectedStudent.passout_year || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1"><strong>Email:</strong> {selectedStudent.email_id || "N/A"}</Typography>
                    <Typography variant="body1"><strong>Contact:</strong> {selectedStudent.contact_no || "N/A"}</Typography>
                    <Typography variant="body1"><strong>Status:</strong> {selectedStudent.status || "N/A"}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Batch History */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#333" }}>Batch Movement History</Typography>
              {studentHistory.length > 0 ? (
                <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 250 }}>
                  <Table stickyHeader size="small">
                    <TableHead sx={{ backgroundColor: "#e8f1f9" }}>
                      <TableRow>
                        {["New Batch", "Old Batch", "Moved At", "Move Reason", "Created By Role", "User ID"].map((header) => (
                          <TableCell key={header} sx={{ fontWeight: "bold", color: "#005D73" }}>{header}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studentHistory.map((record, index) => (
                        <TableRow key={index} hover sx={{ '&:hover': { backgroundColor: "#f1f9fc" } }}>
                          <TableCell>{record.new_batch}</TableCell>
                          <TableCell>{record.old_batch}</TableCell>
                          <TableCell>{new Date(record.moved_at).toLocaleString()}</TableCell>
                          <TableCell>{record.move_reason}</TableCell>
                          <TableCell>{record.created_by_role}</TableCell>
                          <TableCell>{record.created_by_userid}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography mt={2} textAlign="center" color="gray">No history found.</Typography>
              )}

              {/* Evaluation History */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#333" }}>Evaluation History</Typography>
              {evaluationHistory.length > 0 ? (
                <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 250 }}>
                  <Table stickyHeader size="small">
                    <TableHead sx={{ backgroundColor: "#e8f1f9" }}>
                      <TableRow>
                        {["Batch Name", "Attempt", "Attempt Name", "Technical", "MCQ", "Oral", "Total", "Remark"].map((header) => (
                          <TableCell key={header} sx={{ fontWeight: "bold", color: "#005D73" }}>{header}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {evaluationHistory.map((ev, i) => (
                        <TableRow key={i} hover sx={{ '&:hover': { backgroundColor: "#f1f9fc" } }}>
                          <TableCell>{ev.batch_name}</TableCell>
                          <TableCell>{ev.attempt}</TableCell>
                          <TableCell>{ev.attempt_name}</TableCell>
                          <TableCell>{ev.technical}</TableCell>
                          <TableCell>{ev.mcq}</TableCell>
                          <TableCell>{ev.oral}</TableCell>
                          <TableCell>{ev.total}</TableCell>
                          <TableCell>{ev.remark || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography mt={2} textAlign="center" color="gray">No evaluation history found.</Typography>
              )}

              {/* Status Change History */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#333" }}>Status Change History</Typography>
              {statusChangeHistory.length > 0 ? (
                <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 250 }}>
                  <Table stickyHeader size="small">
                    <TableHead sx={{ backgroundColor: "#e8f1f9" }}>
                      <TableRow>
                        {["Old Status", "New Status", "Reason", "Changed At", "By Role", "User ID"].map((header) => (
                          <TableCell key={header} sx={{ fontWeight: "bold", color: "#005D73" }}>{header}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statusChangeHistory.map((status, i) => (
                        <TableRow key={i} hover sx={{ '&:hover': { backgroundColor: "#f1f9fc" } }}>
                          <TableCell>{status.old_status}</TableCell>
                          <TableCell>{status.new_status}</TableCell>
                          <TableCell>{status.reason || "N/A"}</TableCell>
                          <TableCell>{new Date(status.changed_at).toLocaleString()}</TableCell>
                          <TableCell>{status.created_by_role}</TableCell>
                          <TableCell>{status.created_by_userid}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography mt={2} textAlign="center" color="gray">No status changes found.</Typography>
              )}
            </>
          ) : (
            <Typography>Loading...</Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: "space-between", px: 4, py: 3, backgroundColor: "#f4f7fc" }}>
          <Button
            onClick={handleDownloadHistory}
            variant="contained"
            color="success"
            startIcon={<FontAwesomeIcon icon={faDownload} />}
            sx={{ borderRadius: 20, fontWeight: "bold" }}
          >
            Download History
          </Button>
          <Button
            onClick={handleCloseModal}
            variant="contained"
            color="error"
            sx={{ borderRadius: 20, fontWeight: "bold" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* move student */}
      <Dialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold", fontSize: "1.5rem", textAlign: "center" }}>
          Move Student
        </DialogTitle>

        <DialogContent sx={{ padding: "24px" }}>
          {/* Student Info Display */}
          {selectedStudent && (
            <Box sx={{ marginBottom: 3, background: "#f5f5f5", padding: 2, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: "bold", mb: 1 }}>Student Details</Typography>
              <Typography>Name: {selectedStudent.name}</Typography>
              <Typography>Email: {selectedStudent.email_id}</Typography>
              <Typography>Current Batch: {selectedStudent.batch_name}</Typography>
            </Box>
          )}

          {/* Track Name Dropdown */}
          <FormControl fullWidth variant="outlined" sx={{ mb: 2, marginTop: '15px' }}>
            <InputLabel>Track Name *</InputLabel>
            <Select label="Track Name *" value={selectedTrack} onChange={handleTrackChange} fullWidth>
              <MenuItem value="">Select Track</MenuItem>
              {tracks.map(track => (
                <MenuItem key={track.id} value={track.track_name}>{track.track_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Batch Name Dropdown */}
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
                <MenuItem key={index} value={batch.batch_name}>{batch.batch_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Reason for Moving */}
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


        <DialogActions sx={{ justifyContent: "center", padding: "16px", flexDirection: "column" }}>
          <Box sx={{ display: "flex", gap: "10px" }}>
            <Button
              onClick={handleCloseDialog}
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

          {/* Warning Message */}
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

      {/* Change Status */}
      <Dialog open={isStatusModalOpen} onClose={() => setStatusModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Change Student Status</DialogTitle>
        <DialogContent>
          <Typography>Change status for <strong>{selectedStudent?.name}</strong>:</Typography>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} label="Status">
              {statusOptions.map((status, index) => (
                <MenuItem key={index} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for status change"
            value={statusChangeReason}
            onChange={(e) => setStatusChangeReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              const studentId = selectedStudent?.student_id || selectedStudent?.id;

              updateStudentStatus(
                studentId,
                newStatus,
                statusChangeReason,
                () => {
                  setSnackbarMessage(`${selectedStudent.name}'s status updated to ${newStatus}`);

                  setSnackbarSeverity("success");
                  setSnackbarOpen(true);
                  setStatusModalOpen(false);
                  setStatusChangeReason('');

                  setTimeout(() => {
                    window.location.reload();
                  }, 2000); // 2000 milliseconds = 2 seconds
                },
                (errorMsg) => {
                  setSnackbarMessage(errorMsg);
                  setSnackbarSeverity("error");
                  setSnackbarOpen(true);
                }
              );
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReportsPage;
