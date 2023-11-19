import React, { useState, useEffect, useRef  } from "react";
import DashboardHeader from "../../components/Other/DashboardHeader.jsx";
import { useOutletContext } from "react-router-dom";
import { Navigate } from 'react-router-dom';
import { NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import ClipLoader from "react-spinners/ClipLoader";
import { useLocation } from "react-router-dom";
import MaterialGuia from "./MaterialGuia.jsx";
import MaterialGuiaHeader from "./MaterialGuiaHeader.jsx";
import MaterialGuiaFooter from "./MaterialGuiaFooter.jsx";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import {listRequisicoesByGuia,updateGuia,getGuiaSaida} from "../../middleware/GuiaService.js";
import { wait } from "@testing-library/user-event/dist/utils/index.js";
import  exportData from "../../Reporting/SheetJs.jsx";
import {VisualizarGuiSaida} from "../../Reporting/GuiaTemplate.js";
import { getAllMotoristas } from "../../middleware/GenericService.js";

const avatar =
"https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";


export const  VisualizarGuia=() => {

  const [error, setErrorLoadingRequisicoes] = useState(null);
  const [requisicoesDaGuia, setRequisicoesDaGuia] = useState();
  const [loading , setLoadingRequisicoesGuia] = useState(false);
 // create 2 states to enable or disable the salvar and imprimir guia buttons
  const [enableApagar,    setEnableApagar] = useState(true);
  const [enableImprimir,  setEnableImprimir] = useState(false);
  const [motoristas, setMotoristas] = useState();
  const [listMotoristas,setListMotoristas] =  useState([]);
  const [selectedMotorista, setSelectedMotorista] = useState(null);
  const [guiaSaida, setGuiaSaida] = useState();

  let newMotorista = null;
  
  let counter = 0;
  let list_motoristas = [];
  let estado = null;
  const location = useLocation();
  // let guiaSaida = [];
  let nrGuia = "";
  let tempSessionGuiaSaida = [];
  let tempSessionNrGuia =[];
// Parse the retrieved data
estado = location.state ? location.state : null; 
// get guiaSaida from estado


tempSessionGuiaSaida = estado ? estado.requisicoes : null;
tempSessionNrGuia = estado ? estado.tempNrGuia : null;

let tmpguiaSaida= tempSessionGuiaSaida[0];
nrGuia = tempSessionNrGuia;
// transfor guiaSaida to an json array


 // listRequisicoesByGuia
  const [sidebarToggle] = useOutletContext();
  // get userData and isAutheticade from sessionStorage
  const sessionData = sessionStorage.getItem('userData'); // Retrieve data from localStorage
  const islogged = sessionStorage.getItem('isAuthenticated'); // Retrieve data from localStorage


  //get area property from userData
  let userData = [];
  userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data

  //get all  requisicoes from guia using the nr_guia from guiaSaida
useEffect(() => {
    if(nrGuia){
        listRequisicoesByGuia(nrGuia)
        .then((response) => {
            setRequisicoesDaGuia(response);
            setLoadingRequisicoesGuia(true);
            })
        .catch( error => {
                // handle any error state, rejected promises, etc ...
                // NotificationManager.error('Houve erro ao carregar as requisicoes da guia {'+ guiaSaida.nr_guia + '}', 'Erro!', 8000);
                setErrorLoadingRequisicoes(error);
            } );
    }

}, [nrGuia]);

  //get all  motoristas 
  useEffect(() => {
    getAllMotoristas() 
    .then(drivers => { 

      setMotoristas(drivers);
      

      // if list_motoristas is empty, fill it with the drivers
      if(listMotoristas.length === 0){
       //TODO Fix this should be done in the return statement
      // create an array of motoristas with the properties label as their names and id as the id
      if(requisicoesDaGuia){
      let tempMotorista = requisicoesDaGuia[0].motorista;
     
      drivers.forEach((motorista) => {
        list_motoristas.push({label: motorista.nome, id: motorista.id});
      }
      );

      // get the index of the selected motorista from the drivers
      let index = list_motoristas.findIndex((driver) => driver.label === tempMotorista);
       setSelectedMotorista(list_motoristas[index]);
       setListMotoristas(list_motoristas);

    }
  }
      
    } )
    .catch(error => {
      // handle any error state, rejected promises, etc..
      NotificationManager.error('Houve erro ao carregar os motoristas', 'Erro!', 5000);
    });
  
  }, [requisicoesDaGuia]);

  // get guiaSaida  from the rest api using the nrGuia
    
  useEffect(() => {
    if(nrGuia){
      getGuiaSaida(nrGuia)
      .then((response) => {
        setGuiaSaida(response);
      })
      .catch( error => {
        // handle any error state, rejected promises, etc ...
        NotificationManager.error('Houve erro ao carregar a guia {'+ nrGuia + '}', 'Erro!', 8000);
        setErrorLoadingRequisicoes(error);
      } );
    }
  }, [nrGuia]);



const fetchResultUpdateGuia = async (json) => {

  const resultado = await updateGuia(json);

  return resultado;
  
};


const handleImprimirGuia = async() => {

  // modify requisicoesDaGuia to an jsonArray . the jsonArray mus have the following structure
  //  [{ material_descricao, quantidade, condicao, unidade_sanitaria,area,pf_nome, pf_contacto}]
  let jsonArray = [];
  requisicoesDaGuia.forEach((requisicao) => {
    jsonArray.push({
      material_descricao: requisicao.material_descricao,
      quantidade: requisicao.quantidade,
      condicao: 'BOM',
      sector: `${requisicao.unidade_sanitaria}/{${requisicao.area}}\n P. Focal: {${requisicao.pf_nome}/${requisicao.pf_contacto}}`
    });
  });


  // format sector to  material.unidade_sanitaria + "/{"+ material.area + "}" + "\n" + // "P. Focal: {"+ material.
  // pf_nome + "/" + material.pf_contacto + "}" 

 await VisualizarGuiSaida( nrGuia, guiaSaida, jsonArray);


}
const handleApagar =() => {}


const handleConfirmar = async () =>  {

  // first get id_guia from requisicoesDaGuia
  const idGuia = requisicoesDaGuia[0].id_guia;
  const nr_guia = requisicoesDaGuia[0].nr_guia;
  // update the guia with the id_guia using the api function updateGuia from GuiaService. use a hook (useEffect) function to update the guia
  let guia = {
    id_guia: idGuia,
    driver_id: selectedMotorista.id,
    confirmed_by  : userData[0].id};
 
    try {

     let res = await fetchResultUpdateGuia(guia);
     NotificationManager.success("Confirmada a Entrega da Guia: {" +  nr_guia + " }"  , 'Sucesso', 5000);
    // setEnableConfirmar(true);
     // refresh the page
     wait(5000);
      window.location.reload();
  } catch (error) {
       // handle any error state, rejected promises, etc..
        NotificationManager.error("Houve erro ao confirmar Entrega : " + error.message , 'Erro: ' +error.code, 8000);

      }
  }
  
  const handleSelectedMotoristaChange = (event, newValue) => {
    if (newValue !== selectedMotorista) {
      setSelectedMotorista(newValue);
      newMotorista = newValue;
    }
  };
  // if user is not authenticated, redirect to login
  if(!islogged){
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }

  if(!requisicoesDaGuia || !motoristas || !guiaSaida){
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
        <span className="us-header" ><p> Guia de Saida: </p></span>
        <ClipLoader color="#36d7b7"  size={30}/><span > Carregando dados...</span> 
        </div>
            
          </div>

          <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap">
            
          </div>
  
      </main>

     
      </>
    );


  }  else {

                      // if guiaSaida is confirmed, show a noftification and disable the confirmar button
                      if(guiaSaida.confirmedby && counter === 0){
                        NotificationManager.info('Esta Guia de Saida ja foi entregue...','Guia de Saida Confirmada', 8000);
                        // setEnableConfirmar(true);
                        counter++;
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
         {/* Render NewComponent */}
            {/* <GuiaHeader user={userData[0].nome }/> */}

           

            {/* Create a div with a fixed width. and render  <MaterialGuia rows={materiaisGuia}/>  */}
            <div className="flexjustify-down items-down h-screen">
            <div className="w-[950px]">
            <MaterialGuiaHeader  creator={guiaSaida[0].createdby}  user={userData[0].nome }  nr_guia={nrGuia} data_entrega={requisicoesDaGuia[0].data_entrega? requisicoesDaGuia[0].data_entrega: ""}/>
            <MaterialGuia rows={requisicoesDaGuia}/>
            <MaterialGuiaFooter confirmed={guiaSaida[0].confirmedby}  driver={requisicoesDaGuia[0].motorista }/>
            
            <TableContainer component={Paper}>
            <Table sx={{ minWidth: 350 }} size="small" aria-label="a dense table">
              <TableHead>
                {/*  <TableRow>
                    <TableCell align="right">     
                    <div>
                     <p>
                      <br></br>
                      <br></br>
                     </p>
                    </div>  
                    </TableCell>
                    <TableCell align="right">{"           "}</TableCell>
                   <TableCell align="right">{"           "}</TableCell>
                   <TableCell align="center">{"           "}</TableCell>
                </TableRow> */}
              </TableHead>
              <TableBody>
                 <TableRow >
                    <TableCell align = "left">
                    {/* <b>Motorista Alocado: </b> {" " +requisicoesDaGuia[0].motorista} */}
                    < Autocomplete
                    disablePortal
                    id="combo-box-motoristas"
                    options={listMotoristas}
                    value={selectedMotorista}
                    onChange={handleSelectedMotoristaChange}
                    sx={{ width: 200 }}
                     renderInput={(params) => <TextField {...params} label="Motorista Alocado:" />}
                    />
                    </TableCell>
                    <TableCell align = "right"> <b> Data Prevista de Entrega:</b> </TableCell>
                    <TableCell align = "left">       {"" + requisicoesDaGuia[0].previsao_entrega}

                    </TableCell>
                    <TableCell align = "left">
                      {/* <TextField id="guia-observacao" label="Observacao" variant="outlined" />	 */}
                      <b> Observação:  </b> { requisicoesDaGuia[0].observacao ?    requisicoesDaGuia[0].observacao : "" }
                      </TableCell>
                 </TableRow>
                 <TableRow >
                    <TableCell align = "right">
                
                    </TableCell>
                    <TableCell align = "left">
                    <Button variant="contained"onClick={handleConfirmar}  disabled={requisicoesDaGuia[0].status==="NOVA" && userData[0].role==="Logistica" ? false: true  }>Confirmar Entrega</Button>
                        </TableCell>
                    <TableCell align = "left"> 
                    <Button variant="contained"onClick={handleApagar}  disabled={enableApagar }>Apagar</Button>
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

export default VisualizarGuia;