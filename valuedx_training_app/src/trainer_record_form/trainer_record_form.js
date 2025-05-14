import React, { useState, useEffect} from "react";
import Navbar from "../navbar/navbar";
import './trainer_record_form.css';
import { Link } from "react-router-dom";

const TrainerForm = ({ allBatchNames = []}) => {
  const [formData, setFormData] = useState({
    instructorName: "",
    trackName: "", 
    batchName: "",
    batchType: "",
    contentTaught: "", 
    candidatesPresent: 0,
  });

  const [batchNames, setBatchNames] = useState([]);

  useEffect(() => {
    fetchBatchNames();
    
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch("http://10.41.11.10:3001/submitForm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      alert("Daily insight submitted successfully");
      setFormData({
        instructorName: "",
        trackName: "", 
        batchName: "",
        batchType: "",
        contentTaught: "",
        candidatesPresent: 0,
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit form");
    }
  };

  const fetchBatchNames = async () => {
    try {
      const response = await fetch("http://10.41.11.10:3001/tableNames");
      if (!response.ok) {
        throw new Error("Failed to fetch batch names");
      }
      const data = await response.json();
      // Filter out certain table names here
      const filteredBatchNames = data.tableNames.filter(name => {
        return !(
          name.includes('grades') ||
          name.includes('register') ||
          name.includes('evaluation_result')||
          name.includes('student_registration')
        );
      });

          const formattedBatchNames = filteredBatchNames.map(name => {
        return name.toLowerCase().split(' ').map(word => {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
      });
         setBatchNames(formattedBatchNames);
         
    } catch (error) {
      console.error("Error fetching batch names:", error);
      // Handle error as needed
    }
  };
  useEffect(() => {
    console.log("All Batch Names"+allBatchNames);  
  }, [allBatchNames]);
 

  return (
    <>
      <Navbar showLogoutButton={true} />
      <div className="container" style={{ marginTop: '70px', width:'800px' }}>
        <h2 className="text-center">Training Daily Insights</h2>
        <form className="mt-4" onSubmit={handleSubmit} style={{marginLeft:'50px',marginRight:'50px'}}>
          <div className="form-group">
            <label htmlFor="instructorName">Name of Instructor</label>
            <select className="form-control" id="instructorName" required name="instructorName" value={formData.instructorName} onChange={handleInputChange}>
              <option value="">Select Instructor Name</option>
              <option value="Vaishnavi Malusare">Vaishnavi Malusare</option>
              <option value="Saraswati Khude">Saraswati Khude</option>
              <option value="Pooja Akolkar">Pooja Akolkar</option>
              <option value="Kirti Balagujar">Kirti Balagujar</option>
              <option value="Kajal Shaha">Kajal Shaha</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="trackName">Track Name</label> 
            <select className="form-control" id="trackName" required name="trackName" value={formData.trackName} onChange={handleInputChange}>
              <option value="">Select Track Name</option>
              <option value="Track 1">Track 1 (Python Essential + ML + DL + LLM + Generative AI)</option>
              <option value="Track 2">Track 2 (Python Essential + Test Automation)</option>
              <option value="Track 3">Track 3 (Pthon Essential + Django Framework)</option>
             
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="batchName">Batch Name</label>
            <select className="form-control" id="batchName" required name="batchName" value={formData.batchName} onChange={handleInputChange}>
              <option value="">Select Batch Name</option>
              {batchNames.map((batchNames, index) => (
                <option key={index} value={batchNames}>{batchNames}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="batchType">Batch Type</label>
            <select className="form-control" id="batchType" required name="batchType" value={formData.batchType} onChange={handleInputChange}>
              <option value="">Select batch type</option>
              <option value="Weekdays">Weekdays</option>
              <option value="Weekend">Weekend</option>
              <option value="Online">Online</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="contentTaught">Content Taught</label>
            <textarea className="form-control" id="contentTaught" required name="contentTaught" value={formData.contentTaught} onChange={handleInputChange} placeholder="Enter content taught"></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="candidatesPresent">Number of candidates present</label>
            <input type="number" className="form-control" required id="candidatesPresent" name="candidatesPresent" value={formData.candidatesPresent} onChange={handleInputChange} placeholder="Enter number of candidates" />
          </div>
          <div className="text-center">
            <button type="submit" className="btn btn-primary btn-block" style={{ width: '100px' }}>Submit</button>
            <button className="btn btn-primary" style={{width:'100px',marginLeft:'20px'}}><Link className="text-center mt-3" to="/dashboard" style={{color:'white',textDecoration:'none'}}>Home</Link></button>
          </div>
        </form>
        
      </div>
    </>
  );
};

export default TrainerForm;
