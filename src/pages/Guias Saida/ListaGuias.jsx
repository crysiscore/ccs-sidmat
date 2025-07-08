import React, { useState, useEffect, useRef } from "react";
import DashboardHeader from "../../components/Other/DashboardHeader.jsx";
import RequisicoresAreaScrolledCard from "../../components/Widget/RequisicoresAreaScrolledCard.jsx";
import { useOutletContext } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { getRequisicoesPendentesArea } from "../../middleware/RequisicoesService.js";
import { NotificationManager } from "react-notifications";
import "react-notifications/lib/notifications.css";
import ClipLoader from "react-spinners/ClipLoader";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { getAllRequisicoes } from "../../middleware/RequisicoesService.js";
import { GuiasPorAreaTable } from "../../components/Datatables/CustomTable.jsx";
import { listGuiasByArea } from "../../middleware/GuiaService.js";
import { user } from "@nextui-org/react";

const avatar =
  "https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

export const ListaGuias = (props) => {
  const [error, setError] = useState(null);
  const [loading, setHasFinishedLoading] = useState(false);
  const [listaGuias, setListaGuias] = useState();
  const [value, setValue] = React.useState();
  const [requisicoesPendentes, setRequisicoesPendentes] = useState();
  const areasRef = useRef(listaGuias);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const columnNamesListaGuias = [
    {
      accessorKey: "id",
      header: "id_guia",
      size: 40,
    },
    {
      accessorKey: "nr_guia",
      header: "Numero da Guia",
      size: 120,
    },

    {
      accessorKey: "data_guia",
      header: "Data",
      size: 120,
    },
    {
      accessorKey: "status",
      header: "Estado",
      size: 60,
    },
    {
      accessorKey: "unidade_sanitaria",
      header: "Unidade Sanitaria",
      size: 10,
    },

    {
      accessorKey: "area",
      header: "Area",
      size: 60,
    },
    {
      accessorKey: "motorista",
      header: "Motorista",
      size: 10,
    },
    {
      accessorKey: "previsao_entrega",
      header: "Previsao de Entrega",
    },

    {
      accessorKey: "observacao",
      header: "Observacao",
      size: 10,
    },
    {
      accessorKey: "data_entrega",
      header: "Data de Entrega",
      size: 10,
    },
    {
      accessorKey: "foto_id",
      header: "Link Da foto",
      size: 10,
    },
    {
      accessorKey: "createdby",
      header: "Criado por",
      size: 10,
    },
    {
      accessorKey: "confirmedby",
      header: "Confirmado por",
      size: 10,
    },
  ];

  const [sidebarToggle] = useOutletContext();
  // get userData and isAutheticade from sessionStorage
  const sessionData = sessionStorage.getItem("userData"); // Retrieve data from localStorage
  const islogged = sessionStorage.getItem("isAuthenticated"); // Retrieve data from localStorage

  //get area property from userData
  let userData = [];
  userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data
  let userRole = userData[0].role;
  let userArea = "";
  let allAreas = "";

  if (userRole === "Logistica") {
    userArea = "all";
    userArea = [userArea];
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
  //get all Guias de Saida
  useEffect(() => {
    listGuiasByArea(userArea)
      .then((guias) => {
        setListaGuias(guias);
        setHasFinishedLoading(true);
        // count all areas and store the count  in an array
        // the array must have the following structure
        // [{area: 'area1', total_guias: 2}, {area: 'area2', total_guias: 1}]

        if (guias.length > 0) {
          const areas = [];
          const areasCount = [];
          guias.forEach((guia) => {
            if (!areas.includes(guia.area)) {
              areas.push(guia.area);
              areasCount.push({ area: guia.area, total_guias: 1 });
            } else {
              areasCount.forEach((area) => {
                if (area.area === guia.area) {
                  area.total_guias++;
                }
              });
            }
          });
          // set the count of areas in the array
          areasRef.current = areasCount;

          // set the first area as the default value for the tab
          setValue(areasCount[0].area);
        }
      })
      .catch((error) => {
        // handle any error state, rejected promises, etc..
        NotificationManager.error(
          "Unable to get Guias de Saida..." + error.message,
          "Erro getGuiasByArea",
          5000
        );
        setHasFinishedLoading(true);
      });
  }, []);

  // if user is not authenticated, redirect to login
  if (!islogged) {
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }

  if (!listaGuias) {
    return (
      <>
        <div className="flex justify-center items-center h-screen">
          <span className="us-header">
            <p> Lista de Guias de Saida: </p>
          </span>
          <ClipLoader color="#36d7b7" size={30} />
          <span> Carregando dados...</span>
        </div>
      </>
    );
  }

  if (listaGuias.length === 0) {
    // if there are no requisicoes pendentes, display a message using the NotificationManager
    NotificationManager.info(
      "Nao existem Guias de Saida...",
      "Sem dados",
      8000
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
              Lista de Guias de Saida:
            </h1>
            <div className="flex justify-center items-center h-screen">
              <p className="text-2xl text-gray-400">
                Nao existem requisicoes Pendentes...
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }
  const guiasAreaCount = areasRef.current;

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
            Lista de Guias de Saida:
          </h1>

          {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
          <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
            {/*   {sumarioRequisicoes?.map((data, index) => (
              <RequisicoresAreaScrolledCard key={index} data={data} />
            ))} */}

            <Box sx={{ width: "100%", typography: "body1" }}>
              <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <TabList onChange={handleChange}>
                    {guiasAreaCount?.map((data, index) => (
                      // create a label containing the area name and the number of health units
                      // in that area and make label bold

                      <Tab
                        label={data.area + " (" + data.total_guias + ")"}
                        value={data.area}
                      />
                    ))}
                  </TabList>
                </Box>
                {guiasAreaCount?.map((data, index) => (
                  // for each area filter all requisicoes pendentes and display them in a table
                  // with the area name as the table title

                  <TabPanel value={data.area}>
                    <GuiasPorAreaTable
                      colunas={columnNamesListaGuias}
                      dados={listaGuias.filter(
                        (guia) => guia.area === data.area
                      )}
                      role={userRole}
                      status={"pendentes"}
                    />
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
};

export default ListaGuias;
