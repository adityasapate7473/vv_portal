import React, { useState, useEffect } from "react";
import Navbar from "../navbar/navbar";
import { Theme, useTheme } from "@mui/material/styles";
import config from "../config";
import {
  Box,
  Card,
  CardContent,
  Grid,
  OutlinedInput,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Chip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const skillsetOptions = [
  "C",
  "C++",
  "Python",
  "HTML",
  "PHP",
  "JAVA",
  "Nodejs",
  "SQL",
  "MONGODB",
  "JavaScript",
  "CSS",
  "Angular",
  "ML",
  "React JS",
  "Data Analysis",
];
const qualificationOptions = [
  "BE",
  "ME",
  "BCA",
  "MCA",
  "BCS",
  "MCS",
  "B.Tech",
  "M.Tech",
  "MBA",
  "BSC",
  "MSC",
];
const passoutYearOptions = [
  "2015",
  "2016",
  "2017",
  "2018",
  "2019",
  "2020",
  "2021",
  "2022",
  "2023",
  "2024",
];

function getStyles(name, selectedValues, theme) {
  return {
    fontWeight:
      selectedValues.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

const PartnerDashboard = () => {
  const theme = useTheme();
  const [studentList, setStudentList] = useState([]);
  const [filteredStudentList, setFilteredStudentList] = useState([]);
  const [showStudentTable, setShowStudentTable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qualificationFilter, setQualificationFilter] = useState([]);
  const [skillsetFilter, setSkillsetFilter] = useState([]);
  const [passoutYearFilter, setPassoutYearFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(10);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  function getCookie(name) {
    const cookieValue = document.cookie.match(
      "(^|;)\\s*" + name + "\\s*=\\s*([^;]+)"
    );
    return cookieValue ? decodeURIComponent(cookieValue.pop()) : "";
  }
  const client_name = getCookie("name");
  const company_name = getCookie("companyName");
  const company_website = getCookie("companyWebsite");

  const fetchStudentList = async () => {
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/api/getApprovedStudentDetails`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch student details");
      }
      const data = await response.json();

      // Transform data to fit your current state structure
      const transformedData = data.map((student) => ({
        id: student.id, // You might need a unique ID here
        student_name: student.student_name,
        email : student.email,
        highest_qualification: student.education[0]?.degree || "",
        passout_year: student.education[0]?.end_year || "",
        skillset: student.skills.map((skill) => skill.skill).join(", "),
        experience: student.experience
          .map((exp) => exp.total_experience)
          .join(", "),
      }));

      setStudentList(transformedData);
      setFilteredStudentList(transformedData); // Filter if needed
      setShowStudentTable(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentList();
  }, []);

  const handleViewResume = async (profileId) => {
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/api/approvalResume/${profileId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch resume");
      }
      const blob = await response.blob();
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL);
    } catch (error) {
      console.error("Error fetching or displaying resume:", error);
    }
  };

  const handleFilterChange = () => {
    let filteredList = studentList;

    if (qualificationFilter.length > 0) {
      filteredList = filteredList.filter(
        (student) =>
          student.highest_qualification &&
          qualificationFilter.some((qualification) =>
            student.highest_qualification
              .toLowerCase()
              .includes(qualification.toLowerCase())
          )
      );
    }

    if (passoutYearFilter.length > 0) {
      filteredList = filteredList.filter(
        (student) =>
          student.passout_year &&
          passoutYearFilter.includes(student.passout_year.toString())
      );
    }

    if (skillsetFilter.length > 0) {
      filteredList = filteredList.filter((student) => {
        if (student.skillset) {
          const skillsArray = student.skillset
            .toLowerCase()
            .split(",")
            .map((skill) => skill.trim());
          return skillsetFilter.some((skill) =>
            skillsArray.includes(skill.toLowerCase())
          );
        }
        return false;
      });
    }

    setFilteredStudentList(filteredList);
    setCurrentPage(1);
  };

  useEffect(() => {
    handleFilterChange();
  }, [qualificationFilter, skillsetFilter, passoutYearFilter]);

  const handleChange = (event, filterSetter) => {
    const {
      target: { value },
    } = event;
    filterSetter(typeof value === "string" ? value.split(",") : value);
  };

  const toggleSkillset = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = filteredStudentList.slice(
    indexOfFirstResult,
    indexOfLastResult
  );
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleRequestClick = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleConfirmRequest = async () => {
    try {
      const requestPayload = {
        ...selectedStudent,
        clientName: client_name,
        companyName: company_name,
        companyWebsite: company_website,
      };
      const response = await fetch(
        `${config.API_BASE_URL}/api/partnerStudentRequest`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to create request");
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Error sending request");
    }
  };

  const handleConfirmRequest2 = async () => {
    try {
      const requestPayload = {
        ...selectedStudent,
        clientName: client_name,
        companyName: company_name,
        companyWebsite: company_website,
      };
      const response = await fetch(
        `${config.API_BASE_URL}/api/sendStudentRequestEmail`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to send request email");
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error sending request email:", error);
      alert("Error sending request email");
    }
  };

  return (
    <>
      <Navbar showLogoutButton={true} />
      <Box sx={{ mt: 4, mx: 4 }}>
        {loading ? (
          <Typography variant="h6" align="center">
            Loading...
          </Typography>
        ) : error ? (
          <Typography variant="h6" align="center" color="error">
            {error}
          </Typography>
        ) : (
          showStudentTable && (
            <>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold" }}
                align="center"
                gutterBottom
              >
                VishvaVidya Candidate Details
              </Typography>

              <Card variant="outlined" sx={{ mb: 3, boxShadow: 3 }}>
                <CardContent>
                  <Box sx={{ mb: 1 }}>
                    <div className="row">
                      <div className="col-md-4">
                        <FormControl sx={{ m: 1, width: "100%" }}>
                          <InputLabel id="qualification-chip-label">
                            Highest Qualification
                          </InputLabel>
                          <Select
                            labelId="qualification-chip-label"
                            id="qualification-chip"
                            multiple
                            value={qualificationFilter}
                            onChange={(e) =>
                              handleChange(e, setQualificationFilter)
                            }
                            input={
                              <OutlinedInput
                                id="select-qualification-chip"
                                label="Highest Qualification"
                              />
                            }
                            renderValue={(selected) => (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                }}
                              >
                                {selected.map((value) => (
                                  <Chip key={value} label={value} />
                                ))}
                              </Box>
                            )}
                            MenuProps={MenuProps}
                          >
                            {qualificationOptions.map((qualification) => (
                              <MenuItem
                                key={qualification}
                                value={qualification}
                                style={getStyles(
                                  qualification,
                                  qualificationFilter,
                                  theme
                                )}
                              >
                                {qualification}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </div>
                      <div className="col-md-4">
                        <FormControl sx={{ m: 1, width: "100%" }}>
                          <InputLabel id="skillset-chip-label">
                            Skillset
                          </InputLabel>
                          <Select
                            labelId="skillset-chip-label"
                            id="skillset-chip"
                            multiple
                            value={skillsetFilter}
                            onChange={(e) => handleChange(e, setSkillsetFilter)}
                            input={
                              <OutlinedInput
                                id="select-skillset-chip"
                                label="Skillset"
                              />
                            }
                            renderValue={(selected) => (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                }}
                              >
                                {selected.map((value) => (
                                  <Chip key={value} label={value} />
                                ))}
                              </Box>
                            )}
                            MenuProps={MenuProps}
                          >
                            {skillsetOptions.map((skillset) => (
                              <MenuItem
                                key={skillset}
                                value={skillset}
                                style={getStyles(
                                  skillset,
                                  skillsetFilter,
                                  theme
                                )}
                              >
                                {skillset}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </div>
                      <div className="col-md-4">
                        <FormControl sx={{ m: 1, width: "100%" }}>
                          <InputLabel id="passoutYear-chip-label">
                            Passout Year
                          </InputLabel>
                          <Select
                            labelId="passoutYear-chip-label"
                            id="passoutYear-chip"
                            multiple
                            value={passoutYearFilter}
                            onChange={(e) =>
                              handleChange(e, setPassoutYearFilter)
                            }
                            input={
                              <OutlinedInput
                                id="select-passoutYear-chip"
                                label="Passout Year"
                              />
                            }
                            renderValue={(selected) => (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 0.5,
                                }}
                              >
                                {selected.map((value) => (
                                  <Chip key={value} label={value} />
                                ))}
                              </Box>
                            )}
                            MenuProps={MenuProps}
                          >
                            {passoutYearOptions.map((year) => (
                              <MenuItem
                                key={year}
                                value={year}
                                style={getStyles(
                                  year,
                                  passoutYearFilter,
                                  theme
                                )}
                              >
                                {year}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </div>
                    </div>
                  </Box>
                </CardContent>
              </Card>
              <TableContainer sx={{ boxShadow: 3 }} component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sr. No.</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Highest Qualification</TableCell>
                      <TableCell>Passout Year</TableCell>
                      <TableCell>Skillset</TableCell>
                      {/* <TableCell>Experience</TableCell> */}
                      <TableCell>Request</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentResults.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell>{indexOfFirstResult + index + 1}</TableCell>
                        <TableCell
                          sx={{ cursor: "pointer", color: "blue" }}
                          onClick={() => handleViewResume(student.id)}
                        >
                          {student.student_name}
                        </TableCell>
                        <TableCell>{student.highest_qualification}</TableCell>
                        <TableCell>{student.passout_year}</TableCell>
                        <TableCell>
                          {expandedStudent === student.id ? (
                            <div>{student.skillset}</div>
                          ) : (
                            <div>
                              {student.skillset
                                .split(",")
                                .slice(0, 3)
                                .join(", ")}{" "}
                              {student.skillset.split(",").length > 3 && (
                                <IconButton
                                  onClick={() => toggleSkillset(student.id)}
                                >
                                  <ExpandMoreIcon />
                                </IconButton>
                              )}
                            </div>
                          )}
                        </TableCell>
                        {/* <TableCell>{student.experience}</TableCell> */}
                        <TableCell>
                          <Button
                            color="warning"
                            variant="contained"
                            size="small"
                            onClick={() => handleRequestClick(student)}
                          >
                            Request
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Pagination
                  count={Math.ceil(filteredStudentList.length / resultsPerPage)}
                  page={currentPage}
                  onChange={(e, page) => paginate(page)}
                />
              </Box>
            </>
          )
        )}
      </Box>
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        PaperProps={{
          style: {
            position: "absolute",
            top: "10%",
            margin: "auto",
            padding: "20px",
            borderRadius: "10px",
            backgroundColor: "#ffffea",
          },
        }}
      >
        <DialogTitle>Confirm Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to send a request for{" "}
            <b>{selectedStudent?.student_name}</b>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleConfirmRequest();
              handleConfirmRequest2();
              setShowModal(false);
            }}
            color="primary"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PartnerDashboard;
