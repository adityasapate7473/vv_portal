import React, { useState, useEffect } from "react";
import Navbar from "../navbar/navbar";
import config from "../config";
import { Container, TextField, Button, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, Autocomplete, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const skillsetOptions = ["C", "C++", "Python", "HTML", "PHP", "JAVA", "Nodejs", "SQL", "MONGODB", "JavaScript", "TypeScript", "CSS", "Angular", "ML", "React", "Data Analysis"];
const qualificationOptions = ["BE", "ME", "BCA", "MCA", "BCS", "MCS", "B.Tech", "M.Tech", "MBA", "BSC", "MSC"];
const currentYear = new Date().getFullYear();
const passoutYearOptions = Array.from({ length: 30 }, (_, i) => (currentYear - 25 + i).toString());
const statusOptions = ["Placed", "Absconding", "In Training", "Completed", "Shadowed", "pip", "On Leave", "Training Closed"];

const SearchSkillset = () => {
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(5);
  const [batchNames, setBatchNames] = useState([]);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch(`${config.API_BASE_URL}/api/getBatchNames`);
        const data = await response.json();
        setBatchNames(data.map((batch) => batch.batch_name)); // ✅ Extract batch names
      } catch (error) {
        console.error("Error fetching batch names:", error);
      }
    };
    fetchBatches();
  }, []);

  const [filters, setFilters] = useState({
    employeeName: '',
    skillset: [],
    passoutYear: [],
    qualification: [],
    status: [],
    batchName: ""
  });

  const [showResults, setShowResults] = useState(false);

  const handleChange = (name, value) => {
    setFilters({ ...filters, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetchFilteredStudents();
    setShowResults(true);
  };

  const fetchFilteredStudents = async () => {
    const queryParams = new URLSearchParams();

    if (filters.employeeName) queryParams.append('employeeName', filters.employeeName);
    if (filters.skillset.length) queryParams.append('skillset', filters.skillset.join(','));
    if (filters.passoutYear.length) queryParams.append('passoutYear', filters.passoutYear.join(','));
    if (filters.qualification.length) queryParams.append('qualification', filters.qualification.join(','));
    if (filters.status.length) queryParams.append('status', filters.status.join(','));
    if (filters.batchName) queryParams.append('batchName', filters.batchName);

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/filter_students?${queryParams.toString()}`);
      const data = await response.json();
      setFilteredStudents(data);
    } catch (error) {
      console.error('Error fetching filtered students:', error);
    }
  };

  // Pagination logic
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = filteredStudents.slice(indexOfFirstResult, indexOfLastResult);

  const handlePageChange = (event, value) => setCurrentPage(value);

  return (
    <>
      <Navbar showLogoutButton={true} /><br /><br /><br />
      <Container>
        <Typography sx={{ fontWeight: 'bold', mt: 1 }} variant="h5" gutterBottom>
          Search Interns
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                label="Intern Name"
                variant="outlined"
                fullWidth
                margin="normal"
                name="employeeName"
                value={filters.employeeName}
                onChange={(e) => handleChange('employeeName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Autocomplete
                multiple
                options={skillsetOptions}
                getOptionLabel={(option) => option}
                value={filters.skillset}
                onChange={(event, newValue) => handleChange('skillset', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Skillset"
                    margin="normal"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Autocomplete
                multiple
                options={passoutYearOptions}
                getOptionLabel={(option) => option}
                value={filters.passoutYear}
                onChange={(event, newValue) => handleChange('passoutYear', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Passout Year"
                    margin="normal"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Autocomplete
                multiple
                options={qualificationOptions}
                getOptionLabel={(option) => option}
                value={filters.qualification}
                onChange={(event, newValue) => handleChange('qualification', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Qualification"
                    margin="normal"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Autocomplete
                multiple
                options={statusOptions}
                getOptionLabel={(option) => option}
                value={filters.status}
                onChange={(event, newValue) => handleChange('status', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Training Status"
                    margin="normal"
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel>Batch Name</InputLabel>
                <Select
                  value={filters.batchName}
                  onChange={(e) => handleChange("batchName", e.target.value)}
                  label="Batch Name"
                >
                  <MenuItem value="">All Batches</MenuItem> {/* Optional: Allow searching all batches */}
                  {batchNames.map((batch, index) => (
                    <MenuItem key={index} value={batch}>{batch}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>


            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" style={{ marginTop: 16 }}>
                Search
              </Button>
            </Grid>
          </Grid>
        </form>
      </Container>
      {showResults && (
        <Container>
          <TableContainer component={Paper} style={{ marginTop: 16 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><Typography variant="subtitle2">Sr. No.</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Name</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Batch Name</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Email</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Contact</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Skillset</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Passout Year</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Qualification</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2">Placement Status</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentResults.map((student, index) => (
                  <TableRow key={student.id} sx={{ '&:nth-of-type(even)': { backgroundColor: '#f5f5f5' } }}>
                    <TableCell>{indexOfFirstResult + index + 1}</TableCell>
                    <TableCell>{student.student_name}</TableCell>
                    <TableCell>{student.batch_name}</TableCell>
                    <TableCell>{student.email_id}</TableCell>
                    <TableCell>{student.contact_no}</TableCell>
                    <TableCell>{student.skillset}</TableCell>
                    <TableCell>{student.passout_year}</TableCell>
                    <TableCell>{student.highest_qualification}</TableCell>
                    <TableCell>{student.placement_status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Pagination
            count={Math.ceil(filteredStudents.length / resultsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}
          />
        </Container>
      )}
    </>
  );
}

export default SearchSkillset;
