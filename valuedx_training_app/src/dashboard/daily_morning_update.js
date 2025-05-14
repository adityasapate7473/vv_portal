import React, { useState } from 'react';
import Navbar from "../navbar/navbar";
import config from "../config";

const MorningUpdate = () => {
  const [formData, setFormData] = useState({
    projectName: '',
    workMode: '',
    todaysTasks: '',
    todaysMeetings: '',
    employeename: '',
    date: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Get the name from cookies (assuming you are using document.cookie)
      const cookies = document.cookie.split(';').map(cookie => cookie.trim());
      let name = '';
      cookies.forEach(cookie => {
        const [key, value] = cookie.split('=');
        if (key === 'name') {
          name = value;
        }
      });
  
      // Get the current system date
      const currentDate = new Date();
      const localDateString = currentDate.toLocaleDateString('en-CA');
  
      // Add name and current date to form data
      const updatedFormData = {
        ...formData,
        employeename: name,
        date: localDateString
      };
  
      const response = await fetch('http://10.41.11.10:3001/api/daily-task-agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedFormData)
      });
  
      if (response.ok) {
        alert('Morning Status Saved Successfully');
        setFormSubmitted(true);
        // Reset form data
        setFormData({
          projectName: '',
          workMode: '',
          todaysTasks: '',
          todaysMeetings: '',
          employeename: '',
          date: ''
        });
      } else {
        console.error('Failed to save form data');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      <Navbar showLogoutButton={true} /><br /><br /><br></br>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <h2 className="mt-4 mb-5 text-center">Morning Daily Update</h2>
       
          <form onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="mb-3">
              <label htmlFor="projectName" className="form-label">Project Name:</label>
              <input
                type="text"
                className="form-control"
                id="projectName"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="workMode" className="form-label">Work Mode:</label>
              <select
                className="form-select"
                id="workMode"
                name="workMode"
                value={formData.workMode}
                onChange={handleChange}
                required
              >
                <option value="">Select work mode</option>
                <option value="Office">Office</option>
                <option value="Home">Home</option>
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="todaysTasks" className="form-label">Today's Tasks:</label>
              <textarea
                className="form-control"
                id="todaysTasks"
                name="todaysTasks"
                value={formData.todaysTasks}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="todaysMeetings" className="form-label">Today's Meetings:</label>
              <textarea
                className="form-control"
                id="todaysMeetings"
                name="todaysMeetings"
                value={formData.todaysMeetings}
                onChange={handleChange}
                required
              />
            </div>

            <div className='text-center'>
              <button type="submit" style={{ width: '120px' }} className="btn btn-primary">Submit</button>
            </div>
          </form>
      </div>
    </>
  );
};

export default MorningUpdate;