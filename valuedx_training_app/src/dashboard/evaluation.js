import React, { useState, useEffect } from 'react';
import Navbar from '../navbar/navbar';
import config from "../config";
import {
  TextField, Radio, RadioGroup, Checkbox, FormControlLabel, Select, InputLabel, Button, Grid, Typography, Container, Box,
  MenuItem, FormControl, FormHelperText, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Tabs, Tab, Divider, Tooltip, Modal, Autocomplete
} from '@mui/material';
import AssessmentIcon from "@mui/icons-material/Assessment";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import axios from 'axios';
import { Snackbar, Alert } from '@mui/material';
import * as XLSX from 'xlsx';

const EvaluationForm = () => {
  const initialFormData = {
    studentName: '',
    contactNumber: '',
    email_id: '',
    batchName: '',
    trackName: '',
    initialScreening: false,
    module1: false,
    module2: false,
    module3: false,
    module4: false,
    aptitudeMarks: 0,
    aptitudePercentage: 0,
    aptitudeResult: '',
    communicationSkills: '',
    module1TechnicalMarks: 0,
    module1MCQMarks: 0,
    module1OralMarks: 0,
    module1TotalMarks: 0,
    module1Remark: '',
    module2TechnicalMarks: 0,
    module2MCQMarks: 0,
    module2OralMarks: 0,
    module2TotalMarks: 0,
    module2Remark: '',
    module3TechnicalMarks: 0,
    module3MCQMarks: 0,
    module3OralMarks: 0,
    module3TotalMarks: 0,
    module3Remark: '',
    module4TechnicalMarks: 0,
    module4MCQMarks: 0,
    module4OralMarks: 0,
    module4TotalMarks: 0,
    module4Remark: '',
    module1Name: '',
    module2Name: '',
    module3Name: '',
    module4Name: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState(""); // "success" or "error"
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState("");
  const [batches, setBatches] = useState([]);
  const [file, setFile] = useState(null);

  const [registrationType, setRegistrationType] = useState("single");

  const [dialogTitle, setDialogTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [filteredEvaluation, setFilteredEvaluations] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [evaluatedStudent, setEvaluatedStudent] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [selectedTab, setSelectedTab] = useState("evaluationForm"); // Default Tab
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");

  const [date, setDate] = useState(() => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split("T")[0];
  });

  const [selectedModules, setSelectedModules] = useState({
    module1: true,
    module2: true,
    module3: true,
    module4: true,
  });

  const [selectedBatch, setSelectedBatch] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedAttempts, setSelectedAttempts] = useState({
    attempt1: true,
    attempt2: false,
    attempt3: false,
    attempt4: false
  });

  const [attemptNames, setAttemptNames] = useState({});
  const selectedAttempt = Object.keys(selectedAttempts).find(attempt => selectedAttempts[attempt]);

  const getCookie = (name) => {
    const match = document.cookie.match(
      "(^|;)\\s*" + name + "\\s*=\\s*([^;]+)"
    );
    return match ? match.pop() : "";
  };

  const role = getCookie("role");
  const userid = getCookie("userid");


  useEffect(() => {
    fetch(`${config.API_BASE_URL}/api/getBatchNames`)
      .then(response => response.json())
      .then(data => setBatches(data));
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    setDate(today.toISOString().split("T")[0]);
    console.log("Today's Date:", date);

    fetchTracks();
  }, []);

  const handleTrackChange = (event) => {
    const track = event.target.value;
    setSelectedTrack(track);
    setSelectedBatch("");         // Clear previously selected batch
    setStudents([]);              // Clear the current student list
    setFormData({});              // Clear any existing form data
    fetchBatchesByTrack(track);   // Fetch batches for the newly selected track
  };

  // Fetch Batches when Track is Selected
  const fetchTracks = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/tracks`);
      setTracks(response.data);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    }
  };

  const fetchBatchesByTrack = async (trackName) => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/getBatchesByTrack`, {
        params: { trackName },
      });
      setBatches(response.data);
    } catch (error) {
      console.error("Error fetching batches by track:", error);
      setBatches([]); // Reset batches if error occurs
    }
  };

  const handleBatchChange = (event) => {
    const batch = event.target.value;
    setSelectedBatch(batch);

  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear errors dynamically when user corrects input
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: '',
      }));
    }
  };


  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await fetch(`${config.API_BASE_URL}/getTracks`);
        const data = await response.json();
        setTracks(data); // ✅ Ensure `data` is directly used, not mapped
      } catch (error) {
        console.error("Error fetching tracks:", error);
      }
    };

    fetchTracks();

    const calculateTotalMarks = (module) => {
      return (
        (parseFloat(formData[`${module}TechnicalMarks`] || 0) +
          parseFloat(formData[`${module}MCQMarks`] || 0) +
          parseFloat(formData[`${module}OralMarks`] || 0)) || 0
      );
    };

    if (formData.module1) {
      setFormData({
        ...formData,
        module1TotalMarks: calculateTotalMarks('module1'),
      });
    }
    if (formData.module2) {
      setFormData({
        ...formData,
        module2TotalMarks: calculateTotalMarks('module2'),
      });
    }
    if (formData.module3) {
      setFormData({
        ...formData,
        module3TotalMarks: calculateTotalMarks('module3'),
      });
    }
    if (formData.module4) {
      setFormData({
        ...formData,
        module4TotalMarks: calculateTotalMarks('module4'),
      });
    }
  }, [
    formData.module1TechnicalMarks,
    formData.module1MCQMarks,
    formData.module1OralMarks,
    formData.module2TechnicalMarks,
    formData.module2MCQMarks,
    formData.module2OralMarks,
    formData.module3TechnicalMarks,
    formData.module3MCQMarks,
    formData.module3OralMarks,
    formData.module4TechnicalMarks,
    formData.module4MCQMarks,
    formData.module4OralMarks,
  ]);

  const validateForm = () => {
    let isValid = true;
    let errors = [];

    students.forEach(student => {
      const data = formData[student.email_id];
      if (data?.selected) {
        Object.keys(selectedAttempts).forEach(attempt => {
          if (selectedAttempts[attempt]) {
            const attemptData = data[attempt] || {};
            const pending = attemptData.pending || {};

            ['technical', 'mcq', 'oral'].forEach(field => {
              const value = attemptData[field];
              if (!pending[field] && (value === undefined || value === '')) {
                errors.push(
                  `${student.student_name} (${student.email_id}) → ${attempt.replace('attempt', 'Attempt ')}: ${field.toUpperCase()} is required`
                );
                isValid = false;
              }
            });

            const remark = attemptData['remark'];
            if (!pending['remark'] && (remark === undefined || remark === '')) {
              errors.push(
                `${student.student_name} (${student.email_id}) → ${attempt.replace('attempt', 'Attempt ')}: Remark is required`
              );
              isValid = false;
            }

            if (!attemptNames[attempt] || attemptNames[attempt].trim() === '') {
              errors.push(`Attempt name for ${attempt.replace('attempt', 'Attempt ')} is required.`);
              isValid = false;
            }
          }
        });
      }
    });

    if (!isValid && errors.length > 0) {
      setSnackbarMessage(errors[0]); // show only the first error in Snackbar
      setSnackbarOpen(true);
    }

    return isValid;
  };


  const onSubmit = () => {
    if (!validateForm()) {
      // alert('Please fill all required fields for selected students.');
      return;
    }
    handleSubmit();
  };

  const handleSubmit = async () => {
    const selectedStudents = students.filter(student => formData[student.email_id]?.selected);
    if (selectedStudents.length === 0) {
      alert("Please select at least one student");
      return;
    }

    const attemptKey = Object.keys(selectedAttempts).find(a => selectedAttempts[a]);

    const dataToSend = {
      batchName: selectedBatch,
      created_by_userid: userid,
      created_by_role: role,
      students: selectedStudents.map(student => {
        const studentForm = formData[student.email_id];
        const evaluationAttempt = studentForm?.[attemptKey] || {};

        return {
          email_id: student.email_id,
          id: student.id,
          student_name: student.student_name,
          evaluationData: {
            attempt: attemptKey,
            attemptName: attemptNames[attemptKey] || "",
            technical: evaluationAttempt.technical || null,
            mcq: evaluationAttempt.mcq || null,
            oral: evaluationAttempt.oral || null,
            total: evaluationAttempt.total || null,
            remark: evaluationAttempt.remark || null,
            pendingTechnical: evaluationAttempt.pending?.technical || null,
            pendingMcq: evaluationAttempt.pending?.mcq || null,
            pendingOral: evaluationAttempt.pending?.oral || null,
            pendingRemark: evaluationAttempt.pending?.remark || null,
          }
        };
      })
    };

    console.log("Sending data:", JSON.stringify(dataToSend, null, 2));

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        fetchEvaluations();
        setFormData(initialFormData); // Reset form

        setTimeout(() => {
          window.location.reload();
        }, 2000);
        setSelectedTab("studentData");
        setSnackbarMessage("✅ Evaluation result submitted successfully!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage(errors[0]);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }

    } catch (error) {
      console.error("Error submitting evaluation:", error);
      setSnackbarMessage(`Error submitting evaluation: ${error.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSnackbarOpen(true);
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogMessage('');
  };

  // ********************* //
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    handleClearFilters();
  }

  // 🟢 Fetch Available Batches
  const fetchBatches = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/getBatchNames`);
      const data = await response.json();
      setBatches(data.map((batch) => batch.batch_name)); // Extract batch names
      setBatchFilter(data.map((batch) => batch.batch_name));
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // useEffect(() => {
  //   const filteredData = evaluations.filter((student) => {
  //     const matchesSearch = student.student_name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  //     const matchesBatch = batchFilter === "" || student.batch_name.toLowerCase() === batchFilter.toLowerCase();
  //     return matchesSearch && matchesBatch;
  //   });

  //   setFilteredEvaluations(filteredData);
  //   setIsFilterApplied(searchQuery.trim() !== "" || batchFilter !== ""); // Set true if any filter is applied
  // }, [searchQuery, batchFilter, evaluations]);

  // 🟢 Apply Filters
  // const handleApplyFilter = () => {
  //   const filteredData = evaluations.filter((student) =>
  //     student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
  //     (batchFilter === "" || student.batch_name === batchFilter)
  //   );

  //   setFilteredEvaluations(filteredData);
  //   setIsFilterApplied(true);
  // };

  // ✅ Handle Student Selection (Select Duplicates Based on Filters)
  const handleSelectStudent = (student) => {
    setSelectedStudents((prev) => {
      const exists = prev.some(
        (s) =>
          s.student_name === student.student_name &&
          s.contact_number === student.contact_number &&
          s.email_id === student.email_id &&
          s.batch_name === student.batch_name
      );

      return exists
        ? prev.filter(
          (s) =>
            !(
              s.student_name === student.student_name &&
              s.contact_number === student.contact_number &&
              s.email_id === student.email_id &&
              s.batch_name === student.batch_name
            )
        )
        : [...prev, student];
    });
  };

  // ✅ Fix "Select All" to Work Only on Filtered Data
  const handleSelectAll = () => {
    if (selectedStudents.length === filteredEvaluations.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredEvaluations);
    }
  };

  // Handle Attempt Selection
  const handleAttemptSelection = (attempt) => {
    setSelectedAttempts({ ...selectedAttempts, [attempt]: !selectedAttempts[attempt] });
  };

  const handleStudentSelect = (e, studentId) => {
    if (e.target.checked) {
      // Add student to selected list
      setSelectedStudents((prev) => [...prev, studentId]);
    } else {
      // Remove student from selected list
      setSelectedStudents((prev) => prev.filter((id) => id !== studentId));
    }

    console.log("Selected students:", selectedStudents);
  };

  const checkEmailCredentials = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/check-profile-completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, userid }),
      });

      const data = await response.json();

      if (!data.email || !data.email_password) {
        setSnackbarMessage("Email or Email Password is missing. Please update your profile to proceed.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Credential check error:", err);
      setSnackbarMessage("Unable to validate sender email credentials.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return false;
    }
  };

  // Send Mail to Selected Students
  const handleSendMail = async () => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student to send the email_id.");
      return;
    }
    // ✅ Check email/email_password before continuing
    const isMailValid = await checkEmailCredentials();
    if (!isMailValid) return;

    console.log("📩 Sending email_ids to selected students:", selectedStudents);

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/sendEvaluationMail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          students: selectedStudents, // Ensure this is correct
          selectedAttempts,
          role: role || "",
          userid: userid,
        }),
      });

      const result = await response.json();
      console.log("📬 Mail API Response:", result);

      if (response.ok) {
        alert("Email IDs sent successfully!");
      } else {
        alert(`Failed to send email IDs: ${result.message}`);
      }
    } catch (error) {
      console.error("Error sending email_ids:", error);
      alert("Error sending email_ids.");
    }
  };

  // Fetch tracks on mount
  useEffect(() => {
    fetch("/getTracks")
      .then((res) => res.json())
      .then((data) => setTracks(data))
      .catch((err) => console.error("Failed to fetch tracks:", err));
  }, []);

  // Fetch batches when a track is selected
  useEffect(() => {
    if (selectedTrack) {
      fetch(`/api/getBatchesByTrack?trackName=${encodeURIComponent(selectedTrack)}`)
        .then((res) => res.json())
        .then((data) => setBatches(data.map(batch => batch.batch_name)))
        .catch((err) => console.error("Failed to fetch batches:", err));
    } else {
      setBatches([]);
      setSelectedBatch("");
    }
  }, [selectedTrack]);

  useEffect(() => {
    if (selectedBatch && selectedAttempt && !evaluatedStudent) {
      fetch(`${config.API_BASE_URL}/api/getstudentsbyattempt?batchName=${selectedBatch}&selectedAttempt=${selectedAttempt}`)
        .then(res => res.json())
        .then(data => {
          setStudents(data);
          const initialForm = {};
          data.forEach(student => {
            initialForm[student.email_id] = {
              selected: false,
              [selectedAttempt]: createEmptyAttempt()
            };
          });
          setFormData(initialForm);
        })
        .catch(error => {
          console.error("Error fetching filtered students:", error);
          setStudents([]);
        });
    }
  }, [selectedBatch, selectedAttempt]);


  const createEmptyAttempt = () => ({
    technical: '',
    mcq: '',
    oral: '',
    total: 0,
    remark: '',
    pending: {
      technical: false,
      mcq: false,
      oral: false,
      remark: false
    }
  });

  const handleAttemptSelect = (selected) => {
    setSelectedAttempts({
      attempt1: false,
      attempt2: false,
      attempt3: false,
      attempt4: false,
      [selected]: true
    });
  };


  const handleInputChange = (email_id, attempt, field, value) => {
    const updated = { ...formData[email_id] };
    updated[attempt][field] = value;

    if (['technical', 'mcq', 'oral'].includes(field)) {
      const t = parseFloat(updated[attempt].technical) || 0;
      const m = parseFloat(updated[attempt].mcq) || 0;
      const o = parseFloat(updated[attempt].oral) || 0;
      updated[attempt].total = t + m + o;
    }

    setFormData(prev => ({
      ...prev,
      [email_id]: updated
    }));
  };

  const togglePendingDropdown = (email, attempt, field, value) => {
    const isPending = value === 'Pending';

    setFormData(prev => {
      const student = prev[email] || {};
      const attemptData = student[attempt] || {};
      const pending = attemptData.pending || {};

      return {
        ...prev,
        [email]: {
          ...student,
          [attempt]: {
            ...attemptData,
            [field]: isPending ? '' : attemptData[field], // Clear field if pending
            pending: {
              ...pending,
              [field]: isPending
            }
          }
        }
      };
    });
  };

  const handleAttemptNameChange = (attempt, name) => {
    setAttemptNames(prev => ({
      ...prev,
      [attempt]: name,
    }));
  };

  useEffect(() => {
    if (selectedBatch && students.length > 0 && Object.values(selectedAttempts).includes(true)) {
      const selectedAttemptKeys = Object.keys(selectedAttempts).filter(k => selectedAttempts[k]);
      const studentIds = students.map(s => s.id);

      fetch('/api/evaluations/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName: selectedBatch,
          studentIds,
          attempts: selectedAttemptKeys
        })
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        }).then(data => {
          console.log('Fetched evaluation data:', data);
          const updatedFormData = { ...formData };

          data.forEach(evaluation => {
            const email = evaluation.email_id;
            const attempt = evaluation.attempt;

            if (!updatedFormData[email]) updatedFormData[email] = {};

            updatedFormData[email][attempt] = {
              technical: evaluation.technical,
              mcq: evaluation.mcq,
              oral: evaluation.oral,
              total: evaluation.total,
              remark: evaluation.remark,
              pending: {
                technical: evaluation.pending_technical ? 'Pending' : 'Completed',
                mcq: evaluation.pending_mcq ? 'Pending' : 'Completed',
                oral: evaluation.pending_oral ? 'Pending' : 'Completed',
                remark: evaluation.pending_remark ? 'Pending' : 'Completed'
              }
            };
          });

          setFormData(updatedFormData);
        })
        .catch(err => console.error("Failed to fetch evaluation data:", err));
    }
  }, [selectedBatch, selectedAttempts, students]);


  // Fetch Student Evaluations
  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/getStudentEvaluations`);
      const data = await response.json();
      console.log("Fetched data:", data);
      setEvaluations(data);
      setSearchQuery('');
      setBatchFilter('');
      setIsFilterApplied(false);
      setFilteredEvaluations(data); // ✅ Default view
    } catch (error) {
      console.error("Error fetching student evaluations:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Clear Filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setBatchFilter('');
    setIsFilterApplied(false);
    setFilteredEvaluations(evaluations);
  };

  useEffect(() => {
    const noFilters = !searchQuery && !batchFilter;

    if (noFilters) {
      setFilteredEvaluations(evaluations); // ✅ Show all by default
    } else {
      let filtered = [...evaluations]; // ✅ FIX: don't assign directly

      if (searchQuery) {
        filtered = filtered.filter((evalData) =>
          evalData.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          evalData.email_id.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (batchFilter) {
        filtered = filtered.filter((evalData) => evalData.batch_name === batchFilter);
      }

      setFilteredEvaluations(filtered);
    }
  }, [searchQuery, batchFilter, evaluations]);

  const filteredEvaluations = evaluations.filter((evalData) => {
    const matchesSearch = searchQuery
      ? evalData.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evalData.email_id?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesBatch = batchFilter ? evalData.batch_name === batchFilter : true;

    return matchesSearch && matchesBatch;
  });

  const fetchTrackByBatch = async (batchName) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/getTrackByBatch?batchName=${batchName}`);
      const data = await response.json();
      return data.track_name; // Assuming your API returns an object like { track_name: "Java" }
    } catch (error) {
      console.error("Error fetching track name:", error);
      return "";
    }
  };

  const handleEdit = async (student) => {
    const attemptKey = student.attempt?.toLowerCase().includes("1")
      ? "attempt1"
      : student.attempt?.toLowerCase().includes("2")
        ? "attempt2"
        : student.attempt?.toLowerCase().includes("3")
          ? "attempt3"
          : "attempt4";

    const fetchedTrackName = await fetchTrackByBatch(student.batch_name);

    setSelectedTrack(fetchedTrackName);  // <-- ✅ set track name
    setSelectedBatch(student.batch_name);
    setSelectedAttempts({
      attempt1: attemptKey === "attempt1",
      attempt2: attemptKey === "attempt2",
      attempt3: attemptKey === "attempt3",
      attempt4: attemptKey === "attempt4",
    });

    setAttemptNames({ [attemptKey]: student.attempt_name });  // <-- ✅ set attempt name
    setEvaluatedStudent(student);
    setSelectedTab("evaluationForm");

    setStudents([{
      id: student.student_id,
      student_name: student.student_name,
      email_id: student.email_id,
      contact_number: student.contact_number || '',
      batch_name: student.batch_name,
    }]);

    const form = {
      [student.email_id]: {
        selected: true,
        [attemptKey]: {
          technical: student.technical || '',
          mcq: student.mcq || '',
          oral: student.oral || '',
          total: student.total || 0,
          remark: student.remark || '',
          pending: {
            technical: student.pending_technical || false,
            mcq: student.pending_mcq || false,
            oral: student.pending_oral || false,
            remark: student.pending_remark || false,
          },
        },
      },
    };

    setFormData(form);
  };

  useEffect(() => {
    if (selectedTrack && selectedBatch && !batches.find(b => b.batch_name === selectedBatch)) {
      setBatches(prev => [...prev, { batch_name: selectedBatch }]);
    }
  }, [selectedTrack, selectedBatch, batches]);

  // const fetchEvaluations = async () => {
  //   const response = await fetch("/api/evaluations");
  //   const data = await response.json();
  //   setEvaluations(data);
  // };

  const handleDownloadExcel = () => {
    const formattedData = filteredEvaluations.map((evalData) => ({
      "Student ID": evalData.student_id || "N/A",
      "Student Name": evalData.student_name || "N/A",
      "Email ID": evalData.email_id || "N/A",
      "Batch Name": evalData.batch_name || "N/A",
      "Attempt No.": evalData.attempt ?? "N/A",
      "Technical Marks": evalData.technical_marks ?? 0,
      "Technical Status": evalData.pending_technical ? "Pending" : "Completed",
      "MCQ Marks": evalData.mcq_marks ?? 0,
      "MCQ Status": evalData.pending_mcq ? "Pending" : "Completed",
      "Oral Marks": evalData.oral_marks ?? 0,
      "Oral Status": evalData.pending_oral ? "Pending" : "Completed",
      "Total Marks": evalData.total ?? 0,
      "Remark": evalData.remark || "-",
      "Remark Status": evalData.pending_remark ? "Pending" : "Completed"
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Auto column width
    const columnWidths = Object.keys(formattedData[0] || {}).map((key) => ({
      wch: Math.max(key.length + 2, ...formattedData.map((row) => (row[key]?.toString().length || 0))) + 2,
    }));
    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Evaluations");

    XLSX.writeFile(workbook, "Student_Evaluation_Report.xlsx");
  };

  return (
    <>
      <Navbar showLogoutButton={true} />

      <>
        <Tabs sx={{ mt: 9, fontWeight: "bold" }} value={selectedTab} onChange={handleTabChange} centered>
          <Tab sx={{ fontWeight: "bold" }} label="Mark Evaluation" value="evaluationForm" icon={<ListAltIcon />}
            iconPosition="start"
          />

          {/* Line Between Tabs */}
          <Divider orientation="vertical" flexItem
            sx={{ height: "30px", mx: 1, borderColor: "primary.main", borderWidth: "2px", mt: 3 }}
          />

          <Tab
            sx={{ fontWeight: "bold" }} label="Student Evaluation Data"
            value="studentData"
            icon={<AssessmentIcon />}
            iconPosition="start"
          />
        </Tabs>
      </>

      {selectedTab === "evaluationForm" && (
        <Container
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #ddd",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.4)",
          }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', textAlign: "center" }}>
            Mark Evaluation
          </Typography>
          {/* <RadioGroup row value={registrationType} onChange={handleRegistrationTypeChange} sx={{ mb: 3 }}>
            <FormControlLabel value="single" control={<Radio />} label="Single Student Evaluation" />
            <FormControlLabel value="bulk" control={<Radio />} label="Bulk Students Evaluation (File Type: Excel)" />
          </RadioGroup> */}

          {registrationType === "single" && (
            <Container sx={{ mt: 3 }}>
              {/* Track / Batch / Attempt Inputs */}
              <Box sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
                {/* Track Select */}
                <FormControl fullWidth variant="outlined" sx={{ flex: 1 }} disabled={!!evaluatedStudent}>
                  <InputLabel>Track Name *</InputLabel>
                  <Select label="Track Name *" value={selectedTrack} onChange={handleTrackChange} fullWidth>
                    <MenuItem value="">Select Track</MenuItem>
                    {tracks.map(track => (
                      <MenuItem key={track.id} value={track.track_name}>{track.track_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Batch Select */}
                <FormControl fullWidth sx={{ flex: 1 }} disabled={!!evaluatedStudent}>
                  <InputLabel>Select Batch *</InputLabel>
                  <Select
                    label="Select Batch *"
                    value={selectedBatch || ""}
                    onChange={handleBatchChange}
                  >
                    {!selectedTrack
                      ? <MenuItem disabled>Please select a track first</MenuItem>
                      : batches.length === 0
                        ? <MenuItem disabled>No batches available</MenuItem>
                        : batches.map(batch => (
                          <MenuItem key={batch.batch_name} value={batch.batch_name}>
                            {batch.batch_name}
                          </MenuItem>
                        ))}
                  </Select>
                </FormControl>


                {/* Attempt Select */}
                <FormControl fullWidth sx={{ flex: 1 }} disabled={!!evaluatedStudent}>
                  <InputLabel>Select Attempt *</InputLabel>
                  <Select
                    value={Object.keys(selectedAttempts).find(attempt => selectedAttempts[attempt]) || ''}
                    onChange={(e) => handleAttemptSelect(e.target.value)}
                    label="Select Attempt *"
                  >
                    {Object.keys(selectedAttempts).map(attempt => (
                      <MenuItem key={attempt} value={attempt}>{attempt.replace('attempt', 'Attempt ')}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Attempt Name TextField */}
                {selectedAttempt && (
                  <TextField
                    label={`${selectedAttempt.replace('attempt', 'Attempt ')} Name *`}
                    variant="outlined"
                    fullWidth
                    sx={{ flex: 1 }}
                    value={attemptNames[selectedAttempt] || ''}
                    onChange={(e) => handleAttemptNameChange(selectedAttempt, e.target.value)}
                  />
                )}
              </Box>

              {selectedTrack && selectedBatch && selectedAttempt && (
                <Typography variant="subtitle1" sx={{ color: "#444", textAlign: "center", m: 1 }}>
                  Below are the students from the batch <strong>{selectedBatch}</strong> whose <strong>{selectedAttempt.replace('attempt', 'Attempt ')}</strong> evaluation is pending.
                </Typography>
              )}

              {/* Student Table */}
              <TableContainer component={Paper} sx={{ maxHeight: 280, overflow: "auto" }}>

                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ border: '1px solid #ccc', width: '5%' }}>
                        <Checkbox
                          checked={
                            students.length > 0 &&
                            students.every(student => formData[student.email_id]?.selected)
                          }
                          indeterminate={
                            students.some(student => formData[student.email_id]?.selected) &&
                            !students.every(student => formData[student.email_id]?.selected)
                          }
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setFormData(prev => {
                              const updated = { ...prev };
                              students.forEach(student => {
                                if (updated[student.email_id]) {
                                  updated[student.email_id].selected = isChecked;
                                }
                              });
                              return updated;
                            });
                          }}
                        />

                      </TableCell>
                      <TableCell sx={{ border: '1px solid #ccc', textAlign: 'center' }}><strong>Student ID</strong></TableCell>
                      <TableCell sx={{ border: '1px solid #ccc', textAlign: 'center' }}><strong>Email ID</strong></TableCell>
                      <TableCell sx={{ border: '1px solid #ccc', textAlign: 'center', minWidth: 200 }}><strong>Student Name</strong></TableCell>
                      {Object.keys(selectedAttempts).map((attempt, index) => selectedAttempts[attempt] && (
                        <React.Fragment key={attempt}>
                          {['Technical', 'MCQ', 'Oral'].map(section => (
                            <React.Fragment key={section}>
                              <TableCell sx={{ border: '1px solid #ccc', textAlign: 'center', minWidth: 180 }}>
                                <strong>Attempt {index + 1} {section}</strong>
                              </TableCell>
                              <TableCell sx={{ border: '1px solid #ccc', textAlign: 'center', minWidth: 100 }}>
                                <strong>Status</strong>
                              </TableCell>
                            </React.Fragment>
                          ))}
                          <TableCell sx={{ border: '1px solid #ccc', textAlign: 'center', minWidth: 180 }}>
                            <strong>Attempt {index + 1} Total</strong>
                          </TableCell>
                          <TableCell sx={{ border: '1px solid #ccc', textAlign: 'center', minWidth: 300 }}>
                            <strong>Attempt {index + 1} Remark</strong>
                          </TableCell>
                          <TableCell sx={{ border: '1px solid #ccc', textAlign: 'center', minWidth: 100 }}>
                            <strong>Status</strong>
                          </TableCell>
                        </React.Fragment>
                      ))}

                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow><TableCell colSpan={14} align="center">No student records available.</TableCell></TableRow>
                    ) : (
                      students.map(student => {
                        const data = formData[student.email_id];
                        if (!data) return null;

                        return (
                          <TableRow key={student.email_id} hover>
                            <TableCell sx={{ border: '1px solid #ccc', textAlign: 'center' }}>
                              <Checkbox
                                checked={data.selected || false}
                                onChange={(e) =>
                                  setFormData(prev => ({
                                    ...prev,
                                    [student.email_id]: {
                                      ...prev[student.email_id],
                                      selected: e.target.checked
                                    }
                                  }))
                                }
                              />
                            </TableCell>
                            <TableCell sx={{ border: '1px solid #ccc' }}>{student.id}</TableCell>
                            <TableCell sx={{ border: '1px solid #ccc' }}>{student.email_id}</TableCell>
                            <TableCell sx={{ border: '1px solid #ccc' }}>{student.student_name}</TableCell>
                            {Object.keys(selectedAttempts).map(attempt =>
                              selectedAttempts[attempt] && (
                                <React.Fragment key={attempt}>
                                  {['technical', 'mcq', 'oral'].map(field => (
                                    <React.Fragment key={field}>
                                      <TableCell sx={{ border: '1px solid #ccc' }}>
                                        <Tooltip
                                          title={data[attempt]?.pending?.[field] === true ? "Marked as Pending. Cannot enter marks." : ""}
                                          arrow
                                          placement="top"
                                        >
                                          <div>
                                            <TextField
                                              size="small"
                                              type="text"
                                              value={data[attempt]?.[field] || ''}
                                              required={data.selected && !data[attempt]?.pending?.[field]}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                if (/^\d*\.?\d*$/.test(value)) {
                                                  handleInputChange(student.email_id, attempt, field, value);
                                                }
                                              }}
                                              disabled={data[attempt]?.pending?.[field] === true || !data.selected}
                                              fullWidth
                                            />
                                          </div>
                                        </Tooltip>

                                      </TableCell>
                                      <TableCell sx={{ border: '1px solid #ccc' }}>
                                        <FormControl size="small" fullWidth>
                                          <Select
                                            value={data[attempt]?.pending?.[field] === true ? 'Pending' : 'Completed'}
                                            onChange={(e) =>
                                              togglePendingDropdown(student.email_id, attempt, field, e.target.value)
                                            }
                                          >
                                            <MenuItem value="Completed">
                                              <Tooltip title="Completed"><CheckCircleIcon color="success" /></Tooltip>
                                            </MenuItem>
                                            <MenuItem value="Pending">
                                              <Tooltip title="Pending"><HourglassEmptyIcon color="warning" /></Tooltip>
                                            </MenuItem>
                                          </Select>
                                        </FormControl>
                                      </TableCell>
                                    </React.Fragment>
                                  ))}

                                  <TableCell sx={{ border: '1px solid #ccc', textAlign: 'center' }}>{data[attempt]?.total || 0}</TableCell>

                                  {/* Remark */}
                                  <TableCell sx={{ border: '1px solid #ccc', width: 100 }}>
                                    <Autocomplete
                                      fullWidth
                                      options={['Excellent', 'Good', 'Needs Improvement', 'Average', 'Poor']}  // Predefined options
                                      value={data[attempt]?.remark || ''}  // Show the current remark value (either from options or custom)
                                      onChange={(e, newValue) => {
                                        handleInputChange(student.email_id, attempt, 'remark', newValue || "");  // Handle the remark input
                                      }}
                                      freeSolo  // Allows for free text input, not just predefined options
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          error={false}  // Remove the error state to prevent the red border
                                          required={data.selected && data[attempt]?.pending?.remark !== 'Pending'}
                                          disabled={data[attempt]?.pending?.remark === 'Pending' || !data.selected}
                                          placeholder="Select or enter a remark"
                                          sx={{
                                            '& .MuiInputBase-root': {
                                              padding: '4px 8px', // Reduced padding to reduce height
                                              height: '40px', // Optional: Set a fixed height for the input
                                              color: 'black', // Change font color to black
                                              '&.MuiOutlinedInput-root': {
                                                borderColor: 'black', // Change border color to black when not in error state
                                                '&:hover': {
                                                  borderColor: '#3f51b5', // Change border color on hover (blue)
                                                },
                                              },
                                            },
                                            '& .MuiFormLabel-root': {
                                              fontSize: '0.875rem', // Adjust font size if needed
                                              color: 'black', // Change label color to black
                                            },
                                          }}
                                        />
                                      )}
                                      sx={{
                                        width: '100%', // Ensure the width is 100% of the TableCell container
                                        '& .MuiAutocomplete-paper': {
                                          backgroundColor: '#e0f7fa', // Change the background color to a light cyan
                                          borderRadius: '4px', // Rounded corners for the dropdown
                                          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Soft shadow for the dropdown
                                          '& .MuiAutocomplete-option': {
                                            padding: '8px 16px', // Padding for each option
                                            '&:hover': {
                                              backgroundColor: '#b2ebf2', // Lighter cyan background on hover
                                            },
                                          },
                                          '& .MuiAutocomplete-option[aria-selected="true"]': {
                                            backgroundColor: '#00796b', // Dark cyan background for selected option
                                            color: 'white', // White text for the selected option
                                          },
                                        },
                                      }}
                                    />
                                  </TableCell>


                                  <TableCell sx={{ border: '1px solid #ccc' }}>
                                    <FormControl size="small" fullWidth>
                                      <Select
                                        value={data[attempt]?.pending?.remark === true ? 'Pending' : 'Completed'}
                                        onChange={(e) =>
                                          togglePendingDropdown(student.email_id, attempt, 'remark', e.target.value)
                                        }
                                      >
                                        <MenuItem value="Completed">
                                          <Tooltip title="Completed"><CheckCircleIcon color="success" /></Tooltip>
                                        </MenuItem>
                                        <MenuItem value="Pending">
                                          <Tooltip title="Pending"><HourglassEmptyIcon color="warning" /></Tooltip>
                                        </MenuItem>
                                      </Select>
                                    </FormControl>
                                  </TableCell>
                                </React.Fragment>
                              )
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 1 }}>
                <Button variant="contained" color="primary" onClick={onSubmit}>Save All</Button>
              </Box>
            </Container>
          )}
        </Container>
      )}

      {selectedTab === "studentData" && (
        <Container
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #ddd",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.4)",
          }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold", textAlign: "center" }}>
            Student Evaluation Data
          </Typography>

          {/* 🔍 Search & Filter Section */}
          <Box sx={{ display: "flex", justifyContent: "space-evenly", padding: "10px", mb: 1, border: "1px solid #ddd" }}>
            <TextField
              label="Search Student"
              variant="outlined"
              size="small"
              sx={{ minWidth: "40%" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Batch Filter */}
            <FormControl sx={{ minWidth: "40%" }} size="small">
              <InputLabel>Batch Name</InputLabel>
              <Select label="Batch Name" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {batches.map((batch, index) => (
                  <MenuItem key={index} value={batch}>
                    {batch}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Apply & Clear Filter Buttons */}
            {(searchQuery || batchFilter) && (
              <Button variant="outlined" color="secondary" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </Box>

          {/* Table Section */}
          <TableContainer component={Paper} sx={{ maxHeight: 280, overflow: "auto" }}>
            <Table size="small" stickyHeader>

              <TableHead>
                <TableRow>
                  <TableCell sx={{ border: "1px solid #ccc", fontWeight: "bold", textAlign: "center" }}>
                    <Checkbox
                      checked={selectedStudents.length === filteredEvaluations.length && filteredEvaluations.length > 0}
                      indeterminate={
                        selectedStudents.length > 0 &&
                        selectedStudents.length < filteredEvaluations.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  {[
                    "Student ID", "Student Name", "Email ID", "Batch Name", "Attempt", "Attempt Name", "Technical", "Pending Technical",
                    "MCQ", "Pending MCQ", "Oral", "Pending Oral", "Total", "Remark", "Pending Remark", "Edit"
                  ].map((header, idx) => (
                    <TableCell key={idx} sx={{ border: "1px solid #ccc", fontWeight: "bold", textAlign: "center" }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvaluations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} align="center">No student records available.</TableCell>
                  </TableRow>
                ) : (
                  filteredEvaluations.map((evalData) => (
                    <TableRow key={evalData.id}>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        <Checkbox
                          checked={selectedStudents.includes(evalData)}
                          onChange={(e) => handleStudentSelect(e, evalData)}
                        />
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>{evalData.student_id}</TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>{evalData.student_name}</TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>{evalData.email_id}</TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>{evalData.batch_name}</TableCell>
                      <TableCell
                        sx={{
                          border: "1px solid #ccc",
                          width: 120,
                          whiteSpace: "nowrap",
                          textAlign: "center"
                        }}
                      >
                        {`Attempt ${String(evalData.attempt).replace("attempt", "")}`}
                      </TableCell>

                      <TableCell sx={{ border: "1px solid #ccc" }}>{evalData.attempt_name}</TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>{evalData.technical}</TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        <span style={{ color: evalData.pending_technical ? "orange" : "green", fontWeight: "bold" }}>
                          {evalData.pending_technical ? "Pending" : "Completed"}
                        </span>
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>{evalData.mcq}</TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        <span style={{ color: evalData.pending_mcq ? "orange" : "green", fontWeight: "bold" }}>
                          {evalData.pending_mcq ? "Pending" : "Completed"}
                        </span>
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>{evalData.oral}</TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        <span style={{ color: evalData.pending_oral ? "orange" : "green", fontWeight: "bold" }}>
                          {evalData.pending_oral ? "Pending" : "Completed"}
                        </span>
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>{evalData.total}</TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>{evalData.remark}</TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        <span style={{ color: evalData.pending_remark ? "orange" : "green", fontWeight: "bold" }}>
                          {evalData.pending_remark ? "Pending" : "Completed"}
                        </span>
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #ccc" }}>
                        <Button variant="outlined" color="primary" onClick={() => handleEdit(evalData)}>Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Footer Section */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1, mb: 1 }}>
            {["attempt1", "attempt2", "attempt3", "attempt4"].map((key) => (
              <FormControlLabel
                key={key}
                control={<Checkbox checked={selectedAttempts[key]} onChange={() => handleAttemptSelection(key)} />}
                label={`Attempt ${key.slice(-1)}`}
              />
            ))}
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: { xs: 2, sm: 0 }, mb: 1 }}>
            <Button variant="contained" color="primary" onClick={handleSendMail}>
              Send Mail
            </Button>
            <Button variant="contained" color="secondary" onClick={handleDownloadExcel}>
              Download Excel
            </Button>
          </Box>
        </Container>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
export default EvaluationForm;