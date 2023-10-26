import React, { useState , useEffect} from 'react';
import { useOutletContext } from "react-router-dom";
import * as XLSX from 'xlsx';
import axios from 'axios';
import "../../styles/styles.css";
import Navbar from "../../components/Navbar/Index";
import uploadImg  from "../../img/cloud_upload_small.png";
import {ImportarMaterialPreviewTable , RequisicoesPorAreaTable} from "../../components/Datatables/CustomTable";
import { NotificationManager} from 'react-notifications';
import DashboardHeader from "../../components/Other/DashboardHeader.jsx";
import { Navigate } from 'react-router-dom';

const avatar =
"https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

const UploadForm = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [sidebarToggle] = useOutletContext();
  const [xlsFormaError, setXlsFormatError] = useState(false);
  const [materialList, setData] = useState();
  
 // get userData and isAutheticade from sessionStorage
 const sessionData = sessionStorage.getItem('userData'); // Retrieve data from localStorage
 const islogged = sessionStorage.getItem('isAuthenticated'); // Retrieve data from localStorage


 //get area property from userData
 let userData = [];
 userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data

 
  const updateArrayElement = (updatedData) => {
    setData(updatedData);
  };
  
  const columnNames = [

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
      accessorKey: 'armazem',
      header: 'Armazem',
    },
    {
      accessorKey: 'familia',
      header: 'Familia',
      size: 60,
    },
    {
      accessorKey: 'projecto',
      header: 'Projecto',
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

  const handleFileChange = (event) => {
    // Reset the data array
    setData([]);
    setSelectedFile(null);
    
    setSelectedFile(event.target.files[0]);
    // Check if files is xls or xlsx
    const fileType = event.target.files[0].type;
    if(fileType !== "application/vnd.ms-excel" && fileType !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"){
        setXlsFormatError(xlsFormaError);
        // Todo show a error popup notification indicating that the file format is not supported
        console.error('Formato do ficheiro invalido. Por favor certificar que esta importando um ficheior excell valido.');
        // Show error notification
        NotificationManager.info('Formato do ficheiro invalido. Por favor garantir que esta a importar um ficheiro excell valido','Error', 4000);      
        setData([]);
    }  else  {
     // TODO Mostrar nome do ficheiro e uma  POPUP Notification
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      // read workbook using xlsx
       const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];  
      const materialData = XLSX.utils.sheet_to_json(worksheet, {header: 1, blankrows: false});
      

     // Validate data before uploading
    const requiredColumns = ['Descricao', 'Cod', 'Quantidade', 'Armazem', 'Familia', 'Prazo', 'Area','Projecto'];
    const minimumRow = 2;

if (materialData.length >= minimumRow) {

  const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
  // check if header range is equal to the number of required columns
    if (headerRange.e.c !== requiredColumns.length ) {
   // Show a popup notification
    NotificationManager.error("Template de importacao Invalido. Certifique que os dados comecao na 3 linha e contem as seguintes  colunas na ordem  the correct order ['Descricao', 'Cod', 'Quantidade', 'Armazem', 'Familia', 'Prazo', 'Area','Projecto']",'Error', 8000);
    setData([]);
} else {
    

  // const headerColumnNames = jsonData[0];
  const headerRow = materialData[0];
  // headerColumnNames is an json array with the column names, convert to list
   const headerColumnNames = Object.values(headerRow);


  const areAllColumnsPresent = requiredColumns.every((columnName) =>
    headerColumnNames.includes(columnName)
  );

// set dataRows properties based on the headerRow
  const result = materialData.map((row) => {
    return row.reduce((acc, current, index) => {
      const header = headerRow[index];
      return { ...acc, [header]: current };
    }, {});
  });
  // remove first object from result because it contains the column names
  result.shift();
  

  if (areAllColumnsPresent) {
    // Data is valid, proceed with uploading
     // Modify property names in jsonData
    // remove the first row with the column names
    // materialData.shift();
  
   const modifiedData =result.map((row) => {
    return {
      cod: row.Cod,
      descricao: row.Descricao,
      qtd_stock: row.Quantidade,
      armazem: row.Armazem,
      familia: row.Familia,
      projecto: row.Projecto,
      area: row.Area,
      prazo: row.Prazo,



    // Add more property mappings as needed
  };
});
    setData(modifiedData);
} else {
  // Show a popup notification
  NotificationManager.info("Invalid data. Please make sure the data starts from row 3. and contains the required columns in the correct order ['Descricao', 'Cod', 'Quantidade', 'Armazem', 'Familia', 'Prazo', 'Area','Projecto']",'Error', 14000);
} 


 } } else {
    // Data is not valid, display an error message
    console.error(
      'Invalid data. Please make sure the data starts from row 3 and contains the required columns in the correct order.'
    );
    // Show a popup notification
    NotificationManager.info("Invalid data. Please make sure the data starts from row 3. and contains the required columns in the correct order ['Descricao', 'Cod', 'Quantidade', 'Armazem', 'Familia', 'Prazo', 'Area','Projecto']",'Error', 14000);
  }

} ;
reader.readAsArrayBuffer(event.target.files[0]);  
 } } 
   

   const handleUpload = () => {
   const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Send jsonData to the REST API using Axios
      axios.post('YOUR_API_ENDPOINT', jsonData)
        .then((response) => {
          console.log('Data uploaded successfully');
        })
        .catch((error) => {
          console.error('Error uploading data:', error);
        });
    };

    reader.readAsArrayBuffer(selectedFile);
  };


  // if user is not authenticated, redirect to login
  if(!islogged){
    // If there is no data, redirect to login
    return <Navigate to="/auth/login" />;
  }
 //Show a spinner while the data is being fetched'
 if (!materialList) {
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
            Importar Materiais: 
          </h1>
          <p>
                      <br></br>
                      <br></br>
        
                     </p>
          {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
           <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
              <div className="file-upload">
  
              <img src={uploadImg} alt="upload" />
              <h3>Clique para carregar ficheiro</h3>
              <p>Tamanho máximo do arquivo 10mb</p>
              <input type="file" onChange={handleFileChange} />
              </div>
              <div>
              <p>
                      <br></br>
                      <br></br>
                      <br></br>
                     </p>

              <ImportarMaterialPreviewTable colunas = {columnNames}  dados = {[]}  />
            </div>
  
          </div>
  
          <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap"></div>
        </div>
      </main>
    </>

    ); 
  
  
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
        <h1 className="text-slate-500 pb-3 text-base md:text-lg">
          Importar Materiais: 
        </h1>

        {/* <div className="flex flex-row gap-x-4 overflow-hidden overflow-y-auto justify-between "> */}
         <div className=" gap-y-4 overflow-hidden overflow-y-auto center wrapper-requisicoes ">
            <div className="file-upload">

            <img src={uploadImg} alt="upload" />
            <h3>Clique para carregar ficheiro</h3>
            <p>Tamanho máximo do arquivo 10mb</p>
            <input type="file" onChange={handleFileChange} />
            </div>
            <div>
            <ImportarMaterialPreviewTable colunas = {columnNames}  dados = {materialList} onUpdateArrayElement={updateArrayElement}  />
          </div>

        </div>

        <div className="lg:w-full w-[1024px] overflow-hidden flex flex-row justify-between text-slate-700 gap-2 lg:max-h-screen overflow-x-auto whitespace-nowrap"></div>
      </div>
    </main>
  </>

    // ----------------------------------------------------------------------------------

  );
};

export default UploadForm;
