import React, { useState } from "react";
import Navbar from "../navbar/navbar";
import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Typography,
  Box,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  Checkbox,
  FormControlLabel,
  InputLabel,
  Select,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
const OnboardingForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [salutation, setSalutation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fullName, setFullName] = useState("");
  const [fathersName, setFathersName] = useState("");
  const [mothersName, setMothersName] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [dob, setDob] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [candidatePhoto, setCandidatePhoto] = useState(null);
  const [countryCode, setCountryCode] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [alternateMobileNumber, setAlternateMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [passbookUpload, setPassbookUpload] = useState(null);
  const [nonIciciBankName, setNonIciciBankName] = useState("");
  const [nonIciciAccountNumber, setNonIciciAccountNumber] = useState("");
  const [nonIciciIfscCode, setNonIciciIfscCode] = useState("");
  const [educationDetails, setEducationDetails] = useState([
    {
      degree: "",
      specialization: "",
      cgpa: "",
      isCurrentlyStudent: false,
      startDate: "",
      completionDate: "",
      institute: "",
      otherInstitute: "",
      university: "",
      otherUniversity: "",
      documentProof: null,
      instituteAddress: "",
    },
  ]);
  const handleAddEducation = () => {
    setEducationDetails([
      ...educationDetails,
      {
        educationDegree: "",
        fieldOfSpecialization: "",
        cgpaPercentage: "",
        isCurrentlyStudent: false,
        startDate: "",
        completionDate: "",
        institute: "",
        otherInstitutes: "",
        university: "",
        otherUniversities: "",
        instituteAddress: "",
        educationDocument: null,
      },
    ]);
  };

  const handleRemoveEducation = (index) => {
    setEducationDetails((prevDetails) =>
      prevDetails.filter((_, i) => i !== index)
    );
  };
  const instituteOptions = [
    "Sinhgad College",
    "JSPM College",
    "PICT College",
    "Other",
  ];
  const universityOptions = [
    "Pune University",
    "Mumbai University",
    "Shivaji University",
    "Other",
  ];
  const countryCodes = [
    { code: "+1", country: "United States" },
    { code: "+91", country: "India" },
    { code: "+44", country: "United Kingdom" },
  ];

  const handlePhotoUpload = (e) => {
    setCandidatePhoto(e.target.files[0]);
  };
  const handlePassbookUpload = (e) => {
    setPassbookUpload(e.target.files[0]);
  };
  const handleDocumentUpload = (index, event) => {
    const updatedEducationDetails = [...educationDetails];
    updatedEducationDetails[index].educationDocument = event.target.files[0];
    setEducationDetails(updatedEducationDetails);
  };
  // Handle changes in education fields
  const handleEducationChange = (index, event) => {
    const { name, value, type, checked } = event.target;
    const updatedEducationDetails = [...educationDetails];
    updatedEducationDetails[index] = {
      ...updatedEducationDetails[index],
      [name]: type === "checkbox" ? checked : value,
    };
    setEducationDetails(updatedEducationDetails);
  };  
  //Submit Onboarding Details
  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("salutation", salutation);
      formData.append("firstName", firstName);
      formData.append("middleName", middleName);
      formData.append("lastName", lastName);
      formData.append("fullName", fullName);
      formData.append("fathersName", fathersName);
      formData.append("mothersName", mothersName);
      formData.append("gender", gender);
      formData.append("bloodGroup", bloodGroup);
      formData.append("dob", dob);
      formData.append("maritalStatus", maritalStatus);
      formData.append("candidatePhoto", candidatePhoto);
      formData.append("countryCode", countryCode);
      formData.append("mobileNumber", mobileNumber);
      formData.append("alternateMobileNumber", alternateMobileNumber);
      formData.append("email", email);
      formData.append("bankName", bankName);
      formData.append("accountNumber", accountNumber);
      formData.append("ifscCode", ifscCode);
      formData.append("passbookUpload", passbookUpload);
      formData.append("nonIciciBankName", nonIciciBankName);
      formData.append("nonIciciAccountNumber", nonIciciAccountNumber);
      formData.append("nonIciciIfscCode", nonIciciIfscCode);

      educationDetails.forEach((education, index) => {
        formData.append(`educationDetails[${index}][degree]`, education.educationDegree);
        formData.append(`educationDetails[${index}][specialization]`, education.fieldOfSpecialization);
        formData.append(`educationDetails[${index}][cgpa]`, education.cgpaPercentage);
        formData.append(`educationDetails[${index}][isCurrentlyStudent]`, education.isCurrentlyStudent);
        formData.append(`educationDetails[${index}][startDate]`, education.startDate);
        formData.append(`educationDetails[${index}][completionDate]`, education.completionDate);
        formData.append(`educationDetails[${index}][institute]`, education.institute);
        formData.append(`educationDetails[${index}][otherInstitute]`, education.otherInstitutes);
        formData.append(`educationDetails[${index}][university]`, education.university);
        formData.append(`educationDetails[${index}][otherUniversity]`, education.otherUniversities);
        formData.append(`educationDetails[${index}][documentProof]`, education.documentProof);
        formData.append(`educationDetails[${index}][instituteAddress]`, education.instituteAddress);
      });

      const response = await fetch("http://localhost:3001/api/onboarding", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert("Onboarding details submitted successfully!");
        console.log(result);
      } else {
        const error = await response.text();
        alert("Submission failed: " + error);
      }
    } catch (error) {
      alert("An error occurred: " + error.message);
    }
  };
  const steps = [
    {
      label: "Personal Information",
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="salutation-label">Salutation</InputLabel>
              <Select
                labelId="salutation-label"
                id="salutation"
                value={salutation}
                label="Salutation"
                onChange={(e) => setSalutation(e.target.value)}
              >
                <MenuItem value="Mr.">Mr.</MenuItem>
                <MenuItem value="Miss">Miss</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Employee First Name (As per Aadhar Card)"
              fullWidth
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Employee Middle Name (As per Aadhar Card)"
              fullWidth
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Employee Last Name (As per Aadhar Card)"
              fullWidth
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Full Name (As per Aadhar Card)"
              fullWidth
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Father's Name"
              fullWidth
              value={fathersName}
              onChange={(e) => setFathersName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Mother's Name"
              fullWidth
              value={mothersName}
              onChange={(e) => setMothersName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="gender-label">Gender</InputLabel>
              <Select
                labelId="gender-label"
                id="gender"
                value={gender}
                label="Gender"
                onChange={(e) => setGender(e.target.value)}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="blood-group-label">Blood Group</InputLabel>
              <Select
                labelId="blood-group-label"
                id="bloodGroup"
                value={bloodGroup}
                label="Blood Group"
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <MenuItem value="A+">A+</MenuItem>
                <MenuItem value="A-">A-</MenuItem>
                <MenuItem value="B+">B+</MenuItem>
                <MenuItem value="B-">B-</MenuItem>
                <MenuItem value="AB+">AB+</MenuItem>
                <MenuItem value="AB-">AB-</MenuItem>
                <MenuItem value="O+">O+</MenuItem>
                <MenuItem value="O-">O-</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Date of Birth"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="marital-status-label">Marital Status</InputLabel>
              <Select
                labelId="marital-status-label"
                id="maritalStatus"
                value={maritalStatus}
                label="Marital Status"
                onChange={(e) => setMaritalStatus(e.target.value)}
              >
                <MenuItem value="Single">Single</MenuItem>
                <MenuItem value="Married">Married</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button variant="contained" component="label" size="small">
              Upload Candidate Photo
              <input type="file" hidden onChange={handlePhotoUpload} />
            </Button>
            {candidatePhoto && (
              <Typography variant="body2" mt={1}>
                Photo: {candidatePhoto.name}
              </Typography>
            )}
          </Grid>
        </Grid>
      ),
    },
    {
      label: "Contact Details",
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel id="country-code-label">Country Code</InputLabel>
              <Select
                labelId="country-code-label"
                id="countryCode"
                value={countryCode}
                label="Country Code"
                onChange={(e) => setCountryCode(e.target.value)}
              >
                {countryCodes.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.code} ({option.country})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={9}>
            <TextField
              required
              fullWidth
              id="mobileNumber"
              label="Mobile Number"
              name="mobileNumber"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="alternateMobileNumber"
              label="Alternate Mobile Number"
              name="alternateMobileNumber"
              value={alternateMobileNumber}
              onChange={(e) => setAlternateMobileNumber(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Grid>
        </Grid>
      ),
    },
    {
      label: "bank Account Details",
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Bank Name"
              fullWidth
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Account Number"
              fullWidth
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="IFSC Code"
              fullWidth
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
            />
          </Grid>
        </Grid>
      ),
    },
    {
      label: "Bank Account Verification",
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button variant="contained" component="label">
              Upload Passbook
              <input type="file" hidden onChange={handlePassbookUpload} />
            </Button>
            {passbookUpload && <p>{passbookUpload.name}</p>}
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Non ICICI Bank Name"
              fullWidth
              value={nonIciciBankName}
              onChange={(e) => setNonIciciBankName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Non ICICI Bank Account Number"
              fullWidth
              value={nonIciciAccountNumber}
              onChange={(e) => setNonIciciAccountNumber(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Non ICICI Bank IFSC Code"
              fullWidth
              value={nonIciciIfscCode}
              onChange={(e) => setNonIciciIfscCode(e.target.value)}
            />
          </Grid>
        </Grid>
      ),
    },
    {
      label: "Education Details",
      content: (
        <>
          {educationDetails.map((education, index) => (
            <>
              <Box key={index} mb={2}>
                <Typography variant="h6">Education {index + 1}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Degree"
                      name="educationDegree"
                      fullWidth
                      value={education.educationDegree}
                      onChange={(e) => handleEducationChange(index, e)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Field of Specialization"
                      name="fieldOfSpecialization"
                      fullWidth
                      value={education.fieldOfSpecialization}
                      onChange={(e) => handleEducationChange(index, e)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="CGPA/Percentage"
                      name="cgpaPercentage"
                      fullWidth
                      value={education.cgpaPercentage}
                      onChange={(e) => handleEducationChange(index, e)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={education.isCurrentlyStudent}
                          onChange={(e) => handleEducationChange(index, e)}
                          name="isCurrentlyStudent"
                        />
                      }
                      label="Currently a Student"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Start Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      name="startDate"
                      fullWidth
                      value={education.startDate}
                      onChange={(e) => handleEducationChange(index, e)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Completion Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      name="completionDate"
                      fullWidth
                      value={education.completionDate}
                      onChange={(e) => handleEducationChange(index, e)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Institute"
                      name="institute"
                      fullWidth
                      value={education.institute}
                      onChange={(e) => handleEducationChange(index, e)}
                      select
                    >
                      {instituteOptions.map((option, idx) => (
                        <MenuItem key={idx} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                    {education.institute === "Other" && (
                      <TextField
                        sx={{marginTop:'15px'}}
                        label="Other Institute"
                        name="instituteOther"
                        fullWidth
                        value={education.otherInstitutes}
                        onChange={(e) => handleEducationChange(index, e)}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="University"
                      name="university"
                      fullWidth
                      value={education.university}
                      onChange={(e) => handleEducationChange(index, e)}
                      select
                    >
                      {universityOptions.map((option, idx) => (
                        <MenuItem key={idx} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                    {education.university === "Other" && (
                      <TextField
                        sx={{marginTop:'15px'}}
                        label="Other University"
                        name="universityOther"
                        fullWidth
                        value={education.otherUniversities}
                        onChange={(e) => handleEducationChange(index, e)}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Institute Address"
                      name="instituteAddress"
                      fullWidth
                      value={education.instituteAddress}
                      onChange={(e) => handleEducationChange(index, e)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button variant="contained" component="label" size="small">
                      Upload Document Proof
                      <input
                        type="file"
                        hidden
                        onChange={(e) => handleDocumentUpload(index, e)}
                      />
                    </Button>
                    {education.educationDocument && (
                      <Typography variant="body2" mt={1}>
                        Document: {education.educationDocument.name}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Box>
              <Box display="flex" justifyContent="flex-end">
                <IconButton
                  onClick={() => handleRemoveEducation(index)}
                  color="secondary"
                >
                  <DeleteIcon />
                </IconButton>
                <IconButton onClick={handleAddEducation} color="primary">
                  <AddIcon />
                </IconButton>
              </Box>
            </>
          ))}
        </>
      ),
    },
  ];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <>
      <Navbar />
      <br />
      <br />
      <Box sx={{ width: "80%", margin: "0 auto", mt: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }} gutterBottom>
          Onboarding Process
        </Typography>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                {step.content}
                <Box sx={{ mb: 2 }}>
                  <div>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleNext}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      {index === steps.length - 1 ? "Finish" : "Continue"}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                  </div>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Box>
    </>
  );
};
export default OnboardingForm;
