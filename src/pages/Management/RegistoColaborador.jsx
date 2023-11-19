import React, { useState, useEffect, useRef  } from "react";
import DashboardHeader from "../../components/Other/DashboardHeader.jsx";
import { useOutletContext } from "react-router-dom";
import { Navigate } from 'react-router-dom';
import { NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import ClipLoader from "react-spinners/ClipLoader";
import { ColaboradoresTable} from "../../components/Datatables/CustomTable.jsx";
import { getAllRoles, getAllAreas, getAllColaboradores , createColaborador} from "../../middleware/GenericService.js";
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
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';

const avatar =
"https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(name, personName, theme) {
  return {
    fontWeight:
      personName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

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
  
export const  RegistoColaborador=() => {

  const [areasProgramaticas, setAreaProgramaticas] = useState(null);
  const [roles, setRoles] = useState();
  const [colaboradores, setColaboradores] = useState();
  const [error, setError] = useState(null);
  const {enableSalvar, EnableSalvar} = useState(false);

  const [areaName, setAreaName] = React.useState([]);
  const componentTheme = useTheme();

  const handleAreaNameChange = (event) => {
    const {
      target: { value },
    } = event;
    setAreaName(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const columnNamesColaborador= [

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
      accessorKey: 'email',
      header: 'Email',
      size: 40,
    },
    {
      accessorKey: 'contacto',
      header: 'Contacto',
      size: 120,
    },
    {
      accessorKey: 'funcao',
      header: 'Cargo',
      size: 40,
    },
    {
      accessorKey: 'area',
      header: 'Area',
      size: 120,
    },   
    {
      accessorKey: 'role',
      header: 'Papel',
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
      // filter all areas with status = 'Active'
      data = data.filter(item => item.status === "Active"); 
      setAreaProgramaticas(data);
    } )
    .catch(error => {
      // handle any error state, rejected promises, etc..
      NotificationManager.error('Houve erro ao carregar  as Areas', 'Erro!', 5000);
    });

}, []);
 
useEffect(() => {
  getAllRoles() 
    .then(data => { 
      setRoles(data);
    } )
    .catch(error => {
      // handle any error state, rejected promises, etc..
      NotificationManager.error('Houve erro ao carregar os Roles', 'Erro!', 5000);
    });

}, []);


// get all colaboradores
useEffect(() => {
  getAllColaboradores()
  .then(data => {
    setColaboradores(data);
    })
  .catch(error => {
    // handle any error state, rejected promises, etc..
    NotificationManager.error('Houve erro ao carregar os Colaboradores', 'Erro!', 5000);
  });
}, []);


const fetchResultCreateUsuario = async (json) => {

  const resultado = await createColaborador(json);

  return resultado;
  
};
const fetchGetColaboradoes = async () => {

  const resultado = await getAllColaboradores();

  return resultado;
  
};
const handleSalvarColaborador = async () => {
  // first make sure that the user has selected a area and a role and have filled all required fields
  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const contacto = document.getElementById("contacto").value;
  const cargo = document.getElementById("cargo").value;
  const role_name = document.getElementById("combo-box-roles").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // if any of the fields is empty, show error message
  if(role_name === ""){
    NotificationManager.error('Selecione o Papel do Utilizador', 'Erro!', 5000);
    return;

  } else if(role_name === "Motorista"){

    if(nome === ""     || username === "" || password === "" || areaName.length === 0){
      NotificationManager.error('Preencha todos os campos', 'Erro!', 5000);
      return;
    }
  
    // username must be equal to email
    if(username !== email){
      NotificationManager.error('Username deve ser igual ao email', 'Erro!', 5000);
      return;
    }
  
    // password must be at least 8 characters long
    if(password.length < 6){
      NotificationManager.error('Password deve ter pelo menos 6 caracteres', 'Erro!', 5000);
      return;
    }
  
  
    // check if the email address is valid
    const emailRegex = /\S+@\S+\.\S+/;
    if(!emailRegex.test(email)){
      NotificationManager.error('Email invalido', 'Erro!', 5000);
      return;
    }
   //    email address should be valid and contain the domain @ccsaude.org.mz
    const emailRegex2 = /@ccsaude.org.mz/;
    if(!emailRegex2.test(email)){
      NotificationManager.error('Email Deve ser do dominio @ccsaude.org.mz ', 'Erro!', 5000);
      return;
    }
  
  
    // get all areas with the name in the areaName array
    const selectedAreas = areasProgramaticas.filter(item => areaName.includes(item.area));

    const selectedRole = roles.find(item => item.name === role_name);
  
    const ids_area = selectedAreas.map(item => item.id);
    const id_role = selectedRole.id;
  
  
  
  // using md5 hash the password
  // hash the password
  const hashedPassword = md5(password);
  
  
    // if all fields are filled, create the object to be sent to the backend
    const colaborador = {
      nome_colaborador: nome,
      emailaddress: email,
      contacto_colaborador: contacto? contacto : "N/A",
      funcao_colaborador: cargo? cargo : "Motorista",
      id_area: ids_area,
      id_role: id_role,
      user_name: email,
      pass: hashedPassword
    };
  
  
    // send the object to the backend using the createColaborador function
    try {
       let res = await fetchResultCreateUsuario(colaborador);
        NotificationManager.success("Usuario criado com sucesso: {" +  nome + " } , " + " username:  {" + username + " }" , 'Sucesso', 8000);
      


        // clear all fields
        document.getElementById("nome").value = "";
        document.getElementById("email").value = "";
        document.getElementById("contacto").value = "";
        document.getElementById("cargo").value = "";
       setAreaName([]);
        document.getElementById("combo-box-roles").value = "";
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        try {
          let colabs =  await fetchGetColaboradoes();
          if(colabs){
            setColaboradores(colabs);
          }

        } catch (error) {
          NotificationManager.error('Houve erro ao carregar os Colaboradores' + error.message, 'Erro!', 5000);
                    
        return;  
        }

        return;
    } catch (error) {
         // handle any error state, rejected promises, etc..
         if(error.response.data.message==="colaborador already exists"){
          NotificationManager.error("Usuario : { " + email + " } ja existe!", 'Duplicado', 8000);
  
        } else {
          NotificationManager.error("Houve erro ao ao criar o utilizador:" + error.message , 'Erro: ' +error.code, 8000);
        }
        }

  } else {
    if(nome === "" || email === ""  || cargo === ""   || username === "" || password === ""){
      NotificationManager.error('Preencha todos os campos', 'Erro!', 5000);
      return;
    }
    if(areaName.length === 0){
      NotificationManager.error('Selecione a Area do Utilizador', 'Erro!', 5000);
      return;
    }
  
    // username must be equal to email
    if(username !== email){
      NotificationManager.error('Username deve ser igual ao email', 'Erro!', 5000);
      return;
    }
  
    // password must be at least 8 characters long
    if(password.length < 6){
      NotificationManager.error('Password deve ter pelo menos 6 caracteres', 'Erro!', 5000);
      return;
    }
  
  
    // check if the email address is valid
    const emailRegex = /\S+@\S+\.\S+/;
    if(!emailRegex.test(email)){
      NotificationManager.error('Email invalido', 'Erro!', 5000);
      return;
    }
   //    email address should be valid and contain the domain @ccsaude.org.mz
    const emailRegex2 = /@ccsaude.org.mz/;
    if(!emailRegex2.test(email)){
      NotificationManager.error('Email Deve ser do dominio @ccsaude.org.mz ', 'Erro!', 5000);
      return;
    }
  
    //const selectedArea = areasProgramaticas.find(item => item.area === area_name);
    // find all selected areas )(areaName) in the areasProgramaticas array 
    const selectedAreas = areasProgramaticas.filter(item => areaName.includes(item.area));

    const selectedRole = roles.find(item => item.name === role_name);
  
    const ids_area = selectedAreas.map(item => item.id);
    const id_role = selectedRole.id;
  
  
  
  // using md5 hash the password
  // hash the password
  const hashedPassword = md5(password);
  
  
    // if all fields are filled, create the object to be sent to the backend
    const colaborador = {
      nome_colaborador: nome,
      emailaddress: email,
      contacto_colaborador: contacto? contacto : "N/A",
      funcao_colaborador: cargo,
      ids_area: ids_area,
      id_role: id_role,
      user_name: email,
      pass: hashedPassword
    };
  
  
    // send the object to the backend using the createColaborador function
    try {
       let res = await fetchResultCreateUsuario(colaborador);
        NotificationManager.success("Usuario criado com sucesso: {" +  nome + " } , " + " username:  {" + username + " }" , 'Sucesso', 8000);
      
        // clear all fields
        document.getElementById("nome").value = "";
        document.getElementById("email").value = "";
        document.getElementById("contacto").value = "";
        document.getElementById("cargo").value = "";
        setAreaName([]);
        document.getElementById("combo-box-roles").value = "";
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
          // update the colaboradores list
          try {
          
            let colabs = await fetchGetColaboradoes();
            if(colabs){
              setColaboradores(colabs);
            }
  
  
          } catch (error) {
            NotificationManager.error('Houve erro ao carregar os Colaboradores' + error.message, 'Erro!', 5000);
                      
          return;  
          }

        //EnableSalvar(true);
        return;
    } catch (error) {
         // handle any error state, rejected promises, etc..
         if(error.response.data.message==="colaborador already exists"){
          NotificationManager.error("Usuario : { " + email + " } ja existe!", 'Duplicado', 8000);
  
        } else {
          NotificationManager.error("Houve erro ao ao criar o utilizador:" + error.message , 'Erro: ' +error.code, 8000);
        }
        }


  }


}

const handleCancel = () => {
  // redirect to  / 
  window.location.href = "/";
  


}


  // if user is not authenticated, redirect to login
  if(!islogged){
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }

  if(! areasProgramaticas || ! roles || ! colaboradores){
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
        <span className="us-header" ><p>Registo de Novo Colaborador: </p></span>
        <ClipLoader color="#36d7b7"  size={30}/><span > Carregando dados...</span> 
        </div>
            
          </div>

          <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap">
            
          </div>
  
      </main>

     
      </>
    );


  }  else {



         let list_areas = [];
         let list_roles = [];
          // create an array of motoristas with the properties label as their names and id as the id
          areasProgramaticas.forEach((item) => {
            list_areas.push({label: item.area, id: item.id});
          }
          );
          roles.forEach((role) => {
            list_roles.push({label: role.name, id: role.id});
          }
          );


    const colaboradoresList = colaboradores.map((colaborador) => {
      return {
        id: colaborador.id,
        nome: colaborador.nome,
        email: colaborador.email,
        contacto: colaborador.contacto,
        funcao: colaborador.funcao,
        area: colaborador.area,
        role: colaborador.role,
        status: colaborador.status,
      };
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
                  <h1 className="text-slate-500 pb-3 text-base md:text-lg">
                  Usuarios:
                  </h1>
           
                  {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
                   <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
                    
              <ColaboradoresTable colunas={columnNamesColaborador} dados={colaboradoresList}/>

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
        
                    <TextField required id="nome" label="Nome :" variant="standard"    sx={{ width: 200 }}/>	
                    </TableCell>
                    <TableCell align = "left">  <TextField required id="email" label="Email :" variant="standard"    sx={{ width: 200 }} />	</TableCell>
                    <TableCell align = "left"> 
                    <TextField  id="contacto" label="Contacto :" variant="standard" />	
                    </TableCell>
                    <TableCell align = "left">
                      <TextField  id="cargo" label="Cargo:" variant="standard"    sx={{ width: 200 }} />	
                      </TableCell>
                 </TableRow>
                 <TableRow >

                    <TableCell align = "right">
         {/*            < Autocomplete
                    disablePortal
                    
                    id="combo-box-area"
                    options={list_areas}
                    sx={{ width: 200 }}
                    renderInput={(params) => <TextField {...params} label="Area Programatica" />}
                    /> */}
                    
      <FormControl sx={{  width: 300 }}>
        <InputLabel id="demo-multiple-chip-label">Area:</InputLabel>
        <Select
          labelId="multiple-chip-label"
          id="combo-box-area"
          multiple
          value={areaName}
          onChange={handleAreaNameChange}
          input={<OutlinedInput id="select-multiple-chip" label="Area:" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
          MenuProps={MenuProps}
        >
          {list_areas.map((item) => (
            <MenuItem
              key={item.id}
              value={item.label}
              style={getStyles(item.label, areaName, componentTheme)}
            >
              {item.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

                    </TableCell>
                    <TableCell align = "left">     < Autocomplete
                    disablePortal
                    required
                    id="combo-box-roles"
                    options={list_roles}
                    sx={{ width: 200 }}
                    renderInput={(params) => <TextField {...params} label="Papel no sistema:" />}
                    /> </TableCell>

<TableCell align = "left">
        
        <TextField required id="username" label="Username :" variant="standard"    sx={{ width: 200 }}/>	
        </TableCell>
        <TableCell align = "left">  <TextField required id="password" label="Password :" variant="standard"    sx={{ width: 200 }} />	</TableCell>

                 </TableRow>
                 <TableRow >
                 <TableCell align="center"> </TableCell>
                <TableCell align="center"><br></br></TableCell>
                 <TableCell align="left">  
                 {/*  <Button variant="contained" onClick={handleSalvarColaborador}  disabled={enableSalvar }>Salvar</Button> */}</TableCell>
                 <TableCell align="left">{/* <Button variant="contained" onClick={handleCancel} disabled = {false} >Cancelar</Button> */}</TableCell>
                   </TableRow>

            </TableBody>
          </Table>
         </TableContainer> 
         </ThemeProvider>

         <TableContainer component={Paper}>
            <Table sx={{ minWidth: 350 }} size="small" aria-label="a dense table">
              <TableHead>
            <TableRow>
              <TableCell align="center"> </TableCell>
              <TableCell align="center"></TableCell>
              <TableCell align="center"> </TableCell>
              <TableCell align="center"></TableCell>
              <TableCell align="center"> </TableCell>
              <TableCell align="center"></TableCell>
              <TableCell align="center"> </TableCell>
              <TableCell align="center"></TableCell>
              <TableCell align="center"> </TableCell>
              <TableCell align="center"></TableCell>
              <TableCell align="center"> </TableCell>
              <TableCell align="center"></TableCell>
              <TableCell align="center"> </TableCell>
              <TableCell align="center"></TableCell>
              <TableCell align="center"> </TableCell>
              <TableCell align="center"></TableCell>
              <TableCell align="center"> </TableCell>
              <TableCell align="center"></TableCell>
              <TableCell align="right">  
                  <Button variant="contained" onClick={handleSalvarColaborador}  disabled={false }>Salvar</Button></TableCell>
                 <TableCell align="right"><Button variant="contained" onClick={handleCancel} disabled = {false} >Cancelar</Button></TableCell>
            </TableRow> 
          </TableHead>
              <TableBody>
                 <TableRow ></TableRow>
              </TableBody>
            </Table>
            </TableContainer>

          </div>
          </div>
          <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap">
            
          </div>
       
      </main>
    </>
  );


  }



}

export default RegistoColaborador;