import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  Grid,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import ListAltIcon from "@mui/icons-material/ListAlt";
import Navbar from "../navbar/navbar";
import config from "../config";
import * as XLSX from 'xlsx';
import Autocomplete from '@mui/material/Autocomplete';


const AddInstructor = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [instructorName, setInstructorName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [technology, setTechnology] = useState("");

  const [tracks, setTracks] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [editingInstructorId, setEditingInstructorId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [errors, setErrors] = useState({});

  const [filterInstructor, setFilterInstructor] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterTechnology, setFilterTechnology] = useState("");

  useEffect(() => {
    fetchInstructors();
    fetchTracks();
  }, []);

  const fetchInstructors = async () => {
    const res = await fetch(`${config.API_BASE_URL}/api/instructorlist`);
    const data = await res.json();
    setInstructors(data);
  };

  const fetchTracks = async () => {
    const res = await fetch(`${config.API_BASE_URL}/api/tracks`);
    const data = await res.json();
    setTracks(data);
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!instructorName.trim()) tempErrors.instructorName = "Instructor Name is required";
    if (!email.trim()) tempErrors.email = "Email is required";
    if (!contact.trim() || contact.length !== 10) tempErrors.contact = "Valid 10-digit contact number required";
    if (!technology) tempErrors.technology = "Please select a technology";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
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
    if (!validateForm()) return;

    const instructorData = {
      instructorName,
      email,
      contact,
      technology,
      userid: userid,   // Add user who is creating/updating the instructor
      role: role           // Add role of the user
    };

    const url = editingInstructorId
      ? `${config.API_BASE_URL}/api/editInstructor/${editingInstructorId}`
      : `${config.API_BASE_URL}/api/addInstructor`;

    const method = editingInstructorId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(instructorData),
      });

      const result = await res.json();

      if (!res.ok) {
        setSnackbar({ open: true, message: result.message || "Error occurred", severity: "error" });
        return;
      }

      fetchInstructors();
      setInstructorName("");
      setEmail("");
      setContact("");
      setTechnology("");
      setEditingInstructorId(null);
      setSnackbar({ open: true, message: "Instructor saved successfully!", severity: "success" });
      setActiveTab(1); // Switch to View tab
    } catch {
      setSnackbar({ open: true, message: "Error submitting form", severity: "error" });
    }
  };


  const handleEdit = (instructor) => {
    setInstructorName(instructor.instructor_name);
    setEmail(instructor.email);
    setContact(instructor.contact);
    setTechnology(instructor.technology || "");
    setEditingInstructorId(instructor.id);
    setActiveTab(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this instructor?")) return;
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/deleteInstructor/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (res.ok) {
        fetchInstructors();
        setSnackbar({ open: true, message: "Instructor deleted successfully!", severity: "success" });
      } else {
        setSnackbar({ open: true, message: result.message, severity: "error" });
      }
    } catch {
      setSnackbar({ open: true, message: "Error deleting instructor", severity: "error" });
    }
  };

  const filteredInstructors = instructors.filter(
    (ins) =>
      ins.instructor_name.toLowerCase().includes(filterInstructor.toLowerCase()) &&
      ins.email.toLowerCase().includes(filterEmail.toLowerCase()) &&
      (filterTechnology === "" || ins.technology === filterTechnology)
  );

  const exportInstructorsToExcel = () => {
    const filteredData = instructors
      .filter((instructor) => {
        return (
          instructor.instructor_name.toLowerCase().includes(filterInstructor.toLowerCase()) &&
          instructor.email.toLowerCase().includes(filterEmail.toLowerCase()) &&
          instructor.technology.toLowerCase().includes(filterTechnology.toLowerCase())
        );
      })
      .map((instructor) => ({
        "Instructor Name": instructor.instructor_name || "Not Available",
        "Email": instructor.email || "Not Available",
        "Contact": instructor.contact || "Not Available",
        "Technology": instructor.technology || "Not Available",
      }));

    // Create worksheet
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
    const headerCols = ['A1', 'B1', 'C1', 'D1'];
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

      // Apply alternating row color (light gray for even rows)
      if (index % 2 === 0) {
        for (let col = 0; col < 4; col++) {
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
      { wpx: 180 }, // Instructor Name
      { wpx: 200 }, // Email
      { wpx: 120 }, // Contact
      { wpx: 150 }, // Technology
    ];
    ws['!cols'] = wscols;

    // Create a workbook with the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Instructors");

    // Create a dynamic file name with current date
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const fileName = `instructors_data_${formattedDate}.xlsx`;

    // Write the workbook to a Blob and trigger download
    XLSX.writeFile(wb, fileName);
  };

  return (
    <Box>
      <Navbar showLogoutButton={true} />
      <Container maxWidth="lg" sx={{ mt: 10 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} centered sx={{ minHeight: 40, mb: 2 }}>
          <Tab
            icon={<PlaylistAddIcon />}
            iconPosition="start"
            label="ADD INSTRUCTOR"
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
            label="VIEW INSTRUCTORS"
            value={1}
            sx={{ fontWeight: "bold", textTransform: "none", px: 2 }}
          />
        </Tabs>

        <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
          {activeTab === 0 && (
            <Box component="form" onSubmit={handleSubmit}>
              <Typography variant="h6" fontWeight={"bold"} mb={3}>
                {editingInstructorId ? "Edit Instructor" : "Add New Instructor"}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Instructor Name"
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    error={!!errors.instructorName}
                    helperText={errors.instructorName}
                    required
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
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    type="number"
                    value={contact}
                    onChange={(e) => setContact(e.target.value.replace(/\D/, "").slice(0, 10))}
                    error={!!errors.contact}
                    helperText={errors.contact}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    fullWidth
                    options={tracks}
                    getOptionLabel={(option) => option.track_name}
                    value={technology ? { track_name: technology } : null}  // Initialize the value properly
                    onChange={(event, newValue) => setTechnology(newValue ? newValue.track_name : "")}
                    renderInput={(params) => <TextField {...params} label="Technology *" />}
                    isOptionEqualToValue={(option, value) => option.track_name === value.track_name}
                    disableClearable
                    error={!!errors.technology}
                    helperText={errors.technology}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="center" gap={2}>
                    <Button type="submit" variant="contained" color="primary">
                      {editingInstructorId ? "Update" : "Submit"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 2 }}>
                <Typography variant="h6" fontWeight={"bold"} mb={2}>Instructor List</Typography>

                <Button
                  variant="contained"
                  color="success"
                  onClick={exportInstructorsToExcel}
                  disabled={tracks.length === 0}
                >
                  Download Excel
                </Button>
              </Box>

              {/* Filters */}
              <Box sx={{ mb: 2, p: 2, backgroundColor: "#f9f9f9", border: "1px solid #ddd", borderRadius: 2 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 2 }}>
                  <TextField
                    label="Name"
                    value={filterInstructor}
                    onChange={(e) => setFilterInstructor(e.target.value)}
                    sx={{ flex: "1 1 200px" }}
                    size="medium"
                  />
                  <TextField
                    label="Email"
                    value={filterEmail}
                    onChange={(e) => setFilterEmail(e.target.value)}
                    sx={{ flex: "1 1 200px" }}
                    size="medium"
                  />
                  <FormControl sx={{ flex: "1 1 200px" }}>
                    <InputLabel>Technology</InputLabel>
                    <Select
                      label="Technology"
                      value={filterTechnology}
                      onChange={(e) => setFilterTechnology(e.target.value)}
                    >
                      <MenuItem value="">All</MenuItem>
                      {tracks.map((track) => (
                        <MenuItem key={track.track_name} value={track.track_name}>
                          {track.track_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {(filterInstructor || filterEmail || filterTechnology) && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        setFilterInstructor("");
                        setFilterEmail("");
                        setFilterTechnology("");
                      }}
                      sx={{ fontWeight: "bold", height: "56px", whiteSpace: "nowrap" }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Table */}
              <TableContainer component={Paper} sx={{ maxHeight: 300, overflow: "auto", borderRadius: 2 }}>
                <Table stickyHeader size="medium">
                  <TableHead>
                    <TableRow>
                      {["ID", "Name", "Email", "Contact", "Technology", "Actions"].map((header, i) => (
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
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInstructors.map((i) => (
                      <TableRow key={i.id} hover>
                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{i.id}</TableCell>
                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{i.instructor_name}</TableCell>
                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{i.email}</TableCell>
                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{i.contact}</TableCell>
                        <TableCell align="center" sx={{ border: '1px solid rgba(224, 224, 224, 1)' }}>{i.technology}</TableCell>
                        <TableCell align="center" sx={{ minWidth: '200px', border: '1px solid rgba(224, 224, 224, 1)' }}>
                          <Button onClick={() => handleEdit(i)} variant="outlined" color="primary" size="small" sx={{ mr: 1 }}>
                            Edit
                          </Button>
                          {/* <Button onClick={() => handleDelete(i.id)} variant="outlined" color="error" size="small">
                            Delete
                          </Button> */}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredInstructors.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          No instructors found.
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
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AddInstructor;
