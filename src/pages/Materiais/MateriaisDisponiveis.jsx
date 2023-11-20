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
import { all } from "axios";



const avatar =
"https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";



function TableMateriaisDisponivel() {
  const [sidebarToggle] = useOutletContext();
  const [error, setError] = useState(null);
  const [loading,setHasFinishedLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [materialList, setData] = useState();
  const [listArmazens, setListArmazens] = useState();

  // get userData and isAutheticade from sessionStorage

  // get userData and isAutheticade from sessionStorage
  const sessionData = sessionStorage.getItem('userData'); // Retrieve data from localStorage
  const islogged = sessionStorage.getItem('isAuthenticated'); // Retrieve data from localStorage


  //get area property from userData
  let userData = [];
  userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data


  let userRole = userData[0].role;
  let userArea = "";
  let allAreas = "";

  if (userRole === "Logistica") {
   userArea ="all";
 } else if (userRole === "Requisitante" && userData.length > 1) {
   // for all objects in userData get their area and store in userArea
    userArea = userData.map((item) => item.area);
 let tempArea =userArea;

     tempArea.forEach((area, index) => {
       allAreas += `[${area}]`;
       if (index !== tempArea.length - 1) {
         allAreas += ',';
       }
     });

 } else if (userRole === "Administrador") {
  userArea ="all";
  allAreas = userArea;
 } else if (userRole === "Requisitante" && userData.length === 1) {

  userArea = userData[0].area;
  // make userArea an array
  userArea = [userArea];
  allAreas = userArea;
  }



  const columnNames = [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 10,
    },
    {
      accessorKey: 'cod',
      header: 'Cod',
      size: 40,
    },
    {
      accessorKey: 'descricao',
      header: 'Descricao',
      size: 120,
    },
    {
      accessorKey: 'qtd_stock',
      header: 'Stock',
      size: 10,
    },
    {
      accessorKey: 'area',
      header: 'Area',
      size: 10,
    },
    {
      accessorKey: 'armazem',
      header: 'Armazem',
    },
    {
      accessorKey: 'familia',
      header: 'Familia',
      size: 60,
    },
    {
      accessorKey: 'prazo',
      header: 'Prazo',
      size: 60,
    },

    {
      accessorKey: 'id_area',
      header: 'ID Area',
      size: 10,
    }
  ];

//get Material by area
useEffect(() => {
  getMaterialDisponivel(userArea) 
    .then(materialList => { 
      setData(materialList)
      setHasFinishedLoading(true);
    } )
    .catch(error => {
      // handle any error state, rejected promises, etc..
      setError(error);
      setHasFinishedLoading(true);
    });

}, []);
 
useEffect(() => {
  getAllArmazens()
    .then(data =>{

      setListArmazens(data);
      setHasFinishedLoading(true);
    } )
    .catch(error => {
      // handle any error state, rejected promises, etc..
      setError(error);
      setHasFinishedLoading(false);
    });
}, []);

  //if user is not authenticated, redirect to login
  if(!islogged){
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }


  
  //Show a spinner while the data is being fetched'
  if (!materialList || !listArmazens) {
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
          Lista de Materiais para {allAreas}: 
        </h1>

        {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
         <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
        <MaterialDisponivelTable colunas = {columnNames}  dados = {[]}  />
              {/* Dispaly cliplodar with a message  */}
              <ClipLoader color="#36d7b7"  size={30}/><span >    Carregando dados...</span> 
          </div>
         
        </div>
      </main>
    </>
  ); }
  //Show an error if there is one

  else if (error !== null) {
    //  block of code to be executed if there is an error
    NotificationManager.error('Houve umn erro durante a pesquisa de dados. Tente Novamente'+ error.message ,'Erro: ' +error.code, 8000);
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
          Lista de Materiais para {allAreas}:
        </h1>
   {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
   <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
        <MaterialDisponivelTable colunas = {columnNames}  dados = {[]}  />
          </div>
         
        </div>
      </main>
    </>
    );


  } else {


 if(materialList.length === 0) {
   NotificationManager.info('Nao ha material disponivel para a sua area.', 'Info', 8000);
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
                  Lista de Materiais para {allAreas}: 
                  </h1>
           
                  {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
                   <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
        <MaterialDisponivelTable colunas = {columnNames}  dados = {[]}  />
          </div>
         
        </div>
      </main>
    </>
  );
 }  else {

        // only execute if listArmazens has values
        // change  dados  properties values ( armazem ) to cod_armazem based on the   listArmazens values
        
        const mappedData = materialList.map((item) => {
          const armazem = listArmazens.find((armazem) => armazem.id === item.armazem);
          return {
            ...item,
            armazem: armazem.nome,
          };  
        });
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
                  Lista de Materiais para {allAreas}:
                  </h1>
           
                  {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
                   <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
        <MaterialDisponivelTable colunas = {columnNames}  dados = {mappedData}  />
          </div>
  
        </div>
      </main>

    </>
  ); 
  }
}
}
export default TableMateriaisDisponivel;
