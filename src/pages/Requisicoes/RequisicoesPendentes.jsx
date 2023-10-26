import React, { useState, useEffect, useRef  } from "react";
import DashboardHeader from "../../components/Other/DashboardHeader.jsx";
import RequisicoresAreaScrolledCard from "../../components/Widget/RequisicoresAreaScrolledCard.jsx";
import { useOutletContext } from "react-router-dom";
import { Navigate } from 'react-router-dom';
import { getRequisicoesPendentesArea } from "../../middleware/RequisicoesService.js";
import { NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import ClipLoader from "react-spinners/ClipLoader";
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { getAllRequisicoes } from "../../middleware/RequisicoesService.js";
import { RequisicoesPorAreaTable } from "../../components/Datatables/CustomTable.jsx";

const avatar =
"https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";


export const  RequisicoesPendentes=() => {

  const [error, setError] = useState(null);
  const [loading,setHasFinishedLoading] = useState(false);
  const [sumarioRequisicoes, setSumarioRequisicoes] = useState();
  const [value, setValue] = React.useState();
  const [requisicoesPendentes, setRequisicoesPendentes] = useState();
  const areasRef = useRef(sumarioRequisicoes);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const columnNamesPedidosArea = [

    {
      accessorKey: 'id_requisicao',
      header: 'id_requisicao',
      size: 40,
    },
    {
      accessorKey: 'data_requisicao',
      header: 'Data',
      size: 120,
    },
    {
      accessorKey: 'material_descricao',
      header: 'Material',
      size: 120,
    },
    {
      accessorKey: 'quantidade',
      header: 'Quantidade',
      size: 10,
    },
    {
      accessorKey: 'area',
      header: 'Area',
    },
    {
      accessorKey: 'id_us',
      header: 'id_us',
      size: 60,
    },
    {
      accessorKey: 'unidade_sanitaria',
      header: 'Unidade Sanitaria',
      size: 10,
    },
      {
        accessorKey: 'pf_nome',
        header: 'Nome PF',
        size: 60,
      },
    {
      accessorKey: 'pf_contacto',
      header: 'Contacto PF',
      size: 10,
    },
    {
      accessorKey: 'requisitante_nome',
      header: 'Nome do Requisitante',
      size: 60,
    },
  {
    accessorKey: 'notas',
    header: 'Notas',
    size: 10,
  } ,
     {
    accessorKey: 'projecto',
    header: 'Projecto',
    size: 60,
  },
  ];


  const [sidebarToggle] = useOutletContext();
  // get userData and isAutheticade from sessionStorage
  const sessionData = sessionStorage.getItem('userData'); // Retrieve data from localStorage
  const islogged = sessionStorage.getItem('isAuthenticated'); // Retrieve data from localStorage


  //get area property from userData
  let userData = [];
  userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data

  //get summarry of  requisicoes pendentes
useEffect(() => {
  getRequisicoesPendentesArea() 
  .then(requisicoes => { 
    setSumarioRequisicoes(requisicoes);
    setHasFinishedLoading(true);
    // get all areas and store them in an array
    areasRef.current = requisicoes.map((data, index) => (
      data.area
    ));
    // set the first area as the default value for the tab
    setValue(areasRef.current[0]);
  } )
  .catch(error => {
    // handle any error state, rejected promises, etc..
    setError(error);
    setHasFinishedLoading(true);
  });

}, []);

  //get all  requisicoes pendentes
  useEffect(() => {
    getAllRequisicoes() 
    .then(reqPendentes => { 
      setRequisicoesPendentes(reqPendentes);
    } )
    .catch(error => {
      // handle any error state, rejected promises, etc..
      setError(error);
    });
  
  }, []);


  // if user is not authenticated, redirect to login
  if(!islogged){
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }

  if(!sumarioRequisicoes || !requisicoesPendentes){
    return (
      <>
      <div className="flex justify-center items-center h-screen"> 
      <span className="us-header" ><p> Requisições de Distrbuiçao de Material: </p></span>
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

  if(sumarioRequisicoes.length===0 && requisicoesPendentes.length===0 ){
  // if there are no requisicoes pendentes, display a message using the NotificationManager
    NotificationManager.info('Nao existem requisicoes Pendentes...','Sem dados', 8000);
    
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
            Requisições de Distribuiçao de Material: 
          </h1>
           
          <div className="flex justify-center items-center h-screen"><p className="text-2xl text-gray-400">Nao existem requisicoes Pendentes...</p></div>
        </div>
      </main>
    </>
    );

  }
 const firstArea = sumarioRequisicoes[0].area;

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
            Requisições de Distribuicao de Material: 
          </h1>

          {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
           <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
          {/*   {sumarioRequisicoes?.map((data, index) => (
              <RequisicoresAreaScrolledCard key={index} data={data} />
            ))} */}

        <Box sx={{ width: '100%', typography: 'body1' }}>
              <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <TabList onChange={handleChange} 

                  >
                    {sumarioRequisicoes?.map((data, index) => (
                      // create a label containing the area name and the number of health units
                      // in that area
                     <Tab label={data.area + " (" + data.total_requisicao + ")"} value={data.area} />
                  ))}
                  </TabList>
                </Box>
                 {sumarioRequisicoes?.map((data, index) => (
                   // for each area filter all requisicoes pendentes and display them in a table
                  // with the area name as the table title

                  <TabPanel value={data.area} >
                    <RequisicoesPorAreaTable colunas = {columnNamesPedidosArea} 
                     dados = { requisicoesPendentes.filter((requisicao) => requisicao.area === data.area) }
                     areaInfo ={data.id}   />

                  </TabPanel>

                  ))} 
              </TabContext>
            </Box>

          </div>

          <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap"></div>
        </div>
      </main>
    </>
  );


  }



}

export default RequisicoesPendentes;