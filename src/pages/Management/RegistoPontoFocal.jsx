import TextField from "@mui/material/TextField";
import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar/Index";
import { useOutletContext } from "react-router-dom";
import { MinhasRequisicoesTable } from "../../components/Datatables/CustomTable";
import { getLocations } from "../../middleware/GenericService";
import ClipLoader from "react-spinners/ClipLoader";
import { NotificationManager } from "react-notifications";
import "react-notifications/lib/notifications.css";
import { Navigate } from "react-router-dom";
import Autocomplete from "@mui/material/Autocomplete";
import DashboardHeader from "../../components/Other/DashboardHeader.jsx";
import { getPontosFocais } from "../../middleware/GenericService";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import { styled } from "@mui/material/styles";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { green } from "@mui/material/colors";
import {
  OutlinedInput,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControl,
} from "@mui/material";
import { getAreas } from "../../middleware/GenericService";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { PontosFocaisTable } from "../../components/Datatables/CustomTable";
import { createPontoFocal, getAllAreas } from "../../middleware/GenericService";

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
      main: "#BFDBFE",
    },
    secondary: {
      main: "#BFDBFE",
    },
    other: {
      main: "#14532D",
    },
  },
});

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.other.main,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const columnNamesPontoFocal = [
  {
    accessorKey: "id",
    header: "ID",
    size: 10,
  },
  {
    accessorKey: "nome",
    header: "Nome do PF",
    size: 120,
    enableEditing: false,
  },
  {
    accessorKey: "contacto",
    header: "Contacto do PF",
    size: 10,
    enableEditing: false,
  },
  {
    accessorKey: "unidade_sanitaria",
    header: "Unidade Sanitaria",
    size: 40,
  },
  {
    accessorKey: "unidade_sanitaria_id",
    header: "Unidade Sanitaria ID",
    size: 40,
  },

  {
    accessorKey: "area",
    header: "Area",
    size: 10,
    enableEditing: false,
  },
  {
    accessorKey: "area_id",
    header: "Area ID",
    size: 10,
    enableEditing: false,
  },
  {
    accessorKey: "preferred",
    header: "Preferido",
    size: 10,
    enableEditing: false,
  },
  {
    accessorKey: "status",
    header: "Estado",
    size: 10,
    enableEditing: false,
  },
];
export default function RegistoPontoFocal() {
  const [sidebarToggle] = useOutletContext();
  const [error, setError] = useState(null);

  const [locations, setLocations] = useState();
  const [pontosFocais, setPontosFocais] = useState([]);
  const [unidadeSanitariaName, setUnidadeSanitariaName] = React.useState([]);
  const [areasProgramaticas, setAreaProgramaticas] = useState(null);

  const componentTheme = useTheme();
  // get userData and isAutheticade from sessionStorage
  const sessionData = sessionStorage.getItem("userData"); // Retrieve data from localStorage
  const islogged = sessionStorage.getItem("isAuthenticated"); // Retrieve data from localStorage

  const [selectedUs, setSelectedUs] = useState("");
  // create a ref to selectedUs state
  const selectedUsRef = React.useRef(selectedUs);

  //get area property from userData
  let userData = [];
  userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data

  let userRole = userData[0].role;
  let userArea = "";
  let allAreas = "";

  if (userRole === "Logistica") {
    userArea = "all";
  } else if (userRole === "Requisitante" && userData.length > 1) {
    // for all objects in userData get their area and store in userArea
    userArea = userData.map((item) => item.area);
    let tempArea = userArea;

    tempArea.forEach((area, index) => {
      allAreas += `[${area}]`;
      if (index !== tempArea.length - 1) {
        allAreas += ",";
      }
    });
  } else if (userRole === "Administrador") {
    userArea = "all";
    allAreas = userArea;
  } else if (userRole === "Requisitante" && userData.length === 1) {
    userArea = userData[0].area;
    // make userArea an array
    userArea = [userArea];
    allAreas = userArea;
  }

  //get all areas
  useEffect(() => {
    getAllAreas()
      .then((data) => {
        // filter all areas with status = 'Active'
        data = data.filter((item) => item.status === "Active");
        setAreaProgramaticas(data);
      })
      .catch((error) => {
        // handle any error state, rejected promises, etc..
        NotificationManager.error(
          "Houve erro ao carregar  as Areas",
          "Erro!",
          5000
        );
      });
  }, []);

  //get Locations
  useEffect(() => {
    getLocations()
      .then((location) => {
        setLocations(location);
      })
      .catch((error) => {
        // handle any error state, rejected promises, etc..
        setError(error);
      });
  }, []);

  //get Pontos focais by area
  useEffect(() => {
    getPontosFocais(userArea)
      .then((pf) => {
        setPontosFocais(pf);
      })
      .catch((error) => {
        // handle any error state, rejected promises, etc..
        setError(error);
      });
  }, []);

  const handleUSChange = (event) => {
    const {
      target: { value },
    } = event;
    setUnidadeSanitariaName(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
  };

  const fetchResultCreatePontoFocal = async (json) => {
    const resultado = await createPontoFocal(json);

    return resultado;
  };

  const handleRegistarPontoFocal = async () => {
    // first make sure that the user has selected a area and a role and have filled all required fields
    const nome = document.getElementById("nome").value;
    const contacto = document.getElementById("contacto").value;

    const phoneRegex = /^\d{9}$/;

    const unidade_sanitaria = selectedUsRef.current;

    // unidade_sanitaria can be null or undefined
    if (!unidade_sanitaria || unidade_sanitaria === "UNDEFINED") {
      NotificationManager.error("Selecione uma US", "Erro!", 5000);
      return;
    }
    if (contacto !== "" && !phoneRegex.test(contacto)) {
      // Show a notification error using the notification manager
      NotificationManager.error(
        "Houve erro: O contacto deve ter 9 digitos",
        "Erro",
        5000
      );
      return;
    }
    // if any of the fields is empty, show error message
    if (nome === "" || contacto === "" || unidade_sanitaria === "") {
      NotificationManager.error("Prenche todos os campos", "Erro!", 5000);
      return;
    }
    // retrieve the area id of the current user
    // get all areas with the name in the areaName array

    let currentUserArea = userArea;
    const areaInfo = areasProgramaticas.filter((item) =>
      userArea.includes(item.area)
    );
    const area_id = areaInfo[0].id;

    // create a json object with the data nome_ponto_focal character varying,  contacto_ponto_focal character varying,id_us bigint, id_area bigint
    const pontoFocal = {
      nome_ponto_focal: nome,
      contacto_ponto_focal: contacto,
      id_us: selectedUs.value,
      id_area: area_id,
    };

    // send the object to the backend using the createColaborador function
    try {
      let res = await fetchResultCreatePontoFocal(pontoFocal);
      NotificationManager.success("Ponto Focal registado com sucesso:", 5000);

      // clear all fields
      document.getElementById("nome").value = "";
      document.getElementById("contacto").value = "";
      setSelectedUs("");

      // update pontoFocal state in order to update the table
      getPontosFocais(userArea)
        .then((pf) => {
          setPontosFocais(pf);
        })
        .catch((error) => {
          // handle any error state, rejected promises, etc..
          NotificationManager.error(
            "Houve erro ao buscar a lsita dos PF:" + error.message,
            "Erro: " + error.code,
            8000
          );
        });

      return;
    } catch (error) {
      // handle any error state, rejected promises, etc..
      if (error.response.data.message === "Ponto Focal already exists") {
        NotificationManager.error(
          "Ponto Focal : { " + nome + " } ja existe!",
          "Duplicado",
          8000
        );
      } else {
        NotificationManager.error(
          "Houve erro ao registar o PF:" + error.message,
          "Erro: " + error.code,
          8000
        );
      }
    }
  };

  // If user is not authenticated, redirect to login
  if (!islogged) {
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }

  // Show a spinner while the data is being fetched'
  if (!locations || !pontosFocais) {
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
              Registo de Ponto Focal:
            </h1>

            {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
            <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
              {/* Dispaly cliplodar with a message  */}
              <ClipLoader color="#36d7b7" size={30} />
              <span> Carregando dados...</span>
            </div>
          </div>
        </main>
      </>
    );
  } else {
    let list_us = [];

    // create an array of motoristas with the properties label as their names and id as the id
    locations.forEach((item) => {
      list_us.push({ label: item.unidade_sanitaria, id: item.value });
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
              Registo de Ponto Focal:
            </h1>

            {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
            <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
              <br></br>

              <ThemeProvider theme={theme}>
                <TableContainer component={Paper}>
                  <Table
                    sx={{ minWidth: 350 }}
                    size="small"
                    aria-label="a dense table"
                  >
                    <TableHead>
                      <TableRow>
                        <StyledTableCell align="center"> </StyledTableCell>
                        <StyledTableCell align="center">
                          <b>Registar Novo:</b>
                        </StyledTableCell>
                        <StyledTableCell align="center"></StyledTableCell>
                        <StyledTableCell align="center"></StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell align="left">
                          <TextField
                            required
                            id="nome"
                            label="Nome :"
                            variant="standard"
                            sx={{ width: 300 }}
                          />
                        </TableCell>
                        <TableCell align="left">
                          <TextField
                            required
                            id="contacto"
                            label="Contacto :"
                            variant="standard"
                            sx={{ width: 300 }}
                          />
                        </TableCell>
                        <TableCell align="left">
                          <Autocomplete
                            id="grouped-demo"
                            options={locations}
                            groupBy={(option) => option.distrito}
                            getOptionLabel={(option) =>
                              option.unidade_sanitaria
                            }
                            value={selectedUs}
                            onChange={(event, newValue) => {
                              setSelectedUs(newValue);
                              selectedUsRef.current = newValue;
                            }}
                            sx={{ width: 300 }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Selecione uma US:"
                              />
                            )}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell align="center">
                          {" "}
                          <button
                            onClick={handleRegistarPontoFocal}
                            className="py-2 px-4 border border-blue-500 bg-blue-700  rounded text-gray-200 hover:bg-blue-600 hover:border-blue-600 justify-end"
                          >
                            Salvar
                          </button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </ThemeProvider>
              <h1 className="text-slate-500 pb-3 text-base md:text-lg">
                Lista de Pontos Focais:
              </h1>
              <PontosFocaisTable
                colunas={columnNamesPontoFocal}
                dados={pontosFocais}
              />
            </div>
          </div>
        </main>
      </>
    );
  }
}
