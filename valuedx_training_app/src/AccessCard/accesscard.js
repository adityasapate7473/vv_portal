import React, { useState } from "react";
import Navbar from "../navbar/navbar";
import {
  TextField,
  MenuItem,
  Button,
  Grid,
  Container,
  Typography,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";

const AccessCardForm = () => {
  const [formData, setFormData] = useState({
    traineeCode: "",
    traineeName: "",
    email: "",
    contact: "",
    idCard: "",
    accessCardNumber: "",
    cardAllocationDate: "",
    trainingDuration: "",
    trainerName: "",
    managerName: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:3001/api/access-card-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form. Please try again.");
      }

      const result = await response.json();
      setMessage("Access card details submitted successfully!");
      setSnackbarOpen(true); // Open the Snackbar on success
      console.log("Form submitted successfully:", result);

      // Reset form after successful submission
      setFormData({
        traineeCode: "",
        traineeName: "",
        email: "",
        contact: "",
        idCard: "",
        accessCardNumber: "",
        cardAllocationDate: "",
        trainingDuration: "",
        trainerName: "",
        managerName: "",
      });
    } catch (error) {
      setMessage(error.message);
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false); // Close the Snackbar
  };

  return (
    <Container maxWidth="md" style={{ marginTop: "1rem" }}>
      <Navbar />
      {/* <Paper
        elevation={3}
        style={{
          padding: "1rem",
          backgroundColor: "#fdfdfd",
          borderRadius: "8px",
        }}
      > */}
        <Typography variant="h5" align="center" gutterBottom sx={{fontWeight:'bold'}}>
          Access Card Form
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Row 1 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Trainee Code"
                name="traineeCode"
                value={formData.traineeCode}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Trainee Name"
                name="traineeName"
                value={formData.traineeName}
                onChange={handleChange}
                required
              />
            </Grid>

            {/* Row 2 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email ID"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                required
              />
            </Grid>

            {/* Row 3 */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="ID Card"
                name="idCard"
                value={formData.idCard}
                onChange={handleChange}
                required
              >
                <MenuItem value="Temporary ID">Temporary ID</MenuItem>
                <MenuItem value="Permanent ID">Permanent ID</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Access Card Number"
                name="accessCardNumber"
                value={formData.accessCardNumber}
                onChange={handleChange}
                required
              />
            </Grid>

            {/* Row 4 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Card Allocation Date"
                type="date"
                name="cardAllocationDate"
                value={formData.cardAllocationDate}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Training Duration"
                name="trainingDuration"
                value={formData.trainingDuration}
                onChange={handleChange}
                required
              >
                <MenuItem value="1 to 3 Months">1 to 3 Months</MenuItem>
                <MenuItem value="3 to 6 Months">3 to 6 Months</MenuItem>
                <MenuItem value="6 to 9 Months">6 to 9 Months</MenuItem>
              </TextField>
            </Grid>

            {/* Row 5 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Trainer Name"
                name="trainerName"
                value={formData.trainerName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Manager Name"
                name="managerName"
                value={formData.managerName}
                onChange={handleChange}
                required
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12} sx={{textAlign:'center'}}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                style={{
                  padding: "0.4rem",
                  fontWeight: "bold",
                  width:'150px',
                  
                }}
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
      {/* </Paper> */}
       {/* Snackbar */}
       <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          sx={{ bgcolor: "darkgreen", color: "white", marginLeft:'100px' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AccessCardForm;
