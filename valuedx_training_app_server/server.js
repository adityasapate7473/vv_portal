const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const crypto = require("crypto");
const xlsx = require("xlsx");
const fs = require("fs");
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const config = require("./config.js");


const app = express();
const port = 3001;

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use('/profilePic', express.static(path.join(__dirname, 'profilePic')));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Valuedx_Training_App",
  password: "root",
  port: 5432,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "profilePic/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const cvupload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const directory = path.join(__dirname, "reviewresume");
if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory);
}

const finale_directory = path.join(__dirname, "resume");
if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory);
}

// Express.js route
app.get("/templates/student-registration-template.xlsx", (req, res) => {
  const filePath = path.join(__dirname, "templates", "student_registration_template.xlsx");
  res.download(filePath, "Student_Registration_Template.xlsx");
});


async function getEmailCredentials(userId, role) {
  let query;
  let values = [userId];
  let result;

  if (role === "trainer") {
    query = "SELECT email, email_password FROM instructors WHERE id = $1";
    result = await pool.query(query, values);
    if (result.rows.length === 0) throw new Error("Trainer not found");
    return {
      email: result.rows[0].email,
      password: result.rows[0].email_password,
    };
  }

  if (role === "admin") {
    query = "SELECT email_id, email_password FROM register WHERE userid = $1";
    result = await pool.query(query, values);
    if (result.rows.length === 0) throw new Error("Admin not found");
    return {
      email: result.rows[0].email_id,
      password: result.rows[0].email_password,
    };
  }

  if (role === "manager") {
    query = "SELECT email_id, email_password FROM register WHERE userid = $1";
    result = await pool.query(query, values);
    if (result.rows.length === 0) throw new Error("Manager not found");
    return {
      email: result.rows[0].email_id,
      password: result.rows[0].email_password,
    };
  }

  throw new Error("Invalid role provided");
}

// setting build

const upload = multer({ dest: 'uploads/' });

app.post('/api/onboarding', upload.fields([
  { name: 'candidatePhoto' },
  { name: 'passbookUpload' },
  { name: 'educationDocuments' }
]), async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      salutation, firstName, middleName, lastName, fullName,
      fathersName, mothersName, gender, bloodGroup, dob,
      maritalStatus, countryCode, mobileNumber, alternateMobileNumber,
      email, bankName, accountNumber, ifscCode, nonIciciBankName,
      nonIciciAccountNumber, nonIciciIfscCode, educationDetails
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Handle file uploads
    const candidatePhoto = req.files['candidatePhoto'] ? req.files['candidatePhoto'][0].path : null;
    const passbookUpload = req.files['passbookUpload'] ? req.files['passbookUpload'][0].path : null;

    await client.query('BEGIN');

    // Insert personal and contact details
    const onboardingQuery = `
      INSERT INTO onboarding (salutation, first_name, middle_name, last_name, full_name,
        fathers_name, mothers_name, gender, blood_group, dob, marital_status, candidate_photo,
        country_code, mobile_number, alternate_mobile_number, email,
        bank_name, account_number, ifsc_code, passbook_upload,
        non_icici_bank_name, non_icici_account_number, non_icici_ifsc_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
              $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING id;
    `;
    const onboardingValues = [
      salutation, firstName, middleName, lastName, fullName,
      fathersName, mothersName, gender, bloodGroup, dob, maritalStatus, candidatePhoto,
      countryCode, mobileNumber, alternateMobileNumber, email,
      bankName, accountNumber, ifscCode, passbookUpload,
      nonIciciBankName, nonIciciAccountNumber, nonIciciIfscCode,
    ];

    const { rows } = await client.query(onboardingQuery, onboardingValues);
    const candidateId = rows[0].id;

    // Insert education details
    const educationQuery = `
      INSERT INTO onboarding_education (candidate_id, degree, specialization, cgpa, is_currently_student,
        start_date, completion_date, institute, other_institute, university, other_university,
        document_proof, institute_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
    `;

    for (const education of educationDetails) {
      const educationValues = [
        candidateId, education.degree, education.specialization, education.cgpa, education.isCurrentlyStudent,
        education.startDate, education.completionDate, education.institute, education.otherInstitute,
        education.university, education.otherUniversity, education.documentProof, education.instituteAddress,
      ];
      await client.query(educationQuery, educationValues);
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Onboarding data saved successfully!' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving onboarding data:', error);
    res.status(500).json({ error: 'Failed to save onboarding data' });
  } finally {
    client.release();
  }
});

// API to fetch details of all "Approved" students
app.get('/api/getApprovedStudentDetails', async (req, res) => {
  try {
    // Step 1: Fetch all approved students
    const approvedStudentsQuery = 'SELECT id, first_name, last_name, email FROM profiles WHERE approval_status = $1';
    const { rows: approvedStudents } = await pool.query(approvedStudentsQuery, ['Approved']);

    // Step 2: Fetch education, skills, and experience for each approved student
    const allStudentDetails = await Promise.all(
      approvedStudents.map(async (student) => {
        const studentId = student.id;

        // Fetch education details
        const educationQuery = 'SELECT degree, EXTRACT(YEAR FROM end_date) AS end_year FROM educations WHERE profile_id = $1';
        const { rows: education } = await pool.query(educationQuery, [studentId]);

        // Fetch skill details
        const skillsQuery = 'SELECT skill FROM skills WHERE profile_id = $1';
        const { rows: skills } = await pool.query(skillsQuery, [studentId]);

        // Fetch experience details
        const experienceQuery = 'SELECT total_experience FROM experiences WHERE profile_id = $1';
        const { rows: experience } = await pool.query(experienceQuery, [studentId]);

        // Combine the data into a single object for this student
        return {
          student_name: `${student.first_name}${student.last_name}`,
          email: `${student.email}`,
          id: `${student.id}`,
          education,
          skills,
          experience,
        };
      })
    );

    // Step 3: Send the combined details as the response
    res.json(allStudentDetails);

  } catch (error) {
    console.error("Error fetching approved students' details:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const otpStore = {}; // Temporary storage for OTPs

//Mail to Forget Password
app.post("/api/forgetPassword", async (req, res) => {
  const { email } = req.body;

  try {
    const client = await pool.connect();
    let userResult, table;

    // Check in register
    userResult = await client.query("SELECT * FROM register WHERE email_id = $1", [email]);
    table = "register";

    // If not found, check intern_login
    if (userResult.rows.length === 0) {
      userResult = await client.query("SELECT * FROM intern_login WHERE email_id = $1", [email]);
      table = "intern_login";
    }

    // If still not found, check instructors
    if (userResult.rows.length === 0) {
      userResult = await client.query("SELECT * FROM instructors WHERE email_id = $1", [email]);
      if (userResult.rows.length === 0) {
        client.release();
        return res.status(404).json({ message: "User not found." });
      }
      table = "instructors";
    }

    client.release();

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP and expiry
    otpStore[email] = { otp, otpExpires, table };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "placements@vishvavidya.com",
        pass: "kcqmakjzdfigzdip",
      },
    });

    // Send OTP via Email
    const mailOptions = {
      from: `"Training Team" <placements@vishvavidya.com>`,
      to: email,
      subject: "🔐 VishvaVidya OTP for Password Reset",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            
            <div style="text-align: center; padding: 20px 20px 0 20px;">
              <img src="https://vishvavidya.com/wp-content/uploads/2024/07/Vishvavidya-logo-e1719900509472.png" alt="Vishva Vidya Logo" width="180" style="max-width: 100%; height: auto;" />
            </div>
    
            <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
              <h2 style="margin: 0;">VishvaVidya Management System</h2>
            </div>
    
            <div style="padding: 30px; color: #333;">
              <p style="font-size: 16px;">Dear ${email},</p>
    
              <p>You have requested to reset your password. Please use the OTP code below to proceed:</p>
    
              <div style="background-color: #f1f1f1; padding: 15px 20px; margin: 20px 0; border-left: 5px solid #1976d2; font-size: 20px; font-weight: bold; text-align: center;">
                ${otp}
              </div>
    
              <p>This OTP is valid for <strong>5 minutes</strong>. Please do not share this code with anyone for security reasons.</p>
    
              <p>If you did not request a password reset, please contact support immediately.</p>
    
              <p style="margin-top: 30px;">Best regards,<br/>Team Vishva Vidya</p>
            </div>
    
            <div style="background-color: #f0f0f0; color: #666; text-align: center; font-size: 12px; padding: 15px;">
              This is an automated email. Please do not reply.
            </div>
          </div>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email error:", error);
        return res.status(500).json({ message: "Error sending email." });
      }
      res.json({ message: "OTP sent to your email." });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email]) {
    return res.status(400).json({ message: "OTP not found. Request a new OTP." });
  }

  const { otp: storedOtp, otpExpires } = otpStore[email];

  if (Date.now() > otpExpires) {
    delete otpStore[email]; // Remove expired OTP
    return res.status(400).json({ message: "OTP expired. Request a new OTP." });
  }

  if (otp !== storedOtp) {
    return res.status(400).json({ message: "Invalid OTP." });
  }

  res.status(200).json({ message: "OTP Verified!" });
});

//Reset Password and enter new password
app.post('/api/resetPassword', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!otpStore[email]) {
    return res.status(400).json({ message: "OTP not found. Request a new OTP." });
  }

  const { otp: storedOtp, otpExpires, table } = otpStore[email];

  // Validate OTP
  if (otp !== storedOtp) {
    return res.status(400).json({ message: "Invalid OTP." });
  }

  // Check if OTP is expired
  if (Date.now() > otpExpires) {
    delete otpStore[email]; // Remove expired OTP
    return res.status(400).json({ message: "OTP expired. Request a new OTP." });
  }

  try {
    const client = await pool.connect();

    // Update password in the correct table
    await client.query(
      `UPDATE ${table} SET password = $1 WHERE email_id = $2`,
      [newPassword, email]
    );

    client.release();
    delete otpStore[email]; // Remove OTP after successful reset

    res.status(200).json({ message: "Password has been reset successfully." });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


//Mail to forget Username
app.post('/api/forgotUsername', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Check in `register` table first
    let result = await pool.query('SELECT username FROM register WHERE email_id = $1', [email]);

    // If not found, check in `intern_login` table
    if (result.rows.length === 0) {
      result = await pool.query('SELECT username FROM intern_login WHERE email_id = $1', [email]);
    }

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'No user found with this email address' });
    }

    const user = result.rows[0];

    // Create dynamic transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "placements@vishvavidya.com",
        pass: "kcqmakjzdfigzdip",
      },
    });

    // Send email with username
    const mailOptions = {
      from: `"Training Team" <placements@vishvavidya.com>`,
      to: email,
      subject: "👤 VishvaVidya Portal Username",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            
            <div style="text-align: center; padding: 20px 20px 0 20px;">
              <img src="https://vishvavidya.com/wp-content/uploads/2024/07/Vishvavidya-logo-e1719900509472.png" alt="Vishva Vidya Logo" width="180" style="max-width: 100%; height: auto;" />
            </div>
    
            <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
              <h2 style="margin: 0;">VishvaVidya Management System</h2>
            </div>
    
            <div style="padding: 30px; color: #333;">
              <p style="font-size: 16px;">Hello,</p>
    
              <p>We’re sharing your login information for the VishvaVidya Portal.</p>
    
              <p><strong>Username:</strong></p>
              <div style="background-color: #f1f1f1; padding: 15px 20px; margin: 20px 0; border-left: 5px solid #1976d2; font-size: 18px; font-weight: bold; text-align: center;">
                ${user.username}
              </div>
    
              <p>If you did not request this, or if you have any concerns, please contact our support team immediately.</p>
    
              <p style="margin-top: 30px;">Best regards,<br/>Team Vishva Vidya</p>
            </div>
    
            <div style="background-color: #f0f0f0; color: #666; text-align: center; font-size: 12px; padding: 15px;">
              This is an automated email. Please do not reply.
            </div>
          </div>
        </div>
      `
    };



    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Username has been sent to your email address' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//Resume Approval status update
app.post("/api/approveProfile", async (req, res) => {
  const { profileId } = req.body;

  if (!profileId) {
    return res.status(400).send("Profile ID is required");
  }

  try {
    // Update the profile status in the database
    const result = await pool.query(
      'UPDATE profiles SET approval_status = $1 WHERE id = $2 RETURNING *',
      ['Approved', profileId]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Profile not found");
    }

    res.status(200).send("Profile approved successfully");
  } catch (error) {
    console.error("Error updating profile status:", error);
    res.status(500).send("Failed to update profile status");
  }
});

// Get review resume candidate details
app.get("/api/getResumeApprovalCandidates", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM profiles");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching candidate profile details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get('/api/getid_from_profile/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM profiles WHERE userid = $1', [userId]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Profile not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

//save finale resume pdf to server
app.post('/api/save-finale-resume', (req, res) => {
  const { pdfData, firstName, lastName, phone } = req.body;

  if (!pdfData || !firstName || !lastName || !phone) {
    return res.status(400).json({ error: 'Missing data' });
  }

  // Create filename
  //const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const fileName = `${firstName}.${lastName}.${phone}.pdf`;

  // Decode base64 string
  const base64Data = pdfData.replace(/^data:application\/pdf;base64,/, "");
  const filePath = path.join(finale_directory, fileName);

  // Save the PDF file
  fs.writeFile(filePath, base64Data, 'base64', (err) => {
    if (err) {
      console.error('Error saving PDF:', err);
      return res.status(500).json({ error: 'Failed to save PDF' });
    }
    res.status(200).json({ message: 'PDF saved successfully', fileName });
  });
});

//save review pdf to server
app.post('/api/save-review-resume', (req, res) => {
  const { pdfData, firstName, lastName, phone } = req.body;

  if (!pdfData || !firstName || !lastName || !phone) {
    return res.status(400).json({ error: 'Missing data' });
  }

  // Create filename
  //const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const fileName = `${firstName}.${lastName}.${phone}.pdf`;

  // Decode base64 string
  const base64Data = pdfData.replace(/^data:application\/pdf;base64,/, "");
  const filePath = path.join(directory, fileName);

  // Save the PDF file
  fs.writeFile(filePath, base64Data, 'base64', (err) => {
    if (err) {
      console.error('Error saving PDF:', err);
      return res.status(500).json({ error: 'Failed to save PDF' });
    }
    res.status(200).json({ message: 'PDF saved successfully', fileName });
  });
});

// Get Resume details
app.get("/api/getresume/:id", async (req, res) => {
  const { id: profileId } = req.params;
  const client = await pool.connect();

  try {
    // Fetch profile details including github and website
    const profileQuery = `
      SELECT first_name, last_name, email, phone, address, linkedinid, github, website, profile_pic_path, review_resumepath, approval_status
      FROM profiles
      WHERE id = $1;
    `;
    const profileResult = await client.query(profileQuery, [profileId]);

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }
    const profile = profileResult.rows[0];

    // Fetch educations
    const educationQuery = `
      SELECT institution, degree, start_date, end_date, field_of_study
      FROM educations
      WHERE profile_id = $1;
    `;
    const educationResult = await client.query(educationQuery, [profileId]);
    const educations = educationResult.rows;

    // Fetch experiences and associated projects
    const experienceQuery = `
      SELECT id, company, role, start_date, end_date, city, state, work_desc, currently_working
      FROM experiences
      WHERE profile_id = $1;
    `;
    const experienceResult = await client.query(experienceQuery, [profileId]);
    const experiences = experienceResult.rows;

    for (const experience of experiences) {
      const projectQuery = `
        SELECT title, description, technology
        FROM projects
        WHERE experience_id = $1;
      `;
      const projectResult = await client.query(projectQuery, [experience.id]);
      experience.projects = projectResult.rows;
    }


    // Fetch skills
    const skillQuery = `
      SELECT skill
      FROM skills
      WHERE profile_id = $1;
    `;
    const skillResult = await client.query(skillQuery, [profileId]);
    const skills = skillResult.rows;

    // Fetch certificates
    const certificateQuery = `
      SELECT certificate_name, issuing_organization, certificate_date
      FROM certificates
      WHERE profile_id = $1;
    `;
    const certificateResult = await client.query(certificateQuery, [profileId]);
    const certificates = certificateResult.rows;

    // Fetch achievements
    const achievementQuery = `
      SELECT award_name, issuing_organization, award_date
      FROM achievements
      WHERE profile_id = $1;
    `;
    const achievementResult = await client.query(achievementQuery, [profileId]);
    const achievements = achievementResult.rows;

    // Fetch professional summary (null-safe)
    const summaryQuery = `
      SELECT summary
      FROM professional_summaries
      WHERE profile_id = $1;
    `;
    const summaryResult = await client.query(summaryQuery, [profileId]);
    const professionalSummary = summaryResult.rows.length > 0 ? summaryResult.rows[0] : { summary: "" };

    // Fetch extra projects (personal / college projects)
    const extraProjectQuery = `
      SELECT id, title, description, technology
      FROM extra_projects
      WHERE profile_id = $1;
      `;
    const extraProjectResult = await client.query(extraProjectQuery, [profileId]);
    const extraProjects = extraProjectResult.rows;


    // Return all the details as a single JSON object
    res.status(200).json({
      profile,
      educations,
      experiences,
      skills,
      certificates,
      achievements,
      professionalSummary,
      extraProjects,
    });

  } catch (err) {
    console.error("Error fetching resume details:", err);
    res.status(500).json({ error: "An error occurred while fetching resume details." });
  } finally {
    client.release();
  }
});

//Resume Builder Post API
app.post("/api/resume", cvupload.single("profilePic"), async (req, res) => {
  if (!req.body.ResumeData) {
    return res.status(400).json({ error: "No data found in request body" });
  }

  let resumeData;
  try {
    resumeData = JSON.parse(req.body.ResumeData);
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON format" });
  }

  const {
    userId,
    profile,
    educations = [],
    experiences = [],
    skills = [],
    certificates = [],
    achievements = [],
    professionalSummary,
    extraProjects
  } = resumeData;

  // Basic profile validation
  if (!profile?.firstName || !profile?.lastName || !profile?.email || !profile?.phone) {
    return res.status(400).json({ error: "Incomplete profile information" });
  }

  const client = await pool.connect();

  const handleEmptyString = (value) => value?.trim() === "" ? null : value?.trim();

  try {
    await client.query("BEGIN");

    const profilePicPath = req.file ? req.file.path : null;
    const review_resumepath = `reviewresume/${profile.firstName}.${profile.lastName}.${profile.phone}.pdf`;
    const finale_resumepath = `resume/${profile.firstName}.${profile.lastName}.${profile.phone}.pdf`;

    // Insert profile
    const insertProfileQuery = `
      INSERT INTO profiles (first_name, last_name, email, phone, address, linkedinid, github, website, profile_pic_path, review_resumepath, finale_resumepath, userid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id;
    `;
    const insertProfileValues = [
      handleEmptyString(profile.firstName),
      handleEmptyString(profile.lastName),
      handleEmptyString(profile.email),
      handleEmptyString(profile.phone),
      handleEmptyString(profile.address),
      handleEmptyString(profile.linkedinId),
      handleEmptyString(profile.github),
      handleEmptyString(profile.website),
      profilePicPath,
      review_resumepath,
      finale_resumepath,
      userId
    ];
    const { rows } = await client.query(insertProfileQuery, insertProfileValues);
    const profileId = rows[0].id;

    // Insert educations
    for (const edu of educations) {
      if (!edu.institution || !edu.degree || !edu.startDate) {
        throw new Error("Incomplete education information");
      }
      await client.query(`
        INSERT INTO educations (profile_id, institution, degree, start_date, end_date, field_of_study)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [
        profileId,
        handleEmptyString(edu.institution),
        handleEmptyString(edu.degree),
        handleEmptyString(edu.startDate),
        handleEmptyString(edu.endDate),
        handleEmptyString(edu.fieldofstudy)
      ]);
    }

    // Insert experiences and projects
    for (const exp of experiences) {
      if (!exp.company || !exp.role || !exp.startDate) {
        throw new Error("Incomplete experience information");
      }
      const { rows: expRows } = await client.query(`
        INSERT INTO experiences (profile_id, company, role, start_date, end_date, city, state, work_desc, currently_working)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
      `, [
        profileId,
        handleEmptyString(exp.company),
        handleEmptyString(exp.role),
        handleEmptyString(exp.startDate),
        handleEmptyString(exp.endDate),
        handleEmptyString(exp.city),
        handleEmptyString(exp.state),
        handleEmptyString(exp.workDesc),
        exp.currentlyWorking || false
      ]);
      const experienceId = expRows[0].id;

      if (exp.projects?.length) {
        for (const proj of exp.projects) {
          if (!proj.title || !proj.description) {
            throw new Error("Incomplete project information");
          }
          await client.query(`
            INSERT INTO projects (experience_id, title, description, technology)
            VALUES ($1, $2, $3, $4);
          `, [
            experienceId,
            handleEmptyString(proj.title),
            handleEmptyString(proj.description),
            handleEmptyString(proj.technology)
          ]);
        }
      }
    }

    // Insert skills
    for (const skill of skills) {
      if (!skill.skill) {
        throw new Error("Skill missing");
      }
      await client.query(`
        INSERT INTO skills (profile_id, skill)
        VALUES ($1, $2);
      `, [profileId, handleEmptyString(skill.skill)]);
    }

    // Insert certificates
    for (const cert of certificates) {
      await client.query(`
        INSERT INTO certificates (profile_id, certificate_name, issuing_organization, certificate_date)
        VALUES ($1, $2, $3, $4);
      `, [
        profileId,
        handleEmptyString(cert.certificateName),
        handleEmptyString(cert.issuingOrganization),
        handleEmptyString(cert.certificateDate)
      ]);
    }

    // Insert achievements
    for (const ach of achievements) {
      await client.query(`
        INSERT INTO achievements (profile_id, award_name, issuing_organization, award_date)
        VALUES ($1, $2, $3, $4);
      `, [
        profileId,
        handleEmptyString(ach.awardName),
        handleEmptyString(ach.issuingOrganization),
        handleEmptyString(ach.awardDate)
      ]);
    }

    // Insert extra projects (personal / college projects)
    for (const project of extraProjects) {
      if (!project.title) {
        throw new Error("Extra project title is missing");
      }

      await client.query(`
    INSERT INTO extra_projects (profile_id, title, description, technology)
    VALUES ($1, $2, $3, $4);
  `, [
        profileId,
        project.title,
        project.description || null,
        project.technology || null,
      ]);
    }

    // Insert professional summary
    if (!professionalSummary?.summary) {
      throw new Error("Professional summary missing");
    }
    await client.query(`
      INSERT INTO professional_summaries (profile_id, summary)
      VALUES ($1, $2);
    `, [profileId, handleEmptyString(professionalSummary.summary)]);

    await client.query("COMMIT");

    res.status(201).json({ message: "Resume saved successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error inserting resume:", err);

    if (err.code === '23505') {
      res.status(409).json({ error: "User details already present" });
    } else if (err.message.includes("Incomplete") || err.message.includes("missing")) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Server error while saving resume" });
    }
  } finally {
    client.release();
  }
});

//Update api of resume building
app.put('/api/updateResume', cvupload.single('profilePic'), async (req, res) => {
  if (!req.body.ResumeData) {
    return res.status(400).json({ error: 'No data found in request body' });
  }

  let resumeData;
  try {
    resumeData = JSON.parse(req.body.ResumeData);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }

  const {
    userProfileId,
    profile,
    educations = [],
    experiences = [],
    skills = [],
    certificates = [],
    achievements = [],
    professionalSummary,
    extraProjects = [], // ✅ Include extraProjects
  } = resumeData;

  if (!profile || !profile.firstName || !profile.lastName || !profile.email || !profile.phone) {
    return res.status(400).json({ error: 'Incomplete profile information' });
  }

  const client = await pool.connect();
  const handleEmptyString = (value) => (value === "" ? null : value);

  try {
    await client.query('BEGIN');

    // Keep old profile pic if not updated
    let profilePicPath = null;
    if (req.file) {
      profilePicPath = req.file.path;
    } else {
      const oldProfile = await client.query('SELECT profile_pic_path FROM profiles WHERE id = $1', [userProfileId]);
      profilePicPath = oldProfile.rows[0]?.profile_pic_path || null;
    }

    const reviewResumePath = `reviewresume/${profile.firstName}.${profile.lastName}.${profile.phone}.pdf`;
    const finalResumePath = `resume/${profile.firstName}.${profile.lastName}.${profile.phone}.pdf`;

    // Update profile
    const profileQuery = `
      UPDATE profiles 
      SET first_name = $1, last_name = $2, email = $3, phone = $4, address = $5, linkedinid = $6, github = $7, website = $8,
          profile_pic_path = $9, review_resumepath = $10, finale_resumepath = $11
      WHERE id = $12;
    `;
    const profileValues = [
      handleEmptyString(profile.firstName),
      handleEmptyString(profile.lastName),
      handleEmptyString(profile.email),
      handleEmptyString(profile.phone),
      handleEmptyString(profile.address),
      handleEmptyString(profile.linkedinId),
      handleEmptyString(profile.github),
      handleEmptyString(profile.website),
      profilePicPath,
      reviewResumePath,
      finalResumePath,
      userProfileId,
    ];
    await client.query(profileQuery, profileValues);

    // Delete old records
    await client.query('DELETE FROM educations WHERE profile_id = $1', [userProfileId]);
    await client.query('DELETE FROM experiences WHERE profile_id = $1', [userProfileId]);
    await client.query('DELETE FROM skills WHERE profile_id = $1', [userProfileId]);
    await client.query('DELETE FROM certificates WHERE profile_id = $1', [userProfileId]);
    await client.query('DELETE FROM achievements WHERE profile_id = $1', [userProfileId]);
    await client.query('DELETE FROM professional_summaries WHERE profile_id = $1', [userProfileId]);
    await client.query('DELETE FROM extra_projects WHERE profile_id = $1', [userProfileId]); // ✅ DELETE old extra projects too

    // Insert educations
    for (const education of educations) {
      await client.query(`
        INSERT INTO educations (profile_id, institution, degree, start_date, end_date, field_of_study)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [
        userProfileId,
        handleEmptyString(education.institution),
        handleEmptyString(education.degree),
        handleEmptyString(education.startDate),
        handleEmptyString(education.endDate),
        handleEmptyString(education.fieldofstudy)
      ]);
    }

    // Insert experiences and their projects
    for (const experience of experiences) {
      const { rows: expRows } = await client.query(`
        INSERT INTO experiences (profile_id, company, role, start_date, end_date, city, state, work_desc, currently_working)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
      `, [
        userProfileId,
        handleEmptyString(experience.company),
        handleEmptyString(experience.role),
        handleEmptyString(experience.startDate),
        handleEmptyString(experience.endDate),
        handleEmptyString(experience.city),
        handleEmptyString(experience.state),
        handleEmptyString(experience.workDesc),
        experience.currentlyWorking || false,
      ]);
      const experienceId = expRows[0].id;

      for (const project of experience.projects || []) {
        await client.query(`
          INSERT INTO projects (experience_id, title, description, technology)
          VALUES ($1, $2, $3, $4);
        `, [
          experienceId,
          handleEmptyString(project.title),
          handleEmptyString(project.description),
          handleEmptyString(project.technology),
        ]);
      }
    }

    // Insert skills
    for (const skill of skills) {
      await client.query(`
        INSERT INTO skills (profile_id, skill)
        VALUES ($1, $2);
      `, [userProfileId, handleEmptyString(skill.skill)]);
    }

    // Insert certificates
    for (const cert of certificates) {
      await client.query(`
        INSERT INTO certificates (profile_id, certificate_name, issuing_organization, certificate_date)
        VALUES ($1, $2, $3, $4);
      `, [
        userProfileId,
        handleEmptyString(cert.certificateName),
        handleEmptyString(cert.issuingOrganization),
        handleEmptyString(cert.certificateDate)
      ]);
    }

    // Insert achievements
    for (const ach of achievements) {
      await client.query(`
        INSERT INTO achievements (profile_id, award_name, issuing_organization, award_date)
        VALUES ($1, $2, $3, $4);
      `, [
        userProfileId,
        handleEmptyString(ach.awardName),
        handleEmptyString(ach.issuingOrganization),
        handleEmptyString(ach.awardDate)
      ]);
    }

    // Insert extra projects (personal/college)
    for (const project of extraProjects) {
      await client.query(`
        INSERT INTO extra_projects (profile_id, title, description, technology)
        VALUES ($1, $2, $3, $4);
      `, [
        userProfileId,
        handleEmptyString(project.title),
        handleEmptyString(project.description),
        handleEmptyString(project.technology),
      ]);
    }

    // Insert professional summary
    if (professionalSummary?.summary) {
      await client.query(`
        INSERT INTO professional_summaries (profile_id, summary)
        VALUES ($1, $2);
      `, [
        userProfileId,
        handleEmptyString(professionalSummary.summary),
      ]);
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Resume details updated successfully.' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating resume details:', err);
    if (err.message.includes('Incomplete')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'An error occurred while updating resume details.' });
    }
  } finally {
    client.release();
  }
});

//Send Resume Changes email to candidates
app.post("/api/sendResumeChangesEmail", async (req, res) => {
  const { student_name, email_id, changesDetails } = req.body;
  console.log("Email content" + changesDetails);

  // Create dynamic transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "placements@vishvavidya.com",
      pass: "kcqmakjzdfigzdip",
    },
  });

  // Email content
  const mailOptions = {
    from: `"Training Team" <placements@vishvavidya.com>`,
    to: email_id,
    subject: "📄 Resume Change Request",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          
          <div style="text-align: center; padding: 20px 20px 0 20px;">
            <img src="https://vishvavidya.com/wp-content/uploads/2024/07/Vishvavidya-logo-e1719900509472.png" alt="Vishva Vidya Logo" width="180" style="max-width: 100%; height: auto;" />
          </div>
  
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">VishvaVidya Management System</h2>
          </div>
  
          <div style="padding: 30px; color: #333;">
            <p style="font-size: 16px;">Dear ${student_name},</p>
  
            <p>We have reviewed your resume and request the following changes:</p>
  
            <div style="background-color: #f1f1f1; padding: 15px 20px; margin: 20px 0; border-left: 5px solid #1976d2; font-size: 16px;">
              ${changesDetails}
            </div>
  
            <p>Please make the changes at the earliest and upload your updated resume on the portal.</p>
  
            <p style="margin-top: 30px;">Best regards,<br/>Team Vishva Vidya</p>
          </div>
  
          <div style="background-color: #f0f0f0; color: #666; text-align: center; font-size: 12px; padding: 15px;">
            This is an automated email. Please do not reply.
          </div>
        </div>
      </div>
    `
  };


  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Failed to send email");
  }
});

//email send
app.post("/api/sendStudentRequestEmail", async (req, res) => {
  const { student_name, email, clientName, companyName, companyWebsite } = req.body;

  // Create dynamic transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "placements@vishvavidya.com",
      pass: "kcqmakjzdfigzdip",
    },
  });

  // Email content
  const mailOptions = {
    from: `"Training Team" <placements@vishvavidya.com>`,
    to: email,
    subject: "🌟 VishvaVidya Client Request",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
  
          <div style="text-align: center; padding: 20px 20px 0 20px;">
            <img src="https://vishvavidya.com/wp-content/uploads/2024/07/Vishvavidya-logo-e1719900509472.png" alt="Vishva Vidya Logo" width="180" style="max-width: 100%; height: auto;" />
          </div>
  
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">VishvaVidya Management System</h2>
          </div>
  
          <div style="padding: 30px; color: #333;">
            <p style="font-size: 16px;">Dear ${student_name},</p>
  
            <p>We are pleased to inform you that your profile has been <strong>shortlisted</strong> by the company:</p>
  
            <div style="background-color: #f1f1f1; padding: 15px 20px; margin: 20px 0; border-left: 5px solid #1976d2; font-size: 18px; font-weight: bold; text-align: center;">
              ${companyName}
            </div>
  
            <p>Please update your resume on the VishvaVidya portal as soon as possible to proceed further.</p>
  
            <p><strong>Company Website:</strong><br/>
              <a href="${companyWebsite}" target="_blank" style="color: #1976d2;">${companyWebsite}</a>
            </p>
  
            <p style="margin-top: 30px;">Best regards,<br/>Team Vishva Vidya</p>
          </div>
  
          <div style="background-color: #f0f0f0; color: #666; text-align: center; font-size: 12px; padding: 15px;">
            This is an automated email. Please do not reply.
          </div>
        </div>
      </div>
    `
  };


  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Failed to send email");
  }
});

//Get partner student requests
app.get("/api/getPartnerStudentsRequests", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM partner_student_request");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching student requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Send partner student requests
app.post("/api/partnerStudentRequest", async (req, res) => {
  const {
    student_name,
    email,
    highest_qualification,
    passout_year,
    skillset,
    clientName,
    companyName,
    companyWebsite
  } = req.body;

  if (!email || !student_name) {
    return res.status(400).json({ error: "Student Name are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO partner_student_request (student_name, email_id, highest_qualification, passout_year, skillset, client_name, company_name, company_website) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        student_name,
        email,
        highest_qualification,
        passout_year,
        skillset,
        clientName,
        companyName,
        companyWebsite
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to create request:", error);
    res.status(500).json({ error: "Failed to create request" });
  }
});

//Filter students as per skillset, qualification, passout year, employee name
app.get("/api/filter_students", async (req, res) => {
  const { employeeName, skillset, passoutYear, qualification, status, batchName } = req.query;

  let query = "SELECT * FROM student_registration WHERE 1=1";
  const queryParams = [];

  if (employeeName) {
    queryParams.push(`%${employeeName}%`);
    query += ` AND student_name ILIKE $${queryParams.length}`;
  }

  if (skillset && skillset.length > 0) {
    const skillsetArray = skillset.split(',').map(skill => `%${skill.trim()}%`);
    const skillsetQuery = skillsetArray.map((_, index) => `skillset ILIKE $${queryParams.length + index + 1}`).join(' OR ');
    queryParams.push(...skillsetArray);
    query += ` AND (${skillsetQuery})`;
  }

  if (passoutYear && passoutYear.length > 0) {
    const passoutYearArray = passoutYear.split(',');
    const passoutYearQuery = passoutYearArray.map((_, index) => `passout_year = $${queryParams.length + index + 1}`).join(' OR ');
    queryParams.push(...passoutYearArray);
    query += ` AND (${passoutYearQuery})`;
  }

  if (qualification && qualification.length > 0) {
    const qualificationArray = qualification.split(',').map(qual => `%${qual.trim()}%`);
    const qualificationQuery = qualificationArray.map((_, index) => `highest_qualification ILIKE $${queryParams.length + index + 1}`).join(' OR ');
    queryParams.push(...qualificationArray);
    query += ` AND (${qualificationQuery})`;
  }

  if (status && status.length > 0) {
    const statusArray = status.split(',').map(stat => `%${stat.trim()}%`);
    const statusQuery = statusArray.map((_, index) => `training_status ILIKE $${queryParams.length + index + 1}`).join(' OR ');
    queryParams.push(...statusArray);
    query += ` AND (${statusQuery})`;
  }

  if (batchName) {
    queryParams.push(batchName);
    query += ` AND batch_name = $${queryParams.length}`;
  }

  try {
    const result = await pool.query(query, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update placement status
app.put("/api/updatePlacedStatus", async (req, res) => {
  try {
    const { id } = req.body; // Extract student ID from request body
    // Perform the update query using the received student ID
    const updateQuery = `
      UPDATE student_registration
      SET placement_status = 'Placed'
      WHERE id = $1;
    `;
    const result = await pool.query(updateQuery, [id]);
    res.json({ message: "Placed status updated successfully" });
  } catch (error) {
    console.error("Error updating placed status:", error);
    res.status(500).json({ message: "Error updating placed status" });
  }
});


//show review resume from profiles
app.get("/api/approvalResume/:profileId", async (req, res) => {
  const { profileId } = req.params;

  try {
    // Query the database to retrieve the resume file path for the given student ID
    const queryResult = await pool.query(
      "SELECT review_resumepath FROM profiles WHERE id = $1",
      [profileId]
    );
    const resumeFilePath = queryResult.rows[0].review_resumepath;

    // Construct the absolute file path on the server
    const absoluteFilePath = path.join(__dirname, resumeFilePath);

    // Check if the file exists
    if (fs.existsSync(absoluteFilePath)) {
      // Set appropriate Content-Type header based on file type
      const contentType = "application/pdf"; // Adjust according to file type
      res.setHeader("Content-Type", contentType);

      // Stream the file to the response
      const fileStream = fs.createReadStream(absoluteFilePath);
      fileStream.pipe(res);
    } else {
      // If file not found, send a 404 response
      res.status(404).send("Resume not found");
    }
  } catch (error) {
    // If any error occurs, send a 500 response
    console.error("Error fetching resume:", error);
    res.status(500).send("Internal server error");
  }
});

app.get("/api/resume/:studentId", async (req, res) => {
  const { studentId } = req.params;

  try {
    // Query the database to retrieve the resume file path for the given student ID
    const queryResult = await pool.query(
      "SELECT resume FROM student_registration WHERE id = $1",
      [studentId]
    );
    const resumeFilePath = queryResult.rows[0].resume;

    // Construct the absolute file path on the server
    const absoluteFilePath = path.join(__dirname, resumeFilePath);

    // Check if the file exists
    if (fs.existsSync(absoluteFilePath)) {
      // Set appropriate Content-Type header based on file type
      const contentType = "application/pdf"; // Adjust according to file type
      res.setHeader("Content-Type", contentType);

      // Stream the file to the response
      const fileStream = fs.createReadStream(absoluteFilePath);
      fileStream.pipe(res);
    } else {
      // If file not found, send a 404 response
      res.status(404).send("Resume not found");
    }
  } catch (error) {
    // If any error occurs, send a 500 response
    console.error("Error fetching resume:", error);
    res.status(500).send("Internal server error");
  }
});

// Define a route to fetch batch names of a specific instructor
app.post("/api/grades", async (req, res) => {
  const { batchName, trackName, numOfWeeks, batchStartDate, instructorName, batchType, userid, role } = req.body;

  if (!batchName || !trackName || !numOfWeeks || !batchStartDate || !instructorName || !batchType || !userid || !role) {
    return res.status(400).json({ message: "All fields including userid and role are required" });
  }

  try {
    const insertQuery = `
      INSERT INTO grades (batch_name, numofweeks, batch_start_date, instructor_name, batch_type, track_name, created_by, created_role, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    `;
    const values = [batchName, numOfWeeks, batchStartDate, instructorName, batchType, trackName, userid, role];

    await pool.query(insertQuery, values);
    res.status(200).json({ message: `Batch '${batchName}' registered successfully`, batchName });
  } catch (error) {
    console.error("❌ Error inserting batch:", error.message);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

app.get("/api/generate-batch-name/:trackName", async (req, res) => {
  const { trackName } = req.params;

  try {
    const trackRes = await pool.query(
      "SELECT recognition_code FROM tracks WHERE track_name = $1",
      [trackName]
    );

    if (trackRes.rows.length === 0) {
      return res.status(404).json({ message: "Track not found" });
    }

    const recognitionCode = trackRes.rows[0].recognition_code;

    const countRes = await pool.query(
      "SELECT COUNT(*) FROM grades WHERE batch_name LIKE $1",
      [`${recognitionCode}%`]
    );

    const nextNum = parseInt(countRes.rows[0].count || 0) + 1;
    const padded = String(nextNum).padStart(3, "0");

    const generatedName = `${recognitionCode}${padded}`;
    res.json({ batchName: generatedName });
  } catch (err) {
    console.error("Error generating batch name", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Update Batch
app.put("/api/grades/:id", async (req, res) => {
  const { id } = req.params;
  const { batchName, trackName, numOfWeeks, batchStartDate, instructorName, batchType, userid, role } = req.body;

  if (!userid || !role) {
    return res.status(400).json({ message: "userid and role are required for update" });
  }

  try {
    const updateQuery = `
      UPDATE grades
      SET batch_name = $1,
          track_name = $2,
          numofweeks = $3,
          batch_start_date = $4,
          instructor_name = $5,
          batch_type = $6,
          updated_by = $7,
          updated_role = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
    `;
    const values = [batchName, trackName, numOfWeeks, batchStartDate, instructorName, batchType, userid, role, id];

    await pool.query(updateQuery, values);
    res.status(200).json({ message: "Batch updated successfully" });
  } catch (error) {
    console.error("Error updating batch:", error);
    res.status(500).json({ message: "Failed to update batch" });
  }
});

//fetch Grades details
app.get("/api/getgrades", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM grades ORDER BY id DESC");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//fetch tracks for new batch reg
app.get("/api/tracks", async (req, res) => {
  try {
    const tracks = await pool.query("SELECT track_name FROM tracks");
    res.json(tracks.rows);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/tracklist", async (req, res) => {
  try {
    // console.log("Fetching tracks from DB...");
    const result = await pool.query(`
      SELECT 
        id, 
        track_name AS "trackName", 
        TO_CHAR(start_date, 'YYYY-MM-DD') AS "startDate",
        recognition_code AS "recognitionCode"
      FROM tracks 
      ORDER BY start_date DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});


app.get("/getTracks", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tracks"); // Replace 'tracks' with your actual table name
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tracks:", err);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

app.get("/api/getBatchesByTrack", async (req, res) => {
  try {
    const { trackName } = req.query;
    console.log("Requested Track Name:", trackName); // Debug log
    if (!trackName) {
      return res.status(400).json({ error: "Track name is required" });
    }

    const result = await pool.query(
      "SELECT DISTINCT batch_name FROM grades WHERE track_name = $1",
      [trackName]
    );

    console.log("Batches found:", result.rows); // Debug log
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


//fetch instructors for new batch reg
app.get("/api/instructors", async (req, res) => {
  try {
    const instructors = await pool.query("SELECT instructor_name FROM instructors");
    res.json(instructors.rows);
  } catch (error) {
    console.error("Error fetching instructors:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Fetch all instructors List
app.get("/api/instructorlist", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM instructors ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching instructors:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//fetch batch details
app.get("/api/getBatchDetails", async (req, res) => {
  try {
    // Fetch batch details from the grades table
    const result = await pool.query("SELECT * FROM grades");
    const batches = result.rows;

    // Fetch total_students count dynamically for each batch
    const batchDetails = await Promise.all(
      batches.map(async (batch) => {
        const studentCountQuery = `SELECT COUNT(*) AS total_students FROM student_registration WHERE batch_name = $1`;
        const studentCountResult = await pool.query(studentCountQuery, [batch.batch_name]);

        return {
          ...batch,
          total_students: studentCountResult.rows[0].total_students,
        };
      })
    );

    res.status(200).json(batchDetails);
  } catch (error) {
    console.error("Error fetching batch details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/api/getBatchCount", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        batch_name, 
        COUNT(id) AS total_students
      FROM student_registration
      GROUP BY batch_name
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching batch details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/getBatchNames", async (req, res) => {
  const { batchName } = req.query; // Get batchName from the query parameters

  // Construct query and parameters based on batchName presence
  const query = batchName
    ? "SELECT * FROM grades WHERE batch_name = $1"
    : "SELECT batch_name FROM grades";
  const params = batchName ? [batchName] : [];

  try {
    // Execute query with parameters
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching batch details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// API endpoint to get students based on batch name
app.get("/api/getstudents", async (req, res) => {
  const { batchName } = req.query; // Get batchName from query parameters
  const client = await pool.connect();

  try {
    // Modify query to filter based on batchName if provided
    const query = batchName
      ? "SELECT * FROM student_registration WHERE batch_name = $1"
      : "SELECT * FROM student_registration";
    const params = batchName ? [batchName] : [];

    const result = await client.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
});

// Delete a student by ID
app.delete('/api/deleteStudent/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Instead of deleting the student from batch, update their batch to 'No Batch'
    const deleteQuery = `
      UPDATE student_registration
      SET batch_name = 'No Batch'
      WHERE id = $1
    `;
    await pool.query(deleteQuery, [id]);
    res.json({ message: 'Student batch cleared successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});



// Function to generate login credentials and insert into intern_login
const generateStudentId = async (client) => {
  const year = new Date().getFullYear();
  const prefix = `VVINTERN${year}`;

  const { rows } = await client.query(
    `SELECT id FROM student_registration WHERE id LIKE $1`,
    [`${prefix}%`]
  );

  if (rows.length > 0) {
    // Extract numeric part and get max
    const numbers = rows.map(row => {
      const numPart = row.id.replace(prefix, '');
      return parseInt(numPart) || 0;
    });

    const maxNumber = Math.max(...numbers);
    const newId = `${prefix}${String(maxNumber + 1).padStart(3, '0')}`;
    return newId;
  } else {
    return `${prefix}001`;
  }
};

const generatePassword = (name = "", contactNo = "") => {
  const firstName = typeof name === "string" && name.trim() !== "" ? name.trim().split(" ")[0] : "Stu";
  const prefix = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const suffix = typeof contactNo === "string" && contactNo.length >= 4 ? contactNo.slice(-4) : "0000";
  return `${prefix}@${suffix}VV`;
};


const createLoginCredentials = async (client, studentId, studentName, email, contactNo, trainingStatus) => {
  const password = generatePassword(studentName, contactNo); // New pattern
  const role = "intern";
  const status = trainingStatus;

  const loginInsertQuery = `
    INSERT INTO intern_login (student_id, name, email_id, contact_no, role, password, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7);
  `;

  await client.query(loginInsertQuery, [studentId, studentName, email, contactNo, role, password, status]);
};

//submit Student registration details
app.post("/api/student-registration-form", async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      studentName, email, contactNo, userid, role
    } = req.body;

    const batchName = "No Batch";
    const trainingStatus = "No Status";
    const placementStatus = "Unplaced";

    const passoutYear = "Not Defined";
    const highestQualification = "Not Defined";
    const skillset = "Not Defined";
    const certification = "Not Defined";
    const currentLocation = "Not Defined";
    const experience = "Not Defined";

    const password = generatePassword(studentName, contactNo);
    const studentId = await generateStudentId(client);

    // Validations
    const errors = [];
    if (!studentName || studentName.trim().length < 3) errors.push("Full Name must be at least 3 characters.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid Email format.");
    if (!contactNo || !/^[6-9]\d{9}$/.test(contactNo)) errors.push("Contact number must be 10 digits starting with 6-9.");


    const checkEmail = await client.query("SELECT 1 FROM student_registration WHERE email_id = $1", [email]);
    if (checkEmail.rows.length > 0) errors.push("Email already exists.");

    if (errors.length > 0) return res.status(400).json({ message: "Validation failed", errors });

    await client.query("BEGIN");

    await client.query(`
      INSERT INTO student_registration (
        id, student_name, email_id, contact_no, passout_year,
        batch_name, highest_qualification, skillset, certification,
        current_location, experience, placement_status, training_status,
        password, created_by_role, created_by_userid, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    `, [
      studentId, studentName, email, contactNo, passoutYear,
      batchName, highestQualification, skillset, certification || "",
      currentLocation, experience || null, placementStatus, trainingStatus,
      password, req.body.role, req.body.userid, new Date()
    ]);

    await client.query(
      `INSERT INTO student_batch_history (student_id, new_batch, old_batch, moved_at, move_reason, created_by_userid, created_by_role) 
       VALUES ($1, $2, $3, NOW(), $4, $5, $6)`,
      [studentId, batchName, batchName, "Newly Registered, No Batch Assigned Yet", req.body.userid, req.body.role]
    );

    await client.query(`
      INSERT INTO aptitude_result (
        id, aptitude_marks, percentage, result, created_by_role, created_by_userid
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      studentId,
      req.body.aptitudeMarks !== undefined && req.body.aptitudeMarks !== '' ? req.body.aptitudeMarks : null,
      req.body.aptitudePercentage !== undefined && req.body.aptitudePercentage !== '' ? req.body.aptitudePercentage : null,
      req.body.aptitudeResult !== undefined && req.body.aptitudeResult !== '' ? req.body.aptitudeResult : null,
      req.body.role, req.body.userid
    ]);


    await createLoginCredentials(client, studentId, studentName, email, contactNo, trainingStatus);

    await client.query("COMMIT");

    res.status(201).json({ message: "Student successfully registered.", generatedId: studentId });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
});

// Route for file upload
app.post("/api/studentRegistrationExcelUpload", upload.single("file"), async (req, res) => {
  const client = await pool.connect();
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    fs.unlinkSync(req.file.path);

    if (!data.length) return res.status(400).send("File is empty or invalid");

    const requiredFields = ["student_name", "email_id", "contact_no"];
    const errors = [];
    const ignored = [];
    const validRows = [];

    await client.query("BEGIN");

    for (let [index, row] of data.entries()) {
      const rowNumber = index + 2;

      const missingFields = requiredFields.filter(f => !row[f] || row[f].toString().trim() === "");
      if (missingFields.length > 0) {
        errors.push(`Row ${rowNumber} - Missing: ${missingFields.join(", ")}`);
        continue;
      }

      // Email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email_id)) {
        errors.push(`Row ${rowNumber} - Invalid email: ${row.email_id}`);
        continue;
      }

      // Contact number validation
      if (!/^[6-9]\d{9}$/.test(row.contact_no)) {
        errors.push(`Row ${rowNumber} - Invalid contact number: ${row.contact_no}`);
        continue;
      }

      // Student name validation
      if (row.student_name.trim().length < 3 || row.student_name.trim().length > 100) {
        errors.push(`Row ${rowNumber} - Student name must be between 3 and 100 characters.`);
        continue;
      }

      // Skip if already exists
      const existing = await client.query("SELECT id FROM student_registration WHERE email_id = $1", [row.email_id]);
      if (existing.rows.length > 0) {
        ignored.push(`Row ${rowNumber} - Email already registered: ${row.email_id}`);
        continue;
      }

      const studentId = await generateStudentId(client);
      const password = generatePassword(row.student_name, row.contact_no);

      validRows.push({
        id: studentId,
        student_name: row.student_name.trim(),
        email_id: String(row.email_id).trim().toLowerCase(),
        contact_no: String(row.contact_no).trim(),
        passout_year: "Not Defined",
        highest_qualification: "Not Defined",
        skillset: "Not Defined",
        certification: "Not Defined",
        current_location: "Not Defined",
        experience: "Not Defined",
        placement_status: "Unplaced",
        training_status: "No Status",
        batch_name: "No Batch",
        password,
      });
    }

    if (validRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No new students to register", errors, ignored });
    }

    for (const row of validRows) {
      await client.query(`
        INSERT INTO student_registration (
          id, student_name, email_id, contact_no, passout_year,
          batch_name, highest_qualification, skillset, certification,
          current_location, experience, placement_status, training_status, password,
          created_by_role, created_by_userid, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, $17)
      `, [
        row.id, row.student_name, row.email_id, row.contact_no, row.passout_year,
        row.batch_name, row.highest_qualification, row.skillset, row.certification,
        row.current_location, row.experience, row.placement_status,
        row.training_status, row.password, req.body.role, req.body.userid, new Date()
      ]);

      await client.query(`
        INSERT INTO student_batch_history (student_id, new_batch, old_batch, moved_at, move_reason, created_by_role, created_by_userid )
        VALUES ($1, $2, $3, NOW(), $4, $5, $6)
      `, [
        row.id, row.batch_name, "No Batch", "Newly Registered, No Batch Assigned Yet", req.body.role, req.body.userId
      ]);

      await client.query(`
        INSERT INTO aptitude_result (
          id, aptitude_marks, percentage, result, created_by_role, created_by_userid
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        row.id,
        row.aptitude_marks && !isNaN(row.aptitude_marks) ? Number(row.aptitude_marks) : null,
        row.percentage && !isNaN(row.percentage) ? Number(row.percentage) : null,
        row.result || 'Not Defined',
        req.body.role,
        req.body.userid
      ]);


      await createLoginCredentials(client, row.id, row.student_name, row.email_id, row.contact_no, row.training_status);
    }

    await client.query("COMMIT");

    res.status(200).json({
      message: "Upload completed",
      inserted: validRows.length,
      ignored,
      errors
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Bulk upload error:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    client.release();
  }
});



// Route to update student's batch
app.put("/api/moveStudent/:id", async (req, res) => {

  const studentId = req.params.id;
  const { batch, moveReason, role, userid } = req.body; // Get batch and move reason from request

  if (!batch || !moveReason || !studentId) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { email, password } = await getEmailCredentials(userid, role);
    if (!email || !password) {
      throw new Error("Email credentials not found.");
    }

    // Fetch student details
    const { rows } = await client.query(
      "SELECT student_name, email_id, batch_name, training_status FROM student_registration WHERE id = $1",
      [studentId]
    );

    if (rows.length === 0) {
      client.release();
      return res.status(404).json({ error: "Student not found." });
    }

    const student = rows[0];
    const oldBatch = student.batch_name;
    const trainingStatus = student.training_status;

    // Prevent moving to the same batch
    if (oldBatch === batch) {
      client.release();
      return res.status(400).json({ error: "Student is already in this batch." });
    }

    // Update batch name
    await client.query(
      "UPDATE student_registration SET batch_name = $1 WHERE id = $2",
      [batch, studentId]
    );

    // If training status is "No Status", set it to "In Training"
    if (trainingStatus === "No Status") {
      await client.query(
        "UPDATE student_registration SET training_status = 'In Training' WHERE id = $1",
        [studentId]
      );

      await client.query(
        "UPDATE intern_login SET status = 'In Training' WHERE student_id = $1",
        [studentId]
      );
    }

    // Insert batch move into history with reason
    await client.query(
      "INSERT INTO student_batch_history (student_id, old_batch, new_batch, moved_at, move_reason, created_by_role, created_by_userid) VALUES ($1, $2, $3, NOW(), $4, $5, $6)",
      [studentId, oldBatch, batch, moveReason || "Batch updated", role, userid]
    );


    // Insert notification for student
    await client.query(
      `INSERT INTO student_notifications (student_id, message, created_at, seen) 
       VALUES ($1, $2, NOW(), false);`,
      [studentId, `You have been moved to batch ${batch}. Reason: ${moveReason || "Batch updated"}`]
    );

    await client.query("COMMIT");

    // Configure your email transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email,
        pass: password,
      },
    });

    let mailOptions = {
      from: `"Training Team" <${email}>`,
      to: student.email_id,
      subject: "📢 Vishva Vidya - Batch Change Notification",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Logo -->
            <div style="text-align: center; padding: 20px 20px 0 20px;">
              <img src="https://vishvavidya.com/wp-content/uploads/2024/07/Vishvavidya-logo-e1719900509472.png" alt="Vishva Vidya Logo" width="180" style="max-width: 100%; height: auto;" />
            </div>
    
            <!-- Header -->
            <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
              <h2 style="margin: 0;">VishvaVidya Management System</h2>
            </div>
    
            <!-- Body -->
            <div style="padding: 30px; color: #333;">
              <p style="font-size: 16px;">Dear <strong>${student.student_name}</strong>,</p>
    
              <p style="font-size: 16px;">We would like to inform you that your batch has been successfully updated.</p>
    
              <table style="width: 100%; background: #f1f1f1; border-radius: 8px; padding: 10px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 10px;"><strong>Previous Batch :</strong></td>
                  <td style="padding: 10px;">${oldBatch}</td>
                </tr>
                <tr>
                  <td style="padding: 10px;"><strong>New Batch :</strong></td>
                  <td style="padding: 10px;">${batch}</td>
                </tr>
                <tr>
                  <td style="padding: 10px;"><strong>Reason :</strong></td>
                  <td style="padding: 10px;">${moveReason || "N/A"}</td>
                </tr>
              </table>
    
              <div style="margin: 20px 0; padding: 15px; background-color: #e8f4fd; border-left: 5px solid #1976d2;">
                <p style="margin: 0; font-size: 16px; color: #2c3e50;">
                  If you have any questions regarding this change, feel free to contact your trainer or admin.
                </p>
              </div>
    
              <p style="margin-top: 30px;">Best regards,<br/>Team Vishva Vidya</p>
            </div>
    
            <!-- Footer -->
            <div style="background-color: #f0f0f0; color: #666; text-align: center; font-size: 12px; padding: 15px;">
              This is an automated message. Please do not reply.
            </div>
          </div>
        </div>
      `
    };



    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      }
    });

    res.json({ message: "Student moved successfully, reason recorded, email sent, and notification created" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error moving student:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
});

//api to get no batch students
app.get("/api/no-batch-students", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM student_registration
      WHERE batch_name = 'No Batch'
      ORDER BY id DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching no-batch students:", error);
    res.status(500).json({ message: "Server error while fetching no-batch students." });
  }
});

//move students in bulk
app.put("/api/move-students-to-batch", async (req, res) => {
  const { studentIds, newBatch, reason, role, userid } = req.body;

  console.log("role : ", role);

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !newBatch || !reason) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { email, password } = await getEmailCredentials(userid, role);

    const { rows: validStudents } = await client.query(
      "SELECT id FROM student_registration WHERE id = ANY($1::TEXT[])",
      [studentIds]
    );

    if (validStudents.length !== studentIds.length) {
      return res.status(400).json({ message: "Some student IDs are invalid." });
    }

    for (const studentId of studentIds) {
      const { rows } = await client.query(
        "SELECT student_name, email_id, batch_name, training_status FROM student_registration WHERE id = $1",
        [studentId]
      );

      const student = rows[0];
      const oldBatch = student.batch_name || "No Batch";
      const oldStatus = student.training_status || "No Status";
      const newStatus = "In Training";

      await client.query(
        "UPDATE student_registration SET batch_name = $1, training_status = $2 WHERE id = $3",
        [newBatch, newStatus, studentId]
      );

      await client.query(
        `INSERT INTO student_batch_history (student_id, new_batch, move_reason, moved_at, old_batch, created_by_role, created_by_userid) 
         VALUES ($1, $2, $3, NOW(), $4, $5, $6);`,
        [studentId, newBatch, reason, oldBatch, role, userid]
      );


      await client.query(
        `INSERT INTO status_change_history (student_id, old_status, new_status, reason, changed_at)
         VALUES ($1, $2, $3, $4, NOW());`,
        [studentId, oldStatus, newStatus, "Status changed due to batch move"]
      );

      await client.query(
        `INSERT INTO student_notifications (student_id, message, created_at, seen) 
         VALUES ($1, $2, NOW(), false);`,
        [studentId, `You have been moved to batch ${newBatch}. Reason: ${reason}. Training status updated to ${newStatus}.`]
      );

      // Send Email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: email,
          pass: password, // Use ENV in production!
        },
      });

      const mailOptions = {
        from: `"Training Team" <${email}>`,
        to: student.email_id,
        subject: "📢 Vishva Vidya - Batch & Training Status Update",
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; background-color: #f9f9f9; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
              
              <!-- Logo -->
              <div style="text-align: center; padding: 20px 20px 0 20px;">
                <img src="https://vishvavidya.com/wp-content/uploads/2024/07/Vishvavidya-logo-e1719900509472.png" alt="Vishva Vidya Logo" width="180" style="max-width: 100%; height: auto;" />
              </div>
      
              <!-- Header -->
              <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">VishvaVidya Management System</h2>
              </div>
      
              <!-- Body -->
              <div style="padding: 30px; color: #333;">
                <p style="font-size: 16px;">Dear <strong>${student.student_name}</strong>,</p>
                <p style="font-size: 16px;">We would like to inform you that your batch and training status have been updated.</p>
      
                <table style="width: 100%; background: #f1f1f1; border-radius: 8px; padding: 10px; margin-bottom: 20px;">
                  <tr><td style="padding: 10px;"><strong>New Batch:</strong></td><td style="padding: 10px;">${newBatch}</td></tr>
                  <tr><td style="padding: 10px;"><strong>New Status:</strong></td><td style="padding: 10px;">${newStatus}</td></tr>
                  <tr><td style="padding: 10px;"><strong>Reason:</strong></td><td style="padding: 10px;">${reason}</td></tr>
                </table>
      
                <div style="margin: 20px 0; padding: 15px; background-color: #e8f4fd; border-left: 5px solid #1976d2;">
                  <p style="margin: 0; font-size: 16px;">If you have any questions, please reach out to your trainer or admin.</p>
                </div>
      
                <p style="margin-top: 30px;">Best regards,<br/>Team Vishva Vidya</p>
              </div>
      
              <!-- Footer -->
              <div style="background-color: #f0f0f0; color: #666; text-align: center; font-size: 12px; padding: 15px;">
                This is an automated message. Please do not reply.
              </div>
            </div>
          </div>
        `
      };


      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error(`Email error for ${student.email_id}:`, error);
      });
    }

    await client.query("COMMIT");
    res.status(200).json({ message: `${studentIds.length} student(s) moved, status updated, and email(s) sent.` });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error moving students:", error);
    res.status(500).json({ message: "Internal server error." });
  } finally {
    client.release();
  }
});


//register User
app.post("/api/register", async (req, res) => {
  const { name, email, contactNo, username, password, role } = req.body;
  // const studentrole = 'intern';

  try {
    await pool.query(
      "INSERT INTO register (name, email_id, contact_no, username, password, role) VALUES ($1, $2, $3, $4, $5, $6)",
      [name, email, contactNo, username, password, role]
    );
    console.log("Form details inserted successfully");
    res.status(201).json({ message: "Register User successfully" });
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ message: "User already exists with this email." });
  }
});

app.post('/api/clientRegistration', async (req, res) => {
  const { name, email, contactNo, companyName, companyWebsite, username, password } = req.body;

  try {
    const role = "partner"
    await pool.query('INSERT INTO register (name, email_id, contact_no, company_name, company_website, username, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [name, email, contactNo, companyName, companyWebsite, username, password, role]);
    console.log(' Client register successfully');
    res.status(201).json({ message: 'Register User successfully' });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ message: 'User already exists with this email.' });
  }
});

//login authentication api
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", username);

  try {
    // Check in 'register' table
    let result = await pool.query(
      "SELECT username, name, email_id, role, userid, company_name, company_website FROM register WHERE username = $1 AND password = $2",
      [username, password]
    );
    console.log("Register check:", result.rows.length);

    if (result.rows.length === 0) {
      // Check in 'intern_login'
      result = await pool.query(
        `SELECT student_id AS username, name, email_id AS email, role, student_id AS userid, status
         FROM intern_login
         WHERE student_id = $1 AND password = $2`,
        [username, password]
      );

      console.log("Intern login check:", result.rows.length);

      if (result.rows.length > 0) {
        const internStatus = result.rows[0].status;
        if (internStatus === "Placed" || internStatus === "Absconding") {
          console.log("Intern access denied");
          return res.status(403).json({ message: `Access denied: Intern is ${internStatus}` });
        }
      }
    }

    if (result.rows.length === 0) {
      // Check in 'instructors'
      result = await pool.query(
        `SELECT id AS username, instructor_name AS name, email, role, id AS userid
         FROM instructors
         WHERE id = $1 AND password = $2`,
        [username, password]
      );
      console.log("Instructors check:", result.rows.length);
    }

    if (result.rows.length === 0) {
      console.log("Invalid credentials");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const {
      username: dbUsername,
      name,
      role,
      userid,
      email,
      company_name,
      company_website
    } = result.rows[0];

    // Create session token (JWT)
    const sessionToken = jwt.sign({ username: dbUsername, email: email }, "your_secret_key", { expiresIn: "1h" });

    console.log("Login successful:", dbUsername);
    res.json({
      message: "Login successful",
      token: sessionToken,
      name: name,
      role: role,
      userid: userid,
      email: email,  // Make sure email is included here as well
      company_name: company_name || null,
      company_website: company_website || null,
    });

  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


//api Batch Wise Attendance 
app.post("/api/saveAttendance", async (req, res) => {
  const { batch_name, date, lecture_no, students, attendance, marked_by_userid, marked_by_role } = req.body;

  if (!batch_name || !date || !lecture_no || !students || students.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let client;
  try {
    client = await pool.connect();

    const existingAttendance = await client.query(
      `SELECT COUNT(*) FROM attendance WHERE batch_name = $1 AND date = $2 AND lecture_no = $3`,
      [batch_name, date, lecture_no]
    );

    if (parseInt(existingAttendance.rows[0].count) > 0) {
      return res.status(409).json({ error: "❌ Attendance already recorded for this batch, date, and lecture number!" });
    }

    await client.query("BEGIN");

    for (let student of students) {
      const isPresent = attendance[student.id] || false;
      await client.query(
        `INSERT INTO attendance (batch_name, student_id, student_name, date, lecture_no, status, marked_by_userid, marked_by_role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [batch_name, student.id, student.student_name, date, lecture_no, isPresent, marked_by_userid, marked_by_role]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "✅ Attendance saved successfully!" });

  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("❌ Error saving attendance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (client) client.release();
  }
});


app.get("/api/getAttendance", async (req, res) => {
  const { batch, date, status, name, lecture_no } = req.query;
  let query = "SELECT * FROM attendance";
  const params = [];

  if (batch || date || status || name || lecture_no) {
    query += " WHERE";
    if (batch) {
      params.push(batch);
      query += ` batch_name = $${params.length}`;
    }
    if (date) {
      if (params.length > 0) query += " AND";
      params.push(date);
      query += ` date = $${params.length}`;
    }
    if (status) {
      if (params.length > 0) query += " AND";
      params.push(status === "true");
      query += ` status = $${params.length}`;
    }
    if (name) {
      if (params.length > 0) query += " AND";
      params.push(`%${name}%`);
      query += ` student_name ILIKE $${params.length}`;
    }
    if (lecture_no) {
      if (params.length > 0) query += " AND";
      params.push(lecture_no);
      query += ` lecture_no = $${params.length}`;
    }
  }

  query += " ORDER BY date DESC";

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Update attendance
app.put("/api/updateAttendance", async (req, res) => {
  const { student_id, batch_name, lecture_no, status, marked_by_userid, marked_by_role } = req.body;

  if (!student_id || !batch_name || !lecture_no || typeof status === "undefined") {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const checkResult = await pool.query(
      `SELECT * FROM attendance
       WHERE student_id = $1 AND batch_name = $2 AND lecture_no = $3`,
      [student_id, batch_name, lecture_no]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    await pool.query(
      `UPDATE attendance
       SET status = $1, marked_by_userid = $2, marked_by_role = $3
       WHERE student_id = $4 AND batch_name = $5 AND lecture_no = $6`,
      [status, marked_by_userid, marked_by_role, student_id, batch_name, lecture_no]
    );

    res.json({ message: "✅ Attendance updated successfully" });
  } catch (error) {
    console.error("❌ Update error:", error);
    res.status(500).json({ message: "Server error while updating attendance" });
  }
});


app.get("/api/viewAttendance", async (req, res) => {
  const {
    batch = "",
    date = "",
    status = "",
    lecture_no = "",
    student_name = "",
  } = req.query;

  let query = `
    SELECT a.student_id, a.batch_name, a.lecture_no, a.date, a.status,
           s.student_name, s.email_id
    FROM attendance a
    JOIN student_registration s ON a.student_id = s.id
    WHERE 1 = 1
  `;
  const values = [];
  let count = 1;

  if (batch) {
    query += ` AND a.batch_name = $${count++}`;
    values.push(batch);
  }
  if (date) {
    query += ` AND a.date = $${count++}`;
    values.push(date);
  }
  if (status !== "") {
    query += ` AND a.status = $${count++}`;
    values.push(status === "true");
  }
  if (lecture_no) {
    query += ` AND a.lecture_no = $${count++}`;
    values.push(lecture_no);
  }
  if (student_name) {
    query += ` AND LOWER(s.student_name) LIKE $${count++}`;
    values.push(`%${student_name.toLowerCase()}%`);
  }

  query += ` ORDER BY a.date DESC, a.lecture_no`;

  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
});


app.get("/api/getBatchAttendance", async (req, res) => {
  try {
    const result = await pool.query(`
          SELECT batch_name, 
                 ROUND((SUM(CASE WHEN status = TRUE THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 1) AS attendance_percentage
          FROM attendance
          GROUP BY batch_name
      `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/getBatchAttendance/:batchName", async (req, res) => {
  const { batchName } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        batch_name, 
        COUNT(*) AS total_days, 
        SUM(CASE WHEN status = TRUE THEN 1 ELSE 0 END) AS present_days,
        ROUND((SUM(CASE WHEN status = TRUE THEN 1 ELSE 0 END)::float / COUNT(*)) * 100, 1) AS attendance_percentage
      FROM attendance
      WHERE batch_name = $1
      GROUP BY batch_name`,
      [batchName]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]); // ✅ Send batch attendance percentage
    } else {
      res.json({ batch_name: batchName, attendance_percentage: 0 }); // If no data, return 0%
    }
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch attendance for the student based on the user's email
app.get("/api/intern/attendance", async (req, res) => {
  try {
    const userid = req.cookies.userid; // Fetch userid from cookies

    if (!userid) {
      return res.status(401).json({ message: "User not logged in" });
    }

    // console.log("Logged-in User ID:", userid);

    // Fetch attendance records for the logged-in user
    const result = await pool.query(
      "SELECT date, status, batch_name FROM attendance WHERE student_id = $1",
      [userid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No attendance records found" });
    }

    res.status(200).json({ attendance: result.rows });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


//Create Exam API's
app.post("/exams", async (req, res) => {
  try {
    const { title, duration, instructions, shuffle_questions } = req.body;
    const result = await pool.query(
      "INSERT INTO exams (title, duration, instructions, shuffle_questions) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, duration, instructions, shuffle_questions]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch all exams
app.get("/exams", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM exams");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Fetch a single exam with questions and options
app.get("/exams/:id", async (req, res) => {
  try {
    const examId = req.params.id;
    // Fetch exam details
    const exam = await pool.query("SELECT * FROM exams WHERE id = $1", [examId]);

    // Fetch questions for the exam
    const questions = await pool.query("SELECT * FROM questions WHERE exam_id = $1", [examId]);

    // For each question, fetch associated options
    for (let q of questions.rows) {
      const options = await pool.query("SELECT * FROM options WHERE question_id = $1", [q.id]);
      q.options = options.rows;  // Associate options with each question
    }

    // Send response containing exam and its questions with options
    res.json({ exam: exam.rows[0], questions: questions.rows });
  } catch (err) {
    console.error("Error fetching exam details:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Add a question to an exam

app.post("/questions", async (req, res) => {
  try {
    const { exam_id, text, image_url, marks } = req.body;
    const result = await pool.query(
      "INSERT INTO questions (exam_id, text, image_url, marks) VALUES ($1, $2, $3, $4) RETURNING *",
      [exam_id, text, image_url, marks]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add an option to a question
app.post("/options", async (req, res) => {
  try {
    const { question_id, text, image_url, is_correct } = req.body;
    const result = await pool.query(
      "INSERT INTO options (question_id, text, image_url, is_correct) VALUES ($1, $2, $3, $4) RETURNING *",
      [question_id, text, image_url, is_correct]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Edit an exam
app.put("/exams/:id", async (req, res) => {
  const examId = req.params.id;
  const { title, duration, instructions, shuffleQuestions } = req.body;
  const client = await pool.connect();

  try {
    console.log("Received request to update exam with ID:", examId);

    await client.query("BEGIN");

    // Check if the exam exists
    const { rows } = await client.query(
      "SELECT * FROM exams WHERE id = $1",
      [examId]
    );

    if (rows.length === 0) {
      console.error(`Exam with ID ${examId} not found`);
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Exam not found." });
    }

    // Update the exam details
    await client.query(
      "UPDATE exams SET title = $1, duration = $2, instructions = $3, shuffle_questions = $4 WHERE id = $5",
      [title, duration, instructions, shuffleQuestions, examId]
    );

    await client.query("COMMIT");
    res.json({ message: "Exam updated successfully" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating exam:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
});

// Delete an exam
app.delete("/exams/:id", async (req, res) => {
  try {
    const examId = req.params.id;
    await pool.query("DELETE FROM exams WHERE id = $1", [examId]);
    res.json({ message: "Exam deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a question
app.delete("/questions/:id", async (req, res) => {
  try {
    const questionId = req.params.id;
    await pool.query("DELETE FROM questions WHERE id = $1", [questionId]);
    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete an option
app.delete("/options/:id", async (req, res) => {
  try {
    const optionId = req.params.id;
    await pool.query("DELETE FROM options WHERE id = $1", [optionId]);
    res.json({ message: "Option deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


//api Evaluation result

//API: Submit Single Student Evaluation Result
// app.post("/api/evaluation-result-form", async (req, res) => {
//   try {
//     const formData = req.body;

//     // Check if a record with the same student name exists
//     const existingRecord = await pool.query(
//       `SELECT * FROM evaluation_result 
//        WHERE student_name = $1 
//        AND batch_name = $2 
//        AND contact_number = $3 
//        AND email = $4`,
//       [formData.studentName, formData.batchName, formData.contactNumber, formData.email]
//     );

//     if (existingRecord.rows.length > 0) {
//       // If a record with the same student name exists, update the record
//       const existingData = existingRecord.rows[0]; // Assuming there's only one matching record
//       const updatedData = {
//         contact_number: formData.contactNumber || existingData.contact_number,
//         email: formData.email || existingData.email,
//         communication_skills: formData.communicationSkills || existingData.communication_skills,
//         batch_name: formData.batchName || existingData.batch_name,
//         track_name: formData.trackName || existingData.track_name,
//         apti_marks: formData.aptitudeMarks || existingData.apti_marks,
//         apti_percentage: formData.aptitudePercentage || existingData.apti_percentage,
//         apti_result: formData.aptitudeResult || existingData.apti_result,
//         module1_technical: formData.module1TechnicalMarks || existingData.module1_technical,
//         module1_mcq: formData.module1MCQMarks || existingData.module1_mcq,
//         module1_oral: formData.module1OralMarks || existingData.module1_oral,
//         module1_total: formData.module1TotalMarks || existingData.module1_total,
//         module1_remark: formData.module1Remark || existingData.module1_remark,
//         module2_technical: formData.module2TechnicalMarks || existingData.module2_technical,
//         module2_mcq: formData.module2MCQMarks || existingData.module2_mcq,
//         module2_oral: formData.module2OralMarks || existingData.module2_oral,
//         module2_total: formData.module2TotalMarks || existingData.module2_total,
//         module2_remark: formData.module2Remark || existingData.module2_remark,
//         module3_technical: formData.module3TechnicalMarks || existingData.module3_technical,
//         module3_mcq: formData.module3MCQMarks || existingData.module3_mcq,
//         module3_oral: formData.module3OralMarks || existingData.module3_oral,
//         module3_total: formData.module3TotalMarks || existingData.module3_total,
//         module3_remark: formData.module3Remark || existingData.module3_remark,
//         module4_technical: formData.module4TechnicalMarks || existingData.module4_technical,
//         module4_mcq: formData.module4MCQMarks || existingData.module4_mcq,
//         module4_oral: formData.module4OralMarks || existingData.module4_oral,
//         module4_total: formData.module4TotalMarks || existingData.module4_total,
//         module4_remark: formData.module4Remark || existingData.module4_remark,
//         module1_name: formData.module1Name || existingData.module1_name,
//         module2_name: formData.module2Name || existingData.module2_name,
//         module3_name: formData.module3Name || existingData.module3_name,
//         module4_name: formData.module4Name || existingData.module4_name,
//       };

//       await pool.query(
//         `
//           UPDATE evaluation_result SET
//           contact_number = $1,
//           email = $2,
//           communication_skills = $3,
//           batch_name = $4,
//           track_name = $5,
//           apti_marks = $6,
//           apti_percentage = $7,
//           apti_result = $8,
//           module1_name = $9,
//           module1_technical = $10,
//           module1_mcq = $11,
//           module1_oral = $12,
//           module1_total = $13,
//           module1_remark = $14,
//           module2_name = $15,
//           module2_technical = $16,
//           module2_mcq = $17,
//           module2_oral = $18,
//           module2_total = $19,
//           module2_remark = $20,
//           module3_name = $21,
//           module3_technical = $22,
//           module3_mcq = $23,
//           module3_oral = $24,
//           module3_total = $25,
//           module3_remark = $26,
//           module4_name = $27,
//           module4_technical = $28,
//           module4_mcq = $29,
//           module4_oral = $30,
//           module4_total = $31,
//           module4_remark = $32
//           WHERE student_name = $33
//           `,
//         [
//           updatedData.contact_number || null,
//           updatedData.email || null,
//           updatedData.communication_skills || null,
//           updatedData.batch_name || null,
//           updatedData.track_name || null,
//           updatedData.apti_marks || null,
//           updatedData.apti_percentage || null,
//           updatedData.apti_result || null,
//           updatedData.module1_name || null,
//           updatedData.module1_technical || null,
//           updatedData.module1_mcq || null,
//           updatedData.module1_oral || null,
//           updatedData.module1_total || null,
//           updatedData.module1_remark || null,
//           updatedData.module2_name || null,
//           updatedData.module2_technical || null,
//           updatedData.module2_mcq || null,
//           updatedData.module2_oral || null,
//           updatedData.module2_total || null,
//           updatedData.module2_remark || null,
//           updatedData.module3_name || null,
//           updatedData.module3_technical || null,
//           updatedData.module3_mcq || null,
//           updatedData.module3_oral || null,
//           updatedData.module3_total || null,
//           updatedData.module3_remark || null,
//           updatedData.module4_name || null,
//           updatedData.module4_technical || null,
//           updatedData.module4_mcq || null,
//           updatedData.module4_oral || null,
//           updatedData.module4_total || null,
//           updatedData.module4_remark || null,
//           formData.studentName || null,
//         ]

//       );
//     } else {
//       // If no record with the same student name exists, insert a new record
//       await pool.query(
//         `
//           INSERT INTO evaluation_result (
//             student_name,
//             contact_number,
//             email,
//             batch_name,
//             communication_skills,
//             track_name,
//             apti_marks,
//             apti_percentage,
//             apti_result,

//             module1_name,
//             module1_technical,
//             module1_mcq,
//             module1_oral,
//             module1_total,
//             module1_remark,

//             module2_name,
//             module2_technical,
//             module2_mcq,
//             module2_oral,
//             module2_total,
//             module2_remark,

//             module3_name,
//             module3_technical,
//             module3_mcq,
//             module3_oral,
//             module3_total,
//             module3_remark,

//             module4_name,
//             module4_technical,
//             module4_mcq,
//             module4_oral,
//             module4_total,
//             module4_remark
//           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
//           `,
//         [
//           formData.studentName || null,
//           formData.contactNumber || null,
//           formData.email || null,
//           formData.batchName || null,
//           formData.communicationSkills || null,
//           formData.trackName || null,
//           formData.aptitudeMarks || null,
//           formData.aptitudePercentage || null,
//           formData.aptitudeResult || null,
//           formData.module1Name || null,
//           formData.module1TechnicalMarks || null,
//           formData.module1MCQMarks || null,
//           formData.module1OralMarks || null,
//           formData.module1TotalMarks || null,
//           formData.module1Remark || null,
//           formData.module2Name || null,
//           formData.module2TechnicalMarks || null,
//           formData.module2MCQMarks || null,
//           formData.module2OralMarks || null,
//           formData.module2TotalMarks || null,
//           formData.module2Remark || null,
//           formData.module3Name || null,
//           formData.module3TechnicalMarks || null,
//           formData.module3MCQMarks || null,
//           formData.module3OralMarks || null,
//           formData.module3TotalMarks || null,
//           formData.module3Remark || null,
//           formData.module4Name || null,
//           formData.module4TechnicalMarks || null,
//           formData.module4MCQMarks || null,
//           formData.module4OralMarks || null,
//           formData.module4TotalMarks || null,
//           formData.module4Remark || null,
//         ]
//       );
//     }

//     res.status(201).send("Evaluation Result submitted successfully");
//   } catch (error) {
//     console.error("Error inserting/updating evaluation result:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

app.post('/api/evaluations', async (req, res) => {
  const { batchName, created_by_userid, created_by_role, students } = req.body;

  if (!batchName || !created_by_userid || !created_by_role || !Array.isArray(students)) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const student of students) {
      const {
        email_id, id, student_name, evaluationData
      } = student;

      const {
        attempt, attemptName, technical, mcq, oral, total,
        remark, pendingTechnical, pendingMcq, pendingOral, pendingRemark
      } = evaluationData;

      const now = new Date(); // current timestamp

      // Check if record already exists
      const { rows } = await client.query(`
        SELECT * FROM evaluations WHERE email_id = $1 AND batch_name = $2 AND attempt = $3
      `, [email_id, batchName, attempt]);

      if (rows.length > 0) {
        // UPDATE
        await client.query(`
          UPDATE evaluations
          SET student_name = $1, attempt_name = $2,
              technical = $3, mcq = $4, oral = $5, total = $6, remark = $7,
              pending_technical = $8, pending_mcq = $9, pending_oral = $10, pending_remark = $11,
              updated_by_userid = $12, updated_by_role = $13, updated_at = $14
          WHERE email_id = $15 AND batch_name = $16 AND attempt = $17
        `, [
          student_name, attemptName,
          technical, mcq, oral, total, remark,
          pendingTechnical, pendingMcq, pendingOral, pendingRemark,
          created_by_userid, created_by_role,
          now, // updated_at
          email_id, batchName, attempt
        ]);
      } else {
        // INSERT
        await client.query(`
          INSERT INTO evaluations (
            email_id, student_id, student_name, batch_name, attempt, attempt_name,
            technical, mcq, oral, total, remark,
            pending_technical, pending_mcq, pending_oral, pending_remark,
            created_by_userid, created_by_role, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        `, [
          email_id, id, student_name, batchName, attempt, attemptName,
          technical, mcq, oral, total, remark,
          pendingTechnical, pendingMcq, pendingOral, pendingRemark,
          created_by_userid, created_by_role,
          now // created_at
        ]);
      }
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Evaluations processed successfully.' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving/updating evaluations:', error);
    res.status(500).json({ message: 'Error saving/updating evaluations.' });
  } finally {
    client.release();
  }
});

// server.js (Node.js with Express)
app.put("/api/evaluations/:id", async (req, res) => {
  const { id } = req.params;
  const {
    technical,
    mcq,
    oral,
    remark,
    total,
    pending_technical,
    pending_mcq,
    pending_oral,
    pending_remark
  } = req.body;

  try {
    const sql = `
      UPDATE evaluations 
      SET 
        technical = $1, 
        mcq = $2, 
        oral = $3, 
        remark = $4, 
        total = $5, 
        pending_technical = $6, 
        pending_mcq = $7, 
        pending_oral = $8, 
        pending_remark = $9
      WHERE id = $10
    `;

    await pool.query(sql, [
      technical ?? null,
      mcq ?? null,
      oral ?? null,
      remark ?? null,
      total ?? null,
      pending_technical ?? false,
      pending_mcq ?? false,
      pending_oral ?? false,
      pending_remark ?? false,
      id
    ]);

    res.status(200).json({ message: "Evaluation updated successfully" });
  } catch (error) {
    console.error("Error updating evaluation:", error);
    res.status(500).json({ error: "Failed to update evaluation" });
  }
});


app.get("/api/getstudentsbyattempt", async (req, res) => {
  const { batchName, selectedAttempt } = req.query;
  const client = await pool.connect();

  try {
    const studentsQuery = `
      SELECT * FROM student_registration
      WHERE batch_name = $1
      AND email_id NOT IN (
        SELECT email_id FROM evaluations
        WHERE attempt = $2
      )
    `;
    const result = await client.query(studentsQuery, [batchName, selectedAttempt]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching students without saved attempt:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
});


app.post("/api/evaluations/fetch", async (req, res) => {
  try {
    const { batchName, studentIds, attempts } = req.body;
    console.log("Fetching evaluations for batch:", batchName, "studentIds:", studentIds, "attempts:", attempts);

    const result = await pool.query(
      `SELECT * FROM evaluations
       WHERE batch_name = $1
       AND student_id = ANY($2)
       AND attempt = ANY($3)`,
      [batchName, studentIds, attempts]
    );
    console.log('Fetched evaluations:', result.rows); // Log the fetched data
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    res.status(500).send("Internal Server Error");
  }
});



//API: Upload Bulk Evaluation Results via Excel
app.post("/api/evaluationResultExcelUpload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const allowedMimeTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path); // cleanup
      return res.status(400).json({ message: "Invalid file type. Only Excel files are allowed." });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    fs.unlinkSync(req.file.path); // Delete after reading

    if (!data.length) {
      return res.status(400).send("The file is empty or contains invalid data.");
    }

    const validData = data.filter(row => row.student_name && row.batch_name);

    if (validData.length === 0) {
      return res.status(400).send("The file contains invalid or empty records.");
    }

    const client = await pool.connect();
    await client.query("BEGIN");

    await Promise.all(
      validData.map(async (excelRow) => {
        const existingRecord = await client.query(
          `SELECT * FROM evaluation_result 
           WHERE student_name = $1 AND batch_name = $2 AND contact_number = $3 AND email = $4`,
          [excelRow.student_name, excelRow.batch_name, excelRow.contact_number, excelRow.email]
        );

        const values = [
          excelRow.contact_number || null, excelRow.email || null, excelRow.communication_skills || null,
          excelRow.track_name || null, excelRow.apti_marks || null, excelRow.apti_percentage || null, excelRow.apti_result || null,
          excelRow.module1_technical || null, excelRow.module1_mcq || null, excelRow.module1_oral || null, excelRow.module1_total || null, excelRow.module1_remark || null, excelRow.module1_name || null,
          excelRow.module2_technical || null, excelRow.module2_mcq || null, excelRow.module2_oral || null, excelRow.module2_total || null, excelRow.module2_remark || null, excelRow.module2_name || null,
          excelRow.module3_technical || null, excelRow.module3_mcq || null, excelRow.module3_oral || null, excelRow.module3_total || null, excelRow.module3_remark || null, excelRow.module3_name || null,
          excelRow.module4_technical || null, excelRow.module4_mcq || null, excelRow.module4_oral || null, excelRow.module4_total || null, excelRow.module4_remark || null, excelRow.module4_name || null,
          excelRow.student_name, excelRow.batch_name
        ];

        if (existingRecord.rows.length > 0) {
          await client.query(
            `UPDATE evaluation_result SET
              contact_number=$1, email=$2, communication_skills=$3,
              track_name=$4, apti_marks=$5, apti_percentage=$6, apti_result=$7,
              module1_technical=$8, module1_mcq=$9, module1_oral=$10, module1_total=$11, module1_remark=$12, module1_name=$13,
              module2_technical=$14, module2_mcq=$15, module2_oral=$16, module2_total=$17, module2_remark=$18, module2_name=$19,
              module3_technical=$20, module3_mcq=$21, module3_oral=$22, module3_total=$23, module3_remark=$24, module3_name=$25,
              module4_technical=$26, module4_mcq=$27, module4_oral=$28, module4_total=$29, module4_remark=$30, module4_name=$31
            WHERE student_name=$32 AND batch_name=$33`,
            values
          );
        } else {
          await client.query(
            `INSERT INTO evaluation_result (
              contact_number, email, communication_skills, track_name,
              apti_marks, apti_percentage, apti_result,
              module1_technical, module1_mcq, module1_oral, module1_total, module1_remark, module1_name,
              module2_technical, module2_mcq, module2_oral, module2_total, module2_remark, module2_name,
              module3_technical, module3_mcq, module3_oral, module3_total, module3_remark, module3_name,
              module4_technical, module4_mcq, module4_oral, module4_total, module4_remark, module4_name,
              student_name, batch_name
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              $8, $9, $10, $11, $12, $13,
              $14, $15, $16, $17, $18, $19,
              $20, $21, $22, $23, $24, $25,
              $26, $27, $28, $29, $30, $31,
              $32, $33
            )`,
            values
          );
        }
      })
    );

    await client.query("COMMIT");
    client.release();

    res.status(200).json({ message: "Evaluation results successfully uploaded." });
  } catch (error) {
    console.error("Error uploading evaluation results:", error);
    res.status(500).send("Internal server error");
  }
});

app.get("/api/get-evaluation-results", async (req, res) => {
  const { batchName } = req.query;

  try {
    let query = "SELECT * FROM evaluations";
    let values = [];

    if (batchName) {
      query += " WHERE batch_name = $1";
      values.push(batchName);
    }

    const result = await pool.query(query, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching evaluation results:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.get("/api/getStudentEvaluations", async (req, res) => {
  try {
    const { batchName, trackName } = req.query;

    let query = `SELECT * FROM evaluations`;

    let queryParams = [];
    let conditions = [];

    if (batchName) {
      conditions.push("batch_name = $1");
      queryParams.push(batchName);
    }
    if (trackName) {
      conditions.push(`track_name = $${queryParams.length + 1}`);
      queryParams.push(trackName);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching student evaluations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/filterEvaluations", async (req, res) => {
  const { batchName, searchQuery } = req.query;
  let query = "SELECT * FROM evaluations WHERE 1=1";
  let params = [];

  if (batchName) {
    query += " AND batch_name = ?";
    params.push(batchName);
  }

  if (searchQuery) {
    query += " AND student_name LIKE ?";
    params.push(`%${searchQuery}%`);
  }

  const [rows] = await connection.execute(query, params);
  res.json(rows);
});

app.get('/api/evaluations', (req, res) => {
  const { student_id, batch_name } = req.query; // Assuming you want to filter by student_id or batch_name
  const query = `
    SELECT 
        id, student_id, batch_name, attempt, technical, mcq, oral, total, 
        remark, status, pending_technical, pending_mcq, pending_oral, 
        pending_remark, student_name, email_id
    FROM evaluations
    WHERE student_id = ? AND batch_name = ?
  `;

  // Execute the query and send the response
  db.query(query, [student_id, batch_name], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results); // Return the result to the frontend
  });
});


//send evaluation mail
app.post("/api/sendEvaluationMail", async (req, res) => {
  const { students, selectedAttempts, role, userid } = req.body;
  console.log("Received students:", students);

  const { email, password } = await getEmailCredentials(userid, role);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: password,
    },
  });

  try {
    let emailResults = [];

    for (const student of students) {
      let selectedAttemptRows = [];

      ["attempt1", "attempt2", "attempt3", "attempt4"].forEach((attemptKey, index) => {
        if (selectedAttempts[attemptKey]) {
          selectedAttemptRows.push(`
            <tr>
              <td style="padding: 10px; text-align: center;">${index + 1}</td>
              <td style="padding: 10px; text-align: center;">${student[`attempt_name`] ?? '-'}</td>
              <td style="padding: 10px; text-align: center;">${student[`technical`] ?? '-'}</td>
              <td style="padding: 10px; text-align: center;">${student[`mcq`] ?? '-'}</td>
              <td style="padding: 10px; text-align: center;">${student[`oral`] ?? '-'}</td>
              <td style="padding: 10px; text-align: center;">${student[`total`] ?? '-'}</td>
              <td style="padding: 10px; text-align: center;">${student[`remark`] ?? '-'}</td>
            </tr>
          `);
        }
      });

      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 15px !important; }
            .table th, .table td { font-size: 12px !important; padding: 8px !important; }
            .heading h2 { font-size: 20px !important; }
          }
        </style>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 5px;">
        <div class="container" style="max-width: 600px; margin: auto; background-color: white; border-radius: 20px; border: 1px solid #ddd; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <div style="text-align: center; padding: 20px;">
            <img src="https://vishvavidya.com/wp-content/uploads/2024/07/Vishvavidya-logo-e1719900509472.png" alt="Vishva Vidya Logo" width="200" style="max-width: 100%; height: auto;" />
          </div>
      
          <div class="heading" style="background-color: #1976d2; color: white; text-align: center; padding: 20px;">
            <h2>VishvaVidya - Evaluation Report</h2>
          </div>
      
          <div style="padding: 25px; color: #333;">
            <p>Dear <strong>${student.student_name}</strong>,</p>
            <p>We are pleased to share your evaluation results for batch: <strong>${student.batch_name}</strong>.</p>
      
            ${selectedAttemptRows.length > 0 ? `
              <h3 style="margin-top: 25px;">Evaluation Results</h3>
              <div style="overflow-x: auto;">
                <table class="table" style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
                  <thead>
                    <tr style="background-color: #1976d2; color: white;">
                      <th style="padding: 10px; border: 1px solid #ddd;">Evaluation No</th>
                      <th style="padding: 10px; border: 1px solid #ddd;">Evaluation Name</th>
                      <th style="padding: 10px; border: 1px solid #ddd;">Technical</th>
                      <th style="padding: 10px; border: 1px solid #ddd;">MCQ</th>
                      <th style="padding: 10px; border: 1px solid #ddd;">Oral</th>
                      <th style="padding: 10px; border: 1px solid #ddd;">Total</th>
                      <th style="padding: 10px; border: 1px solid #ddd;">Remark</th>
                    </tr>
                  </thead>
                  <tbody>${selectedAttemptRows.join("")}</tbody>
                </table>
              </div>
            ` : `<p style="margin-top: 20px;">No attempt data selected.</p>`}
      
            <p style="margin-top: 25px;">Keep learning and growing! Feel free to reach out with any questions.</p>
            <p style="margin-top: 25px;">Best regards,<br/>Team Vishva Vidya</p>
          </div>
      
          <div style="background-color: #f0f0f0; color: #888; text-align: center; font-size: 12px; padding: 15px; border-top: 1px solid #ccc;">
            This is an automated email. Please do not reply to this message.
          </div>
        </div>
      </body>
      </html>
      `;


      const mailOptions = {
        from: `'Training Team' <${email}>`,
        to: student.email_id,
        subject: "📊 Your Evaluation Attempt Results - Vishva Vidya",
        html: htmlContent,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${student.email_id}`);
        emailResults.push({ email: student.email_id, status: "Sent" });
      } catch (error) {
        console.error(`❌ Failed to send email to ${student.email_id}:`, error.message);
        emailResults.push({ email: student.email_id, status: "Failed", error: error.message });
      }
    }

    res.status(200).json({ message: "Emails sent successfully", details: emailResults });
  } catch (error) {
    console.error("❌ Error sending evaluation emails:", error.message);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

//Access card API
app.post("/api/access-card-details", async (req, res) => {
  const {
    traineeCode,
    traineeName,
    email,
    contact,
    idCard,
    accessCardNumber,
    cardAllocationDate,
    trainingDuration,
    trainerName,
    managerName,
  } = req.body;

  try {
    const card_deposit = 'Paid';
    // SQL query to insert data
    const query = `
      INSERT INTO access_card_details (
        trainee_code,
        trainee_name,
        email,
        contact,
        id_card_type,
        access_card_number,
        card_allocation_date,
        training_duration,
        trainer_name,
        manager_name,
        deposit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;

    const values = [
      traineeCode,
      traineeName,
      email,
      contact,
      idCard,
      accessCardNumber,
      cardAllocationDate,
      trainingDuration,
      trainerName,
      managerName,
      card_deposit
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Access card details submitted successfully!",
      data: { id: result.rows[0].id },
    });
  } catch (error) {
    console.error("Error inserting data:", error.message);
    res.status(500).json({
      message: "Failed to submit details",
      error: error.message,
    });
  }
});

//Fetch All access card details
app.get("/api/getAccessCards", async (req, res) => {
  try {
    const query = "SELECT * FROM access_card_details ORDER BY created_at DESC";
    const result = await pool.query(query);

    // Respond with the retrieved data
    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching access card details:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch access card details.",
      error: error.message,
    });
  }
});

// PUT API to update access card details
app.put("/api/updateAccessCard", async (req, res) => {
  const {
    id,
    trainee_code,
    trainee_name,
    email,
    contact,
    id_card_type,
    access_card_number,
    card_allocation_date,
    training_duration,
    trainer_name,
    manager_name,
    card_submitted_date,
  } = req.body;

  try {
    // SQL query to update data
    const query = `
      UPDATE access_card_details
      SET
        trainee_code = $1,
        trainee_name = $2,
        email = $3,
        contact = $4,
        id_card_type = $5,
        access_card_number = $6,
        card_allocation_date = $7,
        training_duration = $8,
        trainer_name = $9,
        manager_name = $10,
        card_submitted_date = $11
      WHERE id = $12
      RETURNING *;
    `;

    const values = [
      trainee_code,
      trainee_name,
      email,
      contact,
      id_card_type,
      access_card_number,
      card_allocation_date,
      training_duration,
      trainer_name,
      manager_name,
      card_submitted_date,
      id, // Ensure the correct record is updated by ID
    ];

    const result = await pool.query(query, values);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]); // Return the updated card details
    } else {
      res.status(404).json({ message: "Access card not found." });
    }
  } catch (error) {
    console.error("Error updating access card:", error);
    res.status(500).json({ message: "Failed to update access card.", error: error.message });
  }
});

// Started edit from here 

//add track api
app.post("/api/tracks", async (req, res) => {
  const { trackName, startDate, recognitionCode, createdByUserId, createdByRole } = req.body;

  console.log("Received Data:", { trackName, startDate, createdByUserId, createdByRole }); // Debugging log

  if (!trackName || !startDate || !recognitionCode) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const trackExists = await pool.query("SELECT * FROM tracks WHERE track_name = $1", [trackName]);

    if (trackExists.rows.length > 0) {
      console.log("Track Already Exists"); // Debugging log
      return res.status(409).json({ message: "Track already exists" });
    }

    const insertQuery = `
      INSERT INTO tracks (track_name, start_date, recognition_code, created_by_userid, created_by_role)
      VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [trackName, startDate, recognitionCode, createdByUserId, createdByRole];

    await pool.query(insertQuery, values);

    console.log("Track Inserted Successfully"); // Debugging log
    res.status(201).json({ message: "Track added successfully" });
  } catch (error) {
    console.error("Database Insert Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Update a track
app.put("/api/tracks/:id", async (req, res) => {
  const { id } = req.params;
  const { trackName, startDate, recognitionCode, updatedByUserId, updatedByRole } = req.body;

  if (!trackName || !startDate || !recognitionCode) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const trackExists = await pool.query("SELECT * FROM tracks WHERE id = $1", [id]);

    if (trackExists.rows.length === 0) {
      return res.status(404).json({ message: "Track not found" });
    }

    const updateQuery = `
      UPDATE tracks
      SET track_name = $1, start_date = $2, recognition_code = $3, updated_by_userid = $4, updated_by_role = $5
      WHERE id = $6 RETURNING *
    `;
    const updatedTrack = await pool.query(updateQuery, [trackName, startDate, recognitionCode, updatedByUserId, updatedByRole, id]);

    res.json({ message: "Track updated successfully", track: updatedTrack.rows[0] });
  } catch (error) {
    console.error("Database Update Error:", error);
    res.status(500).json({ message: "Error updating track", error: error.message });
  }
});


// Delete a track
app.delete("/api/tracks/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const trackExists = await pool.query("SELECT * FROM tracks WHERE id = $1", [id]);

    if (trackExists.rows.length === 0) {
      return res.status(404).json({ message: "Track not found" });
    }

    const deletedTrack = await pool.query("DELETE FROM tracks WHERE id = $1 RETURNING *", [id]);

    res.json({ message: "Track deleted successfully", track: deletedTrack.rows[0] });
  } catch (error) {
    console.error("Database Delete Error:", error);
    res.status(500).json({ message: "Error deleting track", error: error.message });
  }
});


//Generates Instructor id
const generateInstructorId = async (client) => {
  const year = new Date().getFullYear();
  const prefix = `VVINSTRUCTOR${year}`;

  const result = await client.query(`
    SELECT id FROM instructors WHERE id LIKE $1 ORDER BY id DESC LIMIT 1
  `, [`${prefix}%`]);

  if (result.rows.length > 0) {
    const lastId = result.rows[0].id;
    const numPart = parseInt(lastId.replace(prefix, "")) || 0;
    return `${prefix}${String(numPart + 1).padStart(3, "0")}`;
  } else {
    return `${prefix}001`;
  }
};

const generateCustomPassword = (name) => {
  const firstNameRaw = name.trim().split(" ")[0].toLowerCase(); // get first name
  const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1); // capitalize
  const currentYear = new Date().getFullYear(); // ✅ Get the current year
  return `${firstName}@vishvavidya${currentYear}`;
};

//add instructor api
app.post("/api/addInstructor", async (req, res) => {
  const client = await pool.connect();
  try {
    const { instructorName, email, contact, technology, userid, role } = req.body;  // changed from createdByUserId, createdByRole

    if (!instructorName || !email || !contact || !technology) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists
    const existingInstructor = await client.query("SELECT * FROM instructors WHERE email = $1", [email]);
    if (existingInstructor.rows.length > 0) {
      return res.status(409).json({ message: "Instructor already exists" });
    }

    // Generate unique custom ID (used as primary key 'id')
    const customInstructorId = await generateInstructorId(client);
    const password = generateCustomPassword(instructorName);

    // Insert instructor into DB with created_by_userid, created_by_role
    const insertQuery = `
      INSERT INTO instructors (id, instructor_name, email, contact, technology, password, role, created_by_userid, created_by_role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    await client.query(insertQuery, [
      customInstructorId,
      instructorName,
      email,
      contact,
      technology,
      password,
      "trainer", // Default role for instructor
      userid, // Now we use createdBy and role
      role,      // Now we use createdBy and role
    ]);

    res.status(201).json({ message: "Instructor added successfully", id: customInstructorId });
  } catch (error) {
    console.error("Error adding instructor:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    client.release();
  }
});

app.put("/api/editInstructor/:id", async (req, res) => {
  const { id } = req.params;
  const { instructorName, email, contact, technology, userid, role } = req.body;  // changed from updatedByUserId, updatedByRole

  try {
    // Check if another instructor with the same email exists
    const emailCheckQuery =
      "SELECT * FROM instructors WHERE email = $1 AND id != $2";
    const emailCheckResult = await pool.query(emailCheckQuery, [email, id]);

    if (emailCheckResult.rows.length > 0) {
      return res.status(409).json({ message: "Instructor with this email already exists" });
    }

    // Update instructor details with updated_by_userid and updated_by_role
    const updateQuery =
      "UPDATE instructors SET instructor_name = $1, email = $2, contact = $3, technology = $4, updated_by_userid = $5, updated_by_role = $6 WHERE id = $7 RETURNING *";
    const updatedInstructor = await pool.query(updateQuery, [
      instructorName,
      email,
      contact,
      technology,
      userid, // Now we use updatedBy and role
      role,      // Now we use updatedBy and role
      id,
    ]);

    res.status(200).json(updatedInstructor.rows[0]);
  } catch (error) {
    console.error("Error updating instructor:", error);
    res.status(500).json({ message: "Server error" });
  }
});


app.delete("/api/deleteInstructor/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the instructor's email using the provided ID
    const instructorQuery = await pool.query("SELECT email FROM instructors WHERE id = $1", [id]);

    if (instructorQuery.rows.length === 0) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    const { email } = instructorQuery.rows[0];

    // Delete from the register table using email
    await pool.query("DELETE FROM register WHERE email_id = $1", [email]);

    // Delete from the instructors table using ID
    await pool.query("DELETE FROM instructors WHERE id = $1", [id]);

    res.json({ message: "Instructor deleted successfully from both tables" });
  } catch (error) {
    console.error("Database Delete Error:", error);
    res.status(500).json({ message: "Error deleting instructor" });
  }
});

//Add New Admin
// Helper: Generate Admin ID
const generateAdminId = async (client) => {
  const year = new Date().getFullYear();
  const prefix = `VVADMIN${year}`;
  const result = await client.query(
    `SELECT userid FROM register WHERE userid LIKE $1 ORDER BY userid DESC LIMIT 1`,
    [`${prefix}%`]
  );
  if (result.rows.length > 0) {
    const lastId = result.rows[0].userid;
    const numPart = parseInt(lastId.replace(prefix, "")) || 0;
    return `${prefix}${String(numPart + 1).padStart(3, "0")}`;
  } else {
    return `${prefix}001`;
  }
};

// Helper: Generate Admin Password
const generateAdminPassword = (name, contact) => {
  const firstNameRaw = name.trim().split(" ")[0].toLowerCase();
  const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1);
  const currentYear = new Date().getFullYear();
  const last2 = contact.slice(-2);
  return `${firstName}@vishvavidya${last2}${currentYear}`;
};

// Route: Add Admin
app.post("/api/addAdmin", async (req, res) => {
  const { name, email, contact, userid: created_by, role: created_role } = req.body;

  if (!name || !email || !contact) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const client = await pool.connect();
  try {
    const adminId = await generateAdminId(client); // used for both userid and username
    const plainPassword = generateAdminPassword(name, contact);
    const now = new Date();

    await client.query(
      `INSERT INTO register (
        userid, name, email_id, contact_no, username, password, role, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'admin', $7
      )`,
      [adminId, name, email, contact, adminId, plainPassword, now]
    );

    res.status(201).json({
      message: "Admin added successfully",
      userid: adminId,
      password: plainPassword,
    });
  } catch (err) {
    console.error("Error adding admin:", err);
    res.status(500).json({ message: "Failed to add admin" });
  } finally {
    client.release();
  }
});


// Route: Get Admin List
app.get("/api/adminlist", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT userid, name, email_id, contact_no AS contact, username, created_at
        FROM register
        WHERE role = 'admin'
        ORDER BY created_at DESC`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching admin list:", err);
    res.status(500).json({ message: "Failed to fetch admin list" });
  }
});


// Route: Edit Admin
app.put("/api/editAdmin/:id", async (req, res) => {
  const { name, email, contact } = req.body;
  const { id } = req.params;

  if (!name || !email || !contact) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    await pool.query(
      `UPDATE register SET name=$1, email_id=$2, contact_no=$3 WHERE userid=$4 AND role='admin'`,
      [name, email, contact, id]
    );
    res.status(200).json({ message: "Admin updated successfully" });
  } catch (err) {
    console.error("Error editing admin:", err);
    res.status(500).json({ message: "Failed to edit admin" });
  }
});

app.delete('/api/admins/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM register WHERE userid = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


//Add Manager

const generateManagerId = async (client) => {
  const year = new Date().getFullYear();
  const prefix = `VVMANAGER${year}`;
  const result = await client.query(
    `SELECT userid FROM register WHERE userid LIKE $1 ORDER BY userid DESC LIMIT 1`,
    [`${prefix}%`]
  );
  if (result.rows.length > 0) {
    const lastId = result.rows[0].userid;
    const numPart = parseInt(lastId.replace(prefix, "")) || 0;
    return `${prefix}${String(numPart + 1).padStart(3, "0")}`;
  } else {
    return `${prefix}001`;
  }
};

const generateManagerPassword = (name = "", contact = "") => {
  const firstNameRaw = name.trim().split(" ")[0]?.toLowerCase() || "Manager";
  const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1);
  const year = new Date().getFullYear();
  const last4 = contact?.slice(-4) || "0000";
  return `${firstName}@vishvavidya${last4}${year}`;
};

app.post("/api/addManager", async (req, res) => {
  const { name, email, contact } = req.body;

  if (!name || !email || !contact) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const client = await pool.connect();

    const existing = await client.query(
      "SELECT * FROM register WHERE email_id = $1 OR contact_no = $2",
      [email, contact]
    );
    if (existing.rows.length > 0) {
      client.release();
      return res.status(409).json({ message: "Manager already exists with this email or contact" });
    }

    const userid = await generateManagerId(client);
    const rawPassword = generateManagerPassword(name, contact);

    await client.query(
      `INSERT INTO register (userid, name, email_id, contact_no, password, username, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'manager', NOW())`,
      [userid, name, email, contact, rawPassword, userid]
    );

    client.release();
    return res.status(201).json({ message: "Manager added successfully", userid, userid, rawPassword });
  } catch (err) {
    console.error("Error adding manager:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// 🔸 Get All Managers
app.get("/api/managerlist", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM register WHERE role = 'manager' ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching managers:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 🔸 Edit Manager
app.put("/api/editManager/:id", async (req, res) => {
  const { id } = req.params; // Get manager id from URL
  const { name, email, contact } = req.body;

  // Validate inputs
  if (!name || !email || !contact) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const client = await pool.connect();

    // Check if the email or contact already exists
    const existing = await client.query(
      "SELECT * FROM register WHERE (email_id = $1 OR contact_no = $2) AND userid != $3",
      [email, contact, id]
    );

    if (existing.rows.length > 0) {
      client.release();
      return res.status(409).json({ message: "Manager already exists with this email or contact" });
    }

    // Update manager details
    await client.query(
      `UPDATE register SET name = $1, email_id = $2, contact_no = $3 WHERE userid = $4`,
      [name, email, contact, id]
    );

    client.release();
    res.status(200).json({ message: "Manager updated successfully!" });
  } catch (error) {
    console.error("Error updating manager:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// 🔸 Delete Manager
app.delete("/api/managers/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM register WHERE userid = $1 AND role = 'manager'", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Manager not found" });
    }

    res.json({ message: "Manager deleted successfully" });
  } catch (err) {
    console.error("Error deleting manager:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Reports
app.get("/api/filter_reports", async (req, res) => {
  try {
    const { category, skillset, passoutYear, qualification, status, batchName } = req.query;
    let query = "";
    let queryParams = [];

    if (category === "students") {
      query = "SELECT id AS student_id, student_name AS name, batch_name, passout_year, email_id, contact_no, skillset, certification, experience, highest_qualification AS qualification, training_status AS status FROM student_registration WHERE 1=1";

      if (skillset) {
        const skillArray = skillset.split(',').map(skill => `%${skill.trim()}%`);
        query += ` AND (${skillArray.map((_, i) => `skillset ILIKE $${queryParams.length + i + 1}`).join(" OR ")})`;
        queryParams.push(...skillArray);
      }

      if (passoutYear) {
        const passoutArray = passoutYear.split(',');
        query += ` AND passout_year IN (${passoutArray.map((_, i) => `$${queryParams.length + i + 1}`).join(", ")})`;
        queryParams.push(...passoutArray);
      }

      if (qualification) {
        const qualificationArray = qualification.split(',');
        query += ` AND highest_qualification IN (${qualificationArray.map((_, i) => `$${queryParams.length + i + 1}`).join(", ")})`;
        queryParams.push(...qualificationArray);
      }

      if (status) {
        const statusArray = status.split(',');
        query += ` AND training_status IN (${statusArray.map((_, i) => `$${queryParams.length + i + 1}`).join(", ")})`;
        queryParams.push(...statusArray);
      }

      if (batchName) {
        query += ` AND batch_name = $${queryParams.length + 1}`;
        queryParams.push(batchName);
      }

      query += " ORDER BY student_id ASC";

    } else if (category === "instructors") {
      query = "SELECT id, instructor_name AS name, technology, email, contact FROM instructors WHERE 1=1";

      if (batchName) {
        query += ` AND technology = $${queryParams.length + 1}`;
        queryParams.push(batchName);
      }

    } else if (category === "batches") {
      query = "SELECT batch_name AS name, track_name FROM grades WHERE 1=1";

      if (batchName) {
        query += ` AND batch_name = $${queryParams.length + 1}`;
        queryParams.push(batchName);
      }

    } else if (category === "tracks") {
      query = "SELECT track_name AS name, recognition_code, start_date FROM tracks";
    }

    const result = await pool.query(query, queryParams);
    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get student history
app.get("/api/getStudentDetails/:student_id", async (req, res) => {
  const studentId = req.params.student_id;
  const client = await pool.connect();

  try {
    // Fetch student details
    const studentQuery = await client.query(
      `SELECT id AS student_id, student_name AS name, batch_name, passout_year, email_id, contact_no, training_status
       FROM student_registration 
       WHERE id = $1`,
      [studentId]
    );

    if (studentQuery.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: "Student not found" });
    }

    const student = studentQuery.rows[0];

    // Fetch batch history
    const historyQuery = await client.query(
      `SELECT id, student_id, new_batch, moved_at, move_reason, old_batch, created_by_role, created_by_userid 
       FROM student_batch_history 
       WHERE student_id = $1 
       ORDER BY moved_at DESC`,
      [studentId]
    );

    // Fetch status change history
    const statusHistoryQuery = await client.query(
      `SELECT id, old_status, new_status, reason, changed_at, created_by_userid, created_by_role
       FROM status_change_history
       WHERE student_id = $1
       ORDER BY changed_at DESC`,
      [studentId]
    );

    // Fetch evaluation history
    const evaluationQuery = await client.query(
      `SELECT id, attempt, attempt_name, technical, mcq, oral, total, remark,
              pending_technical, pending_mcq, pending_oral, pending_remark,
              batch_name, created_at
       FROM evaluations 
       WHERE student_id = $1
       ORDER BY created_at DESC`,
      [studentId]
    );

    // Notifications
    const notificationsQuery = await client.query(
      `SELECT id, message, created_at 
       FROM student_notifications 
       WHERE student_id = $1 AND seen = false 
       ORDER BY created_at DESC`,
      [studentId]
    );

    client.release();

    res.json({
      student,
      history: historyQuery.rows,
      statusHistory: statusHistoryQuery.rows,
      evaluations: evaluationQuery.rows,
      notifications: notificationsQuery.rows
    });

  } catch (error) {
    client.release();
    console.error("Error fetching student details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/api/getStudentBatch", async (req, res) => {
  const studentId = req.query.studentId; // Get student ID from query parameter

  try {
    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Fetch the current batch of the student
    const batchQuery = await pool.query(
      `SELECT batch_name FROM student_registration WHERE id = $1`,
      [studentId]
    );

    if (batchQuery.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ batch: batchQuery.rows[0].batch_name });

  } catch (error) {
    console.error("Error fetching student batch:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/api/getNotifications", async (req, res) => {
  const studentId = req.query.studentId; // Get student ID from query parameter
  const client = await pool.connect();

  try {
    if (!studentId) {
      client.release();
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Fetch notifications for the student
    const notificationsQuery = await client.query(
      `SELECT id, message, seen, created_at 
       FROM student_notifications 
       WHERE student_id = $1 
       ORDER BY created_at DESC`,
      [studentId]
    );

    client.release();

    res.json({
      notifications: notificationsQuery.rows,
    });

  } catch (error) {
    client.release();
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/changeStudentStatus", async (req, res) => {
  const { student_id, new_status, reason, role, userid } = req.body;

  if (!student_id || !new_status || !reason) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get sender email credentials
    const { email, password } = await getEmailCredentials(userid, role);
    if (!email || !password) {
      throw new Error("Email credentials not found.");
    }

    const studentResult = await client.query(
      "SELECT training_status, student_name, email_id FROM student_registration WHERE id = $1",
      [student_id]
    );

    if (studentResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Student not found" });
    }

    const old_status = studentResult.rows[0].training_status;
    const student_name = studentResult.rows[0].student_name;
    const email_id = studentResult.rows[0].email_id;

    await client.query(
      "UPDATE student_registration SET training_status = $1 WHERE id = $2",
      [new_status, student_id]
    );

    await client.query(
      "UPDATE intern_login SET status = $1 WHERE student_id = $2",
      [new_status, student_id]
    );

    await client.query(
      "INSERT INTO status_change_history (student_id, old_status, new_status, reason, created_by_role, created_by_userid) VALUES ($1, $2, $3, $4, $5, $6)",
      [student_id, old_status, new_status, reason, role, userid]
    );


    // If status is one of the final states, clear batch_name
    const statusesToClearBatch = ["placed", "absconding", "completed", "shadowed"];
    if (statusesToClearBatch.includes(new_status.toLowerCase())) {
      await client.query(
        "UPDATE student_registration SET batch_name = 'No Batch' WHERE id = $1",
        [student_id]
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email,
        pass: password,
      },
    });

    let html = "";
    let subject = "";
    let notificationMessage = "";

    // ========== 📩 Placed Email ==========
    if (new_status.toLowerCase() === "placed") {
      subject = "🎉 Congratulations! You Have Been Placed!";
      notificationMessage = "🎉 Congratulations! You've been placed successfully.";

      html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Logo Section -->
          <div style="text-align: center; padding: 20px 20px 0 20px;">
            <img src="https://vishvavidya.com/wp-content/uploads/2024/07/Vishvavidya-logo-e1719900509472.png" alt="Vishva Vidya Logo" width="180" style="max-width: 100%; height: auto;" />
          </div>
    
          <!-- Header Section -->
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">VishvaVidya Management System</h2>
          </div>
    
          <!-- Body Section -->
          <div style="padding: 30px; color: #333;">
            <p style="font-size: 16px;">Dear <strong>${student_name}</strong>,</p>
    
            <p>🎉 <strong>Congratulations on your Successful Placement!</strong></p>
            <p>We are thrilled to inform you that you have been officially <strong>Placed</strong>!</p>
    
            <p>We at VishvaVidya are proud to have been part of your journey and are confident that you will continue to achieve great success in your professional career.</p>
    
            <p>Wishing you continued success in this exciting new chapter of your career. Keep shining!</p>
    
            <p>Kindly ensure that you return the company access card, collect your experience and offer letters, and retrieve your security deposit at your earliest convenience.</p>
    
            <p style="margin-top: 30px;">Best regards,<br/>Team VishvaVidya</p>
          </div>
    
          <!-- Footer Section -->
          <div style="background-color: #f0f0f0; color: #666; text-align: center; font-size: 12px; padding: 15px;">
            This is an automated email. Please do not reply.
          </div>
        </div>
      </div>
    `;

    }

    // ========== ⚠️ Absconded Email ==========
    else if (new_status.toLowerCase() === "absconding") {
      subject = "⚠️ Absconding Status Notice – Closure of Enrollment in VishvaVidya Training and Internship Program";
      notificationMessage = "⚠️ Your status has been changed to Absconded.";

      html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Logo Section -->
          <div style="text-align: center; padding: 20px 20px 0 20px;">
            <img src="https://vishvavidya.com/wp-content/uploads/2024/07/Vishvavidya-logo-e1719900509472.png" alt="Vishva Vidya Logo" width="180" style="max-width: 100%; height: auto;" />
          </div>  
  
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">VishvaVidya Management System</h2>
          </div>
  
          <div style="padding: 30px; color: #333;">
            <p style="font-size: 16px;">Dear Candidate,</p>
  
            <p>🌞 Greetings of the day!</p>
  
            <p>Due to your irregular attendance, we regret to inform you that your enrollment in the <strong>VishvaVidya Training and Internship Program</strong> will be closed as per company policy.</p>
  
            <p>If you’d like to discuss your situation or have any concerns, please reach out to us.</p>
  
            <p>Additionally, kindly return the company access card at your earliest convenience.</p>
  
            <p style="margin-top: 30px;">Thank you for your understanding.</p>
  
            <p style="margin-top: 30px;">Regards,<br/>Team Vishva Vidya</p>
          </div>
  
          <div style="background-color: #f0f0f0; color: #666; text-align: center; font-size: 12px; padding: 15px;">
            This is an automated email. Please do not reply.
          </div>
        </div>
      </div>
    `;
    }

    else if (new_status.toLowerCase() === "training closed") {
      subject = "📢 Important Update: Closure of Your Enrollment in the VishvaVidya Training Program";
      notificationMessage = "📢 Your status has been updated to Training Closed.";

      html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Logo Section -->
          <div style="text-align: center; padding: 20px 20px 0 20px;">
            <img src="https://vishvavidya.com/wp-content/uploads/2024/07/Vishvavidya-logo-e1719900509472.png" alt="Vishva Vidya Logo" width="180" style="max-width: 100%; height: auto;" />
          </div>  
  
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">Vishva Vidya Management System</h2>
          </div>
  
          <div style="padding: 30px; color: #333;">
            <p style="font-size: 16px;">Dear Candidate,</p>
  
            <p>We hope this message finds you well.</p>
  
            <p>We would like to inform you that your enrollment in the <strong>VishvaVidya Training and Internship Program</strong> has been officially closed due to continued irregular participation and non-compliance with the program's attendance guidelines.</p>
  
            <p>This decision has been made in accordance with our organizational policy. We value your time with us and wish you the best in your future endeavors.</p>
  
            <p>If you believe this decision requires reconsideration or if you have any concerns, you are welcome to get in touch with us at your earliest convenience.</p>
  
            <p><strong>Note:</strong> If you were issued a company access card, kindly return it to the administrative team.</p>
  
            <p style="margin-top: 30px;">Thank you for being a part of VishvaVidya.</p>
  
            <p style="margin-top: 30px;">Warm regards,<br/>Team Vishva Vidya</p>
          </div>
  
          <div style="background-color: #f0f0f0; color: #666; text-align: center; font-size: 12px; padding: 15px;">
            This is an automated notification. Please do not reply to this email.
          </div>
        </div>
      </div>
    `;
    }


    // ========== 📌 PIP Email ==========
    // else if (new_status.toLowerCase() === "pip") {
    //   subject = "📌 Performance Improvement Plan (PIP) Notification";
    //   notificationMessage = "📌 You are now on a Performance Improvement Plan (PIP).";

    //   html = `
    //     <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 20px;">
    //       <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
    //         <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
    //           <h2 style="margin: 0;">Vishva Vidya Management System</h2>
    //         </div>
    //         <div style="padding: 30px; color: #333;">
    //           <p style="font-size: 16px;">Dear <strong>${student_name}</strong>,</p>
    //           <p>📌 You have been placed under a <strong>Performance Improvement Plan (PIP)</strong>.</p>
    //           <p><strong>Reason:</strong></p>
    //           <p style="background-color: #fefefe; border-left: 4px solid #ff9800; padding: 10px 15px; line-height: 1.6;">
    //             ${reason}
    //           </p>
    //           <p>We encourage you to work closely with your trainer and show progress.</p>
    //           <p style="margin-top: 30px;">Regards,<br/>Team Vishva Vidya</p>
    //         </div>
    //         <div style="background-color: #f0f0f0; color: #666; text-align: center; font-size: 12px; padding: 15px;">
    //           This is an automated email. Please do not reply.
    //         </div>
    //       </div>
    //     </div>
    //   `;
    // }

    // Set default message if not placed/pip/absconding
    if (!notificationMessage) {
      notificationMessage = `Your training status has been updated to "${new_status}".`;
    }

    // Always insert into student_notifications
    await client.query(
      `INSERT INTO student_notifications (student_id, message, created_at, seen) 
   VALUES ($1, $2, NOW(), false);`,
      [student_id, notificationMessage]
    );

    // Only send mail if content is prepared
    if (subject && html) {
      await transporter.sendMail({
        from: `"Training Team" <${email}>`,
        to: email_id,
        subject,
        html,
      });
    }

    await client.query("COMMIT");
    res.json({ message: `Status updated to ${new_status} and email sent.` });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

const cron = require('node-cron');
const fetch = require('node-fetch');

// 🔁 This function runs absentee generation logic
// async function generateAbsenteeNotifications() {
//   try {
//     await fetch('http://localhost:3001/api/generate-absentee-notifications', {
//       method: 'POST',
//     });
//     console.log('✅ Absentee notifications generated (manual/cron)');
//   } catch (err) {
//     console.error('❌ Error generating absentee notifications:', err);
//   }
// }

// Runs every day at 9am
cron.schedule('0 9 * * *', async () => {
  try {
    await fetch('http://localhost:3001/api/generate-absentee-notifications', { method: 'POST' });
    console.log('Absentee notifications generated');
  } catch (err) {
    console.error('Cron error:', err);
  }
});


app.post('/api/generate-absentee-notifications', async (req, res) => {
  try {
    const query = `
      SELECT sr.id, sr.student_name, sr.batch_name
      FROM student_registration sr
      JOIN (
        SELECT a.student_id
        FROM attendance a
        WHERE a.date >= CURRENT_DATE - INTERVAL '5 days'
          AND a.date < CURRENT_DATE
          AND a.status = false
        GROUP BY a.student_id
        HAVING COUNT(DISTINCT a.date) >= 3
      ) AS absent_ids ON sr.id = absent_ids.student_id;
    `;

    const { rows } = await pool.query(query);

    for (const row of rows) {
      await pool.query(
        `INSERT INTO absentee_notifications (student_id, student_name, batch_name)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [row.id, row.student_name, row.batch_name]
      );
    }

    res.json({ message: 'Absentee notifications generated.', count: rows.length });
  } catch (err) {
    console.error("Error inserting absentee notifications:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put('/api/absentee-notifications/mark-seen', async (req, res) => {
  try {
    await pool.query(`UPDATE absentee_notifications SET seen = true WHERE seen = false`);
    res.json({ message: 'All notifications marked as seen.' });
  } catch (err) {
    console.error("Error updating seen status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/api/absentees', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM absentee_notifications
      ORDER BY created_at DESC
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching absentee notifications:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/api/student-notifications/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM student_notifications WHERE student_id = $1 ORDER BY created_at DESC`,
      [studentId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching student notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//send Credentials 
app.post('/api/send-email', async (req, res) => {
  try {
    const { email: recipientEmail, subject, content, role, userid } = req.body;

    if (!recipientEmail || !subject || !content || !role || !userid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get sender email credentials based on role and userid
    const { email: senderEmail, password } = await getEmailCredentials(userid, role);

    if (!senderEmail || !password) {
      return res.status(500).json({ error: 'Failed to fetch sender credentials' });
    }

    // Setup Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: password,
      },
    });

    // Email options
    const mailOptions = {
      from: `"Training Team" <${senderEmail}>`,
      to: recipientEmail,
      subject: subject,
      html: content,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    res.json({ success: true });

  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

//edit profile
app.get("/api/profile", async (req, res) => {
  const userid = req.query.userid;

  try {
    const [managerResult, developerResult, adminResult, instructorResult, internResult] = await Promise.all([
      pool.query("SELECT *, email_id AS email, 'manager' AS role FROM register WHERE userid = $1 AND role = 'manager'", [userid]),
      pool.query("SELECT *, email_id AS email, 'developer' AS role FROM register WHERE userid = $1 AND role = 'developer'", [userid]),
      pool.query("SELECT *, email_id AS email, 'admin' AS role FROM register WHERE userid = $1 AND role = 'admin'", [userid]),
      pool.query("SELECT *, email AS email, 'trainer' AS role FROM instructors WHERE id = $1", [userid]),
      pool.query("SELECT *, email_id AS email, 'intern' AS role FROM student_registration WHERE id = $1", [userid]),
    ]);

    if (managerResult.rows.length > 0) return res.json(managerResult.rows[0]);
    if (developerResult.rows.length > 0) return res.json(developerResult.rows[0]);
    if (adminResult.rows.length > 0) return res.json(adminResult.rows[0]);
    if (instructorResult.rows.length > 0) return res.json(instructorResult.rows[0]);
    if (internResult.rows.length > 0) return res.json(internResult.rows[0]);

    res.status(404).json({ message: "User not found" });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
});

//update profile
app.put("/api/update-profile", async (req, res) => {
  const data = req.body;

  try {
    let result;

    if (data.role === "admin") {
      result = await pool.query(
        "UPDATE register SET password = $1, email_password = $2 WHERE userid = $3 AND role = 'admin'",
        [data.password, data.email_password, data.userid]
      );
    } else if (data.role === "manager") {
      result = await pool.query(
        "UPDATE register SET password = $1, email_password = $2 WHERE userid = $3 AND role = 'manager'",
        [data.password, data.email_password, data.userid]
      );
    } else if (data.role === "developer") {
      result = await pool.query(
        "UPDATE register SET password = $1, email_password = $2 WHERE userid = $3 AND role = 'developer'",
        [data.password, data.email_password, data.userid]
      );
    } else if (data.role === "trainer") {
      result = await pool.query(
        `UPDATE instructors
         SET instructor_name = $1, email = $2, contact = $3, password = $4, email_password = $5
         WHERE id = $6`,
        [
          data.instructor_name,
          data.email,
          data.contact,
          data.password,
          data.email_password,
          data.id,
        ]
      );
    } else if (data.role === "intern") {
      result = await pool.query(
        `UPDATE student_registration
         SET student_name = $1, email_id = $2, contact_no = $3, passout_year = $4,
             highest_qualification = $5, skillset = $6, certification = $7,
             current_location = $8, experience = $9, password = $10
         WHERE id = $11`,
        [
          data.student_name,
          data.email_id,
          data.contact_no,
          data.passout_year,
          data.highest_qualification,
          data.skillset,
          data.certification,
          data.current_location,
          data.experience,
          data.password,
          data.id,
        ]
      );
    } else {
      return res.status(400).json({ message: "Invalid user role" });
    }

    return res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
});

app.post("/api/check-profile-completion", async (req, res) => {
  const { userid, role } = req.body;

  if (!userid || !role) {
    return res.status(400).json({ complete: false, message: "Missing user ID or role" });
  }

  try {
    let result, user, isComplete;

    if (role === "admin") {
      result = await pool.query(
        "SELECT email_id AS email, email_password, password FROM register WHERE userid = $1",
        [userid]
      );
      user = result.rows[0];
      isComplete = !!user?.email && !!user?.email_password && !!user?.password;

    } else if (role === "manager") {
      result = await pool.query(
        "SELECT email_id AS email, email_password, password FROM register WHERE userid = $1",
        [userid]
      );
      user = result.rows[0];
      isComplete = !!user?.email && !!user?.email_password && !!user?.password;

    } else if (role === "developer") {
      result = await pool.query(
        "SELECT email_id AS email, email_password, password FROM register WHERE userid = $1",
        [userid]
      );
      user = result.rows[0];
      isComplete = !!user?.email && !!user?.email_password && !!user?.password;

    } else if (role === "trainer") {
      result = await pool.query(
        `SELECT instructor_name, email, contact, password, email_password
         FROM instructors WHERE id = $1`,
        [userid]
      );
      user = result.rows[0];
      isComplete = Object.values(user).every((field) => field && field !== "");

    } else if (role === "intern") {
      result = await pool.query(
        `SELECT student_name, email_id, contact_no, passout_year,
                highest_qualification, skillset, certification,
                current_location, experience, password
         FROM student_registration WHERE id = $1`,
        [userid]
      );
      user = result.rows[0];
      isComplete = Object.values(user).every((field) => field && field !== "");
    } else {
      return res.status(400).json({ complete: false, message: "Invalid role" });
    }

    // Return email & password only if role is admin or trainer
    const response = {
      complete: isComplete,
    };

    if (role === "admin" || role === "trainer") {
      response.email = user?.email;
      response.email_password = user?.email_password;
    }

    res.json(response);
  } catch (err) {
    console.error("Error checking profile completion:", err);
    res.status(500).json({ complete: false });
  }
});


// API: Get total stats
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const studentsRes = await pool.query("SELECT COUNT(*) FROM student_registration");
    const instructorsRes = await pool.query("SELECT COUNT(*) FROM instructors");
    const batchesRes = await pool.query("SELECT COUNT(*) FROM grades");
    const adminsRes = await pool.query("SELECT COUNT(*) FROM register WHERE role = 'admin'");
    const partnersRes = await pool.query("SELECT COUNT(*) FROM register WHERE role = 'partner'");

    res.json({
      students: parseInt(studentsRes.rows[0].count),
      instructors: parseInt(instructorsRes.rows[0].count),
      batches: parseInt(batchesRes.rows[0].count),
      admins: parseInt(adminsRes.rows[0].count),
      partners: parseInt(partnersRes.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// API: Get attendance (mock logic for now - replace with real)
app.get("/api/dashboard/attendance", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        batch_name AS name, 
        ROUND(
          (COUNT(CASE WHEN status = TRUE THEN 1 END) * 100.0) / COUNT(*), 
          2
        ) AS attendance
      FROM attendance
      GROUP BY batch_name
      ORDER BY attendance ASC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

app.get("/api/dashboard/top-batch", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        batch_name AS name, 
        ROUND(
          (COUNT(CASE WHEN status = TRUE THEN 1 END) * 100.0) / COUNT(*), 
          2
        ) AS attendance
      FROM attendance
      GROUP BY batch_name
      ORDER BY attendance DESC
      LIMIT 1
    `);

    res.json(result.rows[0] || { name: "-", attendance: 0 });
  } catch (err) {
    console.error("Error fetching top batch:", err);
    res.status(500).json({ error: "Failed to fetch top batch" });
  }
});


// Recent students (optional backend)
app.get("/api/dashboard/recent-students", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT student_name, email_id, batch_name, TO_CHAR(created_at, 'YYYY-MM-DD') AS joined 
       FROM student_registration 
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recent students" });
  }
});

// Example pending exams API (You must replace with your logic)
app.get("/api/dashboard/pending-exams", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT student_id, student_name, email_id, batch_name,
             pending_technical, pending_mcq, pending_oral, pending_remark
      FROM evaluations
      WHERE 
        pending_technical = true OR
        pending_mcq = true OR
        pending_oral = true OR
        pending_remark = true
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pending exams:', err);
    res.status(500).json({ error: "Failed to fetch pending exams" });
  }
});



// Example attempts distribution API
app.get("/api/dashboard/attempt-distribution", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE attempt = 1) AS first,
        COUNT(*) FILTER (WHERE attempt = 2) AS second,
        COUNT(*) FILTER (WHERE attempt = 3) AS third,
        COUNT(*) FILTER (WHERE attempt >= 4) AS fourth_or_more
      FROM evaluations
    `);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch attempt stats" });
  }
});

app.get('/api/dashboard/interns-by-status', async (req, res) => {
  try {
    const query = `
      SELECT training_status, COUNT(*) AS count
      FROM student_registration
      WHERE training_status IN (
        'Placed', 'Absconding', 'In Training', 'Completed', 'Shadowed', 
        'pip', 'On Leave', 'Training Closed'
      )
      GROUP BY training_status
      ORDER BY training_status;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching interns by status:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API: Get evaluation result for logged-in intern
app.get("/api/intern/evaluation-result", async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Step 1: Get profile ID using userId
    const profileResult = await pool.query(
      "SELECT id FROM student_registration WHERE id = $1",
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profileId = profileResult.rows[0].id;

    // Step 2: Get evaluations for that profile
    const evaluations = await pool.query(
      `SELECT 
         e.student_id,
         s.student_name,
         s.batch_name,
         e.attempt,
         e.technical,
         e.mcq,
         e.oral,
         e.total,
         e.remark,
         e.pending_technical,
         e.pending_mcq,
         e.pending_oral,
         e.pending_remark
       FROM evaluations e
       JOIN student_registration s ON e.student_id = s.id
       WHERE e.student_id = $1
       ORDER BY e.attempt`,
      [profileId]
    );

    res.json(evaluations.rows);
  } catch (error) {
    console.error("Error fetching intern evaluation:", error);
    res.status(500).json({ error: "Failed to fetch evaluation results" });
  }
});



app.get('/api/getTrackByBatch', async (req, res) => {
  const { batchName } = req.query;

  try {
    const result = await pool.query(
      'SELECT track_name FROM grades WHERE batch_name = $1',
      [batchName]
    );
    if (result.rows.length > 0) {
      res.json({ track_name: result.rows[0].track_name });
    } else {
      res.status(404).json({ error: "Track not found" });
    }
  } catch (err) {
    console.error("Error fetching track by batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// app.get("*", (req, res) => {
//   res.sendFile(
//     path.join(__dirname, "../valuedx_training_app/build", "index.html")
//   );
// });

app.listen(port, () => {
  console.log(`Server app listening at http://localhost:${port}`);
});
