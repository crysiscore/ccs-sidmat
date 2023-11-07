import React, { useState ,useEffect } from "react";
import { MaterialReactTable } from 'material-react-table';
import { Box, Button } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArticleIcon from '@mui/icons-material/Article';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import { ExportToCsv } from 'export-to-csv'; //or use your library of choice here
import { NotificationManager } from 'react-notifications';
import { getAllAreas,getAllArmazens , getAllProjectos, updateAreaStatus,updateArea,updateUsuarioStatus} from '../../middleware/GenericService.js'
import { updateMaterial } from "../../middleware/MaterialService.js";
import { saveAs } from 'file-saver';
import axios from 'axios';
//import { createBrowserHistory } from 'history';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { read, writeFileXLSX ,utils,writeFile} from "xlsx";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import {updateProjectoStatus,updateProjecto} from '../../middleware/GenericService.js';
import {cancelRequisicao} from '../../middleware/RequisicoesService.js';

// TODO highlight selected row
export const MaterialDisponivelTable = ({colunas, dados}) => {
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  //const customHistory = createBrowserHistory();
  let material = null;
  const navigate = useNavigate();

 
 const handleActivate = (rows) => {
  // Check if multiple rows are selected
  if (rows.length > 1) {
    // Alert the user can only activate one row at a time, use NotificationManager
    NotificationManager.info('Apenas uma linha pode ser selecionada de cada vez','Info', 4000);

  } else {
    // Activate the row


    rows.map((row) => {
      // Get values from the selected row and create a json object
      material = {
        id: row.getValue('id'),
        id_area: row.getValue('id_area'),
        descricao: row.getValue('descricao'),
        qtd_stock: row.getValue('qtd_stock'),
        armazem: row.getValue('armazem'),
        cod: row.getValue('cod'),
        familia: row.getValue('familia'),
        prazo: row.getValue('prazo'),
      };

      // Save material to sessionStorage and Route to the requisicao page
      // sessionStorage.setItem('materialRequisicao', JSON.stringify(material));
      //navigate('/requisicao');
      navigate('/requisicao', {
        state: {material },
        replace: true,
      });
      

    });
  }

};

const handleExportMateriais = (rows) => {
  const jsonRows = rows;
  let material = null;

    // extract all data from materiais  from jsonRows and save it to an array
    // array should contain the following properties: cod, descricao, qtd_stock, armazem, familia, prazo
   const rowsArray = jsonRows.map((row) => {
      return {
        cod: row.getValue('cod'),
        descricao: row.getValue('descricao'),
        qtd_stock: row.getValue('qtd_stock'),
        area: row.getValue('area'),
        armazem: row.getValue('armazem'),
        familia: row.getValue('familia'),
        prazo: row.getValue('prazo'),

      };
    });


    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Materiais Disponiveis");


    /* fix headers */
    utils.sheet_add_aoa(worksheet, [["Cod", "Descricao","Qtd Existente","Area","Armazem","Familia","Prazo"]], { origin: "A1" });

    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
      //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [ { wch: max_width } ];

    // Get current date  an store in the YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const today = year + '-' + month + '-' + day;

    /* create an XLSX file and try to save to  */
    // concat the file name  and area with the current date
      const fileName = "Materiais Disponiveis {" + rowsArray[0].area + "} "+ today + ".xlsx";

    writeFile(workbook,fileName, { compression: true });



};

  return (

    <MaterialReactTable
      columns={colunas}
      data={dados}
      initialState={{
        columnVisibility: { id: false,id_area: false },
         density: 'compact'
         }}
      enableRowSelection
      enableRowActions
      enableColumnOrdering
      positionToolbarAlertBanner="bottom"
      renderTopToolbarCustomActions={({ table }) => (

          <div style={{ display: 'flex', gap: '0.5rem' }}>
          
            <Button
              color="success"
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
              onClick={ () => handleActivate(table.getSelectedRowModel().rows)}
              variant="contained"
            >
            Nova Requisição
            </Button>
            <Button
            disabled={table.getPrePaginationRowModel().rows.length === 0}
            //export all rows, including from the next page, (still respects filtering and sorting)
            onClick={() => handleExportMateriais(table.getPrePaginationRowModel().rows)}
            startIcon={<FileDownloadIcon />}
            variant="contained"
          >
            Download
          </Button>
          </div>
  
      
      )}
    />

  );
};

export const MaterialLogisticaTable = ({colunas, dados}) => {


  const [materialDescricao, setMaterialDescricao] = useState('');
  const [materialStock, setMaterialStock] = useState(0); 

  const handleMaterialDescricaoChange = (event) => {
    setMaterialDescricao(event.target.value);
  };

  const handleMaterialStockChange = (event) => {
    setMaterialStock(event.target.value);
  };

  const [materialToEdit, setMaterialToEdit] = useState(null);
  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleSaveEditedMaterial = async () => {
    // Get the values from the form
   // const materialCod = document.getElementById('material-cod-edit').value;
    const materialDescricao = document.getElementById('material-descricao-edit').value;
    const materialStock = document.getElementById('material-stock-edit').value;
  
    // Check if the values are empty
    if (materialDescricao === '' || materialStock === '') {
      NotificationManager.error('Preencha todos os campos','Error', 4000);
      return;
    }
    // check if materialStock is a number
    if (isNaN(materialStock)) {
      NotificationManager.error('Quantidade de Stock deve ser um numero','Error', 4000);
      return;
    }
    // conver materialStock to a number
    const materialStockNumber = Number(materialStock);
    // check if materialStock is less than 0
    if (materialStockNumber < 0) {
      NotificationManager.error('Quantidade de Stock deve ser maior que 0','Error', 4000);
      return;
    }


  
    // Create an area object with the values
    let newMaterial = {
      id_material: materialToEdit.id,
      //cod: materialCod,
      material_nome: materialDescricao,
      quantidade: materialStockNumber,
    };
  
    // Update the Material
    try {
      let res = await fetchResultUpdateMaterial(newMaterial);
      if (res.data === "Actualizado com sucesso") {
        NotificationManager.success('Material actualizada com sucesso','Sucesso', 3000);
        // wait for 5 seconds the close the dialog
        setTimeout(() => {
          // refresh the page
          handleClose();
          window.location.reload();
        }, 3000);
  
  
      } else {
        NotificationManager.error('Erro ao actualizar o Material','Error', 3000);
      }
    } catch (error) {
      // show the error
      NotificationManager.error('Erro ao actualizar o Material' +error.message,'Error', 4000);
      handleClose();
    }
  
    // Close the dialog
    handleClose();
  };
  const fetchResultUpdateMaterial= async (json) => {
      
    const resultado = await updateMaterial(json);

    return resultado;

  };
  const handleExportRows = (rows) => {

   const jsonRows = rows;

   // extract all data from jsonRows and save it to an array
    const rowsArray = jsonRows.map((row) => {
      return {
        cod: row.getValue('cod'),
        descricao: row.getValue('descricao'),
        qtd_stock: row.getValue('qtd_stock'),
        area: row.getValue('area'),
        armazem: row.getValue('armazem'),
        familia: row.getValue('familia'),
        prazo: row.getValue('prazo'),
        data_importacao: row.getValue('data_importacao'),
        projecto: row.getValue('projecto'),
      };
    });


     /* generate worksheet and workbook */
  const worksheet = utils.json_to_sheet(rowsArray);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Materiais Disponiveis");

  /* fix headers */
  utils.sheet_add_aoa(worksheet, [["Cod", "Descricao","Qtd Existente","Area","Armazem","Familia","Prazo","Data de Entrada","Projecto"]], { origin: "A1" });

// Make column names bold by iterating through the header cells
// const headerCellStyle = { font: { bold: true } };
// const headerRange = utils.decode_range(worksheet['!ref']);
// for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
//   const headerCell = utils.encode_cell({ r: headerRange.s.r, c: col });
//   worksheet[headerCell].s = headerCellStyle;
// }


  /* calculate column width ( number of properties from rows object) */
  const max_width = Object.keys(rows[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
    //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
  worksheet["!cols"] = [ { wch: max_width } ];

  // Get current date  an store in the YYYY-MM-DD format
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const today = year + '-' + month + '-' + day;



  /* create an XLSX file and try to save to  */
  // concat the file name with the current date

  const fileName = "Materiais Disponiveis CCS {" + today + "}.xlsx";

  writeFile(workbook,fileName, { compression: true });
  };


  const handleActivate = (rows) => {

    if (rows.length > 1) {
      // Alert the user can only activate one row at a time, use NotificationManager
      NotificationManager.info('Apenas uma linha pode ser selecionada de cada vez','Info', 4000);

    } else {
    rows.map((row) => {
     // alert('activating ' + row.getValue('id_area'));
      // Get values from the selected row and create a json object
      const  material = {
        id: row.getValue('id'),
        material: row.getValue('descricao'),
        quantidade: row.getValue('qtd_stock'),
      };
      setMaterialDescricao(material.material);
      setMaterialStock(material.quantidade);
      setMaterialToEdit(material);
      handleClickOpen();
    });

  }
  };

  return (

    <div>
    <MaterialReactTable
      columns={colunas}
      data={dados}
      initialState={{
        columnVisibility: { id: false,id_area: false, id_projecto: false ,id_armazem:false},
         density: 'compact'
         }}
      enableRowSelection
      enableRowActions
      enableColumnOrdering
      positionToolbarAlertBanner="bottom"
      renderTopToolbarCustomActions={({ table }) => (

          <div style={{ display: 'flex', gap: '0.5rem' }}>
          
            <Button
              color="success"
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
              onClick={() => handleActivate(table.getSelectedRowModel().rows)}
              variant="contained"
            >
            Editar
            </Button>
            <Button
            disabled={table.getPrePaginationRowModel().rows.length === 0}
            //export all rows, including from the next page, (still respects filtering and sorting)
            onClick={() => handleExportRows(table.getFilteredRowModel().rows)}
            startIcon={<FileDownloadIcon />}
            variant="contained"
          >
            Download
          </Button>
          </div>
  
      
      )}
    />

    <div>
       <Dialog open={open} onClose={handleClose}>
        <DialogTitle> Editar  Material </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Nome: {materialToEdit?.material} 
          </DialogContentText>
          <TextField
            margin="dense"
            id="material-descricao-edit"
            label="Nome"
            value={materialDescricao}
            onChange={handleMaterialDescricaoChange}
            sx={{ width: 300 }}
            variant="standard"
          />
          <br>
          </br>
          <TextField
            margin="dense"
            id="material-stock-edit"
            label="Quantidade"
            value={materialStock}
            onChange={handleMaterialStockChange}
            sx={{ width: 300 }}
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSaveEditedMaterial}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </div>
    </div>
  );
};

export const ImportarMaterialPreviewTable =({colunas, dados, onUpdateArrayElement }) => {

  const [listAreas, setListAreas] = useState(null);
  const [listArmazens, setListArmazens] = useState(null);
  const [listprojectos, setProjectos] = useState(null);
  const [hasFinishedLoading, setHasFinishedLoading] = useState(false);
  const [validatedData,setValidatedData ] = useState([]);
 
  

  getAllProjectos()
  .then(data => {
    setProjectos(data);
    setHasFinishedLoading(true);
  })
  .catch(error => {
    // Handle error if needed
    console.log(error);
    setHasFinishedLoading(false);
  });

  getAllAreas()
  .then(data => {
    setListAreas(data);
    setHasFinishedLoading(true);
  })
  .catch(error => {
    // Handle error if needed
    console.log(error);
    setHasFinishedLoading(false);
  });
  getAllArmazens()
  .then(data =>  {
    setListArmazens(data)
    setHasFinishedLoading(true); })
  .catch(error => {
    // Handle error if needed
    console.log(error);
    setHasFinishedLoading(false);
  });


  const  HandleValidateData = () => {

    /* getAllProjectos()
    .then(data => {
      setProjectos(data);
      setHasFinishedLoading(true);
    })
    .catch(error => {
      // Handle error if needed
      console.log(error);
      setHasFinishedLoading(false);
    });

    getAllAreas()
    .then(data => {
      setListAreas(data);
      setHasFinishedLoading(true);
    })
    .catch(error => {
      // Handle error if needed
      console.log(error);
      setHasFinishedLoading(false);
    });
    getAllArmazens()
    .then(data =>  {
      setListArmazens(data)
      setHasFinishedLoading(true); })
    .catch(error => {
      // Handle error if needed
      console.log(error);
      setHasFinishedLoading(false);
    });
 */

    // Only execute when listAreas and listArmazens has finished loading
    if (hasFinishedLoading) {

          //If either one of the lists is empty,  show a popup notification
    if (!listAreas || !listArmazens || !listprojectos) {
      NotificationManager.error('Nao foi possivel validar os dados tente novamente... erro ao connectar com o servidor','Error', 4000);
      return;
    } else {
      // 
       const areas = listAreas.map((area) => area.area);
       const armazens = listArmazens.map((armazem) => armazem.cod_armazem);
       const projectos = listprojectos.map((projecto) => projecto.nome);
 
    const empty_null_qtd_stock = dados.filter(obj => {
      return Object.keys(obj).some(key => {      
        // skip qtd_stock if it is less than 0
        if (key === 'qtd_stock') {

          const value = obj[key];
          return obj[key] <= 0  || value === null || value === undefined || value ==='';
        } else {
          return false;
        }
      });
    });
    const empty_null_armazem = dados.filter(obj => {
      return Object.keys(obj).some(key => {
        if (key === 'armazem') {
          // check if armazem exists in  armazens array
          const value = obj[key];
          return !armazens.includes(value) || value === null || value === undefined || value ==='';
        } else {
          return false;
        }
      });
    });

    const empty_null_area = dados.filter(obj => {
      return Object.keys(obj).some(key => {
        if (key === 'area') {
          // check if area exists in  area array
          const value = obj[key];
          return !areas.includes(value) || value === null || value === undefined || value ==='';
        } else {
          return false;
        }
      });
    });

    const empty_null_descricao = dados.filter(obj => {  
      return Object.keys(obj).some(key => {
        if (key === 'descricao')  return obj[key] === null || obj[key] === undefined || obj[key] ==='';  
      });   });

    const empty_null_projecto = dados.filter(obj => {
      return Object.keys(obj).some(key => {
        if (key === 'projecto') {

           // check if projecto exists in  projecto array
           const value = obj[key];
           return !projectos.includes(value) || value === null || value === undefined || value ==='';


        }  
      });
    });

   // if all arrays are empty, then data is valid
    if (empty_null_qtd_stock.length === 0 && empty_null_armazem.length === 0 
      && empty_null_area.length === 0 && empty_null_descricao.length === 0 
      && empty_null_projecto.length === 0) {
      NotificationManager.success('Dados validados com sucesso. Iniciando a importacao de dados...','Sucesso', 8000);
      // change  dados  properties values (area, armazem, and projecto) to ids based on the  listAreas, listArmazens and listprojectos
      const mappedData = dados.map((obj) => {
        const area = listAreas.find((area) => area.area === obj.area);
        const armazem = listArmazens.find((armazem) => armazem.cod_armazem === obj.armazem);
        const projecto = listprojectos.find((projecto) => projecto.projecto === obj.nome);
        // if area or armazem or projecto is not found , show a notification to the user and return
        if (!area) {
          NotificationManager.error('Nao foi possivel importar os dados. o Material { ' + obj.descricao+ ' } tem uma area { '+ obj.area +' } que nao existe no sistema.','Error', 6000);
          return;
        }
        if ( !armazem ) {
          NotificationManager.error('Nao foi possivel importar os dados. o Material { ' + obj.descricao+ ' } tem um armazem { '+ obj.armazem +' } que nao existe no sistema.','Error', 6000);
          return;
        }
        if ( !projecto) {
          NotificationManager.error('Nao foi possivel importar os dados. o Material { ' + obj.descricao+ ' } tem um projecto { '+ obj.nome +' } que nao existe no sistema.','Error', 6000);
          return;
        }

        return {
          ...obj,
          area: area.id,
          armazem: armazem.id,
          projecto: projecto.id,
        };
      });

      // send data to Rest API
      handleAPIImportarMateriais(mappedData);
     
      /* generate worksheet and workbook */
      const worksheet = utils.json_to_sheet(dados);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Materiais");


      /* fix headers */
      utils.sheet_add_aoa(worksheet, [["Cod", "Descricao","Quantidade","Armazem","Familia","Projecto","Area","Prazo"]], { origin: "A1" });
      /* calculate column width ( number of properties from rows object) */
      const max_width = Object.keys(dados[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
        //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
      worksheet["!cols"] = [ { wch: max_width } ];
      
      /* create an XLSX file and try to save to  */
      // get current date 
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const today = year + '-' + month + '-' + day;
      // concat the file name  and area with the current date
      const fileName =  "Material" + today + ".xlsx";
      writeFile(workbook,fileName, { compression: true });
 
     
    } else {
      // if any of the arrays is not empty, then data is invalid
      const length_empty_null_qtd_stock = empty_null_qtd_stock.length;
      const length_empty_null_armazem = empty_null_armazem.length;
      const length_empty_null_area = empty_null_area.length;
      const length_empty_null_descricao = empty_null_descricao.length;
      const length_empty_null_projecto = empty_null_projecto.length;

      if (length_empty_null_qtd_stock > 0) {
        NotificationManager.error('Total de Linhas com qtd_stock invalidos: ' + length_empty_null_qtd_stock
        ,'Validacao da Quantidade de Stock',
        60000, // duration in milliseconds
        () => {
          // Callback function to be executed after the notification is clicked
          // export data
          const jsonRows = empty_null_qtd_stock;

          /* generate worksheet and workbook */
          const worksheet = utils.json_to_sheet(jsonRows);
          const workbook = utils.book_new();
          utils.book_append_sheet(workbook, worksheet, "Material");


          /* fix headers */
          utils.sheet_add_aoa(worksheet, [["Cod", "Descricao","Quantidade","Armazem","Familia","Projecto","Area","Prazo"]], { origin: "A1" });
          /* calculate column width ( number of properties from rows object) */
          const max_width = Object.keys(empty_null_qtd_stock[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
            //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
          worksheet["!cols"] = [ { wch: max_width } ];

          /* create an XLSX file and try to save to  */
          // concat the file name  and area with the current date
            const fileName = "Material Stock Invalido.xlsx";
          writeFile(workbook,fileName, { compression: true });

          return; 
        },
        true // Whether to show close button or not
      );

      }
      if (length_empty_null_armazem > 0) {
        NotificationManager.error('Total de Linhas com armazem invalidos: ' + length_empty_null_armazem
        ,'Validacao do Armazem',
        60000, // duration in milliseconds
        () => {
          // Callback function to be executed after the notification is clicked
          // export data
          const jsonRows = empty_null_armazem;

          /* generate worksheet and workbook */
          const worksheet = utils.json_to_sheet(jsonRows);
          const workbook = utils.book_new();
          utils.book_append_sheet(workbook, worksheet, "Material");


          /* fix headers */
          utils.sheet_add_aoa(worksheet, [["Cod", "Descricao","Quantidade","Armazem","Familia","Projecto","Area","Prazo"]], { origin: "A1" });
          /* calculate column width ( number of properties from rows object) */
          const max_width = Object.keys(empty_null_armazem[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
            //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
          worksheet["!cols"] = [ { wch: max_width } ];

          /* create an XLSX file and try to save to  */
          // concat the file name  and area with the current date
            const fileName = "Material Armazem Invalido.xlsx";
          writeFile(workbook,fileName, { compression: true });
          return; 
        },
        true // Whether to show close button or not
      );
      }
      if (length_empty_null_area > 0) {
        NotificationManager.error('Total de Linhas com area invalidos: ' + length_empty_null_area
        ,' Validacao da Area',
        60000, // duration in milliseconds
        () => {
          // Callback function to be executed after the notification is clicked
          // export data
          const jsonRows = empty_null_area;

          /* generate worksheet and workbook */
          const worksheet = utils.json_to_sheet(jsonRows);
          const workbook = utils.book_new();
          utils.book_append_sheet(workbook, worksheet, "Material");


          /* fix headers */
          utils.sheet_add_aoa(worksheet, [["Cod", "Descricao","Quantidade","Armazem","Familia","Projecto","Area","Prazo"]], { origin: "A1" });
          /* calculate column width ( number of properties from rows object) */
          const max_width = Object.keys(empty_null_area[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
            //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
          worksheet["!cols"] = [ { wch: max_width } ];

          /* create an XLSX file and try to save to  */
          // concat the file name  and area with the current date
            const fileName = "Material Area Invalido.xlsx";
          writeFile(workbook,fileName, { compression: true });
          return; 
        },
        true // Whether to show close button or not
      );
      }
      if (length_empty_null_descricao > 0) {
        NotificationManager.error('Total de Linhas com descricao invalidos: ' + length_empty_null_descricao
        ,'Validacao da Descricao do Material',
        60000, // duration in milliseconds
        () => {
          // Callback function to be executed after the notification is clicked
          // Export data
          const jsonRows = empty_null_descricao;

          /* generate worksheet and workbook */
          const worksheet = utils.json_to_sheet(jsonRows);
          const workbook = utils.book_new();
          utils.book_append_sheet(workbook, worksheet, "Material");


          /* fix headers */
          utils.sheet_add_aoa(worksheet, [["Cod", "Descricao","Quantidade","Armazem","Familia","Projecto","Area","Prazo"]], { origin: "A1" });
          /* calculate column width ( number of properties from rows object) */
          const max_width = Object.keys(empty_null_area[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
            //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
          worksheet["!cols"] = [ { wch: max_width } ];

          /* create an XLSX file and try to save to  */
          // concat the file name  and area with the current date
            const fileName = "Material descricao Invalido.xlsx";
          writeFile(workbook,fileName, { compression: true });
          return; 
        },
        true // Whether to show close button or not
      );

      }
      if (length_empty_null_projecto > 0) {
        NotificationManager.error('Total de Linhas com projecto invalidos: ' + length_empty_null_projecto
        ,'Validacao do Projecto',
        60000, // duration in milliseconds
        () => {
          // Callback function to be executed after the notification is clicked
          // export data
          const jsonRows = empty_null_projecto;

          /* generate worksheet and workbook */
          const worksheet = utils.json_to_sheet(jsonRows);
          const workbook = utils.book_new();
          utils.book_append_sheet(workbook, worksheet, "Material");


          /* fix headers */
          utils.sheet_add_aoa(worksheet, [["Cod", "Descricao","Quantidade","Armazem","Familia","Projecto","Area","Prazo"]], { origin: "A1" });
          /* calculate column width ( number of properties from rows object) */
          const max_width = Object.keys(empty_null_projecto[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
          //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
          worksheet["!cols"] = [ { wch: max_width } ];

          /* create an XLSX file and try to save to  */
          // concat the file name  and area with the current date
          const fileName = "Material descricao Invalido.xlsx";
          writeFile(workbook,fileName, { compression: true });
          return; 
        },
        true // Whether to show close button or not
      );
      }


      return ;
    }


/* 
    const filteredEmptyJsonData = dados.filter(obj => {
      return Object.keys(obj).some(key => {
        //skip prazo , cod  and familia because are not mandatory fields
        if (key === 'prazo' || key === 'cod' || key === 'familia') return false;
        // skip qtd_stock if it is less than 0
        if (key === 'qtd_stock') return obj[key] <= 0;
        // check if armazem exists in  armazens array
        // if (key === 'armazem') return !armazens.includes(obj[key]);
        // check if area exists in  areas array
        //if (key === 'area') return !areas.includes(obj[key]);
        const value = obj[key];
        return value === '' || value === null || value === undefined;
      });
    });


    const filteredEmptyJsonData = dados.filter(obj => {
      return Object.keys(obj).some(key => {
        //skip prazo , cod  and familia because are not mandatory fields
        if (key === 'prazo' || key === 'cod' || key === 'familia') return false;
        // skip qtd_stock if it is less than 0
        if (key === 'qtd_stock') return obj[key] <= 0;
        // check if armazem exists in  armazens array
        // if (key === 'armazem') return !armazens.includes(obj[key]);
        // check if area exists in  areas array
        //if (key === 'area') return !areas.includes(obj[key]);
        const value = obj[key];
        return value === '' || value === null || value === undefined;
      });
    }); */
  

}    }
    };



const handleAPIImportarMateriais = async (jsonData) => {

      const apiUrl = process.env.REACT_APP_API_URL;   

  // Send a POST request
    try {
      const response = await axios.post(apiUrl + '/material', jsonData);
      const resposta = response.data;
      const statusText = resposta.statusText;
      
      console.log('API response:', statusText);
      NotificationManager.success('Dados importados com sucesso. Total :' + jsonData.length ,'Sucesso', 5000);
      const updatedData = [] ;
      onUpdateArrayElement(updatedData);
      // Do something with the response, such as updating state or displaying a success message
      return resposta;
    } catch (error) {
     
      const errorMessage = error.response.data.message;
      NotificationManager.error('Nao foi possivel importar os dados:' +  errorMessage ,'Error', 10000);
      return error;
    }
  };
  
const HandleResetTableMaterial = () => {
  const updatedData = [] ;
  onUpdateArrayElement(updatedData);
}
 // Hide ID  and ID Area Columns
 const hiddenColumns = ['id', 'id_area']; // Array of columns to hide
 const visibleColumns = colunas.filter(column => !hiddenColumns.includes(column.accessorKey));

    
 const handleExportMaterial= (rows) => {
  const jsonRows = rows;

    // extract all data from colaboradores  from jsonRows and save it to an array
    // array should contain the following properties: Nome, Email, Contacto, Area, Cargo, Papel
   const rowsArray = jsonRows.map((row) => {
      return {
        cod: row.Cod,
        descricao: row.Descricao,
        qtd_stock: row.Quantidade,
        armazem: row.Armazem,
        familia: row.Familia,
        projecto: row.Projecto,
        area: row.Area,
        prazo: row.Prazo,
      };
    } );


    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Material");


    /* fix headers */
    utils.sheet_add_aoa(worksheet, [["Cod", "Descricao","Quantidade","Armazem","Familia","Projecto","Area","Prazo"]], { origin: "A1" });
    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
      //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [ { wch: max_width } ];



    /* create an XLSX file and try to save to  */
    // concat the file name  and area with the current date
      const fileName = "Materiais.xlsx";

    writeFile(workbook,fileName, { compression: true });



};


  return (
    <MaterialReactTable
      columns={visibleColumns}
      data={dados}
      enableRowSelection
      enableRowActions
      enableColumnOrdering
      initialState={{ density: 'compact' }}
      positionToolbarAlertBanner="bottom"
      renderTopToolbarCustomActions={({ table }) => (

          <div style={{ display: 'flex', gap: '0.5rem' }}>
          
            <Button
              color="success"
              disabled={table.getPrePaginationRowModel().rows.length === 0}
              onClick={ HandleValidateData}
              variant="contained"
            >
            Importar Material
            </Button>
            <Button
              color="success"
              disabled={table.getPrePaginationRowModel().rows.length === 0}
              onClick={ HandleResetTableMaterial}
              variant="contained"
            >
            Reset
            </Button>
            <Button
            disabled={table.getPrePaginationRowModel().rows.length === 0}
            //export all rows, including from the next page, (still respects filtering and sorting)
            onClick={handleExportMaterial}
            startIcon={<FileDownloadIcon />}
            variant="contained"
          >
            Download
          </Button>
          </div>
  
      
      )}
    />
  );
};
// export default  {MaterialDisponivelTable, ImportarMaterialPreviewTable } ;

// TODO highlight selected row
export const MaterialUnidadeSanitariaTable = ({colunas, dados, onSetRequisicoes}) => {
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [requisicao, updateData] = useState([...dados]);
  //const valores = selectedValues;
  let material = null;


  const csvOptions = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalSeparator: '.',
    showLabels: true,
    useBom: true,
    useKeysAsHeaders: false,
    headers: colunas.map((c) => c.header),
  };
  
  const csvExporter = new ExportToCsv(csvOptions);

  const handleExportRows = (rows) => {
    csvExporter.generateCsv(rows.map((row) => row.original));
  };

 

const handleSaveRow =  ({ exitEditingMode, row, values }) => {
  //if using flat data and simple accessorKeys/ids, you can just do a simple assignment here.

   // get the original row object
    const originalRequisicao = row.original;
    const constidUSModifiedReq = originalRequisicao.us;

   // crate new Requisicao object with the same properties
   // frrom row.orginal and update the us property with the new value
    const newRequisicao = {
      ...originalRequisicao,
      notas: values.notas,
      pf_contacto: values.pf_contacto,
      pf_nome: values.pf_nome,
      quantidade: values.quantidade,
    };

  exitEditingMode(); //required to exit editing mode
};

  const handleExportData = () => {
    csvExporter.generateCsv(dados);
  };

  return (

    <MaterialReactTable  
      columns={colunas}
      data={dados}
      initialState={{
        columnVisibility: { id: false,material: false,requisitante: false ,us:false},
         density: 'compact'
         }}
         editingMode="row"
         enableEditing
         enableRowSelection
         onEditingRowSave={handleSaveRow}


    />

  );
};

// TODO highlight selected row
export const MinhasRequisicoesTable = ({colunas, dados, tipo}) => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [requisicoes, setUpdateRequisicoes] = useState([...dados]);

  let requisicao = null;
  const navigate = useNavigate();
  let requisition_type = null;

  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  //if tipo is null then requisition_type is  an empty string
 
  if(tipo === 'pendentes'){
    requisition_type = 'pendentes';

  }else if(tipo === 'processadas'){
    requisition_type = 'processadas';
  } else if(tipo === 'entregues') {
    requisition_type = 'entregues';
  } else{
    requisition_type = '';
  }

  const  fetchResultCancelRequisicao = async(id_requisicao) => {
    // Send a POST request
    const result = await cancelRequisicao(id_requisicao);
    return result;
  }

  const handleExportRows = (rows) => {
    const jsonRows = rows;


      // extract all data from jsonRows and save it to an array
      const rowsArray = jsonRows.map((row) => {
        // Get values from the selected row and create a json object
        requisicao = {
          data_requisicao: row.getValue('data_requisicao'),
          material_descricao: row.getValue('material'),
          quantidade: row.getValue('quantidade'),
          unidade_sanitaria: row.getValue('unidade_sanitaria'),
          pf_nome: row.getValue('pf_nome'),
          pf_contacto: row.getValue('pf_contacto'),
          requisitante: row.getValue('requisitante'),
          nr_guia: row.getValue('nr_guia'),
          notas: row.getValue('notas'),
          area: row.getValue('area')
        };
        return requisicao;
      });
  
   
      /* generate worksheet and workbook */
      const worksheet = utils.json_to_sheet(rowsArray);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Requisicoes");
    
   
     /* fix headers */
     utils.sheet_add_aoa(worksheet, [["Data", "Material","Qtd. Requisitada","Unidade Sanitaria","Ponto Focal","Contacto","Requisitante","Numero da Guia","Notas", "Area"]], { origin: "A1" });
   
   // Make column names bold by iterating through the header cells
   // const headerCellStyle = { font: { bold: true } };
   // const headerRange = utils.decode_range(worksheet['!ref']);
   // for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
   //   const headerCell = utils.encode_cell({ r: headerRange.s.r, c: col });
   //   worksheet[headerCell].s = headerCellStyle;
   // }
   
   
     /* calculate column width ( number of properties from rows object) */
     const max_width = Object.keys(rows[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
       //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
     worksheet["!cols"] = [ { wch: max_width } ];
   
     // Get current date  an store in the YYYY-MM-DD format
     const date = new Date();
     const year = date.getFullYear();
     const month = date.getMonth() + 1;
     const day = date.getDate();
     const today = year + '-' + month + '-' + day;
   
     /* create an XLSX file and try to save to  */
     // concat the file name  and area with the current date
      const fileName = "Requisicoes "+ requisition_type + "{" + rowsArray[0].area + "} "+ today + ".xlsx";
   
     writeFile(workbook,fileName, { compression: true });
  }

  const handleVoidRequisicao = async () => {


      let id_requisicao = selectedRow[0].id;
      //  cancell requisicao
      try {
        const result =  await fetchResultCancelRequisicao(id_requisicao);
        if (result[0].canceled==='Yes') {
          NotificationManager.success('Requisicao cancelada com sucesso','Sucesso', 5000);
          // update requisicoes array
          handleClose( );
          const updatedRequisicoes = dados.filter((requisicao) => requisicao.id !== id_requisicao);
          setUpdateRequisicoes(updatedRequisicoes);
        }
        
      } catch (error) {
        NotificationManager.error('Nao foi possivel cancelar a requisicao: ' + error.message,'Error', 5000);
        
      }

      return;
  
  
  };

  const handleConfirmVoidRequisicao =(rows) => {

    if (rows.length > 1) {
      // Alert the user can only activate one row at a time, use NotificationManager
      NotificationManager.info('Apenas uma linha pode ser selecionada de cada vez','Info', 4000);
  
    } else {

      let req = null;
      // get all properties from rows (dados) and store in an array. each row represent a requisicao.
      const requisicao = rows.map((row) => {
       // Get values from the selected row and create a json object
       req = {
         id: row.getValue('id'),
         data_requisicao: row.getValue('data_requisicao'),
         material_descricao: row.getValue('material_descricao'),
         quantidade: row.getValue('quantidade'),
         unidade_sanitaria: row.getValue('unidade_sanitaria'),
         nr_guia: row.getValue('nr_guia'),
         pf_nome: row.getValue('pf_nome'),
         pf_contacto: row.getValue('pf_contacto'),
         requisitante: row.getValue('requisitante'),
         notas: row.getValue('notas')
       };
       return req;
     });

    setSelectedRow(requisicao);

    handleClickOpen();
    
    }

  }



  const handleVisualizarGuia = (rows) => {

      // if more than one row is selected, show a popup notification and return
      if (rows.length > 1) {
        NotificationManager.info('Pode visualizar apenas uma Guia de cada vez','Info', 5000);
        return;
      }
     let req = null;
       // get all properties from rows (dados) and store in an array. each row represent a requisicao.
       const requisicoes = rows.map((row) => {
        // Get values from the selected row and create a json object
        req = {
          id: row.getValue('id'),
          data_requisicao: row.getValue('data_requisicao'),
          material_descricao: row.getValue('material_descricao'),
          quantidade: row.getValue('quantidade'),
          unidade_sanitaria: row.getValue('unidade_sanitaria'),
          nr_guia: row.getValue('nr_guia'),
          pf_nome: row.getValue('pf_nome'),
          pf_contacto: row.getValue('pf_contacto'),
          requisitante: row.getValue('requisitante'),
          notas: row.getValue('notas')
        };
        return req;
      });



       let tempNrGuia = requisicoes[0].nr_guia;
      
       // if tempNrGuia is null, then show a popup notification and return
        if (tempNrGuia === null) {
          NotificationManager.info('Nao existe nenhuma Guia associada a esta requisicao','Info', 5000);
          return;
        }
  
        navigate('/visualizarGuia', {
          state: {requisicoes , tempNrGuia },
          replace: true,
        });
        
  
    
  
  };



  return (
    <div>
    <MaterialReactTable
      columns={colunas}
      data={requisicoes}
      initialState={{
        columnVisibility: { id: false, requisitante_id: false, id_guia: false, guia_status: false},
         density: 'compact'
         }}
      enableRowSelection
      enableRowActions
      enableColumnOrdering
      positionToolbarAlertBanner="bottom"
      renderTopToolbarCustomActions={({ table }) => (

          <div style={{ display: 'flex', gap: '0.5rem' }}>
          
            <Button
              color="success"
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
              onClick={ () => handleVisualizarGuia(table.getSelectedRowModel().rows)}
              variant="contained"
              startIcon={<ArticleIcon />}
             
            >
            Ver Guia
            </Button>
            <Button
            disabled={table.getFilteredSelectedRowModel().rows.length === 0 || requisition_type === 'entregues' || requisition_type=== 'processadas'}
            //export all rows, including from the next page, (still respects filtering and sorting)
            onClick={() => handleConfirmVoidRequisicao(table.getSelectedRowModel().rows)}
            startIcon={<DeleteForeverIcon />}
            variant="contained"
          >
            Anular
          </Button>
          <Button
            disabled={table.getPrePaginationRowModel().rows.length === 0}
            //export all rows, including from the next page, (still respects filtering and sorting)
            onClick={() => handleExportRows(table.getPrePaginationRowModel().rows)}
            startIcon={<FileDownloadIcon />}
            variant="contained"
          >
            Download
          </Button>
          </div>
          
  
      
      )}
    />
    <div>

<Dialog open={open} onClose={handleClose}>
  <DialogTitle> Confirmar   </DialogTitle>
  <DialogContent>
    <DialogContentText>
      Tem certeza que deseja anular esta requisicao?
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleVoidRequisicao}>Salvar</Button>
  </DialogActions>
</Dialog>
</div>

</div>



  );
};

export const RequisicoesPorAreaTable = ({colunas, dados, areaInfo}) => {
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  let requisicao = null;
  const navigate = useNavigate();


   const handleExportRows = (rows) => {
    const jsonRows = rows;


      // extract all data from jsonRows and save it to an array
      const rowsArray = jsonRows.map((row) => {
        // Get values from the selected row and create a json object
        requisicao = {
          data_requisicao: row.getValue('data_requisicao'),
          material_descricao: row.getValue('material_descricao'),
          quantidade: row.getValue('quantidade'),
          area: row.getValue('area'),
          unidade_sanitaria: row.getValue('unidade_sanitaria'),
          pf_nome: row.getValue('pf_nome'),
          pf_contacto: row.getValue('pf_contacto'),
          requisitante: row.getValue('requisitante_nome'),
          notas: row.getValue('notas'),
          projecto: row.getValue('projecto')
        };
        return requisicao;
      });
  
   
      /* generate worksheet and workbook */
      const worksheet = utils.json_to_sheet(rowsArray);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Requisicoes");
    
   
     /* fix headers */
     utils.sheet_add_aoa(worksheet, [["Data", "Material","Qtd. Requisitada","Area","Unidade Sanitaria","Ponto Focal","Contacto","Requisitante","Notas"]], { origin: "A1" });
   
   // Make column names bold by iterating through the header cells
   // const headerCellStyle = { font: { bold: true } };
   // const headerRange = utils.decode_range(worksheet['!ref']);
   // for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
   //   const headerCell = utils.encode_cell({ r: headerRange.s.r, c: col });
   //   worksheet[headerCell].s = headerCellStyle;
   // }
   
   
     /* calculate column width ( number of properties from rows object) */
     const max_width = Object.keys(rows[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
       //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
     worksheet["!cols"] = [ { wch: max_width } ];
   
     // Get current date  an store in the YYYY-MM-DD format
     const date = new Date();
     const year = date.getFullYear();
     const month = date.getMonth() + 1;
     const day = date.getDate();
     const today = year + '-' + month + '-' + day;
   
     /* create an XLSX file and try to save to  */
     // concat the file name  and area with the current date
      const fileName = "Requisicoes {" + rowsArray[0].area + "} "+ today + ".xlsx";
   
     writeFile(workbook,fileName, { compression: true });
  }



 const handleCriarGuia = (rows) => {
  // Check if multiple rows are selected
  if (rows.length > 0) {

     // get all properties from rows and store in an array. each row represent a requisicao.

      const materiasRequisitados = rows.map((row) => {
        // Get values from the selected row and create a json object
        requisicao = {
          id_requisicao: row.getValue('id_requisicao'),
          data_requisicao: row.getValue('data_requisicao'),
          material_descricao: row.getValue('material_descricao'),
          quantidade: row.getValue('quantidade'),
          area: row.getValue('area'),
          id_us: row.getValue('id_us'),
          unidade_sanitaria: row.getValue('unidade_sanitaria'),
          pf_nome: row.getValue('pf_nome'),
          pf_contacto: row.getValue('pf_contacto'),
          notas: row.getValue('notas'),
          projecto: row.getValue('projecto')
        };
        return requisicao;
      });
      // check if all requisicoes are from the same unidade sanitaria
      const us = materiasRequisitados[0].unidade_sanitaria;
      const isSameUS = materiasRequisitados.every((requisicao) => requisicao.unidade_sanitaria === us);
      if (!isSameUS) {
        NotificationManager.error('Apenas requisicoes com mesmo destino podem ser agrupadas numa guia','Error', 14000);
        return;
      }
      // Save idArea and materiasRequisitados to sessionStorage and Route to the requisicao page
      navigate('/novaGuia', {
        state: {materiasRequisitados, areaInfo },
        replace: true,
      });
      

  }

};


  return (

    <MaterialReactTable
      columns={colunas}
      data={dados}
      initialState={{
        columnVisibility: { id_requisicao: false, id_us: false},
         density: 'compact'
         }}
      enableRowSelection
      enableRowActions
      enableColumnOrdering
      positionToolbarAlertBanner="bottom"
      renderTopToolbarCustomActions={({ table }) => (

          <div style={{ display: 'flex', gap: '0.5rem' }}>
          
            <Button
              color="success"
              disabled={table.getSelectedRowModel().rows.length === 0}
              onClick={ () => handleCriarGuia(table.getSelectedRowModel().rows)}
              variant="contained"
            >
            Ciar Guia
            </Button>
            <Button
            disabled={table.getPrePaginationRowModel().rows.length === 0}
            //export all rows, including from the next page, (still respects filtering and sorting)
            onClick={() => handleExportRows(table.getPrePaginationRowModel().rows)}
            startIcon={<FileDownloadIcon />}
            variant="contained"
          > 
            Download
          </Button>
          </div>
  
      
      )}
    />

  );
};

export const GuiasPorAreaTable = ({colunas, dados}) => {

  const navigate = useNavigate();

  let guiaSaida = null;
  const handleExportGuias = (rows) => {
    const jsonRows = rows;
    let guia = null;

      // extract all data from guia (dados) from jsonRows and save it to an array
      // array should contain the following properties:
      // Numero da Guia, Data, Unidade Sanitaria, Area, Motorista, Previsao de Entrega, Estado,
      // Obsercacao and Data de Entrega
      const rowsArray = jsonRows.map((row) => {
        // Get values from the selected row and create a json object
        guia = {
          id_guia: row.getValue('nr_guia'),
          data_guia: row.getValue('data_guia'),
          unidade_sanitaria: row.getValue('unidade_sanitaria'),
          area: row.getValue('area'),
          motorista: row.getValue('motorista'),
          previsao_entrega: row.getValue('previsao_entrega'),
          estado: row.getValue('status'),
          observacao: row.getValue('observacao'),
          data_entrega: row.getValue('data_entrega')
        };
        return guia;
      
      });

      /* generate worksheet and workbook */
      const worksheet = utils.json_to_sheet(rowsArray);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Guias de Saida");


      /* fix headers */
      utils.sheet_add_aoa(worksheet, [["Numero da Guia", "Data","Unidade Sanitaria","Area","Motorista","Previsao de Entrega","Estado","Observacao","Data de Entrega"]], { origin: "A1" });

      /* calculate column width ( number of properties from rows object) */
      const max_width = Object.keys(rows[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
        //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
      worksheet["!cols"] = [ { wch: max_width } ];

      // Get current date  an store in the YYYY-MM-DD format
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const today = year + '-' + month + '-' + day;

      /* create an XLSX file and try to save to  */
      // concat the file name  and area with the current date
        const fileName = "Guias de Saida {" + rowsArray[0].area + "} "+ today + ".xlsx";

      writeFile(workbook,fileName, { compression: true });



  };

  const handleVisualizarGuia = (rows) => {
    // Check if multiple rows are selected
    if (rows.length > 0) {

      // if more than one row is selected, show a popup notification and return
      if (rows.length > 1) {
        NotificationManager.info('Apenas uma guia pode ser selecionada de cada vez','Info', 5000);
        return;
      }
     let guia = null;
       // get all properties from rows (dados) and store in an array. each row represent a guia de saida.
       guiaSaida = rows.map((row) => {
        // Get values from the selected row and create a json object
        guia = {
          nr_guia: row.getValue('nr_guia'),
          data_guia: row.getValue('data_guia'),
          estado: row.getValue('status'),
          unidade_sanitaria: row.getValue('unidade_sanitaria'),
          area: row.getValue('area'),
          motorista: row.getValue('motorista'),
          previsao_entrega: row.getValue('previsao_entrega'),
          observacao: row.getValue('observacao'),
          data_entrega: row.getValue('data_entrega')
        };
        return guia;

      });

    let tempNrGuia = guiaSaida[0].nr_guia;
    let requisicoes = guiaSaida;
  
        navigate('/visualizarGuia', {
          state: {requisicoes , tempNrGuia},
          replace: true,
        });
        
  
    }
  
  };
  

  return (

    <MaterialReactTable
      columns={colunas}
      data={dados}
      initialState={{
        columnVisibility: { id: false},
         density: 'compact'
         }}
      enableRowSelection
      enableRowActions
      enableColumnOrdering
      positionToolbarAlertBanner="bottom"
      renderTopToolbarCustomActions={({ table }) => (

          <div style={{ display: 'flex', gap: '0.5rem' }}>
          
            <Button
              color="success"
              disabled={table.getSelectedRowModel().rows.length === 0}
              onClick={ () => handleVisualizarGuia(table.getSelectedRowModel().rows)}
              variant="contained"
            >
            Visualizar Guia
            </Button>
            <Button
            disabled={table.getPrePaginationRowModel().rows.length === 0}
            //export all rows, including from the next page, (still respects filtering and sorting)
            //onClick={() => handleExportRows(table.getPrePaginationRowModel().rows)}
            onClick={() => handleExportGuias(table.getPrePaginationRowModel().rows)}
            startIcon={<FileDownloadIcon />}
            variant="contained"
          > 
            Download
          </Button>
          </div>
  
      
      )}
    />

  );
};

// TODO highlight selected row
export const AreasProgramaticasTable = ({colunas, dados  }) => {


  const [areaDescricao, setAreaDescricao] = useState('');
  const [areaNome, setAreaNome] = useState(0); 

  const handleAreaDescricaoChange = (event) => {
    setAreaDescricao(event.target.value);
  };

  const handleAreaNomeChange = (event) => {
    setAreaNome(event.target.value);
  };

  const [areaToEdit, setAreaToEdit] = useState(null);
  // create a ref to areaToEdit
  const areaToEditRef = React.useRef(areaToEdit);
  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const fetchResultUpdateAreaStatus = async (json) => {

    const resultado = await updateAreaStatus(json);
  
    return resultado;
    
  };

  const fetchResultUpdateArea = async (json) => {
      
    const resultado = await updateArea(json);

    return resultado;

  };
  const handleEditArea = (rows) => {
    // Check if multiple rows are selected

    if (rows.length > 1) {
      // Alert the user can only activate one row at a time, use NotificationManager
      NotificationManager.info('Apenas uma linha pode ser selecionada de cada vez','Info', 4000);

    } else {

     // create an area object with the selected row values

      rows.map((row) => {
        // Get values from the selected row and create a json object
        const area = {
          id: row.getValue('id'),
          area: row.getValue('area'),
          descricao: row.getValue('descricao'),
        };
        setAreaDescricao(area.descricao);
        setAreaNome(area.area);
        setAreaToEdit(area);

        handleClickOpen();
        // set the values of the area-descricao-edit and area-name-edit to the values of the selected row


      })
    } ;// end of map

  };
  const handleChangeAreaStatus = async (rows) => {

    let area = null;
  // Check if multiple rows are selected
  if (rows.length > 1) {
    // Alert the user can only activate one row at a time, use NotificationManager
    NotificationManager.info('Apenas uma linha pode ser selecionada de cada vez','Info', 4000);

  } else {
  
    rows.map(async (row) => {
      // Get values from the selected row and create a json object
     let  area = {
        id_area: row.getValue('id'),
        area_status: row.getValue('status'),
      };

      // Prompt the user for confirmation using a popup
      // If the user confirms, then update the user status
      // If the user cancels, then do nothing
             if (area.area_status === 'Active') {
                area.area_status = 'Inactive';
                 try {
                  let res = await fetchResultUpdateAreaStatus(area);
                  if (res.data === "Actualizado com sucesso") {
                  NotificationManager.success('Estado da Area alterado com sucesso','Sucesso', 4000);
      
                   // wait for 5 seconds
                   setTimeout(() => {
                    // refresh the page
                    window.location.reload();
                  }, 3000);
                  }
                
                } catch (error) {
                  // show the error
                  NotificationManager.error('Erro ao actualizar a Area' +error.message,'Error', 3000);
                 }
              } else {
                area.area_status = 'Active';
                try {
                  let res = await fetchResultUpdateAreaStatus(area);
                  if (res.data === "Actualizado com sucesso") {
                    NotificationManager.success('Estado da Area alterado com sucesso','Sucesso', 3000);

                  // wait for 5 seconds
                      setTimeout(() => {
                        // refresh the page
                        window.location.reload();
                      }, 3000);
                    }
                } catch (error) {
                  // show the error
                  NotificationManager.error('Erro ao actualizar a Area' +error.message,'Error', 4000);
                 }

                }

    });
  }

};

const handleSaveEditedArea = async () => {
  // Get the values from the form
  const areaName = document.getElementById('area-name-edit').value;
  const areaDescricao = document.getElementById('area-descricao-edit').value;


  // Check if the values are empty
  if (areaName === '' || areaDescricao === '' ) {
    NotificationManager.error('Preencha todos os campos','Error', 4000);
    return;
  }

  // Create an area object with the values
  let newArea = {
    id_area: areaToEdit.id,
    area_name: areaName,
    area_descricao: areaDescricao,
  };

  // Update the area
  try {
    let res = await fetchResultUpdateArea(newArea);
    if (res.data === "Actualizado com sucesso") {
      NotificationManager.success('Area actualizada com sucesso','Sucesso', 3000);
      // wait for 5 seconds the close the dialog
      setTimeout(() => {
        // refresh the page
        handleClose();
        window.location.reload();
      }, 3000);


    } else {
      NotificationManager.error('Erro ao actualizar a Area','Error', 3000);
    }
  } catch (error) {
    // show the error
    NotificationManager.error('Erro ao actualizar a Area' +error.message,'Error', 4000);
    handleClose();
  }

  // Close the dialog
  handleClose();
};

const handleExportAreas = (rows) => {
  const jsonRows = rows;

    // extract all data from materiais  from jsonRows and save it to an array
    // array should contain the following properties: cod, descricao, qtd_stock, armazem, familia, prazo
   const rowsArray = jsonRows.map((row) => {
      return {
        cod: row.getValue('id'),
        descricao: row.getValue('area'),
        status: row.getValue('status'),
      };
    });


    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Areas Programaticas");


    /* fix headers */
    utils.sheet_add_aoa(worksheet, [["ID", "Nome", "Estado"]], { origin: "A1" });

    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
      //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [ { wch: max_width } ];

    // Get current date  an store in the YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const today = year + '-' + month + '-' + day;

    /* create an XLSX file and try to save to  */
    // concat the file name  and area with the current date
      const fileName = "Areas Programaticas  "+ today + ".xlsx";

    writeFile(workbook,fileName, { compression: true });



};

  return (
    <div> 
    <MaterialReactTable
      columns={colunas}
      data={dados}
      initialState={{
        columnVisibility: { id: false },
         density: 'compact'
         }}
      enableRowSelection
      enableRowActions
      enableColumnOrdering
      positionToolbarAlertBanner="bottom"
      renderTopToolbarCustomActions={({ table }) => (

          <div style={{ display: 'flex', gap: '0.5rem' }}>
          
            <Button
              color="success"
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
              onClick={ () => handleChangeAreaStatus(table.getSelectedRowModel().rows)}
              variant="contained"
            >
            Activar / Desactivar
            </Button>
            <Button
            disabled={table.getPrePaginationRowModel().rows.length === 0}
            //export all rows, including from the next page, (still respects filtering and sorting)
            onClick={() => handleExportAreas(table.getPrePaginationRowModel().rows)}
            startIcon={<FileDownloadIcon />}
            variant="contained"
          >
            Download
          </Button>
          <Button
            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
            
            //export all rows, including from the next page, (still respects filtering and sorting)
            onClick={() => handleEditArea(table.getSelectedRowModel().rows)}
            startIcon={<EditIcon  />}
            variant="contained"
          >
            Editar
          </Button>
          </div>
  
      
      )}
    />
<div>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle> Editar   </DialogTitle>
        <DialogContent>
          <DialogContentText>
          </DialogContentText>
          <TextField
            margin="dense"
            id="area-name-edit"
            label="Nome"
            value={areaNome}
            onChange={handleAreaNomeChange}
            sx={{ width: 300 }}
            variant="standard"
          />
          <br>
          </br>
          <TextField
            margin="dense"
            id="area-descricao-edit"
            label="Descricao"
           value={areaDescricao}
           onchange={handleAreaDescricaoChange}
            sx={{ width: 300 }}
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSaveEditedArea}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </div>
    </div>


  );
};

// TODO highlight selected row
export const ColaboradoresTable = ({colunas, dados}) => {
  const [open, setOpen] = React.useState(false);
  let usuario = null;
  let activactioStatus = null;
  const navigate = useNavigate();

  const handleClose = () => {
    setOpen(false);
  };
  const fetchResultUpdateUserStatus = async (json) => {

    const resultado = await updateUsuarioStatus(json);
  
    return resultado;
    
  };

  
 const handleChangeUserStatus = async (rows) => {
  // Check if multiple rows are selected
  if (rows.length > 1) {
    // Alert the user can only activate one row at a time, use NotificationManager
    NotificationManager.info('Apenas uma linha pode ser selecionada de cada vez','Info', 4000);

  } else {
  
    rows.map(async (row) => {
      // Get values from the selected row and create a json object
      usuario = {
        id_usuario: row.getValue('id'),
        user_status: row.getValue('status'),
      };

      // Prompt the user for confirmation using a popup
      // If the user confirms, then update the user status
      // If the user cancels, then do nothing
             if (usuario.user_status === 'Active') {
                usuario.user_status = 'Inactive';
                 try {
                  let res = await fetchResultUpdateUserStatus(usuario);
                  if (res.data === "Actualizado com sucesso") {
                  NotificationManager.success('Estado do utilizador alterado com sucesso','Sucesso', 4000);
      
                   // wait for 5 seconds
                   setTimeout(() => {
                    // refresh the page
                    window.location.reload();
                  }, 3000);
                  }
                
                } catch (error) {
                  // show the error
                  NotificationManager.error('Erro ao actualizar o usuario' +error.message,'Error', 3000);
                 }
              } else {
                usuario.user_status = 'Active';
                try {
                  let res = await fetchResultUpdateUserStatus(usuario);
                  if (res.data === "Actualizado com sucesso") {
                    NotificationManager.success('Estado do utilizador alterado com sucesso','Sucesso', 3000);

                  // wait for 5 seconds
                      setTimeout(() => {
                        // refresh the page
                        window.location.reload();
                      }, 3000);
                    }
                } catch (error) {
                  // show the error
                  NotificationManager.error('Erro ao actualizar o usuario' +error.message,'Error', 4000);
                 }

                }

    });
  }

};

const handleExportColaboradores= (rows) => {
  const jsonRows = rows;

    // extract all data from colaboradores  from jsonRows and save it to an array
    // array should contain the following properties: Nome, Email, Contacto, Area, Cargo, Papel
   const rowsArray = jsonRows.map((row) => {
      return {
        Nome: row.getValue('nome'),
        Email: row.getValue('email'),
        Contacto: row.getValue('contacto'),
        Area: row.getValue('area'),
        Cargo: row.getValue('funcao'),
        Papel: row.getValue('role'),
        Estado: row.getValue('status'),
      };
    } );


    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Usuarios");


    /* fix headers */
    utils.sheet_add_aoa(worksheet, [["Nome", "Email","Contacto","Area","Cargo","Papel"]], { origin: "A1" });
    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
      //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [ { wch: max_width } ];

    // Get current date  an store in the YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const today = year + '-' + month + '-' + day;

    /* create an XLSX file and try to save to  */
    // concat the file name  and area with the current date
      const fileName = "Usuarios  "+ today + ".xlsx";

    writeFile(workbook,fileName, { compression: true });



};

  return (
   <div> 
    <MaterialReactTable
      columns={colunas}
      data={dados}
      initialState={{
        columnVisibility: { id: false,id_area: false, id_role:false },
         density: 'compact'
         }}
      enableRowSelection
      enableRowActions
      enableColumnOrdering
      positionToolbarAlertBanner="bottom"
      renderTopToolbarCustomActions={({ table }) => (

          <div style={{ display: 'flex', gap: '0.5rem' }}>
          
            <Button
              color="success"
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
              onClick={ () => handleChangeUserStatus(table.getSelectedRowModel().rows)}
              variant="contained"
            >
            Activar / Desactivar
            </Button>
            <Button
            disabled={table.getPrePaginationRowModel().rows.length === 0}
            //export all rows, including from the next page, (still respects filtering and sorting)
            onClick={() => handleExportColaboradores(table.getPrePaginationRowModel().rows)}
            startIcon={<FileDownloadIcon />}
            variant="contained"
          >
            Download
          </Button>
          </div>
  
      
      )}
    />
    <Dialog
    open={open}
    onClose={handleClose}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogTitle id="alert-dialog-title">
      {"Alterar o estado do usuario"}
    </DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-description">
      Tem a certeza que deseja alterar o estado deste utilizador?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleChangeUserStatus}>Alterar</Button>
      <Button onClick={handleClose} autoFocus>
        Fechar
      </Button>
    </DialogActions>
  </Dialog>
  </div>
  );
};

// TODO highlight selected row
export const ProjectosTable = ({colunas, dados  }) => {


  const [projectoDescricao, setProjectoDescricao] = useState('');
  const [projectoNome, setProjectoNome] = useState(0); 

  const handleProjectoDescricaoChange = (event) => {
    setProjectoDescricao(event.target.value);
  };

  const handleProjectoNomeChange = (event) => {
    setProjectoNome(event.target.value);
  };

  const [projectoToEdit, setProjectoToEdit] = useState(null);
  // create a ref to projectoToEdit
  const projectoToEditRef = React.useRef(projectoToEdit);
  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const fetchResultUpdateProjectoStatus = async (json) => {

    const resultado = await updateProjectoStatus(json);
  
    return resultado;
    
  };

  const fetchResultUpdateProjecto = async (json) => {
      
    const resultado = await updateProjecto(json);

    return resultado;

  };
  const handleEditProjecto = (rows) => {
    // Check if multiple rows are selected

    if (rows.length > 1) {
      // Alert the user can only activate one row at a time, use NotificationManager
      NotificationManager.info('Apenas uma linha pode ser selecionada de cada vez','Info', 4000);

    } else {

     // create an projecto object with the selected row values

      rows.map((row) => {
        // Get values from the selected row and create a json object
        const projecto = {
          id: row.getValue('id'),
          nome: row.getValue('nome'),
          descricao: row.getValue('descricao'),
        };
        setProjectoDescricao(projecto.descricao);
        setProjectoNome(projecto.nome);
        setProjectoToEdit(projecto);

        handleClickOpen();
        // set the values of the projecto-descricao-edit and projecto-name-edit to the values of the selected row


      })
    } ;// end of map

  };
 const handleChangeProjectoStatus = async (rows) => {


  // Check if multiple rows are selected
  if (rows.length > 1) {
    // Alert the user can only activate one row at a time, use NotificationManager
    NotificationManager.info('Apenas uma linha pode ser selecionada de cada vez','Info', 4000);

  } else {
  
    rows.map(async (row) => {
      // Get values from the selected row and create a json object
     let  projecto = {
        id_projecto: row.getValue('id'),
        projecto_status: row.getValue('status'),
      };

      // Prompt the user for confirmation using a popup
      // If the user confirms, then update the user status
      // If the user cancels, then do nothing
             if (projecto.projecto_status === 'Active') {
                projecto.projecto_status = 'Inactive';
                 try {
                  let res = await fetchResultUpdateProjectoStatus(projecto);
                  if (res.data === "Actualizado com sucesso") {
                  NotificationManager.success('Estado do Projecto alterado com sucesso','Sucesso', 4000);
      
                   // wait for 5 seconds
                   setTimeout(() => {
                    // refresh the page
                    window.location.reload();
                  }, 3000);
                  }
                
                } catch (error) {
                  // show the error
                  NotificationManager.error('Erro ao actualizar o Projecto' +error.message,'Error', 3000);
                 }
              } else {
                projecto.projecto_status = 'Active';
                try {
                  let res = await fetchResultUpdateProjectoStatus(projecto);
                  if (res.data === "Actualizado com sucesso") {
                    NotificationManager.success('Estado do Projecto alterado com sucesso','Sucesso', 3000);

                  // wait for 5 seconds
                      setTimeout(() => {
                        // refresh the page
                        window.location.reload();
                      }, 3000);
                    }
                } catch (error) {
                  // show the error
                  NotificationManager.error('Erro ao actualizar o Projecto' +error.message,'Error', 4000);
                 }

                }

    });
  }

};

const handleSaveEditedProjecto = async () => {
  // Get the values from the form
  const projectoName = document.getElementById('projecto-name-edit').value;
  const projectoDescricao = document.getElementById('projecto-descricao-edit').value;


  // Check if the values are empty
  if (projectoName === '' || projectoDescricao === '' ) {
    NotificationManager.error('Preencha todos os campos','Error', 4000);
    return;
  }

  // Create an projecto object with the values
  let newProjecto = {
    id_projecto: projectoToEdit.id,
    projecto_name: projectoName,
    projecto_descricao: projectoDescricao,
  };

  // Update the projecto
  try {
    let res = await fetchResultUpdateProjecto(newProjecto);
    if (res.data === "Actualizado com sucesso") {
      NotificationManager.success('Projecto actualizada com sucesso','Sucesso', 3000);
      // wait for 5 seconds the close the dialog
      setTimeout(() => {
        // refresh the page
        handleClose();
        window.location.reload();
      }, 3000);


    } else {
      NotificationManager.error('Erro ao actualizar o Projecto','Error', 3000);
    }
  } catch (error) {
    // show the error
    NotificationManager.error('Erro ao actualizar o Projecto' +error.message,'Error', 4000);
    handleClose();
  }

  // Close the dialog
  handleClose();
};

const handleExportProjectos = (rows) => {
  const jsonRows = rows;

    // extract all data from materiais  from jsonRows and save it to an array
    // array should contain the following properties: cod, descricao, qtd_stock, armazem, familia, prazo
   const rowsArray = jsonRows.map((row) => {
      return {
        cod: row.getValue('id'),
        descricao: row.getValue('projecto'),
        status: row.getValue('status'),
      };
    });


    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Projectos");


    /* fix headers */
    utils.sheet_add_aoa(worksheet, [["ID", "Nome", "Estado"]], { origin: "A1" });

    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce((acc, key) => Math.max(acc, key.length), 0);
      //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [ { wch: max_width } ];

    // Get current date  an store in the YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const today = year + '-' + month + '-' + day;

    /* create an XLSX file and try to save to  */
    // concat the file name  and projecto with the current date
      const fileName = "Projectos  "+ today + ".xlsx";

    writeFile(workbook,fileName, { compression: true });



};

  return (
    <div> 
    <MaterialReactTable
      columns={colunas}
      data={dados}
      initialState={{
        columnVisibility: { id: false },
         density: 'compact'
         }}
      enableRowSelection
      enableRowActions
      enableColumnOrdering
      positionToolbarAlertBanner="bottom"
      renderTopToolbarCustomActions={({ table }) => (

          <div style={{ display: 'flex', gap: '0.5rem' }}>
          
            <Button
              color="success"
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
              onClick={ () => handleChangeProjectoStatus(table.getSelectedRowModel().rows)}
              variant="contained"
            >
            Activar / Desactivar
            </Button>
            <Button
            disabled={table.getPrePaginationRowModel().rows.length === 0}
            //export all rows, including from the next page, (still respects filtering and sorting)
            onClick={() => handleExportProjectos(table.getPrePaginationRowModel().rows)}
            startIcon={<FileDownloadIcon />}
            variant="contained"
          >
            Download
          </Button>
          <Button
            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
            
            //export all rows, including from the next page, (still respects filtering and sorting)
            onClick={() => handleEditProjecto(table.getSelectedRowModel().rows)}
            startIcon={<EditIcon  />}
            variant="contained"
          >
            Editar
          </Button>
          </div>
  
      
      )}
    />
<div>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle> Editar   </DialogTitle>
        <DialogContent>
          <DialogContentText>
          </DialogContentText>
          <TextField
            margin="dense"
            id="projecto-name-edit"
            label="Nome"
            value={projectoNome}
            onChange={handleProjectoNomeChange}
            sx={{ width: 300 }}
            variant="standard"
          />
          <br>
          </br>
          <TextField
            margin="dense"
            id="projecto-descricao-edit"
            label="Descricao"
           value={projectoDescricao}
           onchange={handleProjectoDescricaoChange}
            sx={{ width: 300 }}
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSaveEditedProjecto}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </div>
    </div>


  );
};