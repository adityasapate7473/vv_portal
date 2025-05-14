import React, { useState, useEffect } from "react";
import Navbar from "../navbar/navbar";
import config from "../config";

const EmployeeTaskReport = () => {
    const [employeeName, setEmployeeName] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [results, setResults] = useState([]);
    const [employeeNames, setEmployeeNames] = useState([]);

    useEffect(() => {
        fetchEmployeeNames(); // Fetch employee names when component mounts
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const queryParams = new URLSearchParams({
                employee_name: employeeName,
                date_from: dateFrom,
                date_to: dateTo,
            });

            const response = await fetch(`${config.API_BASE_URL}/api/get_employee_daily_status_report?${queryParams}`);
            const data = await response.json();

            setResults(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchEmployeeNames = async () => {
        try {
            const response = await fetch(`${config.API_BASE_URL}/api/employee_names`);
            const data = await response.json();
            setEmployeeNames(data);
        } catch (error) {
            console.error('Error fetching employee names:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Extracts only the date part
    };

    return (
        <>
            <Navbar showLogoutButton={true} />
            <br /><br /><br />
            <div className="text-center">
                <h3>Employee Daily Status Report</h3>
            </div>
            <div className="container mt-4">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-4">
                            <div className="form-group">
                                <label htmlFor="employeeName">Employee Name</label>
                                <select 
                                    className="form-control" 
                                    id="employeeName" 
                                    value={employeeName} 
                                    onChange={(e) => setEmployeeName(e.target.value)} 
                                    required 
                                >
                                    <option value="">Select Employee</option>
                                    {employeeNames.map((name, index) => (
                                        <option key={index} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-group">
                                <label htmlFor="dateFrom">Date From</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    id="dateFrom" 
                                    value={dateFrom} 
                                    onChange={(e) => setDateFrom(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-group">
                                <label htmlFor="dateTo">Date To</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    id="dateTo" 
                                    value={dateTo} 
                                    onChange={(e) => setDateTo(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary ">Submit</button>
                </form>
            </div>
            {results.length > 0 && (
                <div className="container mt-4">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Sr. No.</th>
                                <th>Date</th>
                                <th>Employee Name</th>
                                <th>Work Mode</th>
                                <th>Project Name/Task</th>
                                <th>Task Description</th>
                                <th>Time Given</th>
                                <th>Task Status</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((result, index) => (
                                <tr key={result.id}>
                                    <td>{index + 1}</td>
                                    <td>{formatDate(result.date)}</td>
                                    <td>{result.employee_name}</td>
                                    <td>{result.work_location}</td>
                                    <td>{result.project_name}</td>
                                    <td>{result.task_description}</td>
                                    <td>{result.time}</td>
                                    <td>{result.task_status}</td>
                                    <td>{result.end_of_the_day_result}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

export default EmployeeTaskReport;