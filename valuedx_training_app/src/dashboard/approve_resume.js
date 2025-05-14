import React, { useState, useEffect } from "react";
import Navbar from "../navbar/navbar";
import config from "../config";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Typography,
  Modal,
  Box,
  Pagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

const ApproveResume = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [apiError, setApiError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [approvedProfileId, setApprovedProfileId] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/api/getResumeApprovalCandidates`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setProfiles(data);
    } catch (error) {
      setError("Failed to fetch profiles.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/approveProfile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileId: id }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve profile");
      }

      const updatedProfiles = profiles.map((profile) =>
        profile.id === id ? { ...profile, approved: true } : profile
      );
      setProfiles(updatedProfiles);
      setApprovedProfileId(id); // Set the approved profile ID
      setDialogVisible(true); // Show the dialog
      fetchProfiles();
    } catch (error) {
      console.error("Error approving profile:", error);
      setApiError("Failed to approve profile");
    }
  };

  const handleCloseDialog = () => {
    setDialogVisible(false);
  };

  const handleChanges = (profile) => {
    setSelectedProfile(profile);
    setModalVisible(true);
  };

  const handleSendFeedback = async () => {
    if (!feedback.trim()) {
      setApiError("Feedback cannot be empty");
      return;
    }
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/api/sendResumeChangesEmail`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_name: `${selectedProfile.first_name} ${selectedProfile.last_name}`,
            email_id: selectedProfile.email,
            changesDetails: feedback,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      setModalVisible(false);
      setFeedback("");
      setApiError("");
    } catch (error) {
      console.error("Error sending email:", error);
      setApiError("Failed to send email");
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setFeedback("");
    setApiError("");
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  };

  const paginatedProfiles = profiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <Typography align="center">Loading...</Typography>;
  if (error) return <Typography align="center" color="error">{error}</Typography>;

  return (
    <>
      <Navbar showLogoutButton={true} /><br/><br/><br/>
      <Container>
        <Typography variant="h5" sx={{marginTop:'10px', marginBottom:'20px', fontWeight: 'bold' }}>
          Resume Review Requests
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Sr. No.</TableCell>
                <TableCell align="center">Name</TableCell>
                <TableCell align="center">Email</TableCell>
                <TableCell align="center">Contact</TableCell>
                <TableCell align="center">LinkedIn ID</TableCell>
                <TableCell align="center">Approval</TableCell>
                <TableCell align="center">Changes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProfiles.map((profile, index) => (
                <TableRow key={profile.id}>
                  <TableCell align="center">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      onClick={() => handleViewResume(profile.id)}
                      style={{ textDecoration: "none" }}
                    >
                      {profile.first_name} {profile.last_name}
                    </Button>
                  </TableCell>
                  <TableCell align="center">{profile.email}</TableCell>
                  <TableCell align="center">{profile.phone}</TableCell>
                  <TableCell align="center">
                    <a
                      href={`https://www.linkedin.com/in/${profile.linkedinid}`}
                      style={{ textDecoration: "none" }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {profile.linkedinid}
                    </a>
                  </TableCell>
                  <TableCell align="center">
                    {profile.approval_status !== "Approved" ? (
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        onClick={() => handleApprove(profile.id)}
                      >
                        Approve
                      </Button>
                    ) : (
                      <Typography>Approved</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      color="warning"
                      onClick={() => handleChanges(profile)}
                    >
                      Changes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box mt={2} display="flex" justifyContent="center">
          <Pagination
            count={Math.ceil(profiles.length / itemsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      </Container>

      <Modal open={modalVisible} onClose={handleCloseModal}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2">
            Request Changes
          </Typography>
          {apiError && <Typography color="error">{apiError}</Typography>}
          <TextField
            multiline
            rows={4}
            fullWidth
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <Box mt={2}>
            <Button variant="contained" color="primary" onClick={handleSendFeedback}>
              Send
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleCloseModal}
              style={{ marginLeft: '10px' }}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      <Dialog
        open={dialogVisible}
        onClose={handleCloseDialog}
        PaperProps={{
          style: {
            position: "absolute",
            top: "10%",
            margin: "auto",
            padding: "20px",
            borderRadius: "10px",
            width: "600px",
            backgroundColor: "#ffffea",
          },
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle sx={{color:'green'}}>
          {"Success"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{color:'#0096FF'}}>
            Approved profile Successfully...
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApproveResume;
