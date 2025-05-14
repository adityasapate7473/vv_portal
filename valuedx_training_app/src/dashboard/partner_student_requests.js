import React, { useState, useEffect } from "react";
import Navbar from "../navbar/navbar";
import {
  Typography,
  Container,
  Table,
  TableContainer,
  Link,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Pagination,
} from "@mui/material";
import "./partner_student_request.css";
import config from "../config";

const StudentRequest = () => {
  const [studentList, setStudentList] = useState([]);
  const [showStudentTable, setShowStudentTable] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10); // Number of rows per page

  useEffect(() => {
    const fetchStudentRequests = async () => {
      try {
        const response = await fetch(
          `${config.API_BASE_URL}/api/getPartnerStudentsRequests`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setStudentList(data);
        setShowStudentTable(true);
      } catch (error) {
        console.error("Error fetching student requests:", error);
      }
    };

    fetchStudentRequests();
  }, []);

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Calculate pagination indexes
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  // Format date function
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-GB").format(date); // 'en-GB' locale formats dates as dd/mm/yyyy
  };

  return (
    <>
      <Navbar showLogoutButton={true} />
      <br />
      <br />
      <Container className="mt-4">
        <Typography
          variant="h5"
          sx={{ marginTop: "30px", marginBottom: "10px", fontWeight: "bold" }}
          gutterBottom
        >
          Client Requests
        </Typography>
        {showStudentTable && (
          <TableContainer component={Paper}>
            <Table className="table-hover">
              <TableHead>
                <TableRow>
                  <TableCell>Sr. No.</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email ID</TableCell>
                  <TableCell>Request Date</TableCell>
                  <TableCell>Client Name</TableCell>
                  <TableCell>Company Name</TableCell>
                  <TableCell>Company Website</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentList
                  .slice(startIndex, endIndex)
                  .map((student, index) => {
                    const websiteUrl = student.company_website.startsWith('http')
                      ? student.company_website
                      : `https://${student.company_website}`;

                    return (
                      <TableRow key={index}>
                        <TableCell>{startIndex + index + 1}</TableCell>
                        <TableCell sx={{ fontStyle: "initial" }}>
                          {student.student_name}
                        </TableCell>
                        <TableCell sx={{ color: "#5A4FCF" }}>
                          {student.email_id}
                        </TableCell>
                        <TableCell>{formatDate(student.request_date)}</TableCell>
                        <TableCell>{student.client_name}</TableCell>
                        <TableCell>{student.company_name}</TableCell>
                        <TableCell>
                          <Link
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{textDecoration:'none'}}
                          >
                            {student.company_website}
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Pagination
          count={Math.ceil(studentList.length / rowsPerPage)}
          page={page}
          onChange={handleChangePage}
          color="primary"
          size="medium"
          siblingCount={1} // Number of sibling page buttons to show
          boundaryCount={1} // Number of first and last page buttons to show
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
          }}
        />
      </Container>
    </>
  );
};

export default StudentRequest;
