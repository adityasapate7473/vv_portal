import React, { useState, useEffect } from "react";
import {
    Container,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    IconButton,
    Checkbox,
    FormControlLabel,
    Grid,
    Switch,
    Divider,
    Paper,
    Tabs,
    Tab,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    Stack
} from "@mui/material";
import { AddCircleOutline, Delete, Image, Visibility, LibraryAdd } from "@mui/icons-material";
import axios from "axios";
import Navbar from "../navbar/navbar";
import config from "../config";

const MCQExamCreator = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [examTitle, setExamTitle] = useState("");
    const [examDuration, setExamDuration] = useState(30);
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [instructions, setInstructions] = useState("");
    const [exams, setExams] = useState([]);

    const [selectedExam, setSelectedExam] = useState(null);
    const [isDialogOpen, setDialogOpen] = useState(false);

    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [editExamData, setEditExamData] = useState(null);

    const [loading, setLoading] = useState(false);



    // Fetch all exams when the tab changes to "View Exams"

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { text: "", image: "", options: [{ text: "", image: "" }, { text: "", image: "" }], correct: [], marks: 1 },
        ]);
    };

    const updateQuestion = (index, field, value) => {
        const updated = [...questions];
        updated[index][field] = value;
        setQuestions(updated);
    };

    const updateOption = (qIndex, optIndex, field, value) => {
        const updated = [...questions];
        updated[qIndex].options[optIndex][field] = value;
        setQuestions(updated);
    };

    const toggleCorrect = (qIndex, optIndex) => {
        const updated = [...questions];
        const correctSet = new Set(updated[qIndex].correct);
        correctSet.has(optIndex) ? correctSet.delete(optIndex) : correctSet.add(optIndex);
        updated[qIndex].correct = Array.from(correctSet);
        setQuestions(updated);
    };

    const removeQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const addOption = (qIndex) => {
        const updated = [...questions];
        updated[qIndex].options.push({ text: "", image: "" });
        setQuestions(updated);
    };

    const removeOption = (qIndex, optIndex) => {
        const updated = [...questions];
        if (updated[qIndex].options.length > 2) {
            updated[qIndex].options.splice(optIndex, 1);
            setQuestions(updated);
        }
    };

    const handleTabChange = (event, newIndex) => {
        setTabIndex(newIndex);
    };

    const saveExam = async () => {
        if (!examTitle.trim()) {
            alert("Exam title is required.");
            return;
        }
        if (questions.length === 0) {
            alert("Please add at least one question.");
            return;
        }

        const examData = {
            title: examTitle,
            duration: examDuration,
            instructions,
            shuffleQuestions,
            questions
        };

        try {
            const response = await fetch(`${config.API_BASE_URL}/exams`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(examData),
            });

            if (response.ok) {
                alert("Exam created successfully!");
                setTabIndex(1);
                setExamTitle("");
                setQuestions([]);
            } else {
                throw new Error(`Failed to save exam: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error saving exam:", error);
            alert("Failed to save exam.");
        }
    };

    const fetchExamDetails = async (examId) => {
        try {
            const response = await fetch(`${config.API_BASE_URL}/exams/${examId}`);
            if (!response.ok) throw new Error(`Failed to fetch exam: ${response.statusText}`);

            const data = await response.json();
            setSelectedExam(data);
            setDialogOpen(true);
        } catch (error) {
            console.error("Error fetching exam details:", error);
        }
    };

    useEffect(() => {
        if (tabIndex === 1) {
            setLoading(true);
            fetch(`${config.API_BASE_URL}/exams`)
                .then(response => response.json())
                .then(data => {
                    setExams(data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Error fetching exams:", error);
                    setLoading(false);
                });
        }
    }, [tabIndex]);


    const handleEditExam = (exam) => {
        setEditExamData(exam);
        setEditDialogOpen(true);
    };


    const handleDeleteExam = async (examId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this exam?");
        if (confirmDelete) {
            try {
                await fetch(`/exams/${examId}`, { method: "DELETE" });
                setExams(exams.filter((exam) => exam.id !== examId)); // Remove from UI
                alert("Exam deleted successfully!");
            } catch (error) {
                console.error("Error deleting exam:", error);
                alert("Failed to delete exam.");
            }
        }
    };

    const handleUpdateExam = async () => {
        if (!editExamData.title.trim()) {
            alert("Exam title is required.");
            return;
        }

        const updatedExamData = {
            title: editExamData.title,
            duration: editExamData.duration,
            instructions: editExamData.instructions,
            shuffleQuestions: editExamData.shuffleQuestions,
        };

        try {
            const response = await fetch(`${config.API_BASE_URL}/exams/${editExamData.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedExamData),
            });

            if (response.ok) {
                alert("Exam updated successfully!");
                setExams(exams.map((exam) => (exam.id === editExamData.id ? { ...exam, ...updatedExamData } : exam))); // Update UI
                setEditDialogOpen(false); // Close the edit dialog
            } else {
                throw new Error(`Failed to update exam: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error updating exam:", error);
            alert("Failed to update exam.");
        }
    };


    return (
        <>
            <Navbar showLogoutButton={true} />
            <Container maxWidth="md" sx={{ mt: 10, p: 3, bgcolor: "#f9f9f9", borderRadius: "10px", boxShadow: 3 }}>
                <Tabs value={tabIndex} onChange={handleTabChange} centered sx={{ minHeight: "40px" }}>
                    <Tab
                        sx={{ fontWeight: "bold", minHeight: "36px", py: 0.5, px: 1 }}
                        icon={<LibraryAdd />}
                        iconPosition="start"
                        label="Create Exam"
                    />
                    <Tab
                        sx={{ fontWeight: "bold", minHeight: "36px", py: 0.5, px: 1 }}
                        icon={<Visibility />}
                        iconPosition="start"
                        label="View Exams"
                    />
                </Tabs>

                {tabIndex === 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <TextField
                                fullWidth
                                label="Exam Title"
                                variant="outlined"
                                value={examTitle}
                                onChange={(e) => setExamTitle(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                type="number"
                                label="Exam Duration (Minutes)"
                                variant="outlined"
                                value={examDuration}
                                onChange={(e) => setExamDuration(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Exam Instructions"
                                variant="outlined"
                                multiline
                                rows={3}
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <FormControlLabel
                                control={<Switch checked={shuffleQuestions} onChange={() => setShuffleQuestions(!shuffleQuestions)} />}
                                label="Shuffle Questions"
                            />
                        </Paper>

                        <Divider sx={{ mb: 3 }} />

                        {questions.map((q, qIndex) => (
                            <Card key={qIndex} sx={{ mb: 3, borderLeft: "5px solid #1976d2" }}>
                                <CardContent>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={8}>
                                            <TextField
                                                fullWidth
                                                label={`Question ${qIndex + 1}`}
                                                variant="outlined"
                                                value={q.text}
                                                onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                                                sx={{ mb: 2 }}
                                            />
                                        </Grid>
                                        <Grid item xs={4}>
                                            <TextField
                                                type="number"
                                                label="Marks"
                                                variant="outlined"
                                                value={q.marks}
                                                onChange={(e) => updateQuestion(qIndex, "marks", e.target.value)}
                                                sx={{ width: "100%" }}
                                            />
                                        </Grid>
                                    </Grid>

                                    {q.options.map((opt, optIndex) => (
                                        <Grid container key={optIndex} spacing={1} alignItems="center">
                                            <Grid item xs={6}>
                                                <TextField
                                                    fullWidth
                                                    variant="outlined"
                                                    value={opt.text}
                                                    placeholder={`Option ${optIndex + 1}`}
                                                    onChange={(e) => updateOption(qIndex, optIndex, "text", e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={5}>
                                                <FormControlLabel
                                                    control={<Checkbox checked={q.correct.includes(optIndex)} onChange={() => toggleCorrect(qIndex, optIndex)} />}
                                                    label="Correct"
                                                />
                                            </Grid>
                                            <Grid item xs={1}>
                                                {q.options.length > 2 && (
                                                    <IconButton color="error" onClick={() => removeOption(qIndex, optIndex)}>
                                                        <Delete />
                                                    </IconButton>
                                                )}
                                            </Grid>
                                        </Grid>
                                    ))}

                                    <Button variant="outlined" startIcon={<AddCircleOutline />} onClick={() => addOption(qIndex)} sx={{ mt: 2 }}>
                                        Add Option
                                    </Button>

                                    <IconButton onClick={() => removeQuestion(qIndex)} color="error" sx={{ ml: 2 }}>
                                        <Delete />
                                    </IconButton>
                                </CardContent>
                            </Card>
                        ))}

                        <Button variant="contained" startIcon={<AddCircleOutline />} onClick={addQuestion} sx={{ mr: 2 }}>
                            Add Question
                        </Button>
                        <Button variant="contained" color="success" startIcon={<Visibility />} onClick={saveExam}>
                            Preview & Publish
                        </Button>

                    </Box>
                )}

                {tabIndex === 1 && (
                    <Box sx={{ mt: 4, px: 3 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Available Exams
                        </Typography>

                        {exams.length > 0 ? (
                            exams.map((exam) => (
                                <Paper
                                    key={exam.id}
                                    elevation={4}
                                    sx={{
                                        p: 3,
                                        mt: 2,
                                        borderRadius: 3,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        backgroundColor: "#f9f9f9",
                                        transition: "0.3s",
                                        "&:hover": {
                                            backgroundColor: "#f0f0f0",
                                        },
                                    }}
                                >
                                    {/* Exam Details (Left Side) */}
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" color="primary">
                                            {exam.title}
                                        </Typography>
                                        <Typography color="textSecondary">
                                            <strong>Duration:</strong> {exam.duration} minutes
                                        </Typography>
                                    </Box>

                                    {/* Action Buttons (Right Side) */}
                                    <Stack direction="row" spacing={1}>
                                        {/* View Button */}
                                        <Button variant="contained" color="primary" onClick={() => fetchExamDetails(exam.id)}>
                                            View
                                        </Button>

                                        {/* Edit Button */}
                                        <Button variant="contained" color="warning" onClick={() => handleEditExam(exam)}>
                                            Edit
                                        </Button>


                                        {/* Delete Button with Confirmation */}
                                        <Button variant="contained" color="error" onClick={() => handleDeleteExam(exam.id)}>
                                            Delete
                                        </Button>
                                    </Stack>
                                </Paper>
                            ))
                        ) : (
                            <Typography sx={{ mt: 2, textAlign: "center", color: "gray" }}>
                                No exams available.
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Exam Details Dialog */}
                <Dialog open={isDialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ fontWeight: "bold" }}>Exam Details</DialogTitle>
                    <DialogContent dividers sx={{ p: 3 }}>
                        {selectedExam ? (
                            <>
                                <Typography variant="h5">
                                    {selectedExam.exam?.title || "Exam Title Not Available"}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Duration:</strong> {selectedExam.exam?.duration ? `${selectedExam.exam.duration} minutes` : "Not Available"}
                                </Typography>
                                <Typography sx={{ mt: 1 }}>
                                    <strong>Instructions:</strong> {selectedExam.exam?.instructions || "Not Available"}
                                </Typography>

                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6">Questions:</Typography>

                                <List>
                                    {selectedExam.questions.map((q, index) => (
                                        <Paper key={index} sx={{ p: 2, mt: 2, borderLeft: "5px solid #1976d2" }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                                Q{index + 1}: {q.text}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong>Marks:</strong> {q.marks}
                                            </Typography>

                                            <List>
                                                {q.options.map((opt, optIndex) => (
                                                    <ListItem key={optIndex} sx={{ pl: 2 }}>
                                                        <ListItemText
                                                            primary={opt.text}
                                                            primaryTypographyProps={{
                                                                color: (q.correct || []).includes(optIndex) ? "green" : "inherit",
                                                                fontWeight: (q.correct || []).includes(optIndex) ? "bold" : "normal"
                                                            }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Paper>
                                    ))}
                                </List>
                            </>
                        ) : (
                            <Typography>Loading exam details...</Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)} color="primary" variant="contained">Close</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={isEditDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Edit Exam</DialogTitle>
                    <DialogContent>
                        {editExamData && (
                            <>
                                {/* Exam Title, Duration, and Instructions */}
                                <TextField
                                    fullWidth
                                    label="Exam Title"
                                    value={editExamData.title}
                                    onChange={(e) => setEditExamData({ ...editExamData, title: e.target.value })}
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Duration (Minutes)"
                                    value={editExamData.duration}
                                    onChange={(e) => setEditExamData({ ...editExamData, duration: e.target.value })}
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    fullWidth
                                    label="Instructions"
                                    multiline
                                    rows={3}
                                    value={editExamData.instructions}
                                    onChange={(e) => setEditExamData({ ...editExamData, instructions: e.target.value })}
                                    sx={{ mb: 2 }}
                                />

                                {/* Display Questions with Options */}
                                <Typography variant="h6" sx={{ mt: 3 }}>Questions:</Typography>
                                {editExamData.questions && editExamData.questions.map((question, index) => (
                                    <Paper key={index} sx={{ p: 2, mb: 2, borderLeft: "5px solid #1976d2" }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                            Q{index + 1}:
                                        </Typography>

                                        {/* Edit Question Text */}
                                        <TextField
                                            fullWidth
                                            label="Question Text"
                                            value={question.text}
                                            onChange={(e) => {
                                                const updatedQuestions = [...editExamData.questions];
                                                updatedQuestions[index].text = e.target.value;
                                                setEditExamData({ ...editExamData, questions: updatedQuestions });
                                            }}
                                            sx={{ mb: 2 }}
                                        />

                                        {/* Edit Marks for the Question */}
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Marks"
                                            value={question.marks}
                                            onChange={(e) => {
                                                const updatedQuestions = [...editExamData.questions];
                                                updatedQuestions[index].marks = e.target.value;
                                                setEditExamData({ ...editExamData, questions: updatedQuestions });
                                            }}
                                            sx={{ mb: 2 }}
                                        />

                                        {/* Display and Edit Options for Each Question */}
                                        <Typography variant="body2" sx={{ mt: 2, fontWeight: "bold" }}>Options:</Typography>
                                        {question.options.map((option, optIndex) => (
                                            <TextField
                                                key={optIndex}
                                                fullWidth
                                                label={`Option ${optIndex + 1}`}
                                                value={option.text}
                                                onChange={(e) => {
                                                    const updatedQuestions = [...editExamData.questions];
                                                    updatedQuestions[index].options[optIndex].text = e.target.value;
                                                    setEditExamData({ ...editExamData, questions: updatedQuestions });
                                                }}
                                                sx={{ mb: 2 }}
                                            />
                                        ))}
                                        {/* Display Correct Option Highlight (Optional) */}
                                        <List sx={{ mt: 2 }}>
                                            {question.options.map((option, optIndex) => (
                                                <ListItem key={optIndex} sx={{ pl: 2 }}>
                                                    <ListItemText
                                                        primary={option.text}
                                                        primaryTypographyProps={{
                                                            color: (question.correct || []).includes(optIndex) ? "green" : "inherit",
                                                            fontWeight: (question.correct || []).includes(optIndex) ? "bold" : "normal"
                                                        }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Paper>
                                ))}
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)} color="secondary">Cancel</Button>
                        <Button onClick={handleUpdateExam} color="primary" variant="contained">Save Changes</Button>
                    </DialogActions>
                </Dialog>

            </Container>
        </>
    );
};

export default MCQExamCreator;
