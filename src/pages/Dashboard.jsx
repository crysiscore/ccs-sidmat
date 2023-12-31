import React from "react";
import StatisticWidget from "../components/Widget/Statistic.jsx";
import AchievementWidget from "../components/Widget/Achievment.jsx";
import DashboardHeader from "../components/Other/DashboardHeader.jsx";
import ScrolledCard from "../components/Widget/ScrolledCard.jsx";
import { useOutletContext } from "react-router-dom";
import { Navigate } from 'react-router-dom';
import {getRequisicoesByMonth, getRequisicoesByDistrito} from '../middleware/GenericService';
import { useEffect } from "react";
import { NotificationManager} from 'react-notifications';
import ClipLoader from "react-spinners/ClipLoader";
import { user } from "@nextui-org/react";

export const  Dashboard=() => {
  const avatar =
    "https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";


  const [sidebarToggle] = useOutletContext();
  // get userData and isAutheticade from sessionStorage
  const sessionData = sessionStorage.getItem('userData'); // Retrieve data from localStorage
  const islogged = sessionStorage.getItem('isAuthenticated'); // Retrieve data from localStorage
  const [sumarioRequisicoes , setSumarioRequisicoes] = React.useState([]);
  const [requisicoesDistrito, setRequisicoesDistrito] = React.useState([]);
  // parse sessionData to JSON
  let userData = [];
  userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data

  let userRole = userData[0].role;
  let userArea = "";
 
  if (userRole === "Logistica") {
   userArea ="all";
 } else if (userRole === "Requisitante") {
   // for all objects in userData get their area and store in userArea
    userArea = userData.map((item) => item.area);

 } else if (userRole === "Administrador") {
  userArea ="all";
 }

  useEffect(() => {
    getRequisicoesByMonth(userArea)
      .then(data =>{
        setSumarioRequisicoes(data);
      } )
      .catch(error => {
        // handle any error state, rejected promises, etc..
        NotificationManager.error('Unable to get Sumario Requisicoes...','Erro getRequisicoesByMonth', 5000);
      });
  }, []);

  useEffect(() => {
    getRequisicoesByDistrito(userArea)
      .then(data =>{
        setRequisicoesDistrito(data);
      } )
      .catch(error => {
        // handle any error state, rejected promises, etc..
        NotificationManager.error('Unable to get Sumario Requisicoes...','Erro getRequisicoesByDistricto', 5000);
      });
  }, []);


  // if user is not authenticated, redirect to login
  if(!islogged){
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }

// if sumarioRequisicoes and requisicoesDistrito are empty, show loading
if(!sumarioRequisicoes && !requisicoesDistrito){
return(
  <>
  <main className="h-full">
    {/* Welcome Header */}
    <DashboardHeader
      toggle={sidebarToggle}
      avatar={avatar}
      user={{ name: userData[0].nome }}
    />

    {/* Show a spinner with loading  */}
    <div className="flex items-center justify-center h-full">
      <div className="w-12 h-12 border-t-2 border-gray-900 rounded-full animate-spin"></div>
     {/* Dispaly cliplodar with a message  */}
     <ClipLoader color="#36d7b7"  size={30}/><span > Carregando dados...</span> 
    </div>

  </main>
</> );
} else {

  return (
    <>
      <main className="h-full">
        {/* Welcome Header */}
        <DashboardHeader
          toggle={sidebarToggle}
          avatar={avatar}
          user={{ name: userData[0].nome }}
        />

        {/* Laba */}
        <div className="px-2 mx-auto mainCard">
          <div className="w-full overflow-hidden text-slate-700 md:grid gap-4 grid md:grid-cols-6">
            <StatisticWidget className="col-span-4 col-start-1 bg-white"  dataset={sumarioRequisicoes}  />
            {/* <AchievementWidget /> */}
          </div>
        </div>

        {/* OS Kredit */}
        <div className="px-2 mx-auto mainCard">
          <h1 className="text-slate-500 pb-3 text-base md:text-lg">
            Sumário de Requisições por Distrito:
          </h1>

          <div className="flex flex-row gap-x-4 overflow-hidden overflow-x-auto justify-between no-scrollbar">
            {requisicoesDistrito?.map((data, index) => (
              <ScrolledCard key={index} data={data} />
            ))}
          </div>

          <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap"></div>
        </div>
      </main>
    </>
  );
            }
}

export default Dashboard;
