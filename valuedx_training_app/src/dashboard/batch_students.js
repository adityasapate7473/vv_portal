import React, { useState, useEffect } from 'react';
import Navbar from "../navbar/navbar";
import config from "../config";

const BatchStudents = ()=>{
    const [students, setStudents] = useState([]);

return(
    <><Navbar showLogoutButton={true} /><br></br><br></br>
    <div className="container">
  <h2 className="my-4 text-center">Student List</h2>
  <table className="table table-striped">
    <thead className="thead-dark">
      <tr>
        <th>Sr. No.</th>
        <th>Student name</th>
        <th>Email Id</th>
        <th>Contact No.</th>
        <th>Passout Year</th>
        <th>Batch Name</th>
        <th>Highest Qualification</th>
        <th>Skillset</th>
        <th>Certification</th>
        <th>current Location</th>
        <th>Experience</th>

      </tr>
    </thead>
    <tbody>
    {students
        .filter(student => student.batch_name === 'Sun')
        .map((student, index) => (
          <tr key={student.id}>
          <td>{index + 1}</td>
          <td>{student.student_name}</td>
          <td>{student.email_id}</td>
          <td>{student.contact_no}</td>
          <td>{student.passout_year}</td>
          <td>{student.batch_name}</td>
          <td>{student.highest_qualification}</td>
          <td>{student.skillset}</td>
          <td>{student.certification}</td>
          <td>{student.current_location}</td>
          <td>{student.experience}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

    </>
);
};
export default BatchStudents;