import React, { useState, useEffect  } from "react";
import Navbar from "../../components/Navbar/Index";
import { useOutletContext } from "react-router-dom";
import {MaterialDisponivelTable} from "../../components/Datatables/CustomTable";
import { getMaterialDisponivel } from "../../middleware/MaterialService";
import { getAllArmazens } from "../../middleware/GenericService";
import ClipLoader from "react-spinners/ClipLoader";
import { NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import { Navigate } from 'react-router-dom';
import DashboardHeader from "../../components/Other/DashboardHeader.jsx";
import Button from '@mui/material/Button';
import { createDownloadUploadTemplate } from "../../Reporting/MaterialUplaodTemplate.js";


const avatar =
"https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";



function TemplateDownload() {
  const [sidebarToggle] = useOutletContext();
  const [error, setError] = useState(null);
  const [loading,setHasFinishedLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  // get userData and isAutheticade from sessionStorage

  // get userData and isAutheticade from sessionStorage
  const sessionData = sessionStorage.getItem('userData'); // Retrieve data from localStorage
  const islogged = sessionStorage.getItem('isAuthenticated'); // Retrieve data from localStorage


  //get area property from userData
  let userData = [];
  userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data

  //get area property from userData
  const area = userData ? userData[0].area : null; // Parse the retrieved data

  const handleDownloadTemplate = async () => {

    await createDownloadUploadTemplate( );

  }


   return (
    <>
      <main className="h-full">
       {/* Welcome Header */}
       <DashboardHeader
                  toggle={sidebarToggle}
                  avatar={avatar}
                  user={{ name: userData[0].nome }}
                />
                <div className="px-2 mx-auto mainCard">
                  <h1 className="text-slate-500 pb-3 text-base md:text-lg">
                Template de Importacao de dados
                  </h1>
           
                  {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
                   <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
                    {/* create a button with a function to download an excell template*/}
                    {/* <div className="flex flex-row justify-center"> */}
                    <Button variant="contained" onClick={handleDownloadTemplate}  disabled={false }>Baixar Template</Button>
                    {/* </div> */}
 
   
          </div>
         
        </div>
      </main>
    </>
  );
 } 

export default TemplateDownload;
