import React, { useState, useEffect } from 'react';
import './sidebar.css';
import { NavLink } from "react-router-dom"; // ✅ Changed to NavLink
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars, faUser, faChartBar, faPlusSquare, faUserPlus, faClipboardCheck, faCalendarCheck, faSearch, faClipboardList, faFileInvoice,
  faFileCircleCheck, faFloppyDisk, faRoute, faChalkboardTeacher, faUserCheck, faPenToSquare, faGraduationCap, faTrophy, faChartLine,
  faFilePen, faPaperPlane, faXmark, faArrowLeft, faArrowRight, faSyncAlt, faHome, faUserGraduate, faUserShield, faUserTie, faCode
} from '@fortawesome/free-solid-svg-icons';
import { Avatar, Typography, Tooltip } from '@mui/material';
import config from "../config";
import { Home } from '@mui/icons-material';

const Sidebar = () => {
  const [batch, setBatch] = useState("");
  const storedSidebarState = localStorage.getItem('sidebarOpen');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return storedSidebarState ? JSON.parse(storedSidebarState) : false;
  });

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  useEffect(() => {
    const handleSidebarToggle = () => {
      const wrapper = document.getElementById('wrapper');
      wrapper.classList.toggle('toggled');
    };

    document.querySelectorAll('.sidebar-toggle').forEach(item => {
      item.addEventListener('click', handleSidebarToggle);
    });

    return () => {
      document.querySelectorAll('.sidebar-toggle').forEach(item => {
        item.removeEventListener('click', handleSidebarToggle);
      });
    };
  }, []);

  useEffect(() => {
    const wrapper = document.getElementById('wrapper');
    if (sidebarOpen) {
      wrapper.classList.add('toggled');
    } else {
      wrapper.classList.remove('toggled');
    }
  }, [sidebarOpen]);

  function getCookie(name) {
    const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return cookieValue ? decodeURIComponent(cookieValue.pop()) : '';
  }

  const name = getCookie('name');
  const role = getCookie('role');
  const id = getCookie('userid');

  useEffect(() => {
    if (id) {
      fetch(`${config.API_BASE_URL}/api/getStudentBatch?studentId=${id}`)
        .then((response) => response.json())
        .then((data) => {
          setBatch(data.batch || "N/A");
        })
        .catch((error) => console.error("Error fetching batch:", error));
    }
  }, [id]);

  const linkStyle = ({ isActive }) => ({
    fontSize: '16px',
    textDecoration: 'none',
    color: isActive ? '#1abc9c' : '#ecf0f1',
    fontWeight: isActive ? 'bold' : 'normal',
    display: 'flex',
    alignItems: 'center',
    padding: '6px 0',
    backgroundColor: isActive ? "white" : "",
    borderRadius: isActive ? "10px" : "10px",
    padding: "5px 10px",
    borderBottom: '1px solid #7f8c8d',
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'trainer':
        return faChalkboardTeacher;
      case 'intern':
        return faUserGraduate;
      case 'admin':
        return faUserShield;
      case 'manager':
        return faUserTie;
      case 'developer':
        return faCode;
      default:
        return faUser;
    }
  };

  return (
    <>
      <div id="wrapper" style={{ marginTop: '50px' }}>
        <div id="sidebar-wrapper" className={sidebarOpen ? "open" : ""} style={{ overflowY: "auto", maxHeight: "100vh" }}>

          {/* User Profile */}
          <div
            style={{
              padding: 5,
              width: 220,
              backgroundColor: '#2c3e50',
              color: '#ecf0f1',
              borderRadius: '10px',
              border: '1px solid #7f8c8d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: "15px 15px 0 15px",
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon
                icon={getRoleIcon(role)}
                style={{
                  padding: 7,
                  borderRadius: '50%',
                  color: 'white',
                  fontSize: '20px',
                }}
              />
              <div style={{ flexGrow: 1 }}>
                <Typography variant="" style={{ fontWeight: 'bold', fontSize: '18px', }}>
                  {role === 'trainer'
                    ? 'Instructor'
                    : role?.charAt(0).toUpperCase() + role?.slice(1).toLowerCase()} Panel
                </Typography>


              </div>
            </div>
          </div>

          {/* Sidebar Menu */}
          <nav className="sidebar" style={{ paddingTop: '5px', backgroundColor: '#34495e' }}>
            <ul style={{ listStyle: 'none', paddingLeft: '10px', color: '#ecf0f1' }}>
              {role === 'intern' && (
                <Typography
                  variant="body2"
                  style={{
                    color: '#ecf0f1',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                    padding: 10,
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                >
                  Batch : {batch}
                </Typography>
              )}
              {/* All Sidebar Links */}
              <li style={{ margin: '5px 0' }}>
                {(role === 'user' || role === 'admin' || role === 'trainer' || role === 'manager' || role === 'developer') && (
                  <NavLink to="/dashboard" style={linkStyle}>
                    <Home style={{ marginRight: '7px' }} />
                    Dashboard
                  </NavLink>
                )}
              </li>

              <li style={{ margin: '5px 0' }}>
                {(role === 'user' || role === 'admin' || role === 'trainer' || role === 'manager') && (
                  <NavLink to="/batch_report" style={linkStyle}>
                    <FontAwesomeIcon icon={faChartBar} style={{ marginRight: '10px' }} />
                    Batch Reports
                  </NavLink>
                )}
              </li>

              <li style={{ margin: '5px 0' }}>
                {role === 'user' && (
                  <NavLink to="/trainer_record_form" style={linkStyle}>
                    <FontAwesomeIcon icon={faCalendarCheck} style={{ marginRight: '10px' }} />
                    Daily Update
                  </NavLink>
                )}
              </li>

              <li style={{ margin: '5px 0' }}>
                {(role === 'admin' || role === 'trainer' || role === 'manager') && (
                  <NavLink to="/attendance" style={linkStyle}>
                    <FontAwesomeIcon icon={faUserCheck} style={{ marginRight: '10px' }} />
                    Daily Attendance
                  </NavLink>
                )}
              </li>

              <li style={{ margin: '5px 0' }}>
                {(role === 'admin' || role === 'trainer' || role === 'manager') && (
                  <NavLink to="/addgrades" style={linkStyle}>
                    <FontAwesomeIcon icon={faPlusSquare} style={{ marginRight: '10px' }} />
                    New Batch
                  </NavLink>
                )}
              </li>

              <li style={{ margin: '5px 0' }}>
                {(role === 'user' || role === 'admin' || role === 'trainer' || role === 'manager') && (
                  <NavLink to="/student_registration" style={linkStyle}>
                    <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: '10px' }} />
                    Student Registration
                  </NavLink>
                )}
              </li>

              <li style={{ margin: '5px 0' }}>
                {(role === 'admin' || role === 'trainer' || role === 'manager') && (
                  <NavLink to="/addtrack" style={linkStyle}>
                    <FontAwesomeIcon icon={faRoute} style={{ marginRight: '10px' }} />
                    Add New Track
                  </NavLink>
                )}
              </li>

              <li style={{ margin: '5px 0' }}>
                {(role === 'admin' || role === 'manager') && (
                  <NavLink to="/addinstructor" style={linkStyle}>
                    <FontAwesomeIcon icon={faChalkboardTeacher} style={{ marginRight: '10px' }} />
                    Add New Instructor
                  </NavLink>
                )}
              </li>

              <li style={{ margin: '5px 0' }}>
                {(role === 'developer' || role === 'manager') && (
                  <NavLink to="/addadmin" style={linkStyle}>
                    <FontAwesomeIcon icon={faChalkboardTeacher} style={{ marginRight: '10px' }} />
                    Add New Admin
                  </NavLink>
                )}
              </li>
              <li style={{ margin: '5px 0' }}>
                {role === 'developer' && (
                  <NavLink to="/addmanager" style={linkStyle}>
                    <FontAwesomeIcon icon={faChalkboardTeacher} style={{ marginRight: '10px' }} />
                    Add New Manager
                  </NavLink>
                )}
              </li>

              <li style={{ margin: '5px 0' }}>
                {(role === 'user' || role === 'admin' || role === 'trainer' || role === 'manager') && (
                  <NavLink to="/evaluation" style={linkStyle}>
                    <FontAwesomeIcon icon={faClipboardCheck} style={{ marginRight: '10px' }} />
                    Evaluation
                  </NavLink>
                )}
              </li>

              <li style={{ margin: '5px 0' }}>
                {(role === 'admin' || role === 'manager') && (
                  <>
                    <NavLink to="/search_skillset" style={linkStyle}>
                      <FontAwesomeIcon icon={faSearch} style={{ marginRight: '10px' }} />
                      Search Skillset
                    </NavLink>
                  </>
                )}
              </li>
              <li style={{ margin: '5px 0' }}>
                {(role === 'admin' || role === 'manager') && (
                  <>
                    <NavLink to="/student_request" style={linkStyle}>
                      <FontAwesomeIcon icon={faClipboardList} style={{ marginRight: '10px' }} />
                      Client Requests
                    </NavLink>
                  </>
                )}
              </li>
              <li style={{ margin: '5px 0' }}>
                {(role === 'admin' || role === 'manager') && (
                  <>
                    <NavLink to="/resume_approval" style={linkStyle}>
                      <FontAwesomeIcon icon={faFileInvoice} style={{ marginRight: '10px' }} />
                      CV Review Request
                    </NavLink>
                  </>
                )}
              </li>

              <li style={{ margin: '5px 0' }}>
                {(role === 'admin' || role === 'trainer' || role === 'manager' || role === 'developer') && (
                  <>
                    <NavLink to="/sendmail" style={linkStyle}>
                      <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: '10px' }} />
                      Send Mail
                    </NavLink>
                  </>
                )}
              </li>

              <li style={{ margin: '5px 0' }}>
                {(role === 'admin' || role === 'trainer' || role === 'manager') && (
                  <>
                    <NavLink to="/report" style={linkStyle}>
                      <FontAwesomeIcon icon={faFileCircleCheck} style={{ marginRight: '10px' }} />
                      Reports
                    </NavLink>
                  </>
                )}
              </li>

              <li style={{ margin: '5px 0' }}>
                {role === 'intern' && (
                  <>
                    <NavLink to="/dashboard" style={linkStyle}>
                      <FontAwesomeIcon icon={faFilePen} style={{ marginRight: '10px' }} />
                      Resume Maker
                    </NavLink>
                  </>
                )}
              </li>
              <li style={{ margin: '5px 0' }}>
                {role === 'intern' && (
                  <>
                    <NavLink to="/internresults" style={linkStyle}>
                      <FontAwesomeIcon icon={faTrophy} style={{ marginRight: '10px' }} />
                      Results
                    </NavLink>
                  </>
                )}
              </li>
              <li style={{ margin: '5px 0' }}>
                {role === 'intern' && (
                  <>
                    <NavLink to="/studentattendance" style={linkStyle}>
                      <FontAwesomeIcon icon={faChartLine} style={{ marginRight: '10px' }} />
                      Attendance
                    </NavLink>
                  </>
                )}
              </li>

            </ul>
          </nav>
        </div>

        <button className="btn btn-default sidebar-toggle"
          style={{
            position: 'fixed',
            marginLeft: '10px',
            marginTop: '25px',
            backgroundColor: '#34495e',
            color: '#ecf0f1',
            border: 'none',
            fontSize: '16px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          title={sidebarOpen ? 'Click To Close Sidebar' : 'Click To Open Sidebar'}
          onClick={toggleSidebar}>
          <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
        </button>

        <button className="btn btn-default"
          style={{
            position: 'fixed',
            marginLeft: '10px',
            marginTop: '70px',
            backgroundColor: '#34495e',
            color: '#ecf0f1',
            border: 'none',
            fontSize: '16px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          title="Click To Go Back"
          onClick={() => window.history.back()}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>

        <button className="btn btn-default"
          style={{
            position: 'fixed',
            marginLeft: '10px',
            marginTop: '115px',
            backgroundColor: '#34495e',
            color: '#ecf0f1',
            border: 'none',
            fontSize: '16px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          title="Click To Go Forward"
          onClick={() => window.history.forward()}>
          <FontAwesomeIcon icon={faArrowRight} />
        </button>

        <button className="btn btn-default"
          style={{
            position: 'fixed',
            marginLeft: '10px',
            marginTop: '160px',
            backgroundColor: '#34495e',
            color: '#ecf0f1',
            border: 'none',
            fontSize: '16px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          title="Click To Reload Page"
          onClick={() => window.location.reload()}>
          <FontAwesomeIcon icon={faSyncAlt} />
        </button>

        <button className="btn btn-default"
          style={{
            position: 'fixed',
            marginLeft: '10px',
            marginTop: '205px',
            backgroundColor: '#34495e',
            color: '#ecf0f1',
            border: 'none',
            fontSize: '16px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          title="Click To Go To Home Page"
          onClick={() => window.location.href = '/dashboard'}>
          <FontAwesomeIcon icon={faHome} />
        </button>

      </div>
    </>
  );
};

export default Sidebar;
