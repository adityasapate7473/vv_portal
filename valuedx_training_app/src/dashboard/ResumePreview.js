import React from "react";
import {
    Grid,
    Box,
    Typography,
    Paper,
    Divider
} from "@mui/material";
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationOnIcon,
    School as SchoolIcon,
    Work as WorkIcon,
    Summarize as SummarizeIcon,
    EmojiEvents as EmojiEventsIcon,
    CardMembership as CardMembershipIcon,
    Construction as ConstructionIcon
} from "@mui/icons-material";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import LanguageIcon from "@mui/icons-material/Language";
import BrainIcon from "@mui/icons-material/Psychology";
import { format, parseISO } from "date-fns";
import VVLogo from "../images/vishvavidya_hd_new.png";

const styles = {
    paper: {
        padding: "2em",
        background: "#ffffff",
        borderRadius: "12px",
        border: "2px solid #C5C3E6",
        boxShadow: "0 0 20px rgba(0,0,0,0.05)"
    },
    leftColumn: {
        backgroundColor: "#f8f8f8",
        padding: "1.5em",
        borderRadius: "12px"
    },
    rightColumn: {
        padding: "2em 1.5em 1.5em 1.5em"
    },
    profileImage: {
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        objectFit: "cover",
        border: "3px solid #6E66E5",
        marginBottom: "1.5em"
    },
    lilBold: {
        fontWeight: "600",
        color: "#666"
    },
    logo: {
        width: "120px",
        marginBottom: "1em",
        display: "block",
        marginLeft: "auto"
    },
    sectionTitle: {
        color: "#6E66E5",
        fontWeight: "bold",
        marginBottom: "0.8em",
        textTransform: "uppercase"
    },
    card: {
        background: "#f2f2f2",
        padding: "1em",
        borderRadius: "8px",
        marginBottom: "1em"
    },
    contactInfo: {
        fontSize: "0.85rem",
        color: "#444"
    }
};

const ResumePreview = ({
    profile,
    educations,
    skills,
    experiences,
    certificates,
    achievements,
    professionalSummary,
    profilePicUrl,
    extraProjects,   // 🔥 EXTRA PROJECTS
}) => {
    return (
        <div style={{ position: "relative", width: "100%" }}>
            <Paper elevation={4} style={styles.paper} id="resume">
                <Grid container spacing={2} sx={{ flexWrap: "nowrap" }}>

                    {/* Left Column */}
                    <Grid item xs={12} md={4} style={styles.leftColumn}>
                        {/* Profile Picture */}
                        {profilePicUrl && (
                            <Box display="flex" justifyContent="center">
                                <img
                                    src={profilePicUrl}
                                    alt="Profile"
                                    style={{
                                        width: "140px",
                                        height: "160px",
                                        borderRadius: "10%",
                                        objectFit: "cover",
                                        border: "3px solid #6E66E5",
                                        marginBottom: "1.5em"
                                    }}
                                />
                            </Box>

                        )}

                        {/* Contact Info */}
                        <Box mb={4}>
                            {[{ icon: EmailIcon, text: profile.email },
                            { icon: PhoneIcon, text: profile.phone },
                            { icon: LocationOnIcon, text: profile.address }
                            ].map((item, idx) => (
                                <Box key={idx} display="flex" alignItems="center" gap="8px" mb={1.2}>
                                    <item.icon fontSize="small" />
                                    <Typography style={styles.contactInfo}>{item.text}</Typography>
                                </Box>
                            ))}

                            {profile.linkedinId && (
                                <a href={profile.linkedinId.startsWith("http") ? profile.linkedinId : `https://${profile.linkedinId}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "black" }}>
                                    <Box display="flex" alignItems="center" gap="8px" mb={1.2}>
                                        <LinkedInIcon fontSize="small" />
                                        <Typography style={styles.contactInfo}>
                                            {profile.linkedinId.split("/in/")[1]?.replace("/", "")}
                                        </Typography>
                                    </Box>
                                </a>
                            )}
                            {profile.github && (
                                <a href={profile.github.startsWith("http") ? profile.github : `https://${profile.github}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "black" }}>
                                    <Box display="flex" alignItems="center" gap="8px" mb={1.2}>
                                        <GitHubIcon fontSize="small" />
                                        <Typography style={styles.contactInfo}>
                                            {profile.github.replace("https://", "").split("/")[1]}
                                        </Typography>
                                    </Box>
                                </a>
                            )}
                            {profile.website && (
                                <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "black" }}>
                                    <Box display="flex" alignItems="center" gap="8px" mb={1.2}>
                                        <LanguageIcon fontSize="small" />
                                        <Typography style={styles.contactInfo}>
                                            {profile.website.replace("https://", "").split("/")[0]}
                                        </Typography>
                                    </Box>
                                </a>
                            )}
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* Education */}
                        <Typography variant="h6" style={styles.sectionTitle}>
                            <SchoolIcon /> &nbsp; Education
                        </Typography>
                        {educations.map((edu, idx) => (
                            <Box key={idx} style={styles.card}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {edu.degree} ({edu.fieldofstudy})
                                </Typography>
                                <Typography variant="body2">{edu.institution}</Typography>
                                {edu.endDate && (
                                    <Typography variant="caption">
                                        {new Date(edu.endDate).getFullYear()}
                                    </Typography>
                                )}
                            </Box>
                        ))}

                        {/* Skills */}
                        <Typography variant="h6" style={{ ...styles.sectionTitle, marginTop: "20px" }}>
                            <BrainIcon /> &nbsp; Technical Skills
                        </Typography>
                        {skills.map((skill, idx) => (
                            <Typography key={idx} variant="body2" style={{ marginBottom: "4px" }}>
                                {skill.skill}
                            </Typography>
                        ))}
                    </Grid>

                    {/* Right Column */}
                    <Grid item xs={12} md={8} style={styles.rightColumn}>
                        <img src={VVLogo} alt="Logo" style={styles.logo} />

                        <Typography variant="h4" sx={{ textTransform: "uppercase", fontWeight: "bold", color: "#333", letterSpacing: "1px", mb: 1 }}>
                            {profile.firstName} {profile.lastName}
                        </Typography>

                        {experiences.length > 0 && (
                            <Typography variant="subtitle1" sx={{ color: "#6E66E5", mb: 2 }}>
                                {experiences[0].role}
                            </Typography>
                        )}

                        <Divider sx={{ mb: 2 }} />

                        {/* Professional Summary */}
                        <Typography variant="h6" style={styles.sectionTitle}>
                            <SummarizeIcon /> &nbsp; Professional Summary
                        </Typography>
                        <Typography sx={{ mb: 2 }}>{professionalSummary}</Typography>

                        {/* Experience */}
                        {experiences.length > 0 && (
                            <>
                                <Typography variant="h6" style={styles.sectionTitle}>
                                    <WorkIcon /> &nbsp; Experience
                                </Typography>

                                {experiences.map((exp, idx) => (
                                    <Box key={idx} style={styles.card}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#6E66E5" }}>
                                            {exp.company}, {exp.city}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "#666", fontSize: "0.8rem", fontStyle: "italic" }}>
                                            {exp.role}
                                        </Typography>
                                        <Typography variant="caption" display="block" sx={{ color: "#777" }}>
                                            {exp.startDate && (
                                                <>
                                                    {format(parseISO(exp.startDate), "MMM,yy")} -{" "}
                                                    {exp.currentlyWorking ? "Present" : exp.endDate ? format(parseISO(exp.endDate), "MMM,yy") : ""}
                                                </>
                                            )}
                                        </Typography>
                                        {exp.workDesc && (
                                            <Typography variant="body2" sx={{ mt: 1, color: "#555" }}>
                                                <b>Summary:</b> {exp.workDesc}
                                            </Typography>
                                        )}

                                        {/* Projects inside Experience */}
                                        {exp.projects?.length > 0 && (
                                            <>
                                                <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: "bold", color: "#6E66E5" }}>
                                                    Projects at {exp.company}
                                                </Typography>
                                                {exp.projects.map((proj, projIdx) => (
                                                    <Box key={projIdx} sx={{ mb: 1, pl: 2 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {proj.title}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                                                            {proj.description}
                                                        </Typography>
                                                        <Typography variant="caption">
                                                            <b>Tech:</b> {proj.technology}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </>
                                        )}
                                    </Box>
                                ))}
                            </>
                        )}

                        {/* Extra Projects */}
                        {/* Extra Projects */}
                        {extraProjects?.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <Typography variant="h6" style={styles.sectionTitle}>
                                    <ConstructionIcon /> &nbsp; Other Projects
                                </Typography>
                                {extraProjects.map((proj, idx) => (
                                    <Box key={idx} style={{ ...styles.card, marginBottom: '16px' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            {proj.title}
                                        </Typography>
                                        <Typography variant="body2">{proj.description}</Typography>
                                        <Typography variant="caption">
                                            <b>Tech:</b> {proj.technology}
                                        </Typography>
                                    </Box>
                                ))}
                            </div>
                        )}

                        {/* Certificates */}
                        {certificates?.some((c) => c.certificateName) && (
                            <>
                                <Typography variant="h6" style={styles.sectionTitle}>
                                    <CardMembershipIcon /> &nbsp; Certificates
                                </Typography>
                                {certificates.map((cert, idx) => cert.certificateName && (
                                    <Typography key={idx} variant="body2" style={{ marginBottom: "4px" }}>
                                        <span style={styles.lilBold}>{cert.certificateName}</span>, {cert.issuingOrganization}, {cert.certificateDate && format(parseISO(cert.certificateDate), "dd MMM yyyy")}
                                    </Typography>
                                ))}
                            </>
                        )}

                        {/* Achievements */}
                        {achievements?.some((a) => a.awardName) && (
                            <>
                                <Typography variant="h6" style={styles.sectionTitle}>
                                    <EmojiEventsIcon /> &nbsp; Achievements
                                </Typography>
                                {achievements.map((ach, idx) => ach.awardName && (
                                    <Typography key={idx} variant="body2" style={{ marginBottom: "4px" }}>
                                        <span style={styles.lilBold}>{ach.awardName}</span>, {ach.issuingOrganization}, {ach.awardDate && format(parseISO(ach.awardDate), "dd MMM yyyy")}
                                    </Typography>
                                ))}
                            </>
                        )}
                    </Grid>
                </Grid>
            </Paper>
        </div>
    );
};

export default ResumePreview;
