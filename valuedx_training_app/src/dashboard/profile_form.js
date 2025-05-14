import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { styled } from "@mui/material/styles";
import Cookies from "js-cookie";
import { parseISO, format } from "date-fns";
import html2pdf from "html2pdf.js";
import config from "../config";
import ResumePreview from "../dashboard/ResumePreview";
import Autocomplete from '@mui/material/Autocomplete';
// import StateCitySelector from "../dashboard/Case2_stateCity";

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
  StepIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Card,
  CardContent,
} from "@mui/material";
import { AddCircleOutline, RemoveCircleOutline } from "@mui/icons-material";
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
  fetch("https://raw.githubusercontent.com/Renuka2610/IN_State_majorCity/main/State_Cities.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Fetched JSON Data:");
    })
    .catch((error) => {
      console.error("Error fetching GitHub data:", error);
    });

  const [formErrors, setFormErrors] = useState({}); //Update RD

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
  const [allowResumeCreation, setAllowResumeCreation] = useState(false);
  const [extraProjects, setExtraProjects] = useState([]);

  // 🌐 Load states list on component mount

  const [fileError, setFileError] = useState("");

  // console.log("profilePicUrl", profilePicUrl);

  const titleColor = dialogStatus === "error" ? "red" : "green";

  //stepper states
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    linkedinId: "",
    github: "",
    website: "",
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
      currentlyWorking: false,
      workDesc: "",
    },
  ]);
  const [projects, setProjects] = useState([
    { title: "", technology: "", description: "" },
  ]);

  const [skills, setSkills] = useState([{ skill: "" }]);
  const skillRefs = useRef([]);

  const [certificates, setCertificates] = useState([
    { certificateName: "", issuingOrganization: "", certificateDate: "" },
  ]);

  const [achievements, setAchievements] = useState([
    { awardName: "", issuingOrganization: "", awardDate: "" },
  ]);

  const [professionalSummary, setProfessionalSummary] = useState("");
  const qualificationOptions = [
    "Diploma",
    "BE",
    "ME",
    "BCA",
    "MCA",
    "BCS",
    "MCS",
    "B.Tech",
    "M.Tech",
    "MBA",
    "BSC",
    "MSC",
  ];
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
      pdf.addImage(imgData, "PNG", 10, 10, 190, 270);

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
          showDialog(
            "Error",
            "Failed to save resume. Please try again.",
            "error"
          );
        });
    });
  };
  const pdfStyles = `
  #resume.pdf-mode {
    background-color: white !important;
    padding: 30px !important;
    border-radius: 12px !important;
    border: 2px solid #C5C3E6 !important;
    box-shadow: none !important;
  }

  #resume.pdf-mode .MuiDivider-root {
    border: 1.5px solid rgb(192, 190, 232) !important;
    margin-bottom: 15px !important;
  }

  #resume.pdf-mode .left-column {
    background-color: #f8f8f8 !important;
    padding: 1.5em !important;
    border-radius: 12px !important;
  }

  #resume.pdf-mode .right-column {
    padding: 2em 1.5em 1.5em 1.5em !important;
  }
#resume.pdf-mode .LilBold{
font-weight: 600 !important;
color: #666 !important;
}
#resume.pdf-mode .TinyIt{
font-size: 12px !important;
  
}
#resume.pdf-mode .TechSkillSize{
font-size: 0.85rem !important 
}
  #resume.pdf-mode .profile-image-box img {
    width: 120px !important;
    height: 120px !important;
    border-radius: 50% !important;
    object-fit: cover !important;
    border: 3px solid #6E66E5 !important;
    margin-bottom: 1.5em !important;
  }

  #resume.pdf-mode .resume-logo {
    width: 120px !important;
    margin-bottom: 1em !important;
    display: block !important;
    margin-left: auto !important;
  }

  #resume.pdf-mode .section-title {
    color: #6E66E5 !important;
    font-weight: bold !important;
    margin-bottom: 0.8em !important;
    text-transform: uppercase !important;
    font-size : 17px ;
  }
#resume.pdf-mode .avoid-break {
  break-inside: avoid;
  page-break-inside: avoid;  /* fallback for older browsers */
  display: block;
}
  #resume.pdf-mode .resume-card {
    background: #f2f2f2 !important;
    padding: 1em !important;
    border-radius: 8px !important;
    margin-bottom: 1em !important;
  }
 .NameHeader{
             text-transform: upper  case !important;
                font-weight: bold !important;
                color: #333 !important;
                letter-spacing: 1px !important;
}
  #resume.pdf-mode .contact-info {
    font-size: 0.85rem !important;
    color: #444 !important;
  }

  #resume.pdf-mode .edu-degree {
    
    font-weight: bold !important;
  }
 #resume.pdf-mode .edu-fieldofstudy {
    color: #666 !important;  
    font-size: 12px !important; 
     font-style: italic !important;
     display: block  
  }

  // #resume.pdf-mode * { // applies to all the text and icons
  //   color: red !important;
  //   font-size: 11pt !important;
  //   line-height: 1.4 !important;
  // }
`;

  const handleDownload = () => {
    const resumeElement = document.getElementById("resume");

    // ✅ Inject PDF-specific styles
    const styleTag = document.createElement("style");
    styleTag.innerHTML = pdfStyles;
    document.head.appendChild(styleTag);

    // ✅ Apply .pdf-mode for layout adjustments
    resumeElement.classList.add("pdf-mode");

    const opt = {
      margin: [10, 5, 10, 5],
      filename: "resume.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,    // 🔥 Important!
        allowTaint: true,
        logging: true
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };


    html2pdf()
      .set(opt)
      .from(resumeElement)
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        // ✅ Save the PDF locally
        pdf.save();

        // ✅ Convert to base64 for server
        const pdfBase64 = pdf.output("dataurlstring").split(",")[1];

        const formData = {
          pdfData: `data:application/pdf;base64,${pdfBase64}`,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
        };

        // ✅ Upload to backend
        fetch(`${config.API_BASE_URL}/api/save-review-resume`, {
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
      })
      .finally(() => {
        // 🧹 Clean up
        resumeElement.classList.remove("pdf-mode");
        document.head.removeChild(styleTag);
      });
  };
  const liveChange = (name) => {
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStepAll = () => {
    const errors = {};

    // --- Step 0: Personal Details ---
    if (activeStep === 0) {
      if (!profile.firstName.trim()) {
        errors.firstName = "First name is required";
      } else if (profile.firstName.trim().length < 2) {
        errors.firstName = "First name must be at least 2 characters";
      }

      if (!profile.lastName.trim()) {
        errors.lastName = "Last name is required";
      } else if (profile.lastName.trim().length < 2) {
        errors.lastName = "Last name must be at least 2 characters";
      }

      if (!profile.email.trim()) {
        errors.email = "Email is required";
      } else {
        const emailRegex =
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in|org|edu|me)$/i;
        if (!emailRegex.test(profile.email.trim())) {
          errors.email = "Enter a valid email address";
        }
      }

      if (!profile.phone.trim()) {
        errors.phone = "Phone number is required";
      } else {
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(profile.phone.trim())) {
          errors.phone = "Enter a valid 10-digit Indian mobile number";
        }
      }

      if (!profile.address.trim()) errors.address = "Address is required";

      if (!profile.linkedinId.trim()) {
        errors.linkedinId = "LinkedIn URL is required";
      } else {
        const linkedInRegex =
          /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-_]+\/?$/i;
        if (!linkedInRegex.test(profile.linkedinId.trim())) {
          errors.linkedinId = "Enter a valid LinkedIn profile URL";
        }
      }
    }

    // --- Step 1: Education ---
    if (activeStep === 1) {
      educations.forEach((edu, index) => {
        if (!edu.institution.trim())
          errors[`institution_${index}`] = "Institution is required";

        if (!edu.degree.trim()) {
          errors[`degree_${index}`] = "Degree is required";
          edu.degree = ""; // <-- Reset the dropdown to blank if error happens
        }

        if (!edu.startDate.trim())
          errors[`startDate_${index}`] = "Start Date is required";
        else {
          const startDate = new Date(edu.startDate);
          const today = new Date();
          startDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          if (startDate >= today) {
            errors[`startDate_${index}`] = "Start Date must be before today";
          }
        }

        if (!edu.fieldofstudy.trim())
          errors[`fieldofstudy_${index}`] = "Field of Study is required";

        if (!edu.endDate.trim()) {
          errors[`endDate_${index}`] = "End Date is required";
        } else if (edu.startDate.trim()) {
          const startDate = new Date(edu.startDate);
          const endDate = new Date(edu.endDate);

          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);

          if (endDate <= startDate) {
            errors[`endDate_${index}`] = "End Date must be after Start Date";
          }
        }
      });
    }

    // --- Step 2: Experience ---
    if (activeStep === 2) {
      experiences.forEach((exp, index) => {
        const hasCompany = exp.company?.trim() !== "";
        debugger;
        if (hasCompany) {
          // Role required
          if (!exp.role.trim()) errors[`role_${index}`] = "Role is required";

          // Start Date required + must be before today
          if (!exp.startDate?.trim()) {
            errors[`startDateExp_${index}`] = "Start Date is required";
          } else {
            const startDate = new Date(exp.startDate);
            const today = new Date();
            startDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            if (startDate >= today) {
              errors[`startDateExp_${index}`] =
                "Start Date must be before today";
            }
          }

          // End Date logic
          if (!exp.currentlyWorking) {
            if (!exp.endDate?.trim()) {
              errors[`endDateExp_${index}`] = "End Date is required";
            } else {
              const endDate = new Date(exp.endDate);
              const startDate = new Date(exp.startDate);
              const today = new Date();
              endDate.setHours(0, 0, 0, 0);
              startDate.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);

              if (endDate <= startDate) {
                errors[`endDateExp_${index}`] =
                  "End Date must be after Start Date";
              } else if (endDate > today) {
                errors[`endDateExp_${index}`] = "End Date cannot be in future";
              }
            }
          }

          if (!exp.state || exp.state.trim().length < 2) {
            errors[`state_${index}`] =
              "State is required and must be at least 2 characters";
          }

          if (!exp.city || exp.city.trim().length < 2) {
            errors[`city_${index}`] =
              "City is required and must be at least 2 characters";
          }

          if (!exp.workDesc?.trim()) {
            errors[`workDesc_${index}`] =
              "Description of your role is required";
          }
          setExperiences(filterEmptyFirstFieldObjects(experiences));
        }
      });

      projects.forEach((proj, index) => {
        if (proj.title?.trim()) {
          if (!proj.description?.trim()) {
            errors[`projDesc_${index}`] = "Project description is required";
          }

          if (!proj.technology?.trim()) {
            errors[`projTech_${index}`] = "Technology is required";
          }
        }
        setProjects(filterEmptyFirstFieldObjects(projects));
      });
    }

    // --- Step 3: Skills ---
    if (activeStep === 3) {
      const nonEmptySkills = skills.filter(
        (skill) => skill.skill.trim() !== ""
      );

      if (nonEmptySkills.length === 0) {
        errors[`skill_0`] = "At least one skill is required";
      }
      setSkills(filterEmptyFirstFieldObjects(skills));
    }

    // --- Step 4: Certificates (optional group) ---
    if (activeStep === 4) {
      certificates.forEach((cert, index) => {
        if (cert.certificateDate.trim()) {
          const certDate = new Date(cert.certificateDate);
          const today = new Date();
          certDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);

          if (certDate > today) {
            errors[`certificateDate_${index}`] =
              "Certificate Date cannot be in future";
          }
        }
      });
    }

    // --- Step 5: Achievements (optional group) ---
    if (activeStep === 5) {
      achievements.forEach((ach, index) => {
        if (ach.awardDate.trim()) {
          const awardDate = new Date(ach.awardDate);
          const today = new Date();
          awardDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);

          if (awardDate > today) {
            errors[`awardDate_${index}`] = "Award Date cannot be in future";
          }
        }
      });
    }

    // --- Step 6: Summary ---
    if (activeStep === 6) {
      // professional summery sabki nhi hoti laxman
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCurrentlyWorkingChange = (index) => {
    const updated = experiences.map((exp, idx) => {
      if (idx === index) {
        // Toggle the clicked one
        const newState = !exp.currentlyWorking;
        return {
          ...exp,
          currentlyWorking: newState,
          endDate: newState ? "" : exp.endDate, // clear endDate if toggled ON
        };
      }
      // Disable others if one is currently checked
      return {
        ...exp,
        currentlyWorking: false,
      };
    });

    setExperiences(updated);
  };

  //Submit resume
  const handleFinish = async () => {
    try {
      const formData = new FormData();

      // Append file if available
      if (uploadedProfile) {
        formData.append("profilePic", uploadedProfile);
      }

      // Create the complete resume object
      const resumeData = {
        userId,
        profile: {
          ...profile,  // include github, website too
        },
        educations,
        experiences: experiences.map((exp) => ({
          ...exp,
          projects: exp.projects || [], // ensure projects array is present
        })),
        skills,
        certificates: certificates || [],
        achievements: achievements || [],
        professionalSummary: { summary: professionalSummary || "" },
        extraProjects: extraProjects || [],
      };

      console.log(profile);
      console.log(experiences);

      formData.append("ResumeData", JSON.stringify(resumeData));

      const response = await fetch(`${config.API_BASE_URL}/api/resume`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && response.status === 201) {
        showDialog("Success", "Resume created successfully!", "success");
      } else {
        if (response.status === 409 && data.error === "User details already present") {
          showDialog("Error", "User details already present", "error");
        } else {
          showDialog("Error", data.error || "Failed to create resume", "error");
        }
      }
    } catch (error) {
      console.error("Error in handleFinish:", error);
      showDialog("Error", "Failed to create resume. Please try again.", "error");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      const resumeData = {
        userId, // Pass userId also
        userProfileId, // Important for backend to identify which resume
        profile: {
          ...profile,  // include github, website too
        },
        educations,
        experiences: experiences.map((exp) => ({
          ...exp,
          projects: exp.projects || [], // make sure projects array exists
        })),
        skills,
        certificates: certificates || [],
        achievements: achievements || [],
        professionalSummary: { summary: professionalSummary || "" },
        extraProjects: extraProjects || [],
      };

      console.log(profile);
      console.log(experiences);

      formData.append("ResumeData", JSON.stringify(resumeData));

      if (uploadedProfile) {
        formData.append("profilePic", uploadedProfile);
      }

      const response = await fetch(`${config.API_BASE_URL}/api/updateResume`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showDialog("Success", "Resume updated successfully!", "success");
      } else {
        showDialog("Error", data.error || "Failed to update resume", "error");
      }
    } catch (error) {
      console.error("Error in handleUpdate:", error);
      showDialog("Error", "Failed to update resume. Please try again.", "error");
    }
  };

  const isFieldEmpty = (field) => {
    return field === "" || field === null || field === undefined;
  };

  const validateExperiences = (experiences) => {
    if (experiences.length === 0) {
      console.log("No experiences provided.");
      return false;
    }
    return experiences.every(
      (experience) =>
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
    return skills.every((skill) => !isFieldEmpty(skill.skill));
  };

  const validateProfessionalSummary = (summary) => {
    return !isFieldEmpty(summary);
  };
  const proceedToCreateResume = () => {
    setAllowResumeCreation(true); // allow showing resume
    setIsResumeCreated(true);
    setDisplayResume(true);
    setOpenDialog(false);
    setActiveStep(8);
  };

  const handleCreateResume = () => {
    let warningMessages = [];

    if (!validateExperiences(experiences)) {
      warningMessages.push("Experience details missing.");
    }

    const skillCount = skills.filter(
      (skill) => skill.skill && skill.skill.trim() !== ""
    ).length;

    if (!validateSkills(skills)) {
      warningMessages.push("No skills added.");
    } else if (skillCount < 3) {
      warningMessages.push(`Only ${skillCount} skill(s) added.`);
    }

    if (!validateProfessionalSummary(professionalSummary)) {
      warningMessages.push("Professional Summary is empty.");
    }

    if (warningMessages.length > 0) {
      setDialogTitle("Warning");
      setDialogMessage(
        <>
          Some Data is missing for building a strong resume.
          <ul>
            {warningMessages.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
          Do you still want to proceed?
        </>
      );
      setDialogStatus("warning");
      setOpenDialog(true);
      return;
    }

    // Everything is okay
    proceedToCreateResume();
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
      const response = await fetch(
        `${config.API_BASE_URL}/api/getresume/${id}`
      );
      if (!response.ok) {
        throw new Error("Resume not found");
      }
      const data = await response.json();

      if (data.profile?.profile_pic_path) {
        setProfilePicUrl(`${config.API_BASE_URL}/${data.profile.profile_pic_path}`);
      }

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
        github: resumeDetails.profile?.github || "",
        website: resumeDetails.profile?.website || "",
        profilePictureUrl: resumeDetails.profile?.profile_pic_path || "",
      });

      setEducations(
        (resumeDetails.educations || []).map((education) => ({
          institution: education.institution || "",
          degree: education.degree || "",
          startDate: education.start_date
            ? format(parseISO(education.start_date), "yyyy-MM-dd")
            : "",
          endDate: education.end_date
            ? format(parseISO(education.end_date), "yyyy-MM-dd")
            : "",
          fieldofstudy: education.field_of_study || "",
        }))
      );

      setExperiences(
        (resumeDetails.experiences || []).map((experience) => ({
          company: experience.company || "",
          role: experience.role || "",
          startDate: experience.start_date
            ? format(parseISO(experience.start_date), "yyyy-MM-dd")
            : "",
          endDate: experience.end_date
            ? format(parseISO(experience.end_date), "yyyy-MM-dd")
            : "",
          city: experience.city || "",
          state: experience.state || "",
          workDesc: experience.work_desc || "",
          currentlyWorking: experience.currently_working || false,
          projects: Array.isArray(experience.projects)
            ? experience.projects.map((project) => ({
              title: project.title || "",
              description: project.description || "",
              technology: project.technology || "",
            }))
            : [],
        }))
      );

      setSkills(
        (resumeDetails.skills || []).map((skill) => ({
          skill: skill.skill || "",
        }))
      );

      setCertificates(
        resumeDetails.certificates && resumeDetails.certificates.length > 0
          ? resumeDetails.certificates.map((certificate) => ({
            certificateName: certificate.certificate_name || "",
            issuingOrganization: certificate.issuing_organization || "",
            certificateDate: certificate.certificate_date
              ? format(parseISO(certificate.certificate_date), "yyyy-MM-dd")
              : "",
          }))
          : [
            {
              certificateName: "",
              issuingOrganization: "",
              certificateDate: "",
            },
          ]
      );

      setAchievements(
        resumeDetails.achievements && resumeDetails.achievements.length > 0
          ? resumeDetails.achievements.map((achievement) => ({
            awardName: achievement.award_name || "",
            issuingOrganization: achievement.issuing_organization || "",
            awardDate: achievement.award_date
              ? format(parseISO(achievement.award_date), "yyyy-MM-dd")
              : "",
          }))
          : [{ awardName: "", issuingOrganization: "", awardDate: "" }]
      );

      // ✅ ADD THIS
      setExtraProjects(
        (resumeDetails.extraProjects || []).map((project) => ({
          title: project.title || "",
          description: project.description || "",
          technology: project.technology || "",
        }))
      );

      setProfessionalSummary(resumeDetails.professionalSummary?.summary || "");
    }
  }, [resumeDetails, userProfileId]);

  const handleNext = () => {
    const isValid = validateStepAll();

    if (!isValid) return; // Validation failed

    setFormErrors({}); // Clear errors

    // Show Warning Dialog if ActiveStep is 6 (before showing resume page)
    if (activeStep === 7) {
      handleCreateResume(); // This already shows Dialog & handles Proceed/GoBack
      return; // Don't move to next step unless user clicks Proceed
    }

    // Otherwise go to next step normally
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setDisplayResume(false);
  };

  const clearFieldError = (errorKey) => {
    if (formErrors[errorKey]) {
      setFormErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors };
        delete updatedErrors[errorKey];
        return updatedErrors;
      });
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleEducationChange = (index, event) => {
    const values = [...educations];
    const { name, value } = event.target;

    // If user selects "Select Degree" (empty option), clear value
    if (name === "degree" && value === "") {
      values[index][name] = ""; // clear dropdown
    } else {
      values[index][name] = value;
    }

    setEducations(values);

    clearFieldError(`${name}_${index}`);
  };

  function filterEmptyFirstFieldObjects(array) {
    return array.filter((obj) => {
      const firstKey = Object.keys(obj)[0];
      const firstValue = obj[firstKey];

      // Reject if undefined, null, empty string, or whitespace-only
      return (
        firstValue !== undefined &&
        firstValue !== null &&
        firstValue.toString().trim() !== ""
      );
    });
  }

  const handleExperienceChange = (index, event) => {
    const { name, value } = event.target; // ✅ properly extracted
    const values = [...experiences];
    values[index][name] = value;

    // Clear city if state is changed
    if (name === "state") {
      values[index].city = "";
    }
    setExperiences(values);
    clearFieldError(`${name}_${index}`);
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
        currentlyWorking: false,
        workDesc: "",
      },
    ]);
  };

  const handleRemoveExperience = (index) => {
    const values = [...experiences];
    values.splice(index, 1);
    setExperiences(values);
  };

  const handleProjectChange = (expIndex, projIndex, event) => {
    const { name, value } = event.target;
    const updatedExperiences = [...experiences];
    updatedExperiences[expIndex].projects[projIndex][name] = value;
    setExperiences(updatedExperiences);
  };

  const handleAddProject = (expIndex) => {
    const updatedExperiences = [...experiences];
    updatedExperiences[expIndex].projects = updatedExperiences[expIndex].projects || [];
    updatedExperiences[expIndex].projects.push({ title: "", description: "", technology: "" });
    setExperiences(updatedExperiences);
  };

  const handleRemoveProject = (expIndex, projIndex) => {
    const updatedExperiences = [...experiences];
    updatedExperiences[expIndex].projects.splice(projIndex, 1);
    setExperiences(updatedExperiences);
  };

  const handleExtraProjectChange = (index, event) => {
    const { name, value } = event.target;
    const updatedExtraProjects = [...extraProjects];
    updatedExtraProjects[index][name] = value;
    setExtraProjects(updatedExtraProjects);
  };

  const handleAddExtraProject = () => {
    setExtraProjects([
      ...extraProjects,
      { title: "", description: "", technology: "" }
    ]);
  };

  const handleRemoveExtraProject = (index) => {
    const updatedExtraProjects = [...extraProjects];
    updatedExtraProjects.splice(index, 1);
    setExtraProjects(updatedExtraProjects);
  };

  const handleSkillChange = (index, event) => {
    const { name, value } = event.target;
    const values = [...skills];
    values[index][event.target.name] = event.target.value;
    setSkills(values);
    clearFieldError(`${name}_${index}`);
  };

  const handleAddSkill = () => {
    setSkills((prevSkills) => {
      const updatedSkills = [...prevSkills, { skill: "" }];
      // Wait for the next render to focus the new field
      setTimeout(() => {
        const lastIndex = updatedSkills.length - 1;
        skillRefs.current[lastIndex]?.focus();
      }, 0);
      return updatedSkills;
    });
  };

  const handleRemoveSkill = (index) => {
    const values = [...skills];
    values.splice(index, 1);
    // debugger;
    setSkills(values);
  };

  const handleCertificateChange = (index, e) => {
    const { name, value } = e.target;
    const newCertificates = [...certificates];
    newCertificates[index][name] = value;
    setCertificates(newCertificates);
  };

  const handleAchievementChange = (index, e) => {
    const { name, value } = e.target;
    const newAchievements = [...achievements];
    newAchievements[index][name] = value;
    setAchievements(newAchievements);
  };

  const addCertificate = () => {
    setCertificates([
      ...certificates,
      { certificateName: '', issuingOrganization: '', certificateDate: '' },
    ]);
  };

  const addAchievement = () => {
    setAchievements([
      ...achievements,
      { awardName: '', issuingOrganization: '', awardDate: '' },
    ]);
  };

  const handleProfessionalSummaryChange = (event) => {
    setProfessionalSummary(event.target.value);
  };

  const handleProfileUploadChange = (event) => {
    const file = event.target.files[0];

    // No file selected
    if (!file) {
      setFileError("Please select a file.");
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    const maxSize = 2 * 1024 * 1024; // 2MB

    // Check type
    if (!validTypes.includes(file.type)) {
      setFileError("Invalid file type. Please upload a JPEG, JPG, or PNG.");
      return;
    }

    // Check size
    if (file.size > maxSize) {
      setFileError("File is too large. Maximum size allowed is 2MB.");
      return;
    }

    // All good - reset error, set file & preview
    setFileError("");
    setUploadedProfile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicUrl(reader.result);
    };
    reader.readAsDataURL(file);
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
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
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
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
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
                  error={!!formErrors.email}
                  helperText={formErrors.email}
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
                  error={!!formErrors.phone}
                  helperText={formErrors.phone}
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
                  error={!!formErrors.address}
                  helperText={formErrors.address}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="linkedinId"
                  variant="outlined"
                  required
                  fullWidth
                  label="LinkedIn ID"
                  value={profile.linkedinId}
                  onChange={handleProfileChange}
                  error={!!formErrors.linkedinId}
                  helperText={formErrors.linkedinId}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="github"
                  variant="outlined"
                  fullWidth
                  label="GitHub URL (optional)"
                  value={profile.github || ""}
                  onChange={handleProfileChange}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  name="website"
                  variant="outlined"
                  fullWidth
                  label="Personal Website (optional)"
                  value={profile.website || ""}
                  onChange={handleProfileChange}
                />
              </Grid>
            </Grid>
          </form>
        );

      case 1:
        return (
          <form>
            <Typography
              variant="body1"
              sx={{ fontWeight: "bold", marginBottom: "10px" }}
            >
              Highest Qualification
            </Typography>
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
                      onChange={(e) => handleEducationChange(index, e)}
                      error={!!formErrors[`institution_${index}`]}
                      helperText={formErrors[`institution_${index}`]}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      freeSolo
                      options={qualificationOptions}
                      value={education.degree}
                      onChange={(e, newValue) => {
                        handleEducationChange(index, {
                          target: { name: "degree", value: newValue || "" }
                        });
                      }}
                      onInputChange={(e, newInputValue) => {
                        handleEducationChange(index, {
                          target: { name: "degree", value: newInputValue }
                        });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          name="degree"
                          required
                          fullWidth
                          label="Degree"
                          error={!!formErrors[`degree_${index}`]}
                          helperText={formErrors[`degree_${index}`]}
                        />
                      )}
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
                      onChange={(e) => handleEducationChange(index, e)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        inputMode: "none",
                        style: { textAlign: "left", color: "inherit" },
                      }}
                      error={!!formErrors[`startDate_${index}`]}
                      helperText={formErrors[`startDate_${index}`]}
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
                      onChange={(e) => handleEducationChange(index, e)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        inputMode: "none",
                        style: { textAlign: "left", color: "inherit" },
                      }}
                      error={!!formErrors[`endDate_${index}`]}
                      helperText={formErrors[`endDate_${index}`]}
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
                      onChange={(e) => handleEducationChange(index, e)}
                      error={!!formErrors[`fieldofstudy_${index}`]}
                      helperText={formErrors[`fieldofstudy_${index}`]}
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
            {/* Experience Section */}
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Experience
            </Typography>
            {experiences.length === 0 && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                No experience added yet.
              </Typography>
            )}

            {experiences.map((experience, index) => (
              <Box key={index} mb={3} p={2} sx={{ border: "1px solid #ccc", borderRadius: "8px" }}>
                <Grid container spacing={2}>
                  {/* Experience Fields */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="company"
                      label="Company"
                      fullWidth
                      value={experience.company || ""}
                      onChange={(e) => handleExperienceChange(index, e)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="role"
                      label="Role"
                      fullWidth
                      value={experience.role || ""}
                      onChange={(e) => handleExperienceChange(index, e)}
                      error={!!formErrors[`role_${index}`]}
                      helperText={formErrors[`role_${index}`]}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="startDate"
                      label="Start Date"
                      type="date"
                      fullWidth
                      value={experience.startDate || ""}
                      onChange={(e) => handleExperienceChange(index, e)}
                      InputLabelProps={{ shrink: true }}
                      error={!!formErrors[`startDateExp_${index}`]}
                      helperText={formErrors[`startDateExp_${index}`]}
                    />

                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="endDate"
                      label="End Date"
                      type="date"
                      fullWidth
                      value={experience.endDate || ""}
                      onChange={(e) => handleExperienceChange(index, e)}
                      disabled={experience.currentlyWorking}
                      InputLabelProps={{ shrink: true }}
                      error={!!formErrors[`endDateExp_${index}`]}
                      helperText={formErrors[`endDateExp_${index}`]}
                    />
                    <Box mt={1}>
                      <label style={{ fontSize: "0.85rem" }}>
                        <input
                          type="checkbox"
                          checked={experience.currentlyWorking}
                          onChange={() => handleCurrentlyWorkingChange(index)}
                          disabled={
                            !experience.currentlyWorking &&
                            experiences.some((exp) => exp.currentlyWorking)
                          }
                        />
                        &nbsp;Currently Working
                      </label>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="state"
                      label="State"
                      fullWidth
                      value={experience.state || ""}
                      onChange={(e) => handleExperienceChange(index, e)}
                      error={!!formErrors[`state_${index}`]}
                      helperText={formErrors[`state_${index}`]}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="city"
                      label="City"
                      fullWidth
                      value={experience.city || ""}
                      onChange={(e) => handleExperienceChange(index, e)}
                      error={!!formErrors[`city_${index}`]}
                      helperText={formErrors[`city_${index}`]}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="workDesc"
                      label="Describe your Role"
                      fullWidth
                      multiline
                      rows={3}
                      value={experience.workDesc || ""}
                      onChange={(e) => {
                        const words = e.target.value.trim().split(/\s+/);
                        if (words.length <= 200) {
                          handleExperienceChange(index, e);
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = (e.clipboardData || window.clipboardData).getData("text");
                        const currentWords = (experience.workDesc || "").trim().split(/\s+/).filter(Boolean);
                        const pastedWords = pastedText.trim().split(/\s+/).filter(Boolean);
                        if (currentWords.length + pastedWords.length <= 200) {
                          handleExperienceChange(index, { target: { name: "workDesc", value: experience.workDesc + " " + pastedText } });
                        } else {
                          alert("🚫 You cannot exceed 200 words in Work Description!");
                        }
                      }}
                      helperText={`${(experience.workDesc?.trim().split(/\s+/).filter(Boolean).length) || 0}/200 words`}
                      error={(experience.workDesc?.trim().split(/\s+/).filter(Boolean).length || 0) > 200}
                    />
                  </Grid>

                  {/* 🔥 Now inside each experience: map the projects */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 2 }}>
                      Projects
                    </Typography>

                    {experience.projects && experience.projects.length > 0 ? (
                      experience.projects.map((project, projIndex) => (
                        <Box
                          key={projIndex}
                          mb={2}
                          p={2}
                          sx={{ border: "1px dashed #aaa", borderRadius: "8px" }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 2 }}>
                            Project {projIndex + 1} {/* 🔥 Showing Serial Number */}
                          </Typography>

                          <Grid container spacing={2}>
                            {/* Always show Project Title input */}
                            <Grid item xs={12} sm={6}>
                              <TextField
                                name="title"
                                label="Project Title"
                                fullWidth
                                value={project.title || ""}
                                onChange={(e) => handleProjectChange(index, projIndex, e)}
                              />
                            </Grid>

                            {/* Show Technology and Description only when Title is entered */}
                            {project.title.trim() !== "" && (
                              <>
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    name="technology"
                                    label="Technology Used"
                                    fullWidth
                                    value={project.technology || ""}
                                    onChange={(e) => handleProjectChange(index, projIndex, e)}
                                  />
                                </Grid>

                                <Grid item xs={12}>
                                  <TextField
                                    name="description"
                                    label="Project Description"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={project.description || ""}
                                    onChange={(e) => {
                                      const words = e.target.value.trim().split(/\s+/);
                                      if (words.length <= 200) {
                                        handleProjectChange(index, projIndex, e);
                                      }
                                    }}
                                    onPaste={(e) => {
                                      e.preventDefault();
                                      const pastedText = (e.clipboardData || window.clipboardData).getData("text");
                                      const currentWords = (project.description || "").trim().split(/\s+/).filter(Boolean);
                                      const pastedWords = pastedText.trim().split(/\s+/).filter(Boolean);
                                      if (currentWords.length + pastedWords.length <= 200) {
                                        handleProjectChange(index, projIndex, { target: { name: "description", value: project.description + " " + pastedText } });
                                      } else {
                                        alert("🚫 You cannot exceed 200 words in Project Description!");
                                      }
                                    }}
                                    helperText={`${(project.description?.trim().split(/\s+/).filter(Boolean).length) || 0}/200 words`}
                                    error={(project.description?.trim().split(/\s+/).filter(Boolean).length || 0) > 200}
                                  />
                                </Grid>
                              </>
                            )}

                            <Grid item xs={12}>
                              <Button
                                color="error"
                                variant="outlined"
                                size="small"
                                onClick={() => handleRemoveProject(index, projIndex)}
                              >
                                Delete Project
                              </Button>
                            </Grid>
                          </Grid>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        No projects added yet.
                      </Typography>
                    )}

                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleAddProject(index)}
                    >
                      + Add Project
                    </Button>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      color="error"
                      variant="outlined"
                      size="small"
                      onClick={() => handleRemoveExperience(index)}
                      sx={{ mt: 2 }}
                    >
                      Delete Experience
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleAddExperience}
              sx={{ mb: 4 }}
            >
              + Add Experience
            </Button>

            {/* Other Projects Section */}
            <Typography variant="h6" sx={{ fontWeight: "bold", mt: 4, mb: 2 }}>
              Other Projects (College / Personal / Freelance)
            </Typography>

            {extraProjects.length === 0 && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                No other projects added yet.
              </Typography>
            )}

            {extraProjects.map((project, index) => (
              <Box
                key={index}
                mb={3}
                p={2}
                sx={{ border: "1px dashed #aaa", borderRadius: "8px" }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 2 }}>
                  Project {index + 1}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="title"
                      label="Project Title"
                      fullWidth
                      value={project.title || ""}
                      onChange={(e) => handleExtraProjectChange(index, e)}
                    />
                  </Grid>

                  {project.title.trim() !== "" && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="technology"
                          label="Technology Used"
                          fullWidth
                          value={project.technology || ""}
                          onChange={(e) => handleExtraProjectChange(index, e)}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          name="description"
                          label="Project Description"
                          fullWidth
                          multiline
                          rows={3}
                          value={project.description || ""}
                          onChange={(e) => {
                            const words = e.target.value.trim().split(/\s+/);
                            if (words.length <= 200) {
                              handleExtraProjectChange(index, e);
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedText = (e.clipboardData || window.clipboardData).getData("text");
                            const currentWords = (project.description || "").trim().split(/\s+/).filter(Boolean);
                            const pastedWords = pastedText.trim().split(/\s+/).filter(Boolean);
                            if (currentWords.length + pastedWords.length <= 200) {
                              handleExtraProjectChange(index, { target: { name: "description", value: project.description + " " + pastedText } });
                            } else {
                              alert("🚫 You cannot exceed 200 words in Project Description!");
                            }
                          }}
                          helperText={`${(project.description?.trim().split(/\s+/).filter(Boolean).length) || 0}/200 words`}
                          error={(project.description?.trim().split(/\s+/).filter(Boolean).length || 0) > 200}
                        />

                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Button
                      color="error"
                      variant="outlined"
                      size="small"
                      onClick={() => handleRemoveExtraProject(index)}
                    >
                      Delete Project
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleAddExtraProject}
            >
              + Add Other Project
            </Button>

          </form>
        );

      case 3:
        return (
          <form>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Technical Skills
            </Typography>
            <Grid container spacing={2}>
              {skills.map((skill, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TextField
                      name="skill"
                      variant="outlined"
                      fullWidth
                      label="Skill"
                      value={skill.skill}
                      onChange={(e) => handleSkillChange(index, e)}
                      error={!!formErrors[`skill_${index}`]}
                      helperText={formErrors[`skill_${index}`]}
                      inputRef={(el) => (skillRefs.current[index] = el)} // ← Attach ref
                    />

                    {skills.length > 1 && (
                      <IconButton
                        onClick={() => handleRemoveSkill(index)}
                        color="secondary"
                      >
                        <RemoveCircleOutline />
                      </IconButton>
                    )}
                    {index === skills.length - 1 && (
                      <IconButton onClick={handleAddSkill} color="primary">
                        <AddCircleOutline />
                      </IconButton>
                    )}
                  </Box>
                </Grid>
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
                      onChange={(e) => handleCertificateChange(index, e)}
                      error={!!formErrors[`certificateName_${index}`]}
                      helperText={formErrors[`certificateName_${index}`]}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="issuingOrganization"
                      variant="outlined"
                      fullWidth
                      label="Issuing Organization"
                      value={certificate.issuingOrganization}
                      onChange={(e) => handleCertificateChange(index, e)}
                      error={!!formErrors[`issuingOrganizationCert_${index}`]}
                      helperText={formErrors[`issuingOrganizationCert_${index}`]}
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
                      onChange={(e) => handleCertificateChange(index, e)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        inputMode: "none",
                        style: { textAlign: "left", color: "inherit" },
                      }}
                      error={!!formErrors[`certificateDate_${index}`]}
                      helperText={formErrors[`certificateDate_${index}`]}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
            <Button variant="outlined" color="primary" onClick={addCertificate}>Add Certificate</Button>
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
                      onChange={(e) => handleAchievementChange(index, e)}
                      error={!!formErrors[`awardName_${index}`]}
                      helperText={formErrors[`awardName_${index}`]}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="issuingOrganization"
                      variant="outlined"
                      fullWidth
                      label="Issuing Organization"
                      value={achievement.issuingOrganization}
                      onChange={(e) => handleAchievementChange(index, e)}
                      error={!!formErrors[`issuingOrganizationAch_${index}`]}
                      helperText={formErrors[`issuingOrganizationAch_${index}`]}
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
                      onChange={(e) => handleAchievementChange(index, e)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        inputMode: "none",
                        style: { textAlign: "left", color: "inherit" },
                      }}
                      error={!!formErrors[`awardDate_${index}`]}
                      helperText={formErrors[`awardDate_${index}`]}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
            <Button variant="outlined" color="primary" onClick={addAchievement}>Add Achievement</Button>
          </form>
        );
      case 6:
        return (
          <form>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="professionalSummary"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={4}
                  label="Professional Summary"
                  value={professionalSummary}
                  onChange={(e) => {
                    const words = e.target.value.trim().split(/\s+/);
                    if (words.length <= 200) {
                      handleProfessionalSummaryChange(e);
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = (e.clipboardData || window.clipboardData).getData("text");
                    const currentWords = (professionalSummary || "").trim().split(/\s+/).filter(Boolean);
                    const pastedWords = pastedText.trim().split(/\s+/).filter(Boolean);
                    if (currentWords.length + pastedWords.length <= 200) {
                      handleProfessionalSummaryChange({
                        target: { name: "professionalSummary", value: professionalSummary + " " + pastedText }
                      });
                    } else {
                      alert("🚫 You cannot exceed 200 words in Professional Summary!");
                    }
                  }}
                  helperText={`${(professionalSummary?.trim().split(/\s+/).filter(Boolean).length) || 0}/200 words`}
                  error={(professionalSummary?.trim().split(/\s+/).filter(Boolean).length || 0) > 200}
                />
              </Grid>
            </Grid>
          </form>
        );

      case 7:
        return (
          <Card sx={{ maxWidth: "600px", boxShadow: 6 }}>
            <CardContent sx={{ marginLeft: "50px" }}>
              <form>
                <div className="file-input-wrapper">
                  <input
                    accept="image/jpeg, image/jpg, image/png"
                    type="file"
                    onChange={handleProfileUploadChange}
                    required
                  />
                </div>
                <small
                  style={{ display: "block", marginTop: "8px", color: "green" }}
                >
                  Accepted file types: JPEG, JPG, PNG, <br />
                  Maximum file size: 2MB
                </small>

                {profile && profile.profilePictureUrl && (
                  <p>{profile.profilePictureUrl}</p>
                )}

                {fileError && (
                  <small
                    style={{ color: "red", display: "block", marginTop: "5px" }}
                  >
                    {fileError}
                  </small>
                )}
              </form>
            </CardContent>
          </Card>
        );
    }
  };
  // debugger
  return (
    <Container sx={{ mt: 12 }}>
      <Paper elevation={3} style={{ padding: "2em" }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={index}>
              <StepLabel StepIconComponent={GreenStepIcon}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <div>
          {activeStep === steps.length ? (
            <div>
              {/* <Typography>All steps completed</Typography> */}
              {/* <Button onClick={handleReset}>Reset</Button> */}
              <Button onClick={handleBack}>Back</Button>
              {/* <Button
             
                variant="contained"
                color="primary"
                onClick={handleCreateResume}
              >
                Create Resume
              </Button> */}
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
                {/* <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSkip}
                >
                  Skip
                </Button> */}
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

      {displayResume && (
        <ResumePreview
          profile={profile}
          educations={educations}
          skills={skills}
          experiences={filterEmptyFirstFieldObjects(experiences)}
          projects={filterEmptyFirstFieldObjects(projects)}
          certificates={certificates}
          achievements={achievements}
          professionalSummary={professionalSummary}
          profilePicUrl={profilePicUrl}
          extraProjects={extraProjects}
        />
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
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
        }}
      >
        <DialogTitle sx={{ color: titleColor }}>{dialogTitle}</DialogTitle>
        <DialogContent sx={{ color: "#0096FF" }}>{dialogMessage}</DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Go Back
          </Button>
          <Button
            onClick={() => {
              setOpenDialog(false);
              proceedToCreateResume();
            }}
            color="primary"
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
export default ResumeBuilder;
