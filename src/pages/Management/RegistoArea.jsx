import React, { useState, useEffect, useRef  } from "react";
import DashboardHeader from "../../components/Other/DashboardHeader.jsx";
import { useOutletContext } from "react-router-dom";
import { Navigate } from 'react-router-dom';
import { NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import ClipLoader from "react-spinners/ClipLoader";
import { AreasProgramaticasTable} from "../../components/Datatables/CustomTable.jsx";
import {  getAllAreas , createArea} from "../../middleware/GenericService.js";
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
  
export const  RegistoArea=() => {

  const [areasProgramaticas, setAreaProgramaticas] = useState(null);

  const columnNamesArea= [

    {
      accessorKey: 'id',
      header: 'ID',
      size: 40,
    },
    {
      accessorKey: 'area',
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


  //get area property from userData
  let userData = [];
  userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data

  

  //get all areas
useEffect(() => {
  getAllAreas() 
    .then(data => { 
      setAreaProgramaticas(data);
    } )
    .catch(error => {
      // handle any error state, rejected promises, etc..
      NotificationManager.error('Houve erro ao carregar  as Areas', 'Erro!', 5000);
    });

}, []);
 




const fetchResultCreateArea = async (json) => {

  const resultado = await createArea(json);

  return resultado;
  
};

const handleSalvarArea = async () => {
  // first make sure that the user has selected a area and a role and have filled all required fields
  const area_name = document.getElementById("nome").value;
  const descricao_area = document.getElementById("descricao").value;


  // if any of the fields is empty, show error message
  if(area_name === "" || descricao_area === "" ){
    NotificationManager.error('Preencha todos os campos', 'Erro!', 5000);
    return;
  }

    // if selectedArea exists, show error message (duplicated area)
    const selectedArea = areasProgramaticas.find(item => item.area === area_name);

    if(selectedArea){
        NotificationManager.error("Area : { " + area_name + " } ja existe!", 'Duplicado', 5000);
        return;

    }

  // if all fields are filled, create the object to be sent to the backend
  const area = {
    name_area: area_name,
    descricao_area: descricao_area,
  };


  // send the object to the backend using the createArea function
  try {
     let res = await fetchResultCreateArea(area);
      NotificationManager.success("Area criado com sucesso: {" +  area_name + " }  " , 'Sucesso', 4000);
      wait(3000);
      // update the colaboradores list
      try {
      getAllAreas()
        .then(data => {
          setAreaProgramaticas(data);
          })
      } catch (error) {
        NotificationManager.error('Houve erro ao carregar Areas' + error.message, 'Erro!', 4000);
                  
      return;  
      }
      // clear all fields
      document.getElementById("nome").value = "";
        document.getElementById("descricao").value = "";
      return;
  } catch (error) {
       // handle any error state, rejected promises, etc..
       if(error.response.data.message==="area already exists"){
        NotificationManager.error("Area : { " + area_name + " } ja existe!", 'Duplicado', 5000);

      } else {
        NotificationManager.error("Houve erro ao ao criar a Area:" + error.message , 'Erro: ' +error.code, 5000);
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

  if(! areasProgramaticas){
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
        <span className="us-header" ><p>Gestão de Areas: </p></span>
        <ClipLoader color="#36d7b7"  size={30}/><span > Carregando dados...</span> 
        </div>
            
          </div>

          <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap">
            
          </div>
  
      </main>

     
      </>
    );


  }  else {
 

    const areasList = areasProgramaticas.map((area) => {
      return {
        id: area.id,
        area: area.area,
        descricao: area.descricao,
        status: area.status,
      };
    }
    );
    //sort by name
    areasList.sort((a, b) => (a.area > b.area) ? 1 : -1);



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
                  Áreas Programáticas:
                  </h1>
           
                  {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
                   <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
                    
              <AreasProgramaticasTable colunas={columnNamesArea} dados={areasList}/>

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
              <StyledTableCell align="center"><b>Registar Nova:</b></StyledTableCell>
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
                  <Button variant="contained" onClick={handleSalvarArea}  disabled={false }>Salvar</Button></TableCell>
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

export default RegistoArea;