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
import  GuiaHeader from "./HeaderGuia.jsx";
import { useLocation } from "react-router-dom";
import MaterialGuia from "./MaterialGuia.jsx";
import MaterialGuiaHeader from "./MaterialGuiaHeader.jsx";
import MaterialGuiaFooter from "./MaterialGuiaFooter.jsx";
import { getAllMotoristas } from "../../middleware/GenericService.js";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Button from '@mui/material/Button';
import { createGuia } from "../../middleware/GuiaService.js";

const avatar =
"https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";


export const  NovaGuia=() => {

  const [error, setErrorSaveGuia] = useState(null);
  const [motoristas, setMotoristas] = useState();
  const [datePrevisaoEntrega, setPrevisaoEntrega] = React.useState(null);
  const [loading , setLoadingSaveGuia] = useState(false);
 // create 2 states to enable or disable the salvar and imprimir guia buttons
  const [enableSalvar, setEnableSalvar] = useState(false);
  const [enableImprimir, setEnableImprimir] = useState(true);
  const [nrGuia, setNrGuia] = useState("");
  


  let materiaisGuia = [];
  let estado = "";
  const location = useLocation();
  let areaID = 0;
  let list_motoristas = [];
// Parse the retrieved data
estado = location.state ? location.state : null; 

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
  }
  ];


  const [sidebarToggle] = useOutletContext();
  // get userData and isAutheticade from sessionStorage
  const sessionData = sessionStorage.getItem('userData'); // Retrieve data from localStorage
  const islogged = sessionStorage.getItem('isAuthenticated'); // Retrieve data from localStorage


  //get area property from userData
  let userData = [];
  userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data

  

  //get all  motoristas 
  useEffect(() => {
    getAllMotoristas() 
    .then(drivers => { 

      setMotoristas(drivers);

    } )
    .catch(error => {
      // handle any error state, rejected promises, etc..
      NotificationManager.error('Houve erro ao carregar os motoristas', 'Erro!', 5000);
    });
  
  }, []);

  const fetchResultGuia = async (json) => {

    const resultado = await createGuia(json);

    return resultado;
    
  };
  
const handleSalvarGuia = async () => {


  // get the id of the motorista from the selected value
  let selected_motorista = document.getElementById("combo-box-motoristas").value;
  let id_motorista = null;
  // if nothing is selected show an error message
  if(!selected_motorista){

    NotificationManager.error('Selecione um motorista', 'Erro!', 5000);
    return;

  } else{
 // get the id of the motorista from the selected value
   id_motorista = motoristas.filter((motorista) => (
    motorista.nome === selected_motorista
  ))[0].id;

  }

  let unidade_sanitaria = materiaisGuia[0].id_us;
  
  // if nothing is selected show an error message
  if(!datePrevisaoEntrega){
    NotificationManager.error('Selecione uma data de entrega', 'Erro!', 5000);
    return;
  }


  let observacao = document.getElementById("guia-observacao").value;

  areaID = estado.areaInfo ;


  let nr_guia = document.getElementById("nr-guia").value;
  // if nothing is selected show an error message
  if(!nr_guia){
    NotificationManager.error('Insira o numero da guia', 'Erro!', 5000);
    return;
  } else{

     // check if nr_guia is a number
    if(isNaN(nr_guia)){
      NotificationManager.error('O numero da guia deve ser um numero', 'Erro!', 5000);
      return;
    }
    //cast nr_guia to string
    nr_guia = nr_guia.toString();
  }

  // get all ids of requisicoes
  let id_requisicao = materiaisGuia.map((material) => (
    material.id_requisicao
  ));


  // cast datePrevisaoEntrega to date
  let datePrevisaoEntregaDate = new Date(datePrevisaoEntrega);
  

// get projecto from materiasGuia
 let projecto = materiaisGuia[0].projecto;


let guia = {
  id_motorista: id_motorista,
  us: unidade_sanitaria,
  entrega: datePrevisaoEntregaDate,
  notas: observacao,
  id_area: areaID,
  numero_guia: nr_guia,
  id_requisicao: id_requisicao,
  projecto: projecto,
};

// send guia to backend
// call fetchResult function using the useffect hook

  try {

    setLoadingSaveGuia(true);
    let res = await fetchResultGuia(guia);

     
   NotificationManager.success("Guia de Entrega {" +  nr_guia + " } registado."  , 'Success', 5000);
   setEnableSalvar(true);
   setEnableImprimir(false);
   setNrGuia(nr_guia);
   // save nr_guia  to estado object
   estado.nr_guia = nr_guia;
   // wait 2 seconds then redirect to PedidosPendentesArea
    setTimeout(() => {
      setLoadingSaveGuia(false);
      // redirect to PedidosPendentesArea
      window.location.href = "/pedidosArea";
    }, 2000);


   // add nr_guia  to location state
  } catch (error) {
       // handle any error state, rejected promises, etc..
       setErrorSaveGuia(error);
       if(error.response.data.message==="nr_guia must be unique"){
        NotificationManager.error("O numero da guia ja existe : { " + nr_guia + " } ", '# Guia Duplicado', 8000);
        return;  
      } else {
        NotificationManager.error("Houve erro ao gravar a Gua: " + error.message , 'Erro: ' +error.code, 8000);
        setLoadingSaveGuia(false);
      }

  
  }

  }

const handleImprimirGuia = () => {}


  // if user is not authenticated, redirect to login
  if(!islogged){
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }

  if(!estado || !motoristas){
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
        <div className="flex justify-center items-center h-screen"> 
        <span className="us-header" ><p> Nova guia: </p></span>
        <ClipLoader color="#36d7b7"  size={30}/><span > Carregando dados...</span> 
        </div>
            
          </div>

          <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap">
            
          </div>
  
      </main>

     
      </>
    );


  }  else {

    materiaisGuia = estado.materiasRequisitados;


      //TODO Fix this should be done in the return statement
      // create an array of motoristas with the properties label as their names and id as the id
      motoristas.forEach((motorista) => {
        list_motoristas.push({label: motorista.nome, id: motorista.id});
      }
      );

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
         {/* Render NewComponent */}
            {/* <GuiaHeader user={userData[0].nome }/> */}

           

            {/* Create a div with a fixed width. and render  <MaterialGuia rows={materiaisGuia}/>  */}
            <div className="flexjustify-down items-down h-screen">
            <div className="w-[950px]">
            <MaterialGuiaHeader  user={userData[0].nome }  nr_guia={nrGuia} />
            <MaterialGuia rows={materiaisGuia}/>
            <MaterialGuiaFooter materiais={materiaisGuia}/>
            
            <TableContainer component={Paper}>
            <Table sx={{ minWidth: 350 }} size="small" aria-label="a dense table">
              <TableHead>
                 <TableRow>
                    <TableCell align="right">     
                    <div>
                     <p>
                      <br></br>
                     </p>
                    </div>  
                    </TableCell>
                    <TableCell align="right">{"           "}</TableCell>
                   <TableCell align="right">{"           "}</TableCell>
                   <TableCell align="center">{"           "}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                 <TableRow >
                    <TableCell align = "left">
                    < Autocomplete
                    disablePortal
                    id="combo-box-motoristas"
                    options={list_motoristas}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} label="Alocar ao Motorista" />}
                    />

                    </TableCell>
                    <TableCell align = "left">  Data Prevista de Entrega: </TableCell>
                    <TableCell align = "left"> 
                     <LocalizationProvider dateAdapter={AdapterDayjs}>
                     <DatePicker value={datePrevisaoEntrega} onChange={(newValue) => setPrevisaoEntrega(newValue)}/>
                    </LocalizationProvider>
                    </TableCell>
                    <TableCell align = "left">
                      <TextField id="guia-observacao" label="Observacao" variant="outlined" />	
                      </TableCell>
                 </TableRow>
                 <TableRow >
                    <TableCell align = "right">
                   NR DA GUIA:
                    </TableCell>
                    <TableCell align = "left">   <TextField    id="nr-guia" label="# guia" variant="standard" />	 </TableCell>
                    <TableCell align = "left"> 
                    <Button variant="contained"onClick={handleSalvarGuia}  disabled={enableSalvar }>Salvar</Button>
                    </TableCell>
                    <TableCell align = "left">
                    <Button variant="contained"onClick={handleImprimirGuia} disabled = {enableImprimir} >Imprimir</Button>
                      </TableCell>
                 </TableRow>

            </TableBody>
          </Table>
         </TableContainer> 
          </div>
            <div className="motoristas">
            </div>
          </div>
          <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap">
          </div>
          </div>
      </main>
    </>
  );


  }



}

export default NovaGuia;