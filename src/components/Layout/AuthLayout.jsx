import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import { sidebarToggle } from "./../../utils/toggler.js";
import BottomNavbar from "../BottomNavbar/Index";
import { Navigate } from 'react-router-dom';



function AuthLayout() {
  
  const isDesktop = () => document.body.clientWidth > 768;
  const [sidebarStatus, setSidebarStatus] = useState("");


  useEffect(() => {
    window.addEventListener("resize", () => {
      setSidebarStatus(isDesktop());
    });
    return () => window.removeEventListener("resize", isDesktop);
  }, []);

  // get userData and isAutheticade from sessionStorage
  const sessionData = sessionStorage.getItem('userData'); // Retrieve data from localStorage
  const islogged = sessionStorage.getItem('isAuthenticated'); // Retrieve data from localStorage

  // parse sessionData to JSON
  let userInfo = [];
  // if user is not authenticated, redirect to login
  if(!islogged){
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }


  userInfo = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data

 
  return (
    <div className="adminLayout">
      {/* Sidebar */}
      <Sidebar
        toggle={sidebarToggle}
        className={sidebarStatus ? "" : "mobile"}
        islogged={islogged}
        userData={userInfo}
        
      />

      {/* Main Wrapper */}
      <div className="mainWrapper">
        <Outlet context={[sidebarToggle]} />
      </div>

      {/* Bottom Navigation */}
      <BottomNavbar />
    </div>
  );
}

export default AuthLayout;
