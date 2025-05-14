import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { styled } from "@mui/material/styles";
import Cookies from "js-cookie";
import { parseISO, format } from "date-fns";
import VVLogo from "../images/vishvavidya_hd.jpeg";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HTMLDocx from 'html-docx-js/dist/html-docx';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import config from "../config";
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  TextField,
  Grid,
  IconButton,
  Container,
  Paper,
  Box,
  StepIcon, Dialog, DialogTitle, DialogContent, DialogActions,  Card, CardContent, CardHeader,
} from "@mui/material";
import { AddCircleOutline, RemoveCircleOutline } from "@mui/icons-material";
import WorkIcon from '@mui/icons-material/Work';
import SummarizeIcon from '@mui/icons-material/Summarize';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import SchoolIcon from '@mui/icons-material/School';
import BuildIcon from '@mui/icons-material/Build';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const steps = [
  "Personal Details",
  "Education",
  "Experience",
  "Skills",
  "Certificates",
  "Achievements",
  "Professional Summary",
  "Upload Profile",
];

const ResumeBuilder = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isResumeCreated, setIsResumeCreated] = useState(false);
  const [uploadedProfile, setUploadedProfile] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [displayResume, setDisplayResume] = useState(false);
  const [userProfileId, setUserProfileId] = useState("");
  const [resumeDetails, setResumeDetails] = useState([]);
  const [approvalStatus, setApprovalStatus] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogStatus, setDialogStatus] = React.useState("error"); 

  const titleColor = dialogStatus === 'error' ? 'red' : 'green';

  //stepper states
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    linkedinId: "",
    profilePictureUrl: "",
  });

  const [educations, setEducations] = useState([
    {
      institution: "",
      degree: "",
      startDate: "",
      endDate: "",
      fieldofstudy: "",
    },
  ]);

  const [experiences, setExperiences] = useState([
    {
      company: "",
      role: "",
      startDate: "",
      endDate: "",
      city: "",
      state: "",
      projects: [{ title: "", description: "", technology: "" }],
    },
  ]);

  const [skills, setSkills] = useState([{ skill: "" }]);

  const [certificates, setCertificates] = useState([
    { certificateName: "", issuingOrganization: "", certificateDate: "" },
  ]);

  const [achievements, setAchievements] = useState([
    { awardName: "", issuingOrganization: "", awardDate: "" },
  ]);

  const [professionalSummary, setProfessionalSummary] = useState("");

  //get userid from cookies
  const userId = Cookies.get("userid");

  const GreenStepIcon = styled(StepIcon)(({ theme }) => ({
    color: "#bdbdbd", // Default color for inactive steps
    "&.Mui-active": {
      color: "#1e90ff ", // Blue color for active step
    },
    "&.Mui-completed": {
      color: "#4caf50", // Green color for completed step
    },
  }));

  const handleStepClick = (index) => {
    setActiveStep(index);
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  const showDialog = (title, message, status) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogStatus(status);
    setOpenDialog(true);
  };

  const saveFinaleResume = () => {
    const resumeElement = document.getElementById("resume");

    html2canvas(resumeElement).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      // Adding image data to PDF
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);

      // Convert the PDF to base64
      const pdfBase64 = pdf.output("dataurlstring").split(",")[1];

      // Prepare data to be sent to the server
      const formData = {
        pdfData: `data:application/pdf;base64,${pdfBase64}`,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      };

      // Send the PDF to the server
      fetch(`${config.API_BASE_URL}/api/save-finale-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      .then((response) => response.json())
      .then((data) => {
        console.log("PDF saved successfully:", data);
        showDialog("Success", "Resume saved successfully...", "success");
      })
      .catch((error) => {
        console.error("Error saving PDF:", error);
        showDialog("Error", "Failed to save resume. Please try again.", "error");
        });
    });
  };

  const handleDownload = () => {
    const resumeElement = document.getElementById("resume");

    // Clone the resume element to avoid modifying the original structure
    const clonedResume = resumeElement.cloneNode(true);

    // Set up a container with the same width and layout as the original resume
    const container = document.createElement('div');
    container.style.width = '190mm'; // Slightly less than A4 width for margins
    container.style.minHeight = '277mm'; // Slightly less than A4 height for margins
    container.style.padding = '10mm'; // Padding for content
    container.style.margin = '0';
    container.style.boxSizing = 'border-box';
    container.style.fontSize = '10px'; // Reduce the font size for better fitting
    container.style.lineHeight = '1.5'; // Adjust line spacing
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    // Adjust the cloned resume's styles
    clonedResume.style.transform = 'scale(0.9)'; // Scale down content slightly
    clonedResume.style.transformOrigin = 'top left';
    clonedResume.style.width = '100%';
    clonedResume.style.height = 'auto';
    clonedResume.style.margin = '0';
    clonedResume.style.padding = '0';

    // Append the cloned resume into the container
    container.appendChild(clonedResume);

    // Options for html2pdf
    const options = {
        margin: 0, // No additional margins, as we have set margins via container
        filename: 'resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generate PDF
    html2pdf().from(container).set(options).toPdf().get('pdf').then((pdf) => {
        // Trigger the download
        pdf.save("resume.pdf");

        // Convert the PDF to base64
        const pdfBase64 = pdf.output('datauristring').split(",")[1];

        // Send the PDF to the server
        const formData = {
            pdfData: `data:application/pdf;base64,${pdfBase64}`,
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone,
        };

        fetch(`${config.API_BASE_URL}save-review-resume`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        })
        .then((response) => response.json())
        .then((data) => {
            console.log("PDF saved successfully:", data);
        })
        .catch((error) => {
            console.error("Error saving PDF:", error);
        });
    }).catch((error) => {
        console.error("Error generating PDF:", error);
    });
};

//Submit resume
  const handleFinish = async () => {
    try {
      const formData = new FormData();

      // Append file if available
      if (uploadedProfile) {
        formData.append("profilePic", uploadedProfile);
      }

      // Create a JSON object with all the data
      const resumeData = {
        userId,
        profile,
        educations,
        experiences,
        skills,
        certificates: certificates || [], 
        achievements: achievements || [],
        professionalSummary: { summary: professionalSummary },
      };

      formData.append("ResumeData", JSON.stringify(resumeData));

      // Send the FormData to the server
      const response = await fetch(`${config.API_BASE_URL}/api/resume`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (
          response.status === 409 &&
          errorData.error === "User details already present"
        ) {
          showDialog("Error", "User details already present", "error");
        } else if (response.status === 400) {
          showDialog(`Validation Error`, errorData.error, "error");
        } else if (response.status === 500) {
          showDialog("Error", "An error occurred on the server while creating the resume.", "error");
        } else {
          showDialog("Error", "An unknown error occurred.", "error");
        }
        return;
      }

      const data = await response.json();
      if (response.status === 201) {
        showDialog("Success", "Resume created successfully...", "success");
      } else {
        showDialog("Error", data.error || "Failed to create resume", "error");
      }
    } catch (error) {
      showDialog("Error", "Failed to create resume. Please try again.", "error");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    const resumeData = {
      userId,
      profile,
      educations,
      experiences,
      skills,
      certificates: certificates || [], 
      achievements: achievements || [],
      professionalSummary: { summary: professionalSummary },
    };
    formData.append(
      "ResumeData",
      JSON.stringify({ ...resumeData, userProfileId })
    );

    if (resumeData.profilePic) {
      formData.append("profilePic", uploadedProfile);
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/updateResume`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        showDialog("Resume updated successfully");
      } else {
        showDialog("Failed to update resume");
      }
    } catch (error) {
      console.error("Error updating resume", error);
      showDialog("Failed to update resume");
    }
  };

  const isFieldEmpty = (field) => {
    return field === '' || field === null || field === undefined;
  };
  
  const validateProfile = (profile) => {
    return !isFieldEmpty(profile.firstName) &&
           !isFieldEmpty(profile.lastName) &&
           !isFieldEmpty(profile.email) &&
           !isFieldEmpty(profile.phone) &&
           !isFieldEmpty(profile.address)
  };
  
  const validateEducations = (educations) => {
    if (educations.length === 0) {
      console.log("No educations provided.");
      return false;
    }
    return educations.every(education => 
      !isFieldEmpty(education.institution) &&
      !isFieldEmpty(education.degree) &&
      !isFieldEmpty(education.startDate) &&
      !isFieldEmpty(education.fieldofstudy)
    );
  };
  
  const validateExperiences = (experiences) => {
    if (experiences.length === 0) {
      console.log("No experiences provided.");
      return false;
    }
    return experiences.every(experience => 
      !isFieldEmpty(experience.company) &&
      !isFieldEmpty(experience.role) &&
      !isFieldEmpty(experience.startDate) &&
      !isFieldEmpty(experience.city) &&
      !isFieldEmpty(experience.state)
    );
  };
  
  const validateSkills = (skills) => {
    if (skills.length === 0) {
      console.log("No skills provided.");
      return false;
    }
    return skills.every(skill => !isFieldEmpty(skill.skill));
  };
  
  const validateProfessionalSummary = (summary) => {
    return !isFieldEmpty(summary);
  };
  
  const handleCreateResume = () => {
    console.log("Validating profile...");
    if (!validateProfile(profile)) {
      console.log("Profile validation failed.");
    }
    console.log("Validating educations...");
    if (!validateEducations(educations)) {
      console.log("Educations validation failed.");
    }
    console.log("Validating experiences...");
    if (!validateExperiences(experiences)) {
      console.log("Experiences validation failed.");
    }
    console.log("Validating skills...");
    if (!validateSkills(skills)) {
      console.log("Skills validation failed.");
    }
    console.log("Validating professional summary...");
    if (!validateProfessionalSummary(professionalSummary)) {
      console.log("Professional summary validation failed.");
    }
  
    if (!validateProfile(profile) ||
        !validateEducations(educations) ||
        !validateExperiences(experiences) ||
        !validateSkills(skills) ||
        !validateProfessionalSummary(professionalSummary)
        
    ) {
      setDialogTitle("Error");
      setDialogMessage("Please fill in all required details to create the resume.");
      setOpenDialog(true);
      return;
    }
  
    const resumeData = {
      profile,
      educations,
      experiences,
      skills,
      certificates,
      achievements,
      professionalSummary,
    };
  
    setIsResumeCreated(true);
    setDisplayResume(true);
  };
  
  //get id from profile whose userid match
  useEffect(() => {
    const fetchProfileId = async () => {
      try {
        const response = await fetch(
          `${config.API_BASE_URL}/api/getid_from_profile/${userId}`
        );
        if (!response.ok) {
          throw new Error("Profile not found");
        }
        const data = await response.json();
        setUserProfileId(data.id);
        setApprovalStatus(data.approval_status);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileId();
  }, [userId]);

  const fetchResumeDetails = async (id) => {
    if (!id) {
      console.error("Profile ID is not set");
      return;
    }
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/getresume/${id}`);
      if (!response.ok) {
        throw new Error("Resume not found");
      }
      const data = await response.json();
      setResumeDetails(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfileId) {
      fetchResumeDetails(userProfileId);
    }
  }, [userProfileId]);

  useEffect(() => {
    if (resumeDetails && userProfileId) {
      setProfile({
        firstName: resumeDetails.profile?.first_name || "",
        lastName: resumeDetails.profile?.last_name || "",
        email: resumeDetails.profile?.email || "",
        phone: resumeDetails.profile?.phone || "",
        address: resumeDetails.profile?.address || "",
        linkedinId: resumeDetails.profile?.linkedinid || "",
        profilePictureUrl: resumeDetails.profile?.profile_pic_path || "",
      });
  
      setEducations(
        (resumeDetails.educations || []).map((education) => ({
          institution: education.institution || "",
          degree: education.degree || "",
          startDate: education.start_date ? format(parseISO(education.start_date), "yyyy-MM-dd") : "",
          endDate: education.end_date ? format(parseISO(education.end_date), "yyyy-MM-dd") : "",
          fieldofstudy: education.field_of_study || "",
        }))
      );
  
      setExperiences(
        (resumeDetails.experiences || []).map((experience) => ({
          company: experience.company || "",
          role: experience.role || "",
          startDate: experience.start_date ? format(parseISO(experience.start_date), "yyyy-MM-dd") : "",
          endDate: experience.end_date ? format(parseISO(experience.end_date), "yyyy-MM-dd") : "",
          city: experience.city || "",
          state: experience.state || "",
          projects: (experience.projects || []).map((project) => ({
            title: project.title || "",
            description: project.description || "",
            technology: project.technology || "",
          })),
        }))
      );
  
      setSkills((resumeDetails.skills || []).map((skill) => ({ skill: skill.skill || "" })));
  
      // Ensure at least one empty object in certificates and achievements if not present
      setCertificates(
        (resumeDetails.certificates || []).map((certificate) => ({
          certificateName: certificate.certificate_name || "",
          issuingOrganization: certificate.issuing_organization || "",
          certificateDate: certificate.certificate_date
            ? format(parseISO(certificate.certificate_date), "yyyy-MM-dd")
            : "",
        }))
      );
  
      setAchievements(
        (resumeDetails.achievements || []).map((achievement) => ({
          awardName: achievement.award_name || "",
          issuingOrganization: achievement.issuing_organization || "",
          awardDate: achievement.award_date ? format(parseISO(achievement.award_date), "yyyy-MM-dd") : "",
        }))
      );
  
      setProfessionalSummary(resumeDetails.professionalSummary?.summary || "");
    }
  }, [resumeDetails, userProfileId]);
  
  
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setDisplayResume(false);
  };

  const handleSkip = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setDisplayResume(false);
  };

  const handleReset = () => {
    setActiveStep(0);
    setDisplayResume(false);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleEducationChange = (index, event) => {
    const values = [...educations];
    values[index][event.target.name] = event.target.value;
    setEducations(values);
  };

  const handleAddEducation = () => {
    setEducations([
      ...educations,
      {
        institution: "",
        degree: "",
        startDate: "",
        endDate: "",
        fieldofstudy: "",
      },
    ]);
  };

  const handleRemoveEducation = (index) => {
    const values = [...educations];
    values.splice(index, 1);
    setEducations(values);
  };

  const handleExperienceChange = (index, event) => {
    const values = [...experiences];
    values[index][event.target.name] = event.target.value;
    setExperiences(values);
  };

  const handleAddExperience = () => {
    setExperiences([
      ...experiences,
      {
        company: "",
        role: "",
        startDate: "",
        endDate: "",
        city: "",
        state: "",
        projects: [{ title: "", description: "", technology: "" }],
      },
    ]);
  };

  const handleRemoveExperience = (index) => {
    const values = [...experiences];
    values.splice(index, 1);
    setExperiences(values);
  };

  const handleProjectChange = (expIndex, projIndex, event) => {
    const values = [...experiences];
    values[expIndex].projects[projIndex][event.target.name] =
      event.target.value;
    setExperiences(values);
  };

  const handleAddProject = (expIndex) => {
    const values = [...experiences];
    values[expIndex].projects.push({
      title: "",
      description: "",
      technology: "",
    });
    setExperiences(values);
  };

  const handleRemoveProject = (expIndex, projIndex) => {
    const values = [...experiences];
    values[expIndex].projects.splice(projIndex, 1);
    setExperiences(values);
  };

  const handleSkillChange = (index, event) => {
    const values = [...skills];
    values[index][event.target.name] = event.target.value;
    setSkills(values);
  };

  const handleAddSkill = () => {
    setSkills([...skills, { skill: "" }]);
  };

  const handleRemoveSkill = (index) => {
    const values = [...skills];
    values.splice(index, 1);
    setSkills(values);
  };

  const handleCertificateChange = (index, event) => {
    const { name, value } = event.target;
    const updatedCertificates = [...certificates];
    updatedCertificates[index][name] = value;
    setCertificates(updatedCertificates);
  };

  const handleAddCertificate = () => {
    setCertificates([
      ...certificates,
      {
        certificateName: "", 
        issuingOrganization: "",
        certificateDate: "",
      },
    ]);
  };

  const handleRemoveCertificate = (index) => {
    const updatedCertificates = certificates.filter((_, i) => i !== index);
    setCertificates(updatedCertificates);
  };

  const handleAchievementChange = (index, event) => {
    const values = [...achievements];
    values[index][event.target.name] = event.target.value;
    setAchievements(values);
  };

  const handleAddAchievement = () => {
    setAchievements([
      ...achievements,
      {
        awardName: "",
        issuingOrganization: "",
        awardDate: "",
      },
    ]);
  };

  const handleRemoveAchievement = (index) => {
    const values = [...achievements];
    values.splice(index, 1);
    setAchievements(values);
  };

  const handleProfessionalSummaryChange = (event) => {
    setProfessionalSummary(event.target.value);
  };

  const handleProfileUploadChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedProfile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const getStepContent = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return (
          <form>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  variant="outlined"
                  required
                  fullWidth
                  label="First Name"
                  value={profile.firstName}
                  onChange={handleProfileChange}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="lastName"
                  variant="outlined"
                  required
                  fullWidth
                  label="Last Name"
                  value={profile.lastName}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="email"
                  variant="outlined"
                  required
                  fullWidth
                  label="Email Address"
                  value={profile.email}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="phone"
                  variant="outlined"
                  required
                  fullWidth
                  label="Phone Number"
                  value={profile.phone}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="address"
                  variant="outlined"
                  required
                  fullWidth
                  label="Address"
                  value={profile.address}
                  onChange={handleProfileChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="linkedinId"
                  variant="outlined"
                  fullWidth
                  label="linkedinId"
                  value={profile.linkedinId}
                  onChange={handleProfileChange}
                />
              </Grid>
            </Grid>
          </form>
        );
      case 1:
        return (
          <form>
            <Typography variant="body1" sx={{fontWeight:'bold', marginBottom:'10px'}}>Highest Qualification</Typography>
            {educations.map((education, index) => (
              <Box key={index} mb={4}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="institution"
                      variant="outlined"
                      required
                      fullWidth
                      label="Institution"
                      value={education.institution}
                      onChange={(event) => handleEducationChange(index, event)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="degree"
                      variant="outlined"
                      required
                      fullWidth
                      label="Degree"
                      value={education.degree}
                      onChange={(event) => handleEducationChange(index, event)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="startDate"
                      variant="outlined"
                      required
                      fullWidth
                      type="date"
                      label="Start Date"
                      value={education.startDate}
                      onChange={(event) => handleEducationChange(index, event)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        inputMode: "none",
                        style: {
                          textAlign: "left",
                          color: "inherit",
                          fontSize: "inherit",
                          lineHeight: "inherit",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="endDate"
                      variant="outlined"
                      fullWidth
                      type="date"
                      label="End Date"
                      value={education.endDate}
                      onChange={(event) => handleEducationChange(index, event)}
                      InputLabelProps={{ shrink: true }} // Ensure the label floats when there's input
                      InputProps={{
                        inputMode: "none", // Prevent the default date UI from showing
                        style: {
                          textAlign: "left", // Align text to the left
                          color: "inherit", // Inherit text color
                          fontSize: "inherit", // Inherit font size
                          lineHeight: "inherit", // Inherit line height
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="fieldofstudy"
                      variant="outlined"
                      required
                      fullWidth
                      label="Field of Study"
                      value={education.fieldofstudy}
                      onChange={(event) => handleEducationChange(index, event)}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </form>
        );

      case 2:
        return (
          <form>
            {experiences.map((experience, expIndex) => (
              <Box key={expIndex} mb={4}>
                <Typography variant="body1" sx={{fontWeight:'bold', marginBottom:'10px'}}>Company</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="company"
                      variant="outlined"
                      required
                      fullWidth
                      label="Company"
                      value={experience.company}
                      onChange={(event) =>
                        handleExperienceChange(expIndex, event)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="role"
                      variant="outlined"
                      required
                      fullWidth
                      label="Role"
                      value={experience.role}
                      onChange={(event) =>
                        handleExperienceChange(expIndex, event)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="startDate"
                      variant="outlined"
                      required
                      fullWidth
                      type="date"
                      label="Start Date"
                      value={experience.startDate}
                      onChange={(event) =>
                        handleExperienceChange(expIndex, event)
                      }
                      InputLabelProps={{ shrink: true }} // Ensure the label floats when there's input
                      InputProps={{
                        inputMode: "none", // Prevent the default date UI from showing
                        style: {
                          textAlign: "left", // Align text to the left
                          color: "inherit", // Inherit text color
                          fontSize: "inherit", // Inherit font size
                          lineHeight: "inherit", // Inherit line height
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="endDate"
                      variant="outlined"
                      fullWidth
                      label="End Date"
                      type="date"
                      value={experience.endDate}
                      onChange={(event) =>
                        handleExperienceChange(expIndex, event)
                      }
                      InputLabelProps={{ shrink: true }} // Ensure the label floats when there's input
                      InputProps={{
                        inputMode: "none", // Prevent the default date UI from showing
                        style: {
                          textAlign: "left", // Align text to the left
                          color: "inherit", // Inherit text color
                          fontSize: "inherit", // Inherit font size
                          lineHeight: "inherit", // Inherit line height
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="city"
                      variant="outlined"
                      required
                      fullWidth
                      label="City"
                      value={experience.city}
                      onChange={(event) =>
                        handleExperienceChange(expIndex, event)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="state"
                      variant="outlined"
                      required
                      fullWidth
                      label="State"
                      value={experience.state}
                      onChange={(event) =>
                        handleExperienceChange(expIndex, event)
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                   
                    {experience.projects.map((project, projIndex) => (
                      <Box key={projIndex} mb={2}>
                        <Typography variant="body1" sx={{fontWeight:'bold', marginBottom:'10px'}}>Projects</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              name="title"
                              variant="outlined"
                              required
                              fullWidth
                              label="Project Title"
                              value={project.title}
                              onChange={(event) =>
                                handleProjectChange(expIndex, projIndex, event) 
                              }
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              name="technology"
                              variant="outlined"
                              required
                              fullWidth
                              label="Technology Used"
                              value={project.technology}
                              onChange={(event) =>
                                handleProjectChange(expIndex, projIndex, event)
                              }
                            />
                          </Grid>
                          <Grid item xs={12} sm={12}>
                            <TextField
                              name="description"
                              variant="outlined"
                              required
                              fullWidth
                              multiline
                              rows={4}
                              label="Project Description"
                              value={project.description}
                              onChange={(event) =>
                                handleProjectChange(expIndex, projIndex, event)
                              }
                            />
                          </Grid>

                          <Grid item xs={12} style={{ textAlign: "right" }}>
                            <IconButton
                              onClick={() =>
                                handleRemoveProject(expIndex, projIndex)
                              } color="secondary"
                            >
                               <span style={{ marginLeft: 4, fontSize: 'small' }}>Remove <RemoveCircleOutline /></span>
                            </IconButton>
                            {projIndex === experience.projects.length - 1 && (
                              <IconButton
                                onClick={() => handleAddProject(expIndex)} color="primary"
                              >
                               <span style={{ marginLeft: 4, fontSize: 'small' }}>New Project <AddCircleOutline /></span>
                              </IconButton>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Grid>
                  <Grid item xs={12} style={{ textAlign: "right" }}>
                    <IconButton
                      onClick={() => handleRemoveExperience(expIndex)} color="secondary"
                    >
                      <span style={{ marginLeft: 4, fontSize: 'small' }}>Remove <RemoveCircleOutline /></span>
                    </IconButton>
                    {expIndex === experiences.length - 1 && (
                      <IconButton onClick={handleAddExperience} color="primary"> 
                        <span style={{ marginLeft: 4, fontSize: 'small' }}>New Company <AddCircleOutline /></span>
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              </Box>
            ))}
          </form>
        );

      case 3:
        return (
          <form>
          <Grid container spacing={2}>
            {skills.map((skill, index) => (
              <React.Fragment key={index}>
                <Grid item xs={12} sm={5}>
                  <TextField
                    name="skill"
                    variant="outlined"
                    required
                    fullWidth
                    label="Skill"
                    value={skill.skill}
                    onChange={(event) => handleSkillChange(index, event)}
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <IconButton onClick={() => handleRemoveSkill(index)} color="secondary">
                  <span style={{ marginLeft: 4, fontSize: 'small' }}><RemoveCircleOutline /></span>
                  </IconButton>
                  {index === skills.length - 1 && (
                    <IconButton onClick={handleAddSkill} color="primary">
                      <span style={{ marginLeft: 4, fontSize: 'small' }}><AddCircleOutline /></span>
                    </IconButton>
                  )}
                </Grid>
                {/* Ensure that after two fields, a new row is started */}
                {index % 2 === 1 && <Grid item xs={12} />}
              </React.Fragment>
            ))}
          </Grid>
        </form>
        );
      case 4:
        return (
          <form>
            {certificates.map((certificate, index) => (
              <Box key={index} mb={4}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="certificateName"
                      variant="outlined"
                      fullWidth
                      label="Certificate Name"
                      value={certificate.certificateName}
                      onChange={(event) =>
                        handleCertificateChange(index, event)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="issuingOrganization"
                      variant="outlined"
                      fullWidth
                      label="Issuing Organization"
                      value={certificate.issuingOrganization}
                      onChange={(event) =>
                        handleCertificateChange(index, event)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="certificateDate"
                      variant="outlined"
                      fullWidth
                      type="date"
                      label="Certificate Date"
                      value={certificate.certificateDate}
                      onChange={(event) =>
                        handleCertificateChange(index, event)
                      }
                      InputLabelProps={{ shrink: true }} // Ensure the label floats when there's input
                      InputProps={{
                        inputMode: "none", // Prevent the default date UI from showing
                        style: {
                          textAlign: "left", // Align text to the left
                          color: "inherit", // Inherit text color
                          fontSize: "inherit", // Inherit font size
                          lineHeight: "inherit", // Inherit line height
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} style={{ textAlign: "right" }}>
                    <IconButton onClick={() => handleRemoveCertificate(index)} color="secondary">
                    <span style={{ marginLeft: 4, fontSize: 'small' }}>Remove<RemoveCircleOutline /></span>
                    </IconButton>
                    {index === certificates.length - 1 && (
                      <IconButton onClick={handleAddCertificate} color="primary">
                        <span style={{ marginLeft: 4, fontSize: 'small' }}>New <AddCircleOutline /></span>
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              </Box>
            ))}
          </form>
        );
      case 5:
        return (
          <form>
            {achievements.map((achievement, index) => (
              <Box key={index} mb={4}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="awardName"
                      variant="outlined"
                      fullWidth
                      label="Award Name"
                      value={achievement.awardName}
                      onChange={(event) =>
                        handleAchievementChange(index, event)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="issuingOrganization"
                      variant="outlined"
                      fullWidth
                      label="Issuing Organization"
                      value={achievement.issuingOrganization}
                      onChange={(event) =>
                        handleAchievementChange(index, event)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="awardDate"
                      variant="outlined"
                      type="date"
                      fullWidth
                      label="Award Date"
                      value={achievement.awardDate}
                      onChange={(event) =>
                        handleAchievementChange(index, event)
                      }
                      InputLabelProps={{ shrink: true }} // Ensure the label floats when there's input
                      InputProps={{
                        inputMode: "none", // Prevent the default date UI from showing
                        style: {
                          textAlign: "left", // Align text to the left
                          color: "inherit", // Inherit text color
                          fontSize: "inherit", // Inherit font size
                          lineHeight: "inherit", // Inherit line height
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} style={{ textAlign: "right" }}>
                    <IconButton onClick={() => handleRemoveAchievement(index)} color="secondary">
                    <span style={{ marginLeft: 4, fontSize: 'small' }}>Remove<RemoveCircleOutline /></span>
                    </IconButton>
                    {index === achievements.length - 1 && (
                      <IconButton onClick={handleAddAchievement} color="primary">
                        <span style={{ marginLeft: 4, fontSize: 'small' }}>New <AddCircleOutline /></span>
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              </Box>
            ))}
          </form>
        );
      case 6:
        return (
          <form>
            <TextField
              name="professionalSummary"
              variant="outlined"
              required
              fullWidth
              multiline
              rows={4}
              label="Professional Summary"
              value={professionalSummary}
              onChange={handleProfessionalSummaryChange}
            />
          </form>
        );
      case 7:
        return (
          <Card sx={{maxWidth:'600px', boxShadow:6}}>
          <CardContent sx={{marginLeft:'50px'}}>
          <form>
          <input
            accept="image/*"
            type="file"
            onChange={handleProfileUploadChange}
            required
          />
          <small style={{ display: 'block', marginTop: '8px', color: 'green' }}>
            Accepted file types: JPEG, JPG, PNG, <br />
            Maximum file size: 2MB
          </small>
          {profile && <p>{profile.profilePictureUrl}</p>}
         </form>
         </CardContent>
         </Card>
        );
    }
  };

  return (
    <Container>
      <Paper elevation={3} style={{ padding: "2em", marginTop: "2em"}}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={index}>
              <StepLabel sx={{cursor:'pointer'}} onClick={() => handleStepClick(index)} StepIconComponent={GreenStepIcon}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <div>
          {activeStep === steps.length ? (
            <div>
              {/* <Typography>All steps completed</Typography> */}
              <Button onClick={handleReset}>Reset</Button>
              <Button onClick={handleBack}>Back</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateResume}
              >
                Create Resume
              </Button>
              &nbsp; &nbsp;
              {isResumeCreated && (
                <Button
                  sx={{ backgroundColor: "#4caf50", color: "#fff" }}
                  variant="contained"
                  onClick={handleDownload}
                >
                  Download
                </Button>
              )}
              &nbsp; &nbsp;
              {isResumeCreated && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={
                    resumeDetails && Object.keys(resumeDetails).length > 0
                      ? handleUpdate
                      : handleFinish
                  }
                >
                  {resumeDetails && Object.keys(resumeDetails).length > 0
                    ? "Update"
                    : "Save"}
                </Button>
              )}
              &nbsp; &nbsp;
              {isResumeCreated && approvalStatus === "Approved" && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={saveFinaleResume}
                >
                  Send to Client
                </Button>
              )}
            </div>
          ) : (
            <div>
              <Box my={4}>{getStepContent(activeStep)}</Box>
              <div>
                <Button disabled={activeStep === 0} onClick={handleBack}>
                  Back
                </Button>
                &nbsp;&nbsp;&nbsp;
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSkip}
                >
                  Skip
                </Button>
                &nbsp;&nbsp;
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                >
                  {activeStep === steps.length ? "Finish" : "Next"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Paper>

    <div style={{ position: 'relative', width: '100%' }}>
    {displayResume && (
      <Paper elevation={3} style={{ padding: "2em", marginTop: "2em" }} id="resume">
        <Grid container spacing={2}>
          {/* First Column */}
          <Grid item xs={12} md={4} style={{ backgroundColor: "#f0f0f0", padding: "1em" }}>
            {profilePicUrl && (
              <Box textAlign="center" mb={4}>
                <img
                  src={profilePicUrl}
                  alt="Profile"
                  style={{ width: "80%", height: "250px", borderRadius: "5%" }}
                />
              </Box>
            )}
            <Box textAlign="center" mb={4}>
              <Typography style={{ fontWeight: "bold" }}>
                <EmailIcon />&nbsp; {profile.email}
              </Typography>
              <Typography style={{ fontWeight: "bold" }}>
                <PhoneIcon />&nbsp; {profile.phone}
              </Typography>
              <Typography style={{ fontWeight: "bold" }}>
                <LocationOnIcon />&nbsp; {profile.address}
              </Typography>
            </Box>
            <Typography variant="h6" gutterBottom sx={{ ml: 4 }}>
              <SchoolIcon sx={{ color: 'black' }} />&nbsp;<b>EDUCATIONS</b>
            </Typography>
            {educations.length > 0 ? (
              educations.map((education, index) => (
                <Box key={index} mb={2} sx={{ ml: 4 }}>
                  <Typography variant="subtitle1">
                    {education.degree} ({education.fieldofstudy})
                    {education.endDate && `, ${new Date(education.endDate).getFullYear()}`}
                  </Typography>
                  <Typography>{education.institution}</Typography>
                </Box>
              ))
            ) : (
              <Typography sx={{ ml: 4 }}>No education details provided.</Typography>
            )}
            <Typography variant="h6" gutterBottom sx={{ ml: 4 }}>
              <BuildIcon sx={{ color: 'black' }} />&nbsp;<b>SKILLS</b>
            </Typography>
            <Box sx={{ ml: 4 }}>
              {skills.length > 0 ? (
                skills.map((skill, index) => (
                  <Typography key={index}>{skill.skill}</Typography>
                ))
              ) : (
                <Typography>No skills provided.</Typography>
              )}
            </Box>
          </Grid>
          {/* Second Column */}
          <Grid item xs={12} md={8} style={{ padding: "1em", position: 'relative' }}>
            <img
              src={VVLogo}
              alt="Vishvavidya Logo"
              style={{
                position: 'absolute',
                top: "30px",
                right: "40px",
                width: "200px",
                height: "auto",
              }}
            />
            <Typography variant="h4" sx={{ textTransform: 'capitalize' }}>
              <b>{profile.firstName} {profile.lastName}</b>
            </Typography>
            {experiences.length > 0 && (
              <Typography variant="subtitle1" sx={{ color: "#0096FF", marginLeft: "25px" }}>
                {experiences[0].role}
              </Typography>
            )}
            <hr />
            <Typography variant="h6" gutterBottom>
              <SummarizeIcon sx={{ color: 'black' }} />&nbsp;<b>PROFESSIONAL SUMMARY</b>
            </Typography>
            <Typography sx={{ ml: 4 }}>{professionalSummary}</Typography>
            <hr />
            <Typography variant="h6" gutterBottom>
              <WorkIcon sx={{ color: 'black' }} />&nbsp;<b>PROFESSIONAL EXPERIENCE</b>
            </Typography>
            {experiences.length > 0 ? (
              experiences.map((experience, expIndex) => (
                <Box key={expIndex} mb={4} ml={4}>
                  <Grid container justifyContent="space-between" alignItems="flex-start">
                    <Grid item xs={8}>
                      <Typography variant="subtitle1" sx={{ color: "#0096FF" }}>
                        {experience.company}, {experience.city}
                      </Typography>
                      <Typography>{experience.role}</Typography>
                    </Grid>
                    <Grid item xs={4} style={{ textAlign: "right" }}>
                      <Typography>
                        {experience.startDate} - {experience.endDate}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Box mt={2}>
                    <Typography>{experience.description}</Typography>
                  </Box>
                  {experience.projects.map((project, projIndex) => (
                    <Box key={projIndex} mb={2}>
                      <Typography variant="subtitle1" mb={1}>
                        <b>{project.title}</b>
                      </Typography>
                      <Typography mb={1}>{project.description}</Typography>
                      <Typography>
                        <b>Technology:</b> {project.technology}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ))
            ) : (
              <Typography>No professional experience details provided.</Typography>
            )}
            {certificates.length > 0 ? (
              <>
                <hr />
                <Typography variant="h6" gutterBottom>
                  <CardMembershipIcon sx={{ color: 'black' }} />&nbsp;<b>CERTIFICATES</b>
                </Typography>
                {certificates.map((certificate, index) => (
                  <Box key={index} mb={2} sx={{ ml: 4 }}>
                    <Typography variant="subtitle1">
                      {certificate.certificateName}, {certificate.issuingOrganization}, {certificate.certificateDate}
                    </Typography>
                  </Box>
                ))}
              </>
            ) : null}
                {achievements.length > 0 ? (
              <>
                <hr />
                <Typography variant="h6" gutterBottom>
                  <EmojiEventsIcon sx={{ color: 'black' }} />&nbsp;<b>ACHIEVEMENTS</b>
                </Typography>
                {achievements.map((achievement, index) => (
                  <Box key={index} mb={2} sx={{ ml: 4 }}>
                    <Typography variant="subtitle1">
                      {achievement.awardName}, {achievement.issuingOrganization}, {achievement.awardDate}
                    </Typography>
                  </Box>
                ))}
              </>
            ) : null} 
          </Grid>
        </Grid>
      </Paper>
    )}
  </div>

      <Dialog open={openDialog} onClose={handleCloseDialog}
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
      }}>
        <DialogTitle sx={{ color: titleColor }}>{dialogTitle}</DialogTitle>
        <DialogContent sx={{color:'#0096FF'}}>{dialogMessage}</DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
          <Button onClick={handleCloseDialog} color="primary">
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
export default ResumeBuilder;
