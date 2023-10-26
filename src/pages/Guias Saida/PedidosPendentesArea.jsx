import React, { useState, useEffect  } from "react";
import DashboardHeader from "../../components/Other/DashboardHeader.jsx";
import RequisicoesPendentesAreaScrolledCard from "../../components/Widget/RequisicoesPendentesScrolledCard";
import { useOutletContext } from "react-router-dom";
import { Navigate } from 'react-router-dom';
import { getRequisicoesByArea } from "../../middleware/RequisicoesService.js";
import { NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import ClipLoader from "react-spinners/ClipLoader";
import {  Card, Text } from '@nextui-org/react';
import { useLocation } from "react-router-dom";

const avatar =
"https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";


export const  PedidosPendentesArea=() => {

  const [error, setError] = useState(null);
  const [loading,setHasFinishedLoading] = useState(false);
  const [requisicoesPendentesDaArea, setRequisicoesPendentesDaArea] = useState();
  const location = useLocation();
  let areaInfo = "";

// Parse the retrieved data
  areaInfo = location.state ? location.state.area : null; 
  // get id from material

  const [sidebarToggle] = useOutletContext();
  // get userData and isAutheticade from sessionStorage
  const sessionData = sessionStorage.getItem('userData'); // Retrieve data from localStorage
  const islogged = sessionStorage.getItem('isAuthenticated'); // Retrieve data from localStorage


  // parse sessionData to JSON
  let userData = [];
  userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data
  //get area property from userData

  //get Material by area
useEffect(() => {
  getRequisicoesByArea(areaInfo) 
  .then(requisicoes => { 
    setRequisicoesPendentesDaArea(requisicoes);
    setHasFinishedLoading(true);
  } )
  .catch(error => {
    // handle any error state, rejected promises, etc..
    setError(error);
    setHasFinishedLoading(true);
  });

}, []);


  // if user is not authenticated, redirect to login
  if(!islogged){
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }

  if(!requisicoesPendentesDaArea){
    return (
      <>
      <div className="flex justify-center items-center h-screen"> 
      <span className="us-header" ><p> Requisições de Distribuiçao de Material: </p></span>
     <ClipLoader color="#36d7b7"  size={30}/><span > Carregando dados...</span> 
     </div>
      </>
    );


  }
  else if(error !==null){
    NotificationManager.info('Houve umn erro durante a pesquisa de dados. Tente Novamente'+ error.message ,'Erro: ' +error.code, 8000);
    return <div className="flex justify-center items-center h-screen"><p className="text-2xl text-gray-400">{error.message}</p></div>;

  }

  else {

  if(requisicoesPendentesDaArea.length===0){
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
            Requisições de Distribuiçao de Material: {areaInfo}
          </h1>

          <div className="flex justify-center items-center h-screen"><p className="text-2xl text-gray-400">Nao existem requisicoes feitas...</p></div>
        </div>
      </main>
    </>
    );

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
            Requisições de Distribuicao de Material: {areaInfo}
          </h1>
{/*          <Grid.Container   wrap="nowrap" gap={2}  direction="row" >
          {requisicoesPendentesDaArea?.map((data, index) => (
              // <RequisicoresAreaScrolledCard key={index} data={data} />
              <Grid xs={9}>
              <RequisicoresAreaScrolledCard key={index} data={data} />
              </Grid>
            ))} 
                        
                        </Grid.Container>  */}
    {/*   <div class="flex flex-row gap-x-4 overflow-hidden overflow-x-auto justify-between ">
      {requisicoesPendentesDaArea?.map((data, index) => (
              // <RequisicoresAreaScrolledCard key={index} data={data} />
              <div class="grid-item"><RequisicoresAreaScrolledCard key={index} data={data} /></div>
              
          
            ))}
</div> */}

          {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
           <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
            {requisicoesPendentesDaArea?.map((data, index) => (
              <RequisicoesPendentesAreaScrolledCard key={index} data={data} />
            ))}
          </div>

          <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap"></div>
        </div>
      </main>
    </>
  );


  }



}

export default PedidosPendentesArea;