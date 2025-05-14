import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Avatar from '@mui/material/Avatar';
import ValueDxLogo from '../images/vishvavidya_logo.png';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import Badge from '@mui/material/Badge';
import config from "../config";
import { Box, Divider, Stack, Zoom } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function Navbar({ showLogoutButton }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const isNotificationOpen = Boolean(notificationAnchorEl);
  const [absentNotifications, setAbsentNotifications] = useState([]);
  const [isBlinking, setIsBlinking] = useState(false);
  const [notificationsViewed, setNotificationsViewed] = useState(false);
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const role = getCookie('role');
    const studentId = getCookie('userid');

    const fetchNotifications = async () => {
      try {
        let data = [];
        if (role === 'admin' || role === 'trainer') {
          const res = await fetch(`${config.API_BASE_URL}/api/absentees`);
          data = await res.json();
        } else if (role === 'intern' && studentId) {
          const res = await fetch(`${config.API_BASE_URL}/api/student-notifications/${studentId}`);
          data = await res.json();
          data = Array.isArray(data)
            ? data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            : [];
        }

        const lastSeen = localStorage.getItem('lastNotificationSeen');
        const newNotifications = Array.isArray(data)
          ? data.filter((n) => !lastSeen || new Date(n.created_at) > new Date(lastSeen))
          : [];

        setAbsentNotifications(data);
        setIsBlinking(newNotifications.length > 0);
        setIsBlinking(newNotifications.length > 0);
        setNewNotificationCount(newNotifications.length);
      } catch (error) {
        console.error("Error fetching notifications", error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const groupedNotifications = absentNotifications.reduce((acc, notification) => {
    const date = formatDate(notification.created_at);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(notification);
    return acc;
  }, {});

  const handleNotificationClick = async (event) => {
    setNotificationAnchorEl(event.currentTarget);
    setIsBlinking(false);
    setNotificationsViewed(true);

    const now = new Date().toISOString();
    localStorage.setItem('lastNotificationSeen', now);

    const role = getCookie('role');
    if (role === 'admin' || role === 'trainer') {
      await fetch(`${config.API_BASE_URL}/api/absentee-notifications/mark-seen`, {
        method: 'PUT',
      });
    }
  };



  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
    setIsBlinking(false);
  };

  const handleLogout = () => {
    // Clear all cookies
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.split("=");
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
    });

    // Remove localStorage item
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem("email_password");

    // Redirect to home page
    navigate("/");
  };


  // Fetch user info from cookies
  const name = getCookie('name');
  const username = getCookie('username'); // Assuming email is stored in cookies
  const role = getCookie('role');

  // Function to get cookie value
  function getCookie(name) {
    const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return cookieValue ? decodeURIComponent(cookieValue.pop()) : '';
  }

  // Open popover
  const handleUserIconClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Close popover
  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'user-popover' : undefined;

  useEffect(() => {
    const userId = getCookie("userid");
    const role = getCookie("role");

    const checkProfileCompletion = async () => {
      try {
        const res = await fetch(`${config.API_BASE_URL}/api/check-profile-completion`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userid: userId, role })
        });

        const data = await res.json();

        if (!data.complete) {
          setProfileIncomplete(true);
          setSnackbarOpen(true);
        }
      } catch (err) {
        console.error("Error checking profile completeness", err);
      }
    };

    checkProfileCompletion();

    const intervalId = setInterval(checkProfileCompletion, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(intervalId);
  }, []);



  return (
    <AppBar position="fixed" style={{ backgroundColor: "#cfd8dc" }}>
      <style>
        {`
          @keyframes blinkAnimation {
            0% { opacity: 1; }
            50% { opacity: 0.2; }
            100% { opacity: 1; }
          }
          .blinking-icon {
            animation: blinkAnimation 1s infinite;
          }
        `}
      </style>
      <Toolbar>
        <div style={{ flexGrow: 1 }}>
          <img src={ValueDxLogo} alt="valuedx_logo" style={{ height: 40, width: 150 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Notification Icon */}
          <IconButton
            onClick={handleNotificationClick}
            sx={{
              mr: '8px',
              backgroundColor: '#e3f2fd',
              borderRadius: '10px',
              padding: '8px',
              '&:hover': {
                backgroundColor: '#bbdefb',
              },
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Badge badgeContent={!notificationsViewed && isBlinking ? newNotificationCount : 0} color="error" overlap="circular">

              <NotificationsNoneIcon
                className={isBlinking ? "blinking-icon" : ""}
                sx={{ fontSize: 28, color: '#1565c0' }}
              />

            </Badge>
          </IconButton>

          {/* Notification Popover */}
          <Popover
            open={isNotificationOpen}
            anchorEl={notificationAnchorEl}
            onClose={handleNotificationClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              style: {
                width: 460,
                maxHeight: 420,
                padding: '16px',
                borderRadius: '16px',
                boxShadow: '0 6px 30px rgba(0,0,0,0.12)',
                overflowY: 'auto',
                backgroundColor: '#fcfcfc',
              },
            }}
          >
            {Object.entries(groupedNotifications).length === 0 ? (
              <Typography variant="body2" sx={{ color: "#888", textAlign: 'center', py: 4 }}>
                No new notifications
              </Typography>
            ) : (
              Object.entries(groupedNotifications).map(([date, items], dateIndex) => (
                <Box key={dateIndex} sx={{ mb: 3 }}>
                  {/* Date Header */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: '#1565c0',
                      background: 'linear-gradient(to right, #e3f2fd, #f0f4f8)',
                      px: 2,
                      py: 0.5,
                      borderRadius: '10px',
                      display: 'inline-block',
                      fontSize: '13px',
                      mb: 2,
                    }}
                  >
                    {date}
                  </Typography>

                  {/* Notification Cards */}
                  {items.map((notification, index) => {
                    const role = getCookie("role");
                    const borderColor = role === 'intern' ? '#4caf50' : '#f44336';

                    return (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          borderLeft: `4px solid ${borderColor}`,
                          backgroundColor: '#fff',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          mb: 1,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, color: '#333', mb: 0.5 }}
                        >
                          {role === 'intern'
                            ? notification.title || "Notification"
                            : notification.student_name}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{ color: '#555', mb: 1, lineHeight: 1.5 }}
                        >
                          {role === 'intern'
                            ? notification.message
                            : `Absent for the last 3 days from batch: ${notification.batch_name}`}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#999' }}>
                          <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          <Typography variant="caption">
                            {new Date(notification.created_at).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}

                  {dateIndex < Object.entries(groupedNotifications).length - 1 && (
                    <Divider sx={{ mt: 2, mb: 2 }} />
                  )}
                </Box>
              ))
            )}
          </Popover>


        </div>

        {showLogoutButton && (
          <div>
            <IconButton
              aria-describedby={id}
              onClick={handleUserIconClick}
              edge="end"
              sx={{
                backgroundColor: '#ede7f6',
                px: 1.5,
                py: 0.75,
                borderRadius: '12px',
                boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: '#d1c4e9',
                },
              }}
            >
              {/* Avatar */}
              <Avatar
                sx={{
                  bgcolor: '#5A4FCF',
                  width: 36,
                  height: 36,
                  fontSize: 16,
                  fontWeight: 'bold',
                }}
              >
                {name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>

              {/* Role */}
              <Typography
                variant="subtitle2"
                fontWeight={600}
                color="#333"
                sx={{ whiteSpace: 'nowrap' }}
              >
                {role === 'trainer'
                  ? 'Instructor'
                  : role?.charAt(0).toUpperCase() + role?.slice(1).toLowerCase()}
              </Typography>

              {/* New Icon */}
              <ExpandMoreIcon
                sx={{
                  fontSize: 22,
                  color: '#5A4FCF',
                  transition: 'transform 0.3s ease',
                  transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </IconButton>

            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={handleClosePopover}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  p: 2.5,
                  borderRadius: 3,
                  boxShadow: 6,
                  minWidth: 320,
                  background: 'linear-gradient(to bottom right, #f4f6f8, #ffffff)',
                },
              }}
              TransitionComponent={Zoom}
            >
              <Stack spacing={1} alignItems="center" textAlign="center">
                {/* Avatar with gradient ring */}
                <Box
                  sx={{
                    borderRadius: '50%',
                    p: 0.6,
                    background: 'linear-gradient(135deg, #5A4FCF, #9575cd)',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      fontWeight: 'bold',
                      fontSize: 20,
                      bgcolor: '#ffffff',
                      color: '#5A4FCF',
                    }}
                  >
                    {name?.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>

                {/* User info */}
                <Box>
                  <Typography variant="h6" fontWeight={500} color="#333">
                    {name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {username}
                  </Typography>
                </Box>

                {/* Divider with label */}
                <Divider flexItem>
                  <Typography variant="caption" color="text.secondary">
                    Account Options
                  </Typography>
                </Divider>

                {/* Buttons */}
                <Stack spacing={1.2} width="100%">
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      navigate('/profile');
                      handleClosePopover();
                    }}
                    startIcon={<PersonIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      color: '#5A4FCF',
                      borderColor: '#b39ddb',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#ede7f6',
                        borderColor: '#7e57c2',
                      },
                    }}
                  >
                    View Profile
                  </Button>

                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    onClick={handleLogout}
                    startIcon={<LogoutIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      backgroundColor: '#e53935',
                      '&:hover': {
                        backgroundColor: '#c62828',
                      },
                    }}
                  >
                    Logout
                  </Button>
                </Stack>
              </Stack>
            </Popover>

          </div>

        )}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="warning" onClose={() => setSnackbarOpen(false)}>
            Your profile seems incomplete. Please update it!
          </Alert>
        </Snackbar>

      </Toolbar>
    </AppBar>

  );
}

export default Navbar;
