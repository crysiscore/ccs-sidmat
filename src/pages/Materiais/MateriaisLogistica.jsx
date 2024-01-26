import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar/Index";
import { useOutletContext } from "react-router-dom";
import { MaterialLogisticaTable } from "../../components/Datatables/CustomTable";
import {
  getMaterialDisponivel,
  getMaterialLogistica,
} from "../../middleware/MaterialService";
import { getAllArmazens, getAllAreas } from "../../middleware/GenericService";
import ClipLoader from "react-spinners/ClipLoader";
import { NotificationManager } from "react-notifications";
import "react-notifications/lib/notifications.css";
import DashboardHeader from "../../components/Other/DashboardHeader.jsx";
import { Navigate } from "react-router-dom";

const avatar =
  "https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

function TableMateriaisLogistica() {
  const [sidebarToggle] = useOutletContext();
  const [error, setError] = useState();
  const [materialLogistica, setData] = useState();
  const [listArmazens, setListArmazens] = useState();
  const [hasFinishedLoading, setHasFinishedLoading] = useState(false);
  const [areasProgramaticas, setAreasProgramaticas] = useState();
  // get userData and isAutheticade from sessionStorage
  const sessionData = sessionStorage.getItem("userData"); // Retrieve data from localStorage
  const islogged = sessionStorage.getItem("isAuthenticated"); // Retrieve data from localStorage

  //get area property from userData
  let userData = [];
  userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data

  // setdata(getMaterialDisponivel("APSS"));
  // const materialData = getMaterialDisponivel("APSS");
  useEffect(() => {
    getMaterialLogistica()
      .then((materialLogistica) => {
        setData(materialLogistica);
        setHasFinishedLoading(true);
      })
      .catch((error) => {
        // handle any error state, rejected promises, etc..
        // Show an error notification
        NotificationManager.info(
          "Houve um erro da conectar com o servidor.  Contacte o Administrador do Sistema",
          "Erro getList (material and Armazens)",
          4000
        );
        setError(true);
        setHasFinishedLoading(true);
      });
  }, []);

  useEffect(() => {
    getAllArmazens()
      .then((data) => {
        setListArmazens(data);
        setHasFinishedLoading(true);
      })
      .catch((error) => {
        // handle any error state, rejected promises, etc..
        setError(true);
        setHasFinishedLoading(false);
      });
  }, []);

  // get all areas from the API
  useEffect(() => {
    getAllAreas()
      .then((data) => {
        // filter only  areas with the property "status" set to Active
        const filteredData = data.filter((area) => area.status === "Active");
        setAreasProgramaticas(filteredData);
        setHasFinishedLoading(true);
      })
      .catch((error) => {
        // handle any error state, rejected promises, etc..
        setError(true);
        setHasFinishedLoading(false);
      });
  }, []);

  // if user is not authenticated, redirect to login
  if (!islogged) {
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }

  const columnNames = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "cod",
      header: "Cod",
    },
    {
      accessorKey: "descricao",
      header: "Descricao",
    },
    {
      accessorKey: "qtd_stock",
      header: "Stock",
    },
    {
      accessorKey: "area",
      header: "Area",
    },
    {
      accessorKey: "armazem",
      header: "Armazem",
    },
    {
      accessorKey: "familia",
      header: "Familia",
    },
    {
      accessorKey: "prazo",
      header: "Prazo",
    },

    {
      accessorKey: "data_importacao",
      header: "Data Importacao",
    },
    {
      accessorKey: "projecto",
      header: "Projecto",
    },
    {
      accessorKey: "id_area",
      header: "ID Area",
    },
    {
      accessorKey: "id_armazem",
      header: "ID Armazem",
    },
    {
      accessorKey: "id_projecto",
      header: "ID Projecto",
    },
  ];

  //Show a spinner while the data is being fetched'
  if (!materialLogistica || !listArmazens || !areasProgramaticas) {
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
              Lista de Materiais:
            </h1>

            {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
            <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
              <MaterialLogisticaTable colunas={columnNames} dados={[]} />
              <ClipLoader color="#36d7b7" size={30} />
              <span> Carregando dados...</span>
            </div>

            <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap"></div>
          </div>
        </main>
      </>
    );
  } else if (error) {
    //  block of code to be executed if the condition1 is false and condition2 is true

    NotificationManager.info(
      "Houve umn erro da conectar com o servidor.  Contacte o Administrador do Sistema",
      "Erro getList (material and Armazens)",
      4000
    );
  } else {
    if (materialLogistica.length === 0) {
      NotificationManager.info("Nao ha materiais disponiveis", "Info", 8000);

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
                Lista de Materiais:
              </h1>

              {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
              <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
                <MaterialLogisticaTable colunas={columnNames} dados={[]} />
              </div>

              <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap"></div>
            </div>
          </main>
        </>
      );
    }
    //If either one of the lists is empty,  show a popup notification
    if (!listArmazens) {
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
                Lista de Materiais:
              </h1>

              {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
              <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
                <MaterialLogisticaTable colunas={columnNames} dados={[]} />
              </div>

              <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap"></div>
            </div>
          </main>
        </>
      );
    } else {
      // only execute if listArmazens has values

      /* const mappedData = materialLogistica.map((item) => {
              const armazem = listArmazens.find((armazem) => armazem.id === item.armazem);
              return {
                ...item,
                armazem: armazem.cod_armazem,
              };  
            }); */
      const mappedData = materialLogistica;

      // change data_importacao property to a more readable format
      // mappedData.forEach((element) => {
      //   element.data_importacao = new Date(element.data_importacao).toLocaleDateString();
      // });

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
                Lista de Materiais:
              </h1>

              {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
              <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
                <MaterialLogisticaTable
                  colunas={columnNames}
                  dados={mappedData}
                  areas={areasProgramaticas}
                />
              </div>

              <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap"></div>
            </div>
          </main>
        </>
      );

      // change  dados  properties values ( armazem ) to cod_armazem based on the   listArmazens values

      //console.log(mappedData);
    }
  }
}
export default TableMateriaisLogistica;
