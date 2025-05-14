import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  IconButton,
  TablePagination,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import AccessCardForm from "./accesscard";
import { Close as CloseIcon } from "@mui/icons-material";

const AccessCardDashboard = () => {
  const [accessCards, setAccessCards] = useState([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0); // For pagination
  const [rowsPerPage, setRowsPerPage] = useState(5); // Number of rows per page
  const [openDialog, setOpenDialog] = useState(false); // State for dialog visibility
  const [selectedCard, setSelectedCard] = useState(null); // State for the selected access card data
  const [isFormVisible, setIsFormVisible] = useState(false); // State to manage form visibility
  const [openDialogue, setOpenDialogue] = useState(false);

  useEffect(() => {
    const fetchAccessCards = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/api/getAccessCards"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch access card details.");
        }
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setAccessCards(result.data);
        } else {
          console.error("Expected an array in 'data' field but got:", result);
        }
      } catch (error) {
        console.error("Error fetching access card details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccessCards();
  }, []);

  const handleNewUserDialogOpen = () => {
    setOpenDialogue(true); // Open the New User dialog
  };

  const handleNewUserDialogClose = () => {
    setOpenDialogue(false); // Close the New User dialog
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page on rows per page change
  };

  const handleEditClick = (card) => {
    setSelectedCard(card); // Set the selected card data
    setOpenDialog(true); // Open the dialog
  };

  const handleDialogClose = () => {
    setOpenDialog(false); // Close the dialog
    setSelectedCard(null); // Clear the selected card data
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedCard((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async () => {
    try {
      // Send the PUT request to the API to update the access card details
      const response = await fetch(
        "http://localhost:3001/api/updateAccessCard",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedCard), // Send the updated selectedCard object
        }
      );

      if (response.ok) {
        const updatedCard = await response.json();

        // Update the local state with the updated access card data
        setAccessCards((prev) =>
          prev.map((card) => (card.id === updatedCard.id ? updatedCard : card))
        );

        // Show a success alert and close the dialog
        alert("Access card updated successfully!");
        setOpenDialog(false);
      } else {
        throw new Error("Failed to update access card.");
      }
    } catch (error) {
      console.error("Error updating access card:", error);
      alert("Failed to update access card.");
    }
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div style={{ padding: "2rem"}}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          marginBottom:'10px'
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          Access Card Users
        </Typography>

        <Button
          variant="contained"
          color="primary"
          sx={{ marginLeft: "auto" , backgroundColor:'#044f67'}}
          onClick={handleNewUserDialogOpen} 
        >
          New User
        </Button>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <CircularProgress />
        </div>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#044f67" }}>
                <TableCell align="center" sx={{ color: "white" }}>
                  <strong>Sr. No.</strong>
                </TableCell>
                <TableCell align="center" sx={{ color: "white" }}>
                  <strong>Trainee Code</strong>
                </TableCell>
                <TableCell align="center" sx={{ color: "white" }}>
                  <strong>Trainee Name</strong>
                </TableCell>
                <TableCell align="center" sx={{ color: "white" }}>
                  <strong>Email</strong>
                </TableCell>
                <TableCell align="center" sx={{ color: "white" }}>
                  <strong>Issue Date</strong>
                </TableCell>
                <TableCell align="center" sx={{ color: "white" }}>
                  <strong>Card Deposit</strong>
                </TableCell>
                <TableCell align="center" sx={{ color: "white" }}>
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accessCards.length > 0 ? (
                accessCards
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((card, index) => (
                    <TableRow key={card.id}>
                      <TableCell align="center">{index + 1}</TableCell>
                      <TableCell align="center">{card.trainee_code}</TableCell>
                      <TableCell align="center">{card.trainee_name}</TableCell>
                      <TableCell align="center">{card.email}</TableCell>
                      <TableCell align="center">{formatDate(card.card_allocation_date)}</TableCell>
                      <TableCell align="center" sx={{ color: "green" }}>{card.deposit}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <IconButton
                            color="primary"
                            sx={{ marginRight: 1 }}
                            onClick={() => handleEditClick(card)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton color="secondary">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No Access Cards Available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={accessCards.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Access Card User Details</DialogTitle>
        <DialogContent>
          {selectedCard && (
            <>
              <TextField
                fullWidth
                margin="normal"
                label="Trainee Code"
                name="trainee_code"
                value={selectedCard.trainee_code || ""}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Trainee Name"
                name="trainee_name"
                value={selectedCard.trainee_name || ""}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Email"
                name="email"
                value={selectedCard.email || ""}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Contact"
                name="contact"
                value={selectedCard.contact || ""}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="ID Card Type"
                name="id_card_type"
                select
                value={selectedCard.id_card_type || ""}
                onChange={handleInputChange}
                helperText="Please select an ID card type"
              >
                <MenuItem value="Temporary ID">Temporary ID</MenuItem>
                <MenuItem value="Permanent ID">Permanent ID</MenuItem>
              </TextField>
              <TextField
                fullWidth
                margin="normal"
                label="Access Card Number"
                name="access_card_number"
                value={selectedCard.access_card_number || ""}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Card Allocation Date"
                name="card_allocation_date"
                type="date"
                value={selectedCard.card_allocation_date?.split("T")[0] || ""}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Training Duration"
                name="training_duration"
                select
                value={selectedCard.training_duration || ""}
                onChange={handleInputChange}
                helperText="Please select a training duration"
              >
                <MenuItem value="1 to 3 Months">1 to 3 Months</MenuItem>
                <MenuItem value="3 to 6 Months">3 to 6 Months</MenuItem>
                <MenuItem value="6 to 9 Months">6 to 9 Months</MenuItem>
              </TextField>
              <TextField
                fullWidth
                margin="normal"
                label="Trainer Name"
                name="trainer_name"
                value={selectedCard.trainer_name || ""}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Manager Name"
                name="manager_name"
                value={selectedCard.manager_name || ""}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                margin="normal"
                label="Card Submitted Date"
                name="card_submitted_date"
                type="date"
                value={selectedCard.card_submitted_date?.split("T")[0] || ""}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleUpdate} color="primary" variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

       {/* New User Dialog */}
       <Dialog
        open={openDialogue}
        onClose={handleNewUserDialogClose}
        maxWidth="sm"
        fullWidth
      > 
      <IconButton
      edge="end"
      color="inherit"
      onClick={handleNewUserDialogClose}
      aria-label="close"
      sx={{
        position: "absolute",
        right: 8,
        top: 8,
      }}
    >
      <CloseIcon />
    </IconButton>
        <DialogContent>
          <AccessCardForm/>
        </DialogContent>
        {/* <DialogActions>
          <Button onClick={handleNewUserDialogClose} color="secondary">
            Cancel
          </Button>
          <Button color="primary" variant="contained">
            Create
          </Button>
        </DialogActions> */}
      </Dialog>
    </div>
  );
};

export default AccessCardDashboard;
