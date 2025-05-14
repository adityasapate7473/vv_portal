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
  Typography,
  Paper,
  Box,
  Button
} from "@mui/material";
import * as XLSX from "xlsx";

const EvaluationResult = () => {
  const [evaluationResults, setEvaluationResults] = useState([]);
  const [batchName, setBatchName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const batchName = params.get("batchName");
    setBatchName(batchName);
    if (batchName) fetchEvaluationResults(batchName);
  }, []);

  const fetchEvaluationResults = async (batchName) => {
    try {
      const url = `${config.API_BASE_URL}/api/get-evaluation-results?batchName=${batchName}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch evaluation results");

      const data = await response.json();
      if (Array.isArray(data)) {
        const sortedResults = data.sort((a, b) => {
          if (a.student_id !== b.student_id) return a.student_id.localeCompare(b.student_id);
          return a.attempt - b.attempt;
        });
        setEvaluationResults(sortedResults);
      } else {
        console.error("Unexpected data format:", data);
      }
    } catch (error) {
      console.error("Error fetching evaluation results:", error);
    }
  };

  const formatBoolean = (value) => {
    if (value === true) {
      return {
        text: "Pending",
        color: "orange", // You can adjust this color as needed for "Pending"
      };
    } else {
      return {
        text: "Completed",
        color: "green", // You can adjust this color as needed for "Completed"
      };
    }
  };

  // Function to group results by attempt
  const groupByAttempt = (results) => {
    const grouped = {};
    results.forEach((result) => {
      if (!grouped[result.attempt]) {
        grouped[result.attempt] = [];
      }
      grouped[result.attempt].push(result);
    });
    return grouped;
  };

  const groupedResults = groupByAttempt(evaluationResults);

  const handleDownloadExcel = () => {
    const allData = [];

    Object.keys(groupedResults).forEach((attemptKey) => {
      const attemptData = groupedResults[attemptKey];

      // Push header row per attempt (optional)
      allData.push([`Attempt: ${attemptKey}`]);

      // Push column headers
      allData.push([
        "Intern ID", "Student Name", "Email", "Batch", "Attempt", "Attempt Name",
        "Technical", "MCQ", "Oral", "Total", "Remark",
        "Pending Technical", "Pending MCQ", "Pending Oral", "Pending Remark"
      ]);

      // Push rows
      attemptData.forEach((result) => {
        allData.push([
          result.student_id,
          result.student_name,
          result.email_id,
          result.batch_name,
          result.attempt,
          result.attempt_name,
          result.technical ?? "-",
          result.mcq ?? "-",
          result.oral ?? "-",
          result.total ?? "-",
          result.remark ?? "-",
          formatBoolean(result.pending_technical).text,
          formatBoolean(result.pending_mcq).text,
          formatBoolean(result.pending_oral).text,
          formatBoolean(result.pending_remark).text,
        ]);
      });

      // Empty row for separation
      allData.push([]); 
    });

    const worksheet = XLSX.utils.aoa_to_sheet(allData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Evaluation Results");

    XLSX.writeFile(workbook, `Evaluation_Results_${batchName}.xlsx`);
  };

  return (
    <>
      <Navbar showLogoutButton={true} />
      <Container maxWidth="lg" sx={{ mt: 12 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", mt: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
            Evaluation Results for {batchName} Batch
          </Typography>

          <Button
            variant="contained"
            color="success"
            sx={{ mb: 3 }}
            onClick={handleDownloadExcel}
          >
            Download Excel
          </Button>
        </Box>
        {/* Render tables for each attempt */}
        {Object.keys(groupedResults).map((attempt) => {
          const resultsForAttempt = groupedResults[attempt];
          return (
            <div key={attempt}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                {attempt
                  .replace(/([a-zA-Z]+)(\d+)/, '$1 $2')
                  .toLowerCase()
                  .replace(/^\w/, c => c.toUpperCase())}
              </Typography>

              <TableContainer
                sx={{
                  mb: 4,
                  overflowX: "auto",
                  maxWidth: "100%",
                  borderRadius: "8px",  // Adds rounded corners to the table container
                  boxShadow: "0px 8px 12px rgba(0, 0, 0, 0.3)",  // Adds a subtle shadow around the container
                }}
              >
                <Table sx={{ border: "1px solid #ddd", borderCollapse: "collapse" }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: "#34495e",  // Light background for table headers
                        borderBottom: "2px solid #ddd",  // Border under the header
                      }}
                    >
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", color: "white" }}>Intern ID</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", minWidth: '150px', color: "white" }}>Student Name</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", color: "white" }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", color: "white" }}>Batch</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", color: "white" }}>Attempt</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", color: "white" }}>Attempt Name</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", color: "white" }}>Technical</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", color: "white" }}>MCQ</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", color: "white" }}>Oral</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", color: "white" }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", color: "white" }}>Remark</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", minWidth: '160px', color: "white" }}>Pending Technical</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", minWidth: '160px', color: "white" }}>Pending MCQ</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", minWidth: '160px', color: "white" }}>Pending Oral</TableCell>
                      <TableCell sx={{ fontWeight: "bold", textAlign: "center", border: "1px solid #ddd", minWidth: '160px', color: "white" }}>Pending Remark</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultsForAttempt.length > 0 ? (
                      resultsForAttempt.map((result) => (
                        <TableRow
                          key={`${result.student_id}-${result.attempt}`}
                          sx={{
                            "&:nth-of-type(even)": {
                              backgroundColor: "#fafafa",
                            },
                            "&:hover": {
                              backgroundColor: "#f0f0f0",
                            },
                          }}
                        >
                          <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{result.student_id}</TableCell>
                          <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{result.student_name}</TableCell>
                          <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{result.email_id}</TableCell>
                          <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{result.batch_name}</TableCell>
                          <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{result.attempt}</TableCell>
                          <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{result.attempt_name}</TableCell>
                          <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{result.technical ?? "-"}</TableCell>
                          <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{result.mcq ?? "-"}</TableCell>
                          <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{result.oral ?? "-"}</TableCell>
                          <TableCell sx={{ textAlign: "center", border: "1px solid #ddd" }}>{result.total ?? "-"}</TableCell>
                          <TableCell
                            sx={{
                              textAlign: "center",
                              fontWeight: "bold",
                              color:
                                result.remark?.toLowerCase() === "pass"
                                  ? "green"
                                  : result.remark?.toLowerCase() === "fail"
                                    ? "red"
                                    : "",
                              border: "1px solid #ddd",
                            }}
                          >
                            {result.remark ?? "-"}
                          </TableCell>
                          <TableCell
                            sx={{
                              textAlign: "center",
                              border: "1px solid #ddd",
                              color: formatBoolean(result.pending_technical).color,  // Apply the color
                            }}
                          >
                            {formatBoolean(result.pending_technical).text}  {/* Display the text */}
                          </TableCell>

                          <TableCell
                            sx={{
                              textAlign: "center",
                              border: "1px solid #ddd",
                              color: formatBoolean(result.pending_mcq).color,  // Apply the color
                            }}
                          >
                            {formatBoolean(result.pending_mcq).text}  {/* Display the text */}
                          </TableCell>

                          <TableCell
                            sx={{
                              textAlign: "center",
                              border: "1px solid #ddd",
                              color: formatBoolean(result.pending_oral).color,  // Apply the color
                            }}
                          >
                            {formatBoolean(result.pending_oral).text}  {/* Display the text */}
                          </TableCell>

                          <TableCell
                            sx={{
                              textAlign: "center",
                              border: "1px solid #ddd",
                              color: formatBoolean(result.pending_remark).color,  // Apply the color
                            }}
                          >
                            {formatBoolean(result.pending_remark).text}  {/* Display the text */}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={14} sx={{ textAlign: "center" }}>
                          No records found for Attempt {attempt}.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          );
        })}
      </Container>
    </>
  );
};

export default EvaluationResult;
