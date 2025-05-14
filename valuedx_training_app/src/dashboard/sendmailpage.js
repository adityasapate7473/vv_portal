import React, { useEffect, useState, useRef } from "react";
import {
    Tabs,
    Tab,
    Box,
    Typography,
    Button,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    FormControlLabel,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Alert,
    Divider,
} from "@mui/material";
import config from "../config";
import Navbar from "../navbar/navbar";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faUserTie, faUserShield } from "@fortawesome/free-solid-svg-icons";

const EmailSenderPage = () => {
    const [tab, setTab] = useState(0);
    const [role, setRole] = useState("");
    const [trainers, setTrainers] = useState([]);
    const [students, setStudents] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [managers, setManagers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [includeCredentials, setIncludeCredentials] = useState(true);
    const [includeMessage, setIncludeMessage] = useState(true);
    const [includeWebsiteLink, setIncludeWebsiteLink] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBatch, setSelectedBatch] = useState("All");
    const [batches, setBatches] = useState([]);
    const [customSubject, setCustomSubject] = useState("");
    const [snackOpen, setSnackOpen] = useState(false);
    const [snackMessage, setSnackMessage] = useState("");
    const [snackSeverity, setSnackSeverity] = useState("success"); // or "error", "warning", etc.
    const [attachment, setAttachment] = useState(null);


    const websiteLink = "https://vvms.vishvavidya.com/";

    const getCookie = (name) => {
        const match = document.cookie.match(
            "(^|;)\\s*" + name + "\\s*=\\s*([^;]+)"
        );
        return match ? match.pop() : "";
    };

    const cookieRole = getCookie("role");
    const userid = getCookie("userid");

    useEffect(() => {

        setRole(cookieRole);

        if (cookieRole === "admin" || cookieRole === "trainer" || cookieRole === "manager" || cookieRole === "developer") {
            fetch(`${config.API_BASE_URL}/api/instructorlist`)
                .then((res) => res.json())
                .then(setTrainers);

            fetch(`${config.API_BASE_URL}/api/getstudents`)
                .then((res) => res.json())
                .then((data) => {
                    console.log("Fetched Students:", data);
                    setStudents(data);
                });

            fetch(`${config.API_BASE_URL}/api/adminlist`)
                .then((res) => res.json())
                .then((data) => {
                    console.log("Fetched Admins:", data);
                    setAdmins(data);
                });

            fetch(`${config.API_BASE_URL}/api/managerlist`)
                .then((res) => res.json())
                .then((data) => {
                    console.log("Fetched Managers:", data);
                    setManagers(data);
                });

            // Fetch all batches
            fetch(`${config.API_BASE_URL}/api/getgrades`)
                .then((res) => res.json())
                .then((data) => {
                    setBatches(data);
                });

        }
    }, []);

    const filterUsers = (data) => {
        let filtered = [...data];

        // Batch filter only on students
        if ((role === "admin" || role === "manager" && tab === 0) || role === "trainer" || role === "developer") {
            if (selectedBatch && selectedBatch !== "" && selectedBatch !== "All") {
                filtered = filtered.filter((user) => user.batch_name === selectedBatch);
            }
        }

        if (!searchTerm.trim()) return filtered;

        return filtered.filter((user) => {
            const name = user.instructor_name || user.student_name || user.name || "";
            const email = user.email || user.email_id || user.student_email || user.username || "";
            const username = user.username || user.user_name || "";

            const term = searchTerm.toLowerCase();
            return (
                name.toLowerCase().includes(term) ||
                email.toLowerCase().includes(term) ||
                username.toLowerCase().includes(term)
            );
        });
    };

    const getUniqueBatches = () => {
        const batches = students.map((s) => s.batch).filter(Boolean);
        return ["All", ...new Set(batches)];
    };

    const handleSelectUser = (id) => {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
        );
    };

    const getUserId = (user) => user.id || user._id || user.userid || "N/A";

    const handleSelectAll = (userList) => {
        const allIds = userList.map(getUserId);
        setSelectedUsers((prev) =>
            prev.length === allIds.length ? [] : allIds
        );
    };


    const quillRef = useRef();

    useEffect(() => {
        const editor = quillRef.current?.getEditor?.().root;

        if (editor) {
            editor.style.height = "auto";
            editor.style.overflowY = "hidden";
            editor.style.minHeight = "100px";
            editor.style.paddingBottom = "10px";
            editor.style.borderRadius = "8px"; // Add border radius

            const resize = () => {
                editor.style.height = "auto";
                editor.style.height = editor.scrollHeight + "px";
            };

            resize(); // on mount
            const observer = new MutationObserver(resize);
            observer.observe(editor, { childList: true, subtree: true, characterData: true });

            return () => observer.disconnect();
        }
    }, [message]);


    const handleSendMail = async () => {

        const role = getCookie("role");
        const userid = getCookie("userid");

        // Step 1: Check if sender has email & email_password
        try {
            const response = await fetch(`${config.API_BASE_URL}/api/check-profile-completion`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role, userid })
            });

            const data = await response.json();

            const senderEmail = data.email;
            const senderPassword = data.email_password;

            if (!senderEmail || !senderPassword) {
                setSnackMessage("Email or Email Password not found. Please update your profile to send emails.");
                setSnackSeverity("warning");
                setSnackOpen(true);
                return;
            }
        } catch (err) {
            console.error("Error fetching sender credentials:", err);
            setSnackMessage("Failed to fetch sender email credentials.");
            setSnackSeverity("error");
            setSnackOpen(true);
            return;
        }

        const selectedList = [...trainers, ...students].filter((user) =>
            selectedUsers.includes(user.id || user._id)
        );

        try {
            for (let user of selectedList) {
                const name = user.instructor_name || user.student_name || "User";
                const email = user.email || user.email_id || user.student_email || user.username;
                const username = user.id;
                const password = user.password || user.Password;

                let content = `
                    <div style="margin: 0; padding: 0; background-color: #f4f4f4;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f4; padding: 20px 0;">
                        <tr>
                        <td align="center">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            
                            <tr>
                                <td style="text-align: center; padding: 20px;">
                                    <img src="https://vishvavidya.com/wp-content/uploads/2024/07/Vishvavidya-logo-e1719900509472.png" alt="Vishva Vidya Logo" width="200" style="max-width: 100%; height: auto;" />
                                </td>
                            </tr>

                            <tr>
                                <td style="background-color: #1976d2; color: #ffffff; text-align: center; padding: 20px;">
                                <h2 style="margin: 0; font-size: 22px;">VishvaVidya Management System</h2>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 25px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333;">
                                <p style="font-size: 16px; line-height: 1.5;">Dear <strong>${name}</strong>,</p>

                                ${includeCredentials ? `
                                <p>We are pleased to share your login credentials:</p>
                                <table width="100%" style="margin: 10px 0 20px; background: #f1f1f1; border-radius: 5px; font-size: 15px;">
                                    <tr>
                                    <td style="padding: 10px;"><strong>Username:</strong></td>
                                    <td style="padding: 10px;">${username}</td>
                                    </tr>
                                    <tr>
                                    <td style="padding: 10px;"><strong>Password:</strong></td>
                                    <td style="padding: 10px;">${password}</td>
                                    </tr>
                                </table>
                                ` : ''}

                                 ${includeMessage && message.trim() !== '' ? `
                                <div style="margin-top: 20px;">
                                    <div style="background: #fefefe; border-left: 4px solid #1976d2; padding: 10px 15px; font-size: 15px; line-height: 1.6;">
                                    ${message.replace(/\n/g, "<br/>")}
                                    </div>
                                </div>
                                ` : ''}

                                ${includeWebsiteLink ? `
                                <p>You can access the platform using the button below:</p>
                                <div style="text-align: center; margin: 25px 0;">
                                    <a href="${websiteLink}" target="_blank" style="background-color: #1976d2; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px;">Go to Website</a>
                                </div>
                                ` : ''}
                            
                                <p style="margin-top: 30px;">Best regards,<br/>Team Vishva Vidya</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="background-color: #eeeeee; text-align: center; padding: 15px; font-size: 12px; color: #555;">
                                Please do not share your credentials with anyone. This is an automated email.
                                </td>
                            </tr>
                            </table>
                        </td>
                        </tr>
                    </table>
                    </div>
                    `;

                let subjectParts = [];

                if (includeCredentials) subjectParts.push("Login Credentials");
                if (includeWebsiteLink) subjectParts.push("Platform Access");
                if (includeMessage && message.trim() !== "") subjectParts.push("Message from Vishva Vidya");

                const subject =
                    customSubject.trim() !== ""
                        ? customSubject.trim()
                        : subjectParts.length > 0
                            ? `Vishva Vidya - ${subjectParts.join(" | ")}`
                            : "Important Information from Vishva Vidya";


                await fetch(`${config.API_BASE_URL}/api/send-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email,
                        subject,
                        content,
                        role: role || "",
                        userid: userid,
                    }),
                });
            }

            setSnackMessage("Emails sent successfully!");
            setSnackSeverity("success");
            setSnackOpen(true);
            setSelectedUsers([]);
            setMessage("");

            // Wait 2 seconds, then refresh
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error("Email sending failed:", error);
            setSnackMessage("Failed to send emails.");
            setSnackSeverity("error");
            setSnackOpen(true);
        }
    };

    const renderTable = (data) => (
        <>
            {/* Search + Batch Filter + Clear Filters */}
            <Box display="flex" gap={2} alignItems="center" mb={1} flexWrap="wrap">
                <TextField
                    label="Search by name or email"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flex: 1, maxWidth: 350 }}
                />

                {(role === "trainer"|| role === "admin" || role === "manager") && (
                    <FormControl size="small" sx={{ flex: 1, maxWidth: 250 }}>
                        <InputLabel id="batch-filter-label">Filter by Batch</InputLabel>
                        <Select
                            labelId="batch-filter-label"
                            value={selectedBatch}
                            label="Filter by Batch"
                            onChange={(e) => setSelectedBatch(e.target.value)}
                        >
                            <MenuItem value="All">All Batches</MenuItem>
                            {batches.map((batch) => (
                                <MenuItem key={batch.id || batch._id} value={batch.batch_name}>
                                    {batch.batch_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {(searchTerm.trim() !== '' || (selectedBatch !== 'All' && (role === "trainer"  || tab === 0))) && (
                    <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => {
                            setSearchTerm('');
                            setSelectedBatch('All');
                        }}
                        sx={{ height: 40 }}
                    >
                        Clear Filters
                    </Button>
                )}
            </Box>

            {/* Select All */}
            {/* <FormControlLabel
                control={
                    <Checkbox
                        checked={selectedUsers.length === data.length}
                        indeterminate={selectedUsers.length > 0 && selectedUsers.length < data.length}
                        onChange={() => handleSelectAll(data)}
                    />
                }
                label="Select All"
            /> */}

            {/* Table Container with Sticky Header and Scrollable Body */}
            <Box
                sx={{
                    overflow: "hidden",
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    boxShadow: 2,
                    mt: 1,
                }}
            >
                {/* Combined table: head + scrollable body */}

                {/* Scrollable body only */}
                <Box
                    sx={{
                        maxHeight: 200, // Max height before scroll
                        overflowY: "auto",
                        border: "1px solid #e0e0e0",
                        borderRadius: 2,
                        boxShadow: 2,
                    }}
                >
                    <Table stickyHeader size="small" sx={{ minWidth: 650, borderCollapse: "separate", borderSpacing: 0 }}>
                        <TableHead>
                            <TableRow
                                sx={{
                                    backgroundColor: "#34495e",
                                    "& th": {
                                        backgroundColor: "#34495e",
                                        color: "#ffffff",
                                        fontWeight: "bold",
                                        position: "sticky",
                                        top: 0,
                                        zIndex: 1,
                                        borderRight: "1px solid #ddd",
                                        borderBottom: "2px solid #ccc",
                                    },
                                }}
                            >
                                <TableCell padding="checkbox" sx={{ borderLeft: "1px solid #ddd" }}>
                                    <Checkbox
                                        sx={{
                                            color: "#fff",
                                            "&.Mui-checked": { color: "#fff" },
                                        }}
                                        checked={selectedUsers.length === data.length}
                                        indeterminate={selectedUsers.length > 0 && selectedUsers.length < data.length}
                                        onChange={() => handleSelectAll(data)}
                                    />
                                </TableCell>
                                <TableCell>ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                {(role === "trainer" || role === "admin" || role === "manager") && (tab === 0 && <TableCell>Batch</TableCell>)}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filterUsers(data).length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={tab === 0 ? 5 : 4} align="center">
                                        <Typography variant="body2" color="text.secondary" py={2}>
                                            No data found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filterUsers(data).map((user, index) => {
                                    const id = user.id || user._id || user.userid || "N/A";
                                    const name = user.instructor_name || user.student_name || user.name || "N/A";
                                    const email = user.email || user.email_id || user.student_email || user.username || "No Email";
                                    const batch = user.batch_name || "N/A";

                                    return (
                                        <TableRow
                                            key={id}
                                            hover
                                            sx={{
                                                backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff",
                                                "&:hover": {
                                                    backgroundColor: "#e3f2fd",
                                                },
                                                "& td": {
                                                    borderRight: "1px solid #ddd",
                                                    borderBottom: "1px solid #eee",
                                                },
                                            }}
                                        >
                                            <TableCell padding="checkbox" sx={{ borderLeft: "1px solid #ddd" }}>
                                                <Checkbox
                                                    checked={selectedUsers.includes(id)}
                                                    onChange={() => handleSelectUser(id)}
                                                    sx={{
                                                        color: "#34495e",
                                                        "&.Mui-checked": {
                                                            color: "#1976d2",
                                                        },
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>{id}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{name}</TableCell>
                                            <TableCell sx={{ color: email ? "inherit" : "red" }}>
                                                {email || <i>No Email</i>}
                                            </TableCell>
                                            {(role === "trainer" || role === "admin" || role === "manager") && (tab === 0 && <TableCell>{batch}</TableCell>)}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>

                    </Table>
                </Box>
            </Box>

        </>
    );


    return (
        <>
            <Navbar showLogoutButton={true} />
            <Box sx={{ padding: 4, mt: 6 }}>
                <Typography variant="h5" fontWeight={'bold'} gutterBottom>
                    Send Credentials / Email
                </Typography>

                {(role === "admin" || role === "manager" || role === "developer") && (
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Tabs
                            value={tab}
                            onChange={(e, val) => setTab(val)}
                            centered
                            size="small"
                        >
                            {/* Interns tab only for admin or manager */}
                            {(role === "admin" || role === "manager") && (
                                <Tab
                                    sx={{
                                        fontWeight: "bold",
                                        textAlign: "center",
                                        minHeight: "32px",
                                        paddingY: "4px",
                                    }}
                                    icon={<FontAwesomeIcon icon={faUsers} />}
                                    iconPosition="start"
                                    label="Interns"
                                />
                            )}

                            {/* Instructors tab only for admin, manager, trainer */}
                            {(role !== "developer") && (
                                <Tab
                                    sx={{
                                        fontWeight: "bold",
                                        textAlign: "center",
                                        minHeight: "32px",
                                        paddingY: "4px",
                                    }}
                                    icon={<FontAwesomeIcon icon={faUserTie} />}
                                    iconPosition="start"
                                    label="Instructors"
                                />
                            )}

                            {/* Admins tab for developer only */}
                            {(role === "developer" || role === "manager") && (
                                <Tab
                                    sx={{
                                        fontWeight: "bold",
                                        textAlign: "center",
                                        minHeight: "32px",
                                        paddingY: "4px",
                                    }}
                                    icon={<FontAwesomeIcon icon={faUserShield} />}
                                    iconPosition="start"
                                    label="Admins"
                                />
                            )}

                            {/* Managers tab for developer only */}
                            {role === "developer" && (
                                <Tab
                                    sx={{
                                        fontWeight: "bold",
                                        textAlign: "center",
                                        minHeight: "32px",
                                        paddingY: "4px",
                                    }}
                                    icon={<FontAwesomeIcon icon={faUserShield} />}
                                    iconPosition="start"
                                    label="Managers"
                                />
                            )}
                        </Tabs>
                    </Box>
                )}


                <Box
                    mt={2}
                    p={2}
                    border="1px solid #ccc"
                    borderRadius="12px"
                    boxShadow={2}
                    bgcolor="#fff"
                >
                    {/* Students or Trainers Table */}
                    {((role === "admin" || role === "manager") && tab === 0) || role === "trainer"
                        ? renderTable(students)
                        : null}
                    {(role === "admin" || role === "manager") && tab === 1 && renderTable(trainers)}
                    {(role === "manager") && tab === 2 && renderTable(admins)}

                    {(role === "developer" && tab === 0) && renderTable(admins)}
                    {(role === "developer" && tab === 1) && renderTable(managers)}


                    {/* Email Options */}
                    <Box mt={2}>
                        <Typography variant="subtitle1" fontWeight="bold">What to include in email:</Typography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={includeCredentials}
                                    onChange={() => {
                                        setIncludeCredentials(!includeCredentials);
                                        setIncludeWebsiteLink(!includeWebsiteLink); // sync
                                    }}
                                />
                            }
                            label="Login Credentials & Website Link"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={includeMessage}
                                    onChange={() => setIncludeMessage(!includeMessage)}
                                />
                            }
                            label="Include Optional Message"
                        />
                    </Box>

                    {/* Message Editor */}
                    {includeMessage && (
                        <Box mt={2}>
                            <TextField
                                label="Subject (optional)"
                                variant="outlined"
                                fullWidth
                                value={customSubject}
                                onChange={(e) => setCustomSubject(e.target.value)}
                                sx={{ mb: 1 }}
                            />
                            <ReactQuill
                                theme="snow"
                                value={message}
                                onChange={setMessage}
                                ref={quillRef}
                                style={{ marginBottom: "10px", borderRadius: "8px" }}
                            />
                        </Box>
                    )}

                    {/* Send Button */}
                    <Box textAlign="left" mt={2}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSendMail}
                            disabled={
                                selectedUsers.length === 0 ||
                                (!includeCredentials && !includeMessage && !includeWebsiteLink)
                            }
                        >
                            Send Email
                        </Button>
                    </Box>
                </Box>

            </Box>
            <Snackbar
                open={snackOpen}
                autoHideDuration={4000}
                onClose={() => setSnackOpen(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setSnackOpen(false)}
                    severity={snackSeverity}
                    sx={{ width: "100%" }}
                >
                    {snackMessage}
                </Alert>
            </Snackbar>

        </>
    );
};

export default EmailSenderPage;