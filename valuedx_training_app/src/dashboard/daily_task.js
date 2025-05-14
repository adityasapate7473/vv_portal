
import React, { useState, useEffect } from 'react';
import Navbar from "../navbar/navbar";
import config from "../config";
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
};

const DailyTask = () => {
    const initialFormData = {
        date: '',
        employeeName: '',
        workLocation: '',
        projectName: '',
        taskDescription: '',
        time: '',
        taskStatus: '',
        endOfDayResult: ''
    };

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        // Get employee name from cookies
        const employeeName = getCookie('name');

        // Get the current date
        const currentDate = new Date().toISOString().split('T')[0];

        setFormData(prevData => ({
            ...prevData,
            employeeName,
            date: currentDate
        }));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form data submitted:', formData);

        try {
            const response = await fetch('http://10.41.11.10:3001/api/employee_tasks_status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                
                // Reset the form
                setFormData(initialFormData);
            } else {
                console.error('Failed to submit form data');
            }
        } catch (error) {
            console.error('Error submitting form data', error);
        }
    };

    return (
        <>
            <Navbar showLogoutButton={true} /><br></br>
            <div className="container mt-5" style={{ maxWidth: '1000px' }}>
                <div className="form-container" style={{ maxWidth: '800px', marginLeft: '100px' }}>
                    <h2 className="mb-4 text-center">Evening Daily Update</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Project Name / Task:</label>
                            <input
                                type="text"
                                name="projectName"
                                className="form-control"
                                value={formData.projectName}
                                onChange={handleChange}
                                required />
                        </div>
                        <div className="form-group">
                            <label>Work Mode:</label>
                            <select
                                name="workLocation"
                                className="form-control"
                                value={formData.workLocation}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Work Mode</option>
                                <option value="Office">Office</option>
                                <option value="Home">Home</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Task Description:</label>
                            <textarea
                                name="taskDescription"
                                className="form-control"
                                value={formData.taskDescription}
                                onChange={handleChange}
                                required
                            ></textarea>
                        </div>
                        <div className="form-group">
                            <label>Time Given:</label>
                            <input
                                type="time"
                                name="time"
                                className="form-control"
                                value={formData.time}
                                onChange={handleChange}
                                required />
                        </div>
                        <div className="form-group">
                            <label>Task Status:</label>
                            <select
                                name="taskStatus"
                                className="form-control"
                                value={formData.taskStatus}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Status</option>
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>End of The Day Result:</label>
                            <textarea
                                name="endOfDayResult"
                                className="form-control"
                                value={formData.endOfDayResult}
                                onChange={handleChange}
                                required
                            ></textarea>
                        </div>
                        <div className='text-center'>
                            <button type="submit" style={{ width: '120px' }} className="btn btn-primary">Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default DailyTask;

