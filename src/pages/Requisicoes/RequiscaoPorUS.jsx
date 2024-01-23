import TextField from '@mui/material/TextField';
import React, { useState, useEffect  } from "react";
import Navbar from "../../components/Navbar/Index";
import { useOutletContext } from "react-router-dom";
import {MinhasRequisicoesTable} from "../../components/Datatables/CustomTable";
import { getLocations , getPontosFocais } from "../../middleware/GenericService";
import ClipLoader from "react-spinners/ClipLoader";
import { NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import { Navigate } from 'react-router-dom';
import Autocomplete from '@mui/material/Autocomplete';
import DashboardHeader from "../../components/Other/DashboardHeader.jsx";
import { getMaterialDisponivel } from "../../middleware/MaterialService";
import { getAllArmazens } from "../../middleware/GenericService";
import { MaterialDisponivelDistribuicaoUSTable } from "../../components/Datatables/CustomTable";
import { MaterialReactTable } from 'material-react-table';
import { useRef } from "react";
import { Box, Button } from '@mui/material';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import {createRequisicao} from "../../middleware/RequisicoesService";

const avatar =
"https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";


const columnNamesQuantidadesDistribuicao = [

  {
    accessorKey: 'id',
    header: 'ID',
    size: 10,
  },
  {
    accessorKey: 'cod',
    header: 'Cod',
    size: 40,
  },
  {
    accessorKey: 'descricao',
    header: 'Material',
    size: 120,
    enableEditing: false,
  },
  {
    accessorKey: 'qtd_stock',
    header: 'Stock',
    size: 10,
    enableEditing: false,
  },
  {
    accessorKey: 'quantidade',
    header: 'Quantidade a Requisitar',
    muiEditTextFieldProps: {
      type: 'number',
      required: true,
    },
  },
  {
    accessorKey: 'id_area',
    header: 'ID Area',
    size: 10,
  },
  {
    accessorKey: 'idUS',
    header: 'US ID',
    size: 120,
  },
 
  {
    accessorKey: 'pf_nome',
    header: 'Nome Ponto Focal',
    size: 10,
  },
  {
    accessorKey: 'pf_contacto',
    header: 'Contacto',
  },
  {
    accessorKey: 'notas',
    header: 'Notas',
  }
];
 
const columnNames = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 10,
  },
  {
    accessorKey: 'cod',
    header: 'Cod',
    size: 40,
  },
  {
    accessorKey: 'descricao',
    header: 'Descricao',
    size: 120,
  },
  {
    accessorKey: 'qtd_stock',
    header: 'Stock',
    size: 10,
  },
  {
    accessorKey: 'area',
    header: 'Area',
    size: 10,
  },

  {
    accessorKey: 'prazo',
    header: 'Prazo',
    size: 60,
  },

  {
    accessorKey: 'id_area',
    header: 'ID Area',
    size: 10,
  }
];
export default function RequisicaoPorUS() {


  const [sidebarToggle] = useOutletContext();
  const [error, setError] = useState(null);
  const [loading,setHasFinishedLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locations, setLocations] = useState();
  const [pontosFocais, setPontosFocais] = useState();
  const [materialList, setData] = useState();

  const [requisicoes, setRequisicoes] = useState([]);
  const [materialRequisicao, setMaterialRequisicao] = useState([]);
  const selectedMaterialRef = useRef(materialRequisicao);

  const [loadingRequisicao, setLoadingRequisicao] = useState(false);
  const [requisicoesEnviadas, setRequisicoesEnviadas] = useState(null);

  const [selectedUs, setSelectedUs] = useState("");
  // get userData and isAutheticade from sessionStorage

  // get userData and isAutheticade from sessionStorage
  const sessionData = sessionStorage.getItem('userData'); // Retrieve data from localStorage
  const islogged = sessionStorage.getItem('isAuthenticated'); // Retrieve data from localStorage


  //get area property from userData
  let userData = [];
  userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data


  let userRole = userData[0].role;
  let userArea = "";
  let allAreas = "";

  if (userRole === "Logistica") {
   userArea ="all";
 } else if (userRole === "Requisitante" && userData.length > 1) {
   // for all objects in userData get their area and store in userArea
    userArea = userData.map((item) => item.area);
 let tempArea =userArea;

     tempArea.forEach((area, index) => {
       allAreas += `[${area}]`;
       if (index !== tempArea.length - 1) {
         allAreas += ',';
       }
     });

 } else if (userRole === "Administrador") {
  userArea ="all";
  allAreas = userArea;
 } else if (userRole === "Requisitante" && userData.length === 1) {

  userArea = userData[0].area;
  // make userArea an array
  userArea = [userArea];
  allAreas = userArea;
  }

  
  //get Locations
useEffect(() => {
    getLocations() 
    .then(location => { 
      setLocations(location);
    } )
    .catch(error => {
      // handle any error state, rejected promises, etc..
      setError(error);
      setHasFinishedLoading(true);
    });

}, []);


//get Material by area
useEffect(() => {
getMaterialDisponivel(userArea) 
  .then(materialList => { 
    setData(materialList)
    setHasFinishedLoading(true);
  } )
  .catch(error => {
    // handle any error state, rejected promises, etc..
    setError(error);
    setHasFinishedLoading(true);
  });

}, [selectedUs]);


// get pontos focais by area 
useEffect(() => {
    // get pontos focais by area
    getPontosFocais(allAreas)
    .then(pontosFocais => {

      // filter all 
      setPontosFocais(pontosFocais);

    } )
    .catch(error => {
      // handle any error state, rejected promises, etc..
      setError(error);

    });
}, []);





const handleSaveRow =  ({ exitEditingMode, row, values }) => {

   // get the original row object
    const originalRequisicao = row.original;
    const constidUSModifiedReq = originalRequisicao.us;
    const valuesCached = row._valuesCache;
    // get values from edited object
    const phoneRegex = /^\d{9}$/;
    const phoneNumber = values.pf_contacto;
    const quantidade = values.quantidade;

    // check if quantidade is not a decimal number
    let isDecimal = quantidade % 1 !== 0;
    //check if quantidade does not start with the value 0
    let startsWithZero = quantidade.startsWith("0");

  // access the totalQuantidadeReq value using the current property of the ref
  if(quantidade === "" || isNaN(quantidade) || parseInt(quantidade) === 0 || isDecimal || startsWithZero){  
    // Show a notification error using the notification manager
    NotificationManager.error("Houve erro: A quantidade deve ser um numero e maior que zero" , 'Erro', 4000);
    exitEditingMode(); //required to exit editing mode
    return;
  }
  else if(parseInt(quantidade) > originalRequisicao.qtd_stock){
    NotificationManager.error("Houve erro: As quantidades requisitadas sao superiores ao stock" , 'Erro', 5000);
    exitEditingMode();  //required to exit editing mode
    return;
  }
  else if(phoneNumber !== "" && !phoneRegex.test(phoneNumber)){
    // Show a notification error using the notification manager
    NotificationManager.error("Houve erro: O contacto deve ter 9 digitos" , 'Erro', 8000);
    exitEditingMode();  //required to exit editing mode
    return;
  } else {

    const newRequisicao = {
      ...originalRequisicao,
      notas: values.notas,
      pf_contacto: values.pf_contacto,
      pf_nome: values.pf_nome,
      quantidade: values.quantidade,
    }
  
  
  
      // update the materiaisRequisicao state with the new newRequisicao object
      
      setMaterialRequisicao((prevItems) =>
      prevItems.map((item) =>
        item.id === originalRequisicao.id ? { ...item, ...newRequisicao } : item
      )

    );




    exitEditingMode(); //required to exit editing mode
  }

     
/*     if(valuesCached.length === 0){
     // DO nothing

    } 
    let totalQuantidadeReqValue  = totalQuantidadeReqRef.current;
    if (originalRequisicao.quantidade !=="" && valuesCached.quantidade !== originalRequisicao.quantidade  ){

      totalQuantidadeReqValue = totalQuantidadeReqRef.current- parseInt(originalRequisicao.quantidade) + parseInt(quantidade);
      // subtract the previous quantidade from totalQuantidadeReq state
      if(totalQuantidadeReqValue > materialRequisicao[0].qtd_stock ){
        NotificationManager.error("Houve erro: As quantidades requisitadas sao superiores ao stock" , 'Erro', 8000);
        exitEditingMode();  //required to exit editing mode
        return;
      }
      setTotalQuantidadeReq(prevState => prevState - parseInt(originalRequisicao.quantidade) + parseInt(quantidade));
      
    } else {
      if(parseInt(quantidade) + totalQuantidadeReqValue > materialRequisicao[0].qtd_stock){
        NotificationManager.error("Houve erro: As quantidades requisitadas sao superiores ao stock" , 'Erro', 8000);
        exitEditingMode();  //required to exit editing mode
        return;
      }

    }
     
       if(phoneNumber !== "" && !phoneRegex.test(phoneNumber)){
      // Show a notification error using the notification manager
      NotificationManager.error("Houve erro: O contacto deve ter 9 digitos" , 'Erro', 8000);
      exitEditingMode();  //required to exit editing mode
      return;
    } else if( parseInt(quantidade) > materialRequisicao[0].qtd_stock){
      // Show a notification error using the notification manager
      NotificationManager.error("Houve erro: A quantidade requisitada é superior ao stock" , 'Erro', 8000);
      exitEditingMode();  //required to exit editing mode
      return;
    }   else if( totalQuantidadeReq > materialRequisicao[0].qtd_stock){
      // Show a notification error using the notification manager
      NotificationManager.error("Houve erro: A quantidade requisitada é superior ao stock" , 'Erro', 8000);
      exitEditingMode();  //required to exit editing mode
      return;
    }

   // crate new Requisicao object with the same properties
   // frrom row.orginal and update the us property with the new value
   const newRequisicao = {
    ...originalRequisicao,
    notas: values.notas,
    pf_contacto: values.pf_contacto,
    pf_nome: values.pf_nome,
    quantidade: values.quantidade,
  }



    // update the requisicoes state with the new object
    // using map function
    setRequisicoes((prevItems) =>
    prevItems.map((item) =>
      item.us === constidUSModifiedReq ? { ...item, ...newRequisicao } : item
    )
    
  );
  
  // update totalQuantidadeReq state
  // if the quantidade of originalRequisicao isnt null and is greater than zero,
  // subtract it crom previous totalQuantidadeReq state 
   if(originalRequisicao.quantidade !== "" && parseInt(originalRequisicao.quantidade) > 0){
   // setTotalQuantidadeReq(prevState => prevState - parseInt(originalRequisicao.quantidade)+ parseInt(quantidade));
   exitEditingMode(); //required to exit editing mode

  } else {

    setTotalQuantidadeReq(prevState => prevState + parseInt(quantidade));
    exitEditingMode(); //required to exit editing mode
  }  */


};

const addSelectedMaterial = (newObject) => {
  const updatedArray = [...materialRequisicao, newObject];
  setMaterialRequisicao(updatedArray);
  selectedMaterialRef.current = updatedArray;

};

const setMateriaisRequisicao = (newObjects) => {

 // ADD idUS , quantidade , npf_nome, pf_contacto, notas to newObjects
 // idUS can be found in selectedUs
 // quantidade is 0 by default
  newObjects.forEach((object) => {
    object.idUS = selectedUs.value;
    object.quantidade = 0;
    object.notas = "";
  });

  // remove amazem and prazo from newObjects
  newObjects.forEach((object) => {
    delete object.armazem;
    delete object.prazo;
    delete object.familia;
    delete object.cod;

  });

  setMaterialRequisicao(newObjects);
  selectedMaterialRef.current = newObjects;
}
const removeSelectedMaterial = (objectToRemove) => {
  const updatedArray = materialRequisicao.filter(obj => obj !== objectToRemove);
  setMaterialRequisicao(updatedArray);
  selectedMaterialRef.current = updatedArray;
};
const fetchResult = async (json) => {

  setLoadingRequisicao(true);
  
  const resultado = await createRequisicao(json);

  setRequisicoesEnviadas(resultado);


  return resultado;
  
};

const handleEnviarRequisicao = async (rows) => {


   // if there is one requisicao object with quantidade empty or  quatidade is  an integer grater than zero, then show error message
   let requisicoesWithEmptyQuantidade = materialRequisicao.filter((item) => {

   
    return item.quantidade === "" ||  isNaN(item.quantidade) || parseInt(item.quantidade) === 0;
  } );

// check if quantidade is not a decimal number






  if(requisicoesWithEmptyQuantidade.length > 0){
    NotificationManager.error("Houve erro: Todas  as requisicoes devem ter  quantidade superior a zero. corrija os dados" , 'Erro', 5000);
    return;
  }

  // remove descricao property from requisicoes array
  let requisicoesArray = materialRequisicao.map(({ descricao, ...item }) => item);
  // rename the idUS property to unidade_sanitaria
  requisicoesArray = requisicoesArray.map(({ idUS, ...item }) => ({ ...item, unidade_sanitaria: idUS }));
  // change quantidade type to integer

  let updatedRequisicoesArray = requisicoesArray.map((requisicao) => {
    return {
      ...requisicao,
      quantidade: parseInt(requisicao.quantidade)
    };
  });
 // change id property to material
  updatedRequisicoesArray = updatedRequisicoesArray.map(({ id, ...item }) => ({ ...item, material: id }));

// set requisitante property to the current user
updatedRequisicoesArray = updatedRequisicoesArray.map((requisicao) => {
  return {
    ...requisicao, 
    requisitante: userData[0].id
  };
});
// remove qtd_stock property from requisicoes array
updatedRequisicoesArray = updatedRequisicoesArray.map(({ qtd_stock, ...item }) => item);

// remove id_area property from requisicoes array
updatedRequisicoesArray = updatedRequisicoesArray.map(({ id_area, ...item }) => item);


 try {
    let res = await fetchResult(updatedRequisicoesArray);


   NotificationManager.success("Foram gravados com sucesso:" +res.length + " Requisicoes" , 'Sucesso', 5000);
   //NotificationManager.success("Requisicao enviada com sucesso" , 'Sucesso', 8000);
   setLoadingRequisicao(false);
        //refresh the page
        setTimeout(() => {
          setSelectedUs(null);
          setMateriaisRequisicao([]);
      }, 3000);
        //refresh the page
  


  } catch (error) {
       // handle any error state, rejected promises, etc..
       NotificationManager.error("Houve erro ao gravar as requisicoes: " +error.message , 'Erro: ' +error.code, 8000);
       setLoadingRequisicao(false);
  
  }
 

};

  //if user is not authenticated, redirect to login
  if(!islogged){
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }


  //Show a spinner while the data is being fetched'
  if (!locations || !materialList  || !pontosFocais) {
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
            Nova Requisição de Material por US:
          </h1>
  
          {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
           <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
                {/* Dispaly cliplodar with a message  */}
                <ClipLoader color="#36d7b7"  size={30}/><span > Carregando dados...</span> 
            </div>
           
          </div>
        </main>
      </>
    ); }
  else  if(materialList.length === 0) {
    NotificationManager.info('Nao ha material disponivel para a sua area.', 'Info', 8000);
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
                   Nova Requisicao de Material por US:
                   </h1>
            
                   {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
                   <div>
                   <Autocomplete
                    id="grouped-demo"
                    options={locations}
                    groupBy={( option ) => option.distrito}
                    getOptionLabel={( option ) => option.unidade_sanitaria}
                    onChange={(event, newValue) => {
                      setSelectedUs(newValue);
                      
                }}
                sx={{ width: 300 }}
                renderInput={(params) => <TextField {...params} label="Selecione uma US:" />}
                />
              </div>
                 
                    <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
        
                      
                   <MaterialDisponivelDistribuicaoUSTable colunas = {columnNames}  dados = {[]}  unidadeSanitaria={selectedUs} pontoFocal ={pontosFocais}  setMateriaisRequisicao ={ setMateriaisRequisicao} />
           </div>
          
         </div>
       </main>
     </>
   );
  }  
  else {



       
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
              Nova Requisicao de Material por US:
            </h1>
    
            {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
             <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">

             <br></br>
             <Autocomplete
                id="grouped-demo"
                options={locations}
                groupBy={( option ) => option.distrito}
                getOptionLabel={( option ) => option.unidade_sanitaria}
                onChange={(event, newValue) => {
                  setSelectedUs(newValue);
                }}
                sx={{ width: 350 }}
                renderInput={(params) => <TextField {...params} label="Selecione uma US:" />}
                />
                <div>  <br></br></div>
        
               { selectedUs ? 
               <div>
                  <h1 className="text-slate-500 pb-3 text-base md:text-lg">
                      Especifique os materiais  a requisitar para: {selectedUs.unidade_sanitaria}
                    </h1>
                 <MaterialDisponivelDistribuicaoUSTable colunas = {columnNames}  dados = {materialList}   unidadeSanitaria={selectedUs} pontoFocal ={pontosFocais}  setMateriaisRequisicao ={ setMateriaisRequisicao}   /> 
                 <br></br>
                 <h1 className="text-slate-500 pb-3 text-base md:text-lg">
                  Especifique as quantidades a requisitar para: {selectedUs.unidade_sanitaria}
                 </h1>
                 <br></br>
                 <div className="border w-full border-gray-200 bg-white py-4 px-6 rounded-md ">
               <MaterialReactTable  
                columns={columnNamesQuantidadesDistribuicao}
                data={materialRequisicao}
                initialState={{
                  columnVisibility: { id: false,idUS: false, id_area: false, cod: false},
                  density: 'compact',
                  pagination: { pageSize: 12, pageIndex: 0 }

                  }}
                  editingMode="row"
                  enableEditing
                  enableRowSelection
                  onEditingRowSave={handleSaveRow}
                  renderTopToolbarCustomActions={({ table }) => (

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                    
                      <Button
                      disabled={table.getPrePaginationRowModel().rows.length === 0}
                      //export all rows, including from the next page, (still respects filtering and sorting)
                      onClick={() => handleEnviarRequisicao(table.getPrePaginationRowModel().rows)}
                      startIcon={<PlayCircleIcon />}
                      variant="contained"
                    >
                      Enviar Pedido
                    </Button>
                    </div>
            
                
                )}
           />  </div>
                </div>
               
               : " " }
              </div>
        

             
            </div>
          </main>
        </>
           
          );

    }

  

}

