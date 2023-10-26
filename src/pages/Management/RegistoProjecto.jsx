import React, { useState, useEffect, useRef  } from "react";
import DashboardHeader from "../../components/Other/DashboardHeader.jsx";
import { useOutletContext } from "react-router-dom";
import { Navigate } from 'react-router-dom';
import { NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import ClipLoader from "react-spinners/ClipLoader";
import { ProjectosTable} from "../../components/Datatables/CustomTable.jsx";
import {  getAllProjectos , createProjecto} from "../../middleware/GenericService.js";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import { styled } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Button from '@mui/material/Button';
import md5 from 'md5';
import { wait } from "@testing-library/user-event/dist/utils/index.js";



const avatar =
"https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";


let theme = createTheme({
  palette: {
    primary: {
      main: '#8a8686',
    },
    secondary: {
      main: '#edf2ff',
    },
  },
});


const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor:  theme.palette.primary.main,
      color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14,
    },
  }));
  
export const  RegistoProjecto=() => {

  const [projectos, setProjectos] = useState(null);

  const columnNamesProjecto= [

    {
      accessorKey: 'id',
      header: 'ID',
      size: 40,
    },
    {
      accessorKey: 'nome',
      header: 'Nome',
      size: 120,
    },
    {
        accessorKey: 'descricao',
        header: 'Descricao',
        size: 120,
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        size: 120,
      },
   
  ];
  


  const [sidebarToggle] = useOutletContext();
  // get userData and isAutheticade from sessionStorage
  const sessionData = sessionStorage.getItem('userData'); // Retrieve data from localStorage
  const islogged = sessionStorage.getItem('isAuthenticated'); // Retrieve data from localStorage


  //get projecto property from userData
  let userData = [];
  userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data

  

  //get all projectos
useEffect(() => {
  getAllProjectos() 
    .then(data => { 
      setProjectos(data);
    } )
    .catch(error => {
      // handle any error state, rejected promises, etc..
      NotificationManager.error('Houve erro ao carregar  as Projectos', 'Erro!', 5000);
    });

}, []);
 

const fetchGetProjectos = async () => {

    const resultado = await getAllProjectos();
  
    return resultado;
    
  };
  


const fetchResultCreateProjecto = async (json) => {

  const resultado = await createProjecto(json);

  return resultado;
  
};

const handleSalvarProjecto = async () => {
  // first make sure that the user has selected a projecto and a role and have filled all required fields
  const projecto_name = document.getElementById("nome").value;
  const descricao_projecto = document.getElementById("descricao").value;


  // if any of the fields is empty, show error message
  if(projecto_name === "" || descricao_projecto === "" ){
    NotificationManager.error('Preencha todos os campos', 'Erro!', 5000);
    return;
  }

    // if selectedProjecto exists, show error message (duplicated projecto)
    let selectedProjecto = projectos.find(item => item.nome === projecto_name);

    if(selectedProjecto){
        NotificationManager.error("Projecto : { " + projecto_name + " } ja existe!", 'Duplicado', 5000);
        return;

    }

  // if all fields are filled, create the object to be sent to the backend
  const projecto = {
    nome_projecto: projecto_name,
    descricao_projecto: descricao_projecto,
  };


  // send the object to the backend using the createProjecto function
  try {
     let res = await fetchResultCreateProjecto(projecto);
      NotificationManager.success("Projecto criado com sucesso: {" +  projecto_name + " }  " , 'Sucesso', 4000);

            // clear all fields
            document.getElementById("nome").value = "";
            document.getElementById("descricao").value = "";

      // update the colaboradores list
      try {
      let projectos = await fetchGetProjectos();
      if(projectos){
        setProjectos(projectos);
      }
      } catch (error) {
        NotificationManager.error('Houve erro ao carregar Projectos' + error.message, 'Erro!', 4000);
                  
      return;  
      }

      return;
  } catch (error) {
       // handle any error state, rejected promises, etc..
       if(error.response.data.message==="projecto already exists"){
        NotificationManager.error("Projecto : { " + projecto_name + " } ja existe!", 'Duplicado', 5000);

      } else {
        NotificationManager.error("Houve erro ao ao criar a Projecto:" + error.message , 'Erro: ' +error.code, 5000);
      }
      }

}

const handleCancel = () => {
  // route to Dashboard
    window.location.href = "/";


}


  // if user is not authenticated, redirect to login
  if(!islogged){
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }

  if(! projectos){
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
        <span className="us-header" ><p>Gestão de Projectos: </p></span>
        <ClipLoader color="#36d7b7"  size={30}/><span > Carregando dados...</span> 
        </div>
            
          </div>

          <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap">
            
          </div>
  
      </main>

     
      </>
    );


  }  else {
 

    const projectosList = projectos.map((projecto) => {
      return {
        id: projecto.id,
        nome: projecto.nome,
        descricao: projecto.descricao,
        status: projecto.status,
      };
    }
    );
    //sort by name
    // projectosList.sort((a, b) => (a.nome > b.nome) ? 1 : -1);



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
                  Projectos:
                  </h1>
           
                  {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
                   <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
                    
              <ProjectosTable colunas={columnNamesProjecto} dados={projectosList}/>

              <ThemeProvider theme={theme}>
            <TableContainer component={Paper}>
            <Table sx={{ minWidth: 350 }} size="small" aria-label="a dense table">
              <TableHead>
                 <TableRow>
                    <TableCell align="right">     
                    <div>
                     <p>
                      <br></br>
                      <br></br>
                      <br></br>
                     </p>
                    </div>  
                    </TableCell>
                    <TableCell align="right">{"           "}</TableCell>
                   <TableCell align="right">{"           "}</TableCell>
                   <TableCell align="center">{"           "}</TableCell>
                </TableRow>
            <TableRow>
              <StyledTableCell align="center"> </StyledTableCell>
              <StyledTableCell align="center"><b>Registar Novo:</b></StyledTableCell>
              <StyledTableCell align="center"></StyledTableCell>
              <StyledTableCell align="center"></StyledTableCell>
            </TableRow> 
          </TableHead>
              <TableBody>
                 <TableRow >
                    <TableCell align = "left">
        
                    <TextField required id="nome" label="Nome :" variant="standard"    sx={{ width: 250 }}/>	
                    </TableCell>
                    <TableCell align = "left"> <TextField  required id="descricao"  label="Descricao :" variant="standard"    sx={{ width: 300 }}/>	</TableCell>
                    <TableCell align = "left"> 
                   
                    </TableCell>
                    <TableCell align = "left">
                    
                      </TableCell>
                 </TableRow>
                 <TableRow >
                 </TableRow>
                 <TableRow >
                 <TableCell align="center"> </TableCell>
                <TableCell align="center"><br></br></TableCell>
                 <TableCell align="left">  
                  <Button variant="contained" onClick={handleSalvarProjecto}  disabled={false }>Salvar</Button></TableCell>
                 <TableCell align="left"> <Button variant="contained" onClick={handleCancel} disabled = {false} >Cancelar</Button> </TableCell>
                   </TableRow>

            </TableBody>
          </Table>
         </TableContainer> 
         </ThemeProvider>

          </div>
          </div>
          <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap">
            
          </div>
       
      </main>
    </>
  );


  }



}

export default RegistoProjecto;