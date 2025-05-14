import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Paper,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Snackbar,
  Alert,
} from "@mui/material";
import config from "../config";
import Navbar from "../navbar/navbar";
import ListAltIcon from "@mui/icons-material/ListAlt";        // for View Batches
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd"; // for Add Batch
import Divider from "@mui/material/Divider";
import * as XLSX from 'xlsx';
import Autocomplete from "@mui/material/Autocomplete";

const Grades = () => {
  const [activeTab, setActiveTab] = useState(0);

  const [batchName, setBatchName] = useState("");
  const [trackName, setTrackName] = useState("");
  const [numOfWeeks, setNumOfWeeks] = useState("");
  const [batchStartDate, setBatchStartDate] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [batchType, setBatchType] = useState("");

  const [tracks, setTracks] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [errors, setErrors] = useState({});
  const [filterBatch, setFilterBatch] = useState("");
  const [filterTrack, setFilterTrack] = useState("");
  const [filterInstructor, setFilterInstructor] = useState("");

  useEffect(() => {
    fetchTracks();
    fetchInstructors();
    fetchBatches();
  }, []);

  const fetchTracks = async () => {
    const res = await fetch(`${config.API_BASE_URL}/api/tracks`);
    const data = await res.json();
    setTracks(data);
  };

  const fetchInstructors = async () => {
    const res = await fetch(`${config.API_BASE_URL}/api/instructors`);
    const data = await res.json();
    setInstructors(data);
  };

  const fetchBatches = async () => {
    const res = await fetch(`${config.API_BASE_URL}/api/getgrades`);
    const data = await res.json();
    setBatches(data);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" }));
    switch (name) {
      case "batchName": setBatchName(value); break;
      case "trackName":
        setTrackName(value);
        setErrors((prev) => ({ ...prev, trackName: "" }));

        // 🎯 Fetch recognition-based batch name
        fetch(`${config.API_BASE_URL}/api/generate-batch-name/${value}`)
          .then((res) => res.json())
          .then((data) => {
            setBatchName(data.batchName); // Update generated batch name
          })
          .catch((err) => console.error("Error generating batch name:", err));
        break;
      case "numOfWeeks": setNumOfWeeks(value); break;
      case "batchStartDate": setBatchStartDate(value); break;
      case "instructorName": setInstructorName(value); break;
      case "batchType": setBatchType(value); break;
      default: break;
    }
  };

  const validateFields = () => {
    const errors = {};
    if (!batchName.trim()) errors.batchName = "Batch Name is required";
    if (!trackName) errors.trackName = "Track is required";
    if (!numOfWeeks || isNaN(numOfWeeks) || parseInt(numOfWeeks) <= 0) errors.numOfWeeks = "Valid weeks required";
    if (!batchStartDate) errors.batchStartDate = "Start date required";
    if (!instructorName) errors.instructorName = "Instructor is required";
    if (!batchType) errors.batchType = "Batch type is required";
    return errors;
  };

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : "";
  };

  const role = getCookie('role');
  const userid = getCookie("userid");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateFields();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const method = editingBatchId ? "PUT" : "POST";
    const url = editingBatchId
      ? `${config.API_BASE_URL}/api/grades/${editingBatchId}`
      : `${config.API_BASE_URL}/api/grades`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchName,
          numOfWeeks,
          batchStartDate,
          instructorName,
          batchType,
          trackName,
          userid,
          role,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSnackbar({
          open: true,
          message: data.message || "Batch saved successfully!",
          severity: "success",
        });

        fetchBatches();
        resetForm();
        setActiveTab(1);
      } else {
        setSnackbar({
          open: true,
          message: data.message || "Failed to save batch.",
          severity: "error",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Server error. Please try again later.",
        severity: "error",
      });
    }
  };


  const handleEdit = (batch) => {
    setBatchName(batch.batch_name);
    setTrackName(batch.track_name);
    setNumOfWeeks(batch.numofweeks);
    setBatchStartDate(batch.batch_start_date?.split("T")[0]);
    setInstructorName(batch.instructor_name);
    setBatchType(batch.batch_type);
    setEditingBatchId(batch.id);
    setActiveTab(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setBatchName("");
    setTrackName("");
    setNumOfWeeks("");
    setBatchStartDate("");
    setInstructorName("");
    setBatchType("");
    setEditingBatchId(null);
  };


  const exportBatchesToExcel = () => {
    // Filter and map the batches
    const filteredData = batches
      .filter(
        (batch) =>
          batch.batch_name.toLowerCase().includes(filterBatch.toLowerCase()) &&
          (!filterTrack || batch.track_name === filterTrack) &&
          (!filterInstructor || batch.instructor_name === filterInstructor)
      )
      .map((batch) => ({
        "Batch Name": batch.batch_name || "Not Available",
        "Track": batch.track_name || "Not Available",
        "Instructor": batch.instructor_name || "Not Assigned",
        "Weeks": batch.numofweeks || "0",
        "Type": batch.batch_type || "Unknown",
        "Start Date": batch.batch_start_date
          ? new Date(batch.batch_start_date).toLocaleDateString("en-GB")
          : "Not Available",
      }));

    // Create a new worksheet from the filtered data
    const ws = XLSX.utils.json_to_sheet(filteredData);

    // Styling the header row
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Arial', sz: 12 },
      fill: { fgColor: { rgb: '4CAF50' } }, // Green background for header
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      },
    };

    // Apply header style to the first row (headers)
    const headerCols = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'];
    headerCols.forEach((col) => {
      if (ws[col]) {
        ws[col].s = headerStyle;
      }
    });

    // Apply alternating row colors for readability
    const rows = ws['!rows'] = ws['!rows'] || [];
    filteredData.forEach((_, index) => {
      rows[index] = { hpt: 20, hpx: 20 }; // Set row height for all rows
      const rowIndex = index + 2; // Start from row 2 (as row 1 is header)
      const row = `A${rowIndex}:F${rowIndex}`;

      // Apply alternating row color (light gray for even rows)
      if (index % 2 === 0) {
        for (let col = 0; col < 6; col++) {
          const cell = `${String.fromCharCode(65 + col)}${rowIndex}`;
          if (ws[cell]) {
            ws[cell].s = {
              fill: { fgColor: { rgb: 'F2F2F2' } }, // Light gray background for even rows
              border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } },
              },
            };
          }
        }
      }
    });

    // Set the column widths dynamically based on the content
    const wscols = [
      { wpx: 180 }, // Batch Name
      { wpx: 120 }, // Track
      { wpx: 150 }, // Instructor
      { wpx: 70 },  // Weeks
      { wpx: 100 }, // Type
      { wpx: 130 }, // Start Date
    ];
    ws['!cols'] = wscols;

    // Create a workbook with the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Batches");

    // Create a dynamic file name with current date
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const fileName = `batches_data_${formattedDate}.xlsx`;

    // Write the workbook to a Blob and trigger download
    XLSX.writeFile(wb, fileName);
  };

  return (
    <Box>
      <Navbar showLogoutButton={true} />
      <Container maxWidth="lg" sx={{ mt: 10 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          centered
          sx={{ minHeight: "40px", mb: 1 }}
        >
          <Tab
            icon={<PlaylistAddIcon />}
            iconPosition="start"
            label="ADD BATCH"
            value={0}
            sx={{
              minWidth: "auto",
              padding: "6px 12px",
              fontSize: "14px",
              fontWeight: "bold",
              textTransform: "none",
            }}
          />
          <Divider
            orientation="vertical"
            flexItem
            sx={{ height: "30px", mx: 1, borderColor: "primary.main", borderWidth: 2, alignSelf: "center" }}
          />
          <Tab
            icon={<ListAltIcon/>}
            iconPosition="start"
            label="VIEW BATCHES"
            value={1}
            sx={{
              minWidth: "auto",
              padding: "6px 12px",
              fontSize: "14px",
              fontWeight: "bold",
              textTransform: "none",
            }}
          />
        </Tabs>
        <Paper elevation={4} sx={{ borderRadius: 2 }}>
          {activeTab === 0 && (
            <Box p={3}>
              <Typography variant="h6" mb={3} fontWeight={"bold"}>
                {editingBatchId ? "Edit Batch" : "Register New Batch"}
              </Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      fullWidth
                      options={tracks.map((track) => track.track_name)}
                      value={trackName}
                      onChange={(e, newValue) => {
                        setTrackName(newValue || "");
                        setErrors((prev) => ({ ...prev, trackName: "" }));

                        // 🧠 Generate batch name when a track is selected
                        if (newValue) {
                          fetch(`${config.API_BASE_URL}/api/generate-batch-name/${newValue}`)
                            .then((res) => res.json())
                            .then((data) => {
                              setBatchName(data.batchName);
                            })
                            .catch((err) => console.error("Error generating batch name:", err));
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Track"
                          error={!!errors.trackName}
                          helperText={errors.trackName}
                        />
                      )}
                      disabled={!!editingBatchId}
                    />

                    {editingBatchId && (
                      <Typography variant="caption" color="textSecondary" mt={0.5}>
                        Track cannot be edited while updating a batch.
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Batch Name"
                      value={batchName}
                      name="batchName"
                      disabled={!!editingBatchId}
                      InputProps={{ readOnly: true }} // Already readOnly as per your code
                      helperText="Auto-generated based on track"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!errors.batchType}>
                      <InputLabel>Batch Type *</InputLabel>
                      <Select name="batchType" value={batchType} onChange={handleInputChange} label="Batch Type *">
                        <MenuItem value="Weekdays">Weekdays</MenuItem>
                        <MenuItem value="Weekend">Weekend</MenuItem>
                        <MenuItem value="Online">Online</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      fullWidth
                      options={instructors.map((i) => i.instructor_name)}
                      value={instructorName}
                      onChange={(e, newValue) => {
                        setInstructorName(newValue || "");
                        setErrors((prev) => ({ ...prev, instructorName: "" }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Instructor *"
                          error={!!errors.instructorName}
                          helperText={errors.instructorName}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="numOfWeeks"
                      label="Number of Weeks *"
                      type="number"
                      value={numOfWeeks}
                      onChange={handleInputChange}
                      error={!!errors.numOfWeeks}
                      helperText={errors.numOfWeeks}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="batchStartDate"
                      label="Start Date *"
                      type="date"
                      value={batchStartDate}
                      onChange={handleInputChange}
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.batchStartDate}
                      helperText={errors.batchStartDate}
                    />
                  </Grid>
                </Grid>

                <Box textAlign="center" mt={3}>
                  <Button type="submit" variant="contained" color="primary">
                    {editingBatchId ? "Update Batch" : "Submit"}
                  </Button>
                </Box>
              </form>
            </Box>
          )}

          {activeTab === 1 && (
            <Box p={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Registered Batches
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  onClick={exportBatchesToExcel}
                >
                  Download Excel
                </Button>
              </Box>

              {/* 🔍 Filter Row */}
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  backgroundColor: "#f9f9f9",
                  border: "1px solid #ddd",
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Search by Batch"
                    variant="outlined"
                    size="medium"
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    sx={{ flex: "1 1 200px" }}
                  />
                  <TextField
                    label="Search by Track"
                    variant="outlined"
                    size="medium"
                    value={filterTrack}
                    onChange={(e) => setFilterTrack(e.target.value)}
                    sx={{ flex: "1 1 200px" }}
                  />
                  <TextField
                    label="Search by Instructor"
                    variant="outlined"
                    size="medium"
                    value={filterInstructor}
                    onChange={(e) => setFilterInstructor(e.target.value)}
                    sx={{ flex: "1 1 200px" }}
                  />

                  {(filterBatch || filterTrack || filterInstructor) && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="medium"
                      onClick={() => {
                        setFilterBatch("");
                        setFilterTrack("");
                        setFilterInstructor("");
                      }}
                      sx={{
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                        height: "56px", // ✅ Matches the TextField height
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </Box>
              </Box>

              {/* 📋 Table */}
              <TableContainer
                component={Paper}
                sx={{
                  maxHeight: 300,
                  overflow: "auto",
                  borderRadius: 2,
                }}
              >
                <Table stickyHeader size="medium">
                  <TableHead>
                    <TableRow>
                      {["Batch", "Track", "Instructor", "Weeks", "Start Date", "Type", "Actions"].map((col, i) => (
                        <TableCell
                          key={i}
                          align="center"
                          sx={{
                            fontWeight: "bold",
                            backgroundColor: "#34495e",
                            color: "white",
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                            border: '1px solid rgba(224, 224, 224, 1)'
                          }}
                        >
                          {col}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {batches
                      .filter((batch) =>
                        (batch.batch_name?.toLowerCase().includes(filterBatch.toLowerCase()) || batch.batch_name === null) &&
                        (batch.track_name?.toLowerCase().includes(filterTrack.toLowerCase()) || batch.track_name === null) &&
                        (batch.instructor_name?.toLowerCase().includes(filterInstructor.toLowerCase()) || batch.instructor_name === null)
                      )
                      .map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', width:100 }}>{batch.batch_name}</TableCell>
                          <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{batch.track_name}</TableCell>
                          <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', width:220 }}>{batch.instructor_name}</TableCell>
                          <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{batch.numofweeks}</TableCell>
                          <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)', width:120 }}>{batch.batch_start_date?.split("T")[0]}</TableCell>
                          <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{batch.batch_type}</TableCell>
                          <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleEdit(batch)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {batches.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: "#999" }}>
                          No batches found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Grades;
