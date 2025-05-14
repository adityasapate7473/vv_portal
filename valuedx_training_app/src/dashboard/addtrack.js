import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import ListAltIcon from "@mui/icons-material/ListAlt";
import Navbar from "../navbar/navbar";
import config from "../config";
import Papa from "papaparse"; // Import PapaParse
import * as XLSX from 'xlsx';


const AddTrack = () => {
  const [trackName, setTrackName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [tracks, setTracks] = useState([]);
  const [editingTrackId, setEditingTrackId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [activeTab, setActiveTab] = useState(0);
  const [filterTrackName, setFilterTrackName] = useState("");
  const [recognitionCode, setRecognitionCode] = useState("");


  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/tracklist`);
      const data = await response.json();
      setTracks(data);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    }
  };

  const getCookie = (name) => {
    const match = document.cookie.match(
      "(^|;)\\s*" + name + "\\s*=\\s*([^;]+)"
    );
    return match ? match.pop() : "";
  };

  const role = getCookie("role");
  const userid = getCookie("userid");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trackName || !startDate || !recognitionCode) {
      setSnackbar({ open: true, message: "Please fill all required fields", severity: "error" });
      return;
    }

    const trackData = {
      trackName,
      startDate,
      recognitionCode,
      createdByUserId: userid,
      createdByRole: role,
      updatedByUserId: userid,
      updatedByRole: role
    };

    const url = editingTrackId
      ? `${config.API_BASE_URL}/api/tracks/${editingTrackId}`
      : `${config.API_BASE_URL}/api/tracks`;

    const method = editingTrackId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackData),
      });

      if (response.ok) {
        fetchTracks();
        setTrackName("");
        setStartDate("");
        setEditingTrackId(null);
        setSnackbar({
          open: true,
          message: editingTrackId ? "Track updated successfully!" : "Track added successfully!",
          severity: "success",
        });
        setActiveTab(1);
      } else {
        setSnackbar({ open: true, message: "Error submitting track", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: "Error submitting form", severity: "error" });
    }
  };


  const handleEdit = (track) => {
    setTrackName(track.trackName);
    setStartDate(track.startDate);
    setRecognitionCode(track.recognitionCode)
    setEditingTrackId(track.id);
    setActiveTab(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this track?")) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/tracks/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTracks();
        setSnackbar({ open: true, message: "Track deleted successfully!", severity: "success" });
      } else {
        setSnackbar({ open: true, message: "Failed to delete track", severity: "error" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: "Error deleting track", severity: "error" });
    }
  };

  const filteredTracks = tracks.filter((track) =>
    track.trackName.toLowerCase().includes(filterTrackName.toLowerCase())
  );

  const exportTracksToExcel = () => {
    // Filter and map the tracks
    const filteredData = tracks
      .filter((track) =>
        track.trackName.toLowerCase().includes(filterTrackName.toLowerCase()) // Apply filter if needed
      )
      .map((track) => ({
        "Track Name": track.trackName || "Not Available", // Handle missing track name
        "Start Date": track.startDate ? new Date(track.startDate).toLocaleDateString("en-GB") : "Not Available", // Format date
        "Recognition Code": track.recognitionCode || "Not Available", // Handle missing recognition code
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
    const headerCols = ['A1', 'B1', 'C1'];
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
      const row = `A${rowIndex}:C${rowIndex}`;

      // Apply alternating row color (light gray for even rows)
      if (index % 2 === 0) {
        for (let col = 0; col < 3; col++) {
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
      { wpx: 180 }, // Track Name
      { wpx: 130 }, // Start Date
      { wpx: 150 }, // Recognition Code
    ];
    ws['!cols'] = wscols;

    // Create a workbook with the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tracks");

    // Create a dynamic file name with current date
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const fileName = `tracks_data_${formattedDate}.xlsx`;

    // Write the workbook to a Blob and trigger download
    XLSX.writeFile(wb, fileName);
  };




  return (
    <Box>
      <Navbar showLogoutButton={true} />
      <Container maxWidth="lg" sx={{ mt: 10 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          centered
          sx={{ minHeight: 40, mb: 2 }}
        >
          <Tab
            icon={<PlaylistAddIcon />}
            iconPosition="start"
            label="ADD TRACK"
            value={0}
            sx={{ fontWeight: "bold", textTransform: "none", px: 2 }}
          />
          <Divider
            orientation="vertical"
            flexItem
            sx={{ height: "30px", mx: 1, borderColor: "primary.main", borderWidth: 2, alignSelf: "center" }}
          />
          <Tab
            icon={<ListAltIcon />}
            iconPosition="start"
            label="VIEW TRACKS"
            value={1}
            sx={{ fontWeight: "bold", textTransform: "none", px: 2 }}
          />
        </Tabs>

        <Paper elevation={4} sx={{ p: 3, borderRadius: 2 }}>
          {activeTab === 0 && (
            <Box component="form" onSubmit={handleSubmit}>
              <Typography variant="h6" mb={3} fontWeight={"bold"}>
                {editingTrackId ? "Edit Track" : "Add New Track"}
              </Typography>
              <TextField
                fullWidth
                label="Track Name"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="Recognition Code"
                value={recognitionCode}
                onChange={(e) => setRecognitionCode(e.target.value.toUpperCase())} // 💡 always uppercase
                required
                sx={{ mb: 2 }}
              />

              <Box textAlign="center">
                <Button type="submit" variant="contained" color="primary">
                  {editingTrackId ? "Update Track" : "Submit"}
                </Button>
              </Box>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 2 }}>
                <Typography variant="h6" fontWeight={"bold"}>
                  Track List
                </Typography>

                <Button
                  variant="contained"
                  color="success"
                  onClick={exportTracksToExcel}
                  disabled={tracks.length === 0}
                >
                  Download Excel
                </Button>
              </Box>

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
                    label="Search by Track Name"
                    variant="outlined"
                    size="medium"
                    value={filterTrackName}
                    onChange={(e) => setFilterTrackName(e.target.value)}
                    sx={{ flex: "1 1 250px" }}
                  />
                  {filterTrackName && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => setFilterTrackName("")}
                      sx={{
                        fontWeight: "bold",
                        height: "56px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </Box>
              </Box>

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
                      {["Track Name", "Start Date", "Recognition Code", "Actions"]
                        .map((header, idx) => (
                          <TableCell
                            key={idx}
                            sx={{
                              backgroundColor: "#34495e",
                              color: "white",
                              textAlign: "center",
                              fontWeight: "bold",
                              border: "1px solid #ccc",
                              position: "sticky",
                              top: 0,
                              zIndex: 1,
                            }}
                          >
                            {header}
                          </TableCell>
                        ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTracks.map((track) => (
                      <TableRow key={track.id} hover>
                        <TableCell align="center" sx={{ border: "1px solid #ccc" }}>
                          {track.trackName}
                        </TableCell>
                        <TableCell align="center" sx={{ border: "1px solid #ccc" }}>
                          {track.startDate}
                        </TableCell>
                        <TableCell align="center" sx={{ border: "1px solid #ccc" }}>
                          {track.recognitionCode}
                        </TableCell>
                        <TableCell align="center" sx={{ border: "1px solid #ccc" }}>
                          <Button
                            onClick={() => handleEdit(track)}
                            variant="outlined"
                            color="primary"
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            Edit
                          </Button>
                          {/* <Button
                            onClick={() => handleDelete(track.id)}
                            variant="outlined"
                            color="error"
                            size="small"
                          >
                            Delete
                          </Button> */}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTracks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                          No matching tracks found.
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
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default AddTrack;