import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Paper, Card, CardContent, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, Chip,
  Divider, Stack, Pagination
} from '@mui/material';
import Navbar from '../navbar/navbar';
import {
  Groups, School, CalendarMonth, TrendingUp, WarningAmber, EmojiEvents,
  Assessment, AssignmentLate, AdminPanelSettings, Handshake
} from '@mui/icons-material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import axios from 'axios';
import config from '../config';
import ResumeBuilder from "./profile_form";
import PartnerDashboard from "./partner_home";
import AccessCardDashboard from "../AccessCard/accesscarddashboard";
import { LinearProgress } from '@mui/material';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingExams, setPendingExams] = useState([]);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [showTable, setShowTable] = useState(false);
  const [internStatusStats, setInternStatusStats] = useState([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 4;
  const [topBatch, setTopBatch] = useState({ name: "-", attendance: 0 });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        attendanceRes,
        pendingRes,
        internStatusRes,
        topBatchRes
      ] = await Promise.all([
        axios.get(`${config.API_BASE_URL}/api/dashboard/stats`, { withCredentials: true }),
        axios.get(`${config.API_BASE_URL}/api/dashboard/attendance`, { withCredentials: true }),
        axios.get(`${config.API_BASE_URL}/api/dashboard/pending-exams`, { withCredentials: true }),
        axios.get(`${config.API_BASE_URL}/api/dashboard/interns-by-status`, { withCredentials: true }),
        axios.get(`${config.API_BASE_URL}/api/dashboard/top-batch`, { withCredentials: true }) // 👈 this one
      ]);
  
      setStats(statsRes.data);
      setAttendanceData(attendanceRes.data);
      setPendingExams(pendingRes.data);
      setInternStatusStats(internStatusRes.data);
      setTopBatch(topBatchRes.data); // 👈 set the top batch directly
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getRoleFromCookie = () => {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
      const [name, value] = cookie.split("=");
      if (name === "role") {
        return value;
      }
    }
    return "";
  };

  const getNameFromCookie = () => {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
      const [name, value] = cookie.split("=");
      if (name === "name") {
        return decodeURIComponent(value);
      }
    }
    return "";
  };

  useEffect(() => {
    const userRole = getRoleFromCookie();
    setRole(userRole);

    const name = getNameFromCookie();
    setName(name);

    if (userRole === "admin" || userRole === "trainer" || userRole === 'manager' || userRole === 'developer') {
      setShowTable(true);
    }
  }, []);

  const getColor = (val) => {
    if (val >= 85) return 'success';
    if (val >= 70) return 'warning';
    return 'error';
  };

  const batchesWithLowAttendance = attendanceData.filter(b => b.attendance < 65);

  if (loading || !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
        <CircularProgress size={60} color="primary" />
      </Box>
    );
  }

  const statsArray = [
    {
      label: "Interns",
      value: stats.students,
      icon: <Groups fontSize="small" />,
      bgColor: "#3A6EA5",
    },
    {
      label: "Instructors",
      value: stats.instructors,
      icon: <School fontSize="small" />,
      bgColor: "#4C6E91",
    },
    {
      label: "Batches",
      value: stats.batches,
      icon: <CalendarMonth fontSize="small" />,
      bgColor: "#2A4051",
    },
    {
      label: "Admins",
      value: stats.admins,
      icon: <AdminPanelSettings fontSize="small" />,
      bgColor: "#546E7A",
    },
    {
      label: "Partners",
      value: stats.partners,
      icon: <Handshake fontSize="small" />,
      bgColor: "#6D4C41",
    },
  ];

  const paginatedData = pendingExams.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  return (
    <>
      <Navbar showLogoutButton={true} />
      {role === "intern" && <ResumeBuilder />}
      {role === "partner" && <PartnerDashboard />}
      {role === "ITAdmin" && <AccessCardDashboard />}
      {(role === "admin" || role === "trainer" || role === 'manager' || role === 'developer') && showTable && (
        <Box sx={{ flexGrow: 1, pt: 2, pr: 5, pb: 6, pl: 6, mt: 8 }}>
          {/* Stat Cards */}
          <Grid container spacing={2} sx={{ py: 1 }}>
            {statsArray.map((item, index) => (
              <Grid item xs={12} sm={6} md={2.4} key={index}>
                <Card
                  sx={{
                    backgroundColor: item.bgColor,
                    color: "#fff",
                    borderRadius: 3,
                    boxShadow: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    p: 2,
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {item.label}
                      </Typography>
                      {item.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 2 }}>
                      {item.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>



          {/* Attendance Overview */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 3,
                  boxShadow: 2,
                  bgcolor: '#E1F5FE',
                  borderLeft: '6px solid #0288D1',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: '#01579B', display: 'flex', alignItems: 'center', mb: 1 }}
                >
                  <TrendingUp sx={{ mr: 1, fontSize: 22 }} />
                  Attendance Overview
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {/* Line Chart Box */}
                <Box
                  sx={{
                    border: '1px solid #81D4FA',
                    borderRadius: 2,
                    p: 1.5,
                    mb: 3,
                    backgroundColor: '#ffffff',
                  }}
                >
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart
                      data={attendanceData}
                      margin={{ top: 10, right: 15, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="attendance"
                        stroke="#0288D1"
                        strokeWidth={2}
                        activeDot={{ r: 5 }}
                        dot={{ stroke: '#0288D1', strokeWidth: 1.5, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>

                {/* Batch Attendance Table */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#01579B', mb: 1 }}>
                  Batch Attendance Summary
                </Typography>
                <Table
                  size="small"
                  sx={{
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    borderRadius: 2,
                    overflow: 'hidden',
                    '& th, & td': {
                      border: '1px solid #B3E5FC',
                    },
                    '& th': {
                      backgroundColor: '#B3E5FC',
                      color: '#01579B',
                      fontWeight: 600,
                    },
                    '& td': {
                      backgroundColor: '#ffffff',
                    },
                    // Rounded corners on the table
                    '& thead tr:first-of-type th:first-of-type': {
                      borderTopLeftRadius: 8,
                    },
                    '& thead tr:first-of-type th:last-of-type': {
                      borderTopRightRadius: 8,
                    },
                    '& tbody tr:last-of-type td:first-of-type': {
                      borderBottomLeftRadius: 8,
                    },
                    '& tbody tr:last-of-type td:last-of-type': {
                      borderBottomRightRadius: 8,
                    },
                  }}
                >

                  <TableHead>
                    <TableRow>
                      <TableCell>Batch</TableCell>
                      <TableCell>Attendance (%)</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceData.map((batch, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{batch.name}</TableCell>
                        <TableCell>{batch.attendance}%</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              batch.attendance >= 85
                                ? 'Excellent'
                                : batch.attendance >= 70
                                  ? 'Average'
                                  : 'Low'
                            }
                            color={getColor(batch.attendance)}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>

          {/* Top Performing and Low Attendance */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Top Performing Batch */}
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  height: '100%',
                  p: 2,
                  borderRadius: 3,
                  boxShadow: 2,
                  bgcolor: '#E0F7FA',
                  borderLeft: '5px solid #0076A1',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#003C5D', display: 'flex', alignItems: 'center' }}>
                  <EmojiEvents sx={{ mr: 1, fontSize: 20, color: '#0076A1' }} />
                  Top Performing Batch
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#0076A1' }}>
                    {topBatch.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Attendance: <b>{topBatch.attendance}%</b>
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Low Attendance Batches */}
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  height: '100%',
                  p: 2,
                  borderRadius: 3,
                  boxShadow: 2,
                  bgcolor: '#FFF3F3',
                  borderLeft: '5px solid #D32F2F',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#B71C1C', display: 'flex', alignItems: 'center' }}>
                  <WarningAmber sx={{ mr: 1, fontSize: 20, color: '#D32F2F' }} />
                  Batches with Low Attendance
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {batchesWithLowAttendance.length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#555' }}>
                      All batches have good attendance.
                    </Typography>
                  ) : (
                    batchesWithLowAttendance.map((batch, idx) => (
                      <Typography key={idx} variant="body2" sx={{ color: '#D32F2F' }}>
                        {batch.name}: <b>{batch.attendance}%</b>
                      </Typography>
                    ))
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Intern Status Chart and Count */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: 2,
                  bgcolor: '#FFFDE7',
                  borderLeft: '6px solid #FBC02D',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: '#F57F17',
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Assessment sx={{ mr: 1 }} />
                  Interns by Training Status
                </Typography>

                {/* Bar Chart */}
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={internStatusStats}
                    margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                    barCategoryGap={30}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="training_status" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#FBC02D" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                {/* New Design: Pill Badges */}
                <Grid container spacing={2} sx={{ mt: 1 }} justifyContent="center">
                  {internStatusStats.map((item, idx) => (
                    <Grid item key={idx}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          backgroundColor: '#FFEB3B',
                          borderRadius: '10px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#6D4C41',
                          boxShadow: 1,
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: 4,
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {item.training_status} :
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#F57F17' }}>
                          {item.count}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          {/* Pending Exams */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: 2,
                  bgcolor: '#E8F5E9',
                  borderLeft: '6px solid #43A047',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: '#2E7D32',
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Assessment sx={{ mr: 1, fontSize: 22 }} />
                  Pending Exams & Remarks
                </Typography>

                {pendingExams.length > 0 ? (
                  <Table size="small" sx={{
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    '& th, & td': {
                      border: '1px solid #C8E6C9',
                    },
                    '& th': {
                      backgroundColor: '#C8E6C9',
                      color: '#1B5E20',
                      fontWeight: 600,
                    }
                  }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Batch</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Pending</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedData.map((exam, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{exam.student_name}</TableCell>
                          <TableCell>{exam.batch_name}</TableCell>
                          <TableCell>{exam.email_id}</TableCell>
                          <TableCell>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {exam.pending_technical && (
                                <Chip label="Technical" color="warning" size="small" />
                              )}
                              {exam.pending_mcq && (
                                <Chip label="MCQ" color="warning" size="small" />
                              )}
                              {exam.pending_oral && (
                                <Chip label="Oral" color="warning" size="small" />
                              )}
                              {exam.pending_remark && (
                                <Chip label="Remark" color="warning" size="small" />
                              )}
                            </Box>
                          </TableCell>

                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography
                    sx={{
                      mt: 2,
                      color: '#388E3C',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                    }}
                  >
                    All students' evaluations are completed!
                  </Typography>
                )}

                {pendingExams.length > rowsPerPage && (
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                      count={Math.ceil(pendingExams.length / rowsPerPage)}
                      page={page}
                      onChange={handleChangePage}
                      color="primary"
                    />
                  </Box>
                )}

              </Paper>
            </Grid>
          </Grid>

        </Box>
      )}
    </>
  );
};

export default Dashboard;
