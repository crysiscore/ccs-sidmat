import React, { useState, useEffect  } from "react";
import Navbar from "../../components/Navbar/Index";
import { useOutletContext } from "react-router-dom";
import {MinhasRequisicoesTable} from "../../components/Datatables/CustomTable";
import { getRequisicoesByUser } from "../../middleware/RequisicoesService";
import ClipLoader from "react-spinners/ClipLoader";
import { NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import { Navigate } from 'react-router-dom';
import DashboardHeader from "../../components/Other/DashboardHeader.jsx";
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';


const avatar =
"https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";


function MinhasRequisicoes() {
  const [sidebarToggle] = useOutletContext();
  const [error, setError] = useState(null);
  const [loading,setHasFinishedLoading] = useState(false);
  const [requisicaoList, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listArmazens, setListArmazens] = useState([]);
  const [value, setValue] = React.useState();


  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // get userData and isAutheticade from sessionStorage

  // get userData and isAutheticade from sessionStorage
  const sessionData = sessionStorage.getItem('userData'); // Retrieve data from localStorage
  const islogged = sessionStorage.getItem('isAuthenticated'); // Retrieve data from localStorage


  //get area property from userData
  let userData = [];
  userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data

  //get area property from userData
  const area = userData ? userData[0].area : null; // Parse the retrieved data
  const user_id = userData ? userData[0].id : null; // Parse the retrieved data

  //parse sessionData to JSON
  let userInfo = [];
  userInfo = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data


  const columnNames = [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 10,
    },
    {
      accessorKey: 'data_requisicao',
      header: 'Data da Requisicao',
      size: 40,
    },
    {
      accessorKey: 'material',
      header: 'Material',
      size: 120,
    },
    {
      accessorKey: 'quantidade',
      header: 'Quantidade Solicitada',
      size: 10,
    },
    {
      accessorKey: 'unidade_sanitaria',
      header: 'Unidade Sanitaria',
    },
    {
      accessorKey: 'pf_nome',
      header: 'Nome P. Focal',
      size: 60,
    },
    {
      accessorKey: 'pf_contacto',
      header: 'Contacto P. Focal',
      size: 60,
    },

    {
      accessorKey: 'requisitante',
      header: 'Requisitante',
      size: 10,
    },
      {
        accessorKey: 'nr_guia',
        header: '# Guia',
        size: 60,
      },
  
      {
        accessorKey: 'notas',
        header: 'Notas',
        size: 10,
      },
      {
        accessorKey: 'area',
        header: 'Area',
        size: 10,
      }
  ];

//get Material by user
useEffect(() => {
    getRequisicoesByUser(user_id) 
    .then(requisicoes => { 
      setData(requisicoes);
      setHasFinishedLoading(true);
      setValue("pendentes");
    } )
    .catch(error => {
      // handle any error state, rejected promises, etc..
      setError(error);
      setHasFinishedLoading(true);
    });

}, []);
 

  //if user is not authenticated, redirect to login
  if(!islogged){
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }

  
  //Show a spinner while the data is being fetched'
  if (!requisicaoList) {
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
          Lista de Requisicoes feitas por {area}: 
        </h1>

        {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
         <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
        <MinhasRequisicoesTable colunas = {columnNames}  dados = {[]}  />
              {/* Dispaly cliplodar with a message  */}
              <ClipLoader color="#36d7b7"  size={30}/><span > Carregando dados...</span> 
          </div>
         
        </div>
      </main>
    </>
  ); }
  //Show an error if there is one
  else if (error !== null) {
    //  block of code to be executed if there is an error
    NotificationManager.info('Houve umn erro durante a pesquisa de dados. Tente Novamente'+ error.message ,'Erro: ' +error.code, 8000);
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
          Lista de Requisicoes feitas por {area}: 
        </h1>

        {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
         <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
        <MinhasRequisicoesTable colunas = {columnNames}  dados = {[]}  />
          </div>
         
        </div>
      </main>
      </>
    );


  } else {


 if(requisicaoList.length === 0) {
  //  NotificationManager.info('Nao ha Requisicoes feitas por ' + area, 'Info', 8000);
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
          Lista de Requisicoes feitas por {area}: 
        </h1>

        {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
         <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
        <MinhasRequisicoesTable colunas = {columnNames}  dados = {[]}  />
          </div>
         
        </div>
      </main>
    </>
  );
}

        // only execute if listArmazens has values
        // change  dados  properties values ( armazem ) to cod_armazem based on the   listArmazens values
        
        /* const mappedData = requisicaoList.map((item) => {
          const armazem = listArmazens.find((armazem) => armazem.id === item.armazem);
          return {
            ...item,
            armazem: armazem.nome,
          };  
        }); */


  // Use filter to get items that match the criteria
  const filteredDataPendentes = requisicaoList.filter((item) => item.id_guia === null);
  const filteredDataProcessadas = requisicaoList.filter((item) => {

    return (item.id_guia !== null && item.guia_status === "NOVA");
  }
  );
  const filteredDataEntregues = requisicaoList.filter((item) => {
      
      return (item.id_guia !== null && item.guia_status === "ENTREGUE");
    }
    );

  // Get the count of filtered items
  const countPendentes= filteredDataPendentes.length;
  const countProcessadas= filteredDataProcessadas.length;
  const countEntregues= filteredDataEntregues.length;

  return (
    <main className="h-full">
    {/* Welcome Header */}
<DashboardHeader
toggle={sidebarToggle}
avatar={avatar}
user={{ name: userData[0].nome }}
/>

<div className="px-2 mx-auto mainCard">
<h1 className="text-slate-500 pb-3 text-base md:text-lg">
Lista de Requisições feitas por {area}: 
</h1>

{/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
<div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
{/* <MinhasRequisicoesTable colunas = {columnNames}  dados = {[requisicaoList]}  /> */}

<Box sx={{ width: '100%', typography: 'body1' }}>
              <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <TabList onChange={handleChange} >
  
                     <Tab label={"Pendentes ("+ countPendentes + ")"      }  value={"pendentes"} />
                     <Tab label={"Processadas (" + countProcessadas + ")" }  value={"processadas"} />
                     <Tab label={"Entregues (" + countEntregues + ")"     }  value={"entregues"} />
                
                  </TabList>
                </Box>
                  <TabPanel value={"pendentes"} >
                  <MinhasRequisicoesTable colunas = {columnNames} 
                  // filter null or empty requisicoes
                  dados={requisicaoList.filter((requisicao) => requisicao.id_guia === null )} tipo={"pendentes"} />
                  </TabPanel>
                  <TabPanel value={"processadas"} >
                  <MinhasRequisicoesTable colunas = {columnNames} 
                  // filter null or empty requisicoes
                  dados={requisicaoList.filter((requisicao) =>  {
                    return requisicao.id_guia !==null && requisicao.guia_status==="NOVA" ;
                   } )} tipo={"processadas"}  />
                  </TabPanel>
                  <TabPanel value={"entregues"} >
                  <MinhasRequisicoesTable colunas = {columnNames} 
                   dados={requisicaoList.filter((requisicao) =>  {
                    return requisicao.id_guia !==null && requisicao.guia_status==="ENTREGUE" ;
                   } )} tipo={'entregues'}    />
                  </TabPanel>

              </TabContext>
            </Box>
</div>

</div>
</main>
  ); 
  
  }
}
export default MinhasRequisicoes;
