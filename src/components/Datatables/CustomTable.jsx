import React, { useState, useEffect } from "react";
import { MaterialReactTable } from "material-react-table";
import { Box, Button } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArticleIcon from "@mui/icons-material/Article";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";
import { ExportToCsv } from "export-to-csv"; //or use your library of choice here
import { NotificationManager } from "react-notifications";
import {
  getAllAreas,
  getAllArmazens,
  getAllProjectos,
  updateAreaStatus,
  updateArea,
  updatePontoFocalStatus,
  voidPontoFocal,
  updateUsuarioStatus,
  updateUsuario,
} from "../../middleware/GenericService.js";
import { updateMaterial } from "../../middleware/MaterialService.js";
import { saveAs } from "file-saver";
import axios from "axios";
//import { createBrowserHistory } from 'history';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { read, writeFileXLSX, utils, writeFile } from "xlsx";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import SendIcon from "@mui/icons-material/Send";
import {
  updateProjectoStatus,
  updateProjecto,
} from "../../middleware/GenericService.js";
import { cancelRequisicao } from "../../middleware/RequisicoesService.js";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { ImportExport, RestartAlt } from "@mui/icons-material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { updateGuia } from "../../middleware/GuiaService.js";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { select } from "@nextui-org/react";
import { Select } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import { IconButton } from "@mui/material";
import { Delete as DeleteIcon, Email as EmailIcon } from "@mui/icons-material";
import CancelIcon from "@mui/icons-material/Cancel";

export const MaterialDisponivelTable = ({ colunas, dados }) => {
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  //const customHistory = createBrowserHistory();
  let material = null;
  const navigate = useNavigate();

  const handleActivate = (rows) => {
    // Check if multiple rows are selected
    if (rows.length > 1) {
      // Alert the user can only activate one row at a time, use NotificationManager
      NotificationManager.info(
        "Apenas uma linha pode ser selecionada de cada vez",
        "Info",
        4000
      );
    } else {
      // Activate the row

      rows.map((row) => {
        // Get values from the selected row and create a json object
        material = {
          id: row.getValue("id"),
          id_area: row.getValue("id_area"),
          descricao: row.getValue("descricao"),
          qtd_stock: row.getValue("qtd_stock"),
          armazem: row.getValue("armazem"),
          cod: row.getValue("cod"),
          familia: row.getValue("familia"),
          prazo: row.getValue("prazo"),
        };

        // Save material to sessionStorage and Route to the requisicao page
        // sessionStorage.setItem('materialRequisicao', JSON.stringify(material));
        //navigate('/requisicao');
        navigate("/requisicao", {
          state: { material },
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
        cod: row.getValue("cod"),
        descricao: row.getValue("descricao"),
        qtd_stock: row.getValue("qtd_stock"),
        area: row.getValue("area"),
        armazem: row.getValue("armazem"),
        familia: row.getValue("familia"),
        prazo: row.getValue("prazo"),
      };
    });

    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Materiais Disponiveis");

    /* fix headers */
    utils.sheet_add_aoa(
      worksheet,
      [
        [
          "Cod",
          "Descricao",
          "Qtd Existente",
          "Area",
          "Armazem",
          "Familia",
          "Prazo",
        ],
      ],
      { origin: "A1" }
    );

    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce(
      (acc, key) => Math.max(acc, key.length),
      0
    );
    //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [{ wch: max_width }];

    // Get current date  an store in the YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const today = year + "-" + month + "-" + day;

    /* create an XLSX file and try to save to  */
    // concat the file name  and area with the current date
    const fileName =
      "Materiais Disponiveis {" + rowsArray[0].area + "} " + today + ".xlsx";

    writeFile(workbook, fileName, { compression: true });
  };

  return (
    <MaterialReactTable
      columns={colunas}
      data={dados}
      initialState={{
        columnVisibility: { id: false, id_area: false },
        density: "compact",
        pagination: { pageSize: 30, pageIndex: 0 },
      }}
      enableRowSelection
      enableRowActions
      enableColumnOrdering
      positionToolbarAlertBanner="bottom"
      renderTopToolbarCustomActions={({ table }) => (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            color="success"
            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
            onClick={() => handleActivate(table.getSelectedRowModel().rows)}
            variant="contained"
          >
            Nova Requisição
          </Button>
          <Button
            disabled={table.getPrePaginationRowModel().rows.length === 0}
            //export all rows, including from the next page, (still respects filtering and sorting)
            onClick={() =>
              handleExportMateriais(table.getPrePaginationRowModel().rows)
            }
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

export const MaterialDisponivelDistribuicaoUSTable = ({
  colunas,
  dados,
  unidadeSanitaria,
  pontoFocal,
  setMateriaisRequisicao,
}) => {
  // const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  //const customHistory = createBrowserHistory();
  let material = null;
  //const navigate = useNavigate();
  let selectedUnidadeSanitaria = unidadeSanitaria;
  let selectedMaterials = [];

  let filteredPontosFocais = [];
  // if ponto Focal is empty, do nothing
  if (pontoFocal.length > 0) {
    filteredPontosFocais = pontoFocal.filter(
      (pf) => pf.unidade_sanitaria_id === selectedUnidadeSanitaria.value
    );
  }

  const [selectedValue, setSelectedValue] = React.useState(
    filteredPontosFocais[0]
  );

  const handleActivate = (rows) => {
    // filter from pontoFocal  records  with unidade_sanitaria_id that match the selectedUnidadeSanitaria.value

    if (filteredPontosFocais.length === 0) {
      selectedMaterials = rows.map((row) => {
        // Get values from the selected row and create a json object
        material = {
          id: row.getValue("id"),
          id_area: row.getValue("id_area"),
          descricao: row.getValue("descricao"),
          qtd_stock: row.getValue("qtd_stock"),
          armazem: row.getValue("armazem"),
          cod: row.getValue("cod"),
          familia: row.getValue("familia"),
          prazo: row.getValue("prazo"),
          pf_nome: "",
          pf_contacto: "",
        };
        return material;
      });
    } else if (filteredPontosFocais.length === 1) {
      selectedMaterials = rows.map((row) => {
        // Get values from the selected row and create a json object
        material = {
          id: row.getValue("id"),
          id_area: row.getValue("id_area"),
          descricao: row.getValue("descricao"),
          qtd_stock: row.getValue("qtd_stock"),
          armazem: row.getValue("armazem"),
          cod: row.getValue("cod"),
          familia: row.getValue("familia"),
          prazo: row.getValue("prazo"),
          pf_nome: filteredPontosFocais[0].nome,
          pf_contacto: filteredPontosFocais[0].contacto,
        };
        return material;
      });
    } /* else {
      let prefferedPontoFocal = filteredPontosFocais.filter(
        (pf) => pf.preferred === "Sim"
      );
      // wait for the user to select a pontoFocal, create a conditional wait for the user to select a pontoFocal
      selectedMaterials = rows.map((row) => {
        // Get values from the selected row and create a json object
        material = {
          id: row.getValue("id"),
          id_area: row.getValue("id_area"),
          descricao: row.getValue("descricao"),
          qtd_stock: row.getValue("qtd_stock"),
          armazem: row.getValue("armazem"),
          cod: row.getValue("cod"),
          familia: row.getValue("familia"),
          prazo: row.getValue("prazo"),
          pf_nome: prefferedPontoFocal[0].nome,
          pf_contacto: prefferedPontoFocal[0].contacto,
        };
        return material;
      });
    } */

    // update parent state
    setMateriaisRequisicao(selectedMaterials);

    // unselect all rows
  };

  const handleExportMateriais = (rows) => {
    const jsonRows = rows;
    let material = null;

    // extract all data from materiais  from jsonRows and save it to an array
    // array should contain the following properties: cod, descricao, qtd_stock, armazem, familia, prazo
    const rowsArray = jsonRows.map((row) => {
      return {
        cod: row.getValue("cod"),
        descricao: row.getValue("descricao"),
        qtd_stock: row.getValue("qtd_stock"),
        area: row.getValue("area"),
        armazem: row.getValue("armazem"),
        familia: row.getValue("familia"),
        prazo: row.getValue("prazo"),
      };
    });

    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Materiais Disponiveis");

    /* fix headers */
    utils.sheet_add_aoa(
      worksheet,
      [
        [
          "Cod",
          "Descricao",
          "Qtd Existente",
          "Area",
          "Armazem",
          "Familia",
          "Prazo",
        ],
      ],
      { origin: "A1" }
    );

    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce(
      (acc, key) => Math.max(acc, key.length),
      0
    );
    //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [{ wch: max_width }];

    // Get current date  an store in the YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const today = year + "-" + month + "-" + day;

    /* create an XLSX file and try to save to  */
    // concat the file name  and area with the current date
    const fileName =
      "Materiais Disponiveis {" + rowsArray[0].area + "} " + today + ".xlsx";

    writeFile(workbook, fileName, { compression: true });
  };

  return (
    <div>
      <MaterialReactTable
        columns={colunas}
        data={dados}
        initialState={{
          columnVisibility: { id: false, id_area: false },
          density: "compact",
          pagination: { pageSize: 15, pageIndex: 0 },
        }}
        enableRowSelection
        enableRowActions
        enableColumnOrdering
        positionToolbarAlertBanner="bottom"
        renderTopToolbarCustomActions={({ table }) => (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              color="success"
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
              onClick={() => handleActivate(table.getSelectedRowModel().rows)}
              variant="contained"
            >
              Nova Requisição
            </Button>
            <Button
              disabled={table.getPrePaginationRowModel().rows.length === 0}
              //export all rows, including from the next page, (still respects filtering and sorting)
              onClick={() =>
                handleExportMateriais(table.getPrePaginationRowModel().rows)
              }
              startIcon={<FileDownloadIcon />}
              variant="contained"
            >
              Download
            </Button>
          </div>
        )}
      />
    </div>
  );
};

export const MaterialLogisticaTable = ({ colunas, dados, areas }) => {
  const [materialDescricao, setMaterialDescricao] = useState("");
  const [materialStock, setMaterialStock] = useState(0);
  const [currentArea, setCurrentArea] = useState(null);
  let areasProgramaticas = areas;
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
    const materialDescricao = document.getElementById(
      "material-descricao-edit"
    ).value;
    const materialStock = document.getElementById("material-stock-edit").value;

    const materialArea = currentArea;
    // const materialArea2 = document.getElementById("area-simple-select").value;

    // Check if the values are empty
    if (
      materialDescricao === "" ||
      materialStock === "" ||
      materialArea === "" ||
      !materialArea
    ) {
      NotificationManager.error("Preencha todos os campos", "Error", 4000);
      return;
    }
    // check if materialStock is a number
    if (isNaN(materialStock)) {
      NotificationManager.error(
        "Quantidade de Stock deve ser um numero",
        "Error",
        4000
      );
      return;
    }
    // conver materialStock to a number
    const materialStockNumber = Number(materialStock);
    // check if materialStock is less than 0
    if (materialStockNumber < 0) {
      NotificationManager.error(
        "Quantidade de Stock deve ser maior que 0",
        "Error",
        4000
      );
      return;
    }
    // from the areasProgramaticas array, get the id value pf the object that matches the currentArea

    const areaObject = areasProgramaticas.find(
      (area) => area.area === materialArea
    );
    const areaObjectId = areaObject.id;

    // Create an area object with the values
    let newMaterial = {
      id_material: materialToEdit.id,
      //cod: materialCod,
      material_nome: materialDescricao,
      quantidade: materialStockNumber,
      previous_area_id: materialToEdit.id_area,
      id_area: areaObjectId,
    };

    // Update the Material
    try {
      let res = await fetchResultUpdateMaterial(newMaterial);
      if (res.data === "Actualizado com sucesso") {
        NotificationManager.success(
          "Material actualizado com sucesso",
          "Sucesso",
          3000
        );
        // wait for 5 seconds the close the dialog
        setTimeout(() => {
          // refresh the page
          handleClose();
          window.location.reload();
        }, 3000);
      } else if (
        res.data ===
        "Material cannot be moved because there are requisitions for the material in the previous area"
      ) {
        // show the error
        NotificationManager.error(
          "Este material ja tem requisicoes associadas. Nao e possivel trocar a area",
          "Error",
          7000
        );
        handleClose();
      } else {
        NotificationManager.error(
          "Erro ao actualizar o Material",
          "Error",
          3000
        );
      }
    } catch (error) {
      // show the error
      NotificationManager.error(
        "Erro ao actualizar o Material" + error.message,
        "Error",
        4000
      );
      handleClose();
    }

    // Close the dialog
    handleClose();
  };
  const fetchResultUpdateMaterial = async (json) => {
    const resultado = await updateMaterial(json);

    return resultado;
  };
  const handleExportRows = (rows) => {
    const jsonRows = rows;

    // extract all data from jsonRows and save it to an array
    const rowsArray = jsonRows.map((row) => {
      return {
        cod: row.getValue("cod"),
        descricao: row.getValue("descricao"),
        qtd_stock: row.getValue("qtd_stock"),
        area: row.getValue("area"),
        armazem: row.getValue("armazem"),
        familia: row.getValue("familia"),
        prazo: row.getValue("prazo"),
        data_importacao: row.getValue("data_importacao"),
        projecto: row.getValue("projecto"),
      };
    });

    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Materiais Disponiveis");

    /* fix headers */
    utils.sheet_add_aoa(
      worksheet,
      [
        [
          "Cod",
          "Descricao",
          "Qtd Existente",
          "Area",
          "Armazem",
          "Familia",
          "Prazo",
          "Data de Entrada",
          "Projecto",
        ],
      ],
      { origin: "A1" }
    );

    // Make column names bold by iterating through the header cells
    // const headerCellStyle = { font: { bold: true } };
    // const headerRange = utils.decode_range(worksheet['!ref']);
    // for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    //   const headerCell = utils.encode_cell({ r: headerRange.s.r, c: col });
    //   worksheet[headerCell].s = headerCellStyle;
    // }

    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce(
      (acc, key) => Math.max(acc, key.length),
      0
    );
    //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [{ wch: max_width }];

    // Get current date  an store in the YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const today = year + "-" + month + "-" + day;

    /* create an XLSX file and try to save to  */
    // concat the file name with the current date

    const fileName = "Materiais Disponiveis CCS {" + today + "}.xlsx";

    writeFile(workbook, fileName, { compression: true });
  };

  const handleActivate = (rows) => {
    if (rows.length > 1) {
      // Alert the user can only activate one row at a time, use NotificationManager
      NotificationManager.info(
        "Apenas uma linha pode ser selecionada de cada vez",
        "Info",
        4000
      );
    } else {
      rows.map((row) => {
        // alert('activating ' + row.getValue('id_area'));
        // Get values from the selected row and create a json object
        const material = {
          id: row.getValue("id"),
          material: row.getValue("descricao"),
          quantidade: row.getValue("qtd_stock"),
          area: row.getValue("area"),
          id_area: row.getValue("id_area"),
        };
        setMaterialDescricao(material.material);
        setMaterialStock(material.quantidade);
        setMaterialToEdit(material);
        setCurrentArea(material.area);
        handleClickOpen();
      });
    }
  };
  const handleAreaChange = (event) => {
    setCurrentArea(event.target.value);
  };

  if (!areasProgramaticas) {
    return (
      <div>
        <MaterialReactTable
          columns={colunas}
          data={dados}
          initialState={{
            columnVisibility: {
              id: false,
              id_area: false,
              id_projecto: false,
              id_armazem: false,
            },
            density: "compact",
            pagination: { pageSize: 30, pageIndex: 0 },
          }}
          enableRowSelection
          enableRowActions
          enableColumnOrdering
          positionToolbarAlertBanner="bottom"
          renderTopToolbarCustomActions={({ table }) => (
            <div style={{ display: "flex", gap: "0.5rem" }}>
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
                onClick={() =>
                  handleExportRows(table.getFilteredRowModel().rows)
                }
                startIcon={<FileDownloadIcon />}
                variant="contained"
              >
                Download
              </Button>
            </div>
          )}
        />

        <div></div>
      </div>
    );
  } else {
    return (
      <div>
        /
        <MaterialReactTable
          columns={colunas}
          data={dados}
          initialState={{
            columnVisibility: {
              id: false,
              id_area: false,
              id_projecto: false,
              id_armazem: false,
            },
            density: "compact",
            pagination: { pageSize: 30, pageIndex: 0 },
          }}
          enableRowSelection
          enableRowActions
          enableColumnOrdering
          positionToolbarAlertBanner="bottom"
          renderTopToolbarCustomActions={({ table }) => (
            <div style={{ display: "flex", gap: "0.5rem" }}>
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
                onClick={() =>
                  handleExportRows(table.getFilteredRowModel().rows)
                }
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
            <DialogTitle>
              {" "}
              Editar Material: {materialToEdit?.material}{" "}
            </DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                id="material-descricao-edit"
                label="Nome"
                value={materialDescricao}
                onChange={handleMaterialDescricaoChange}
                sx={{ width: 300 }}
                variant="standard"
              />
              <br></br>
              <TextField
                margin="dense"
                id="material-stock-edit"
                label="Quantidade"
                value={materialStock}
                onChange={handleMaterialStockChange}
                sx={{ width: 300 }}
                variant="standard"
              />
              <br></br>

              <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                <p>
                  Area: &nbsp; &nbsp;
                  <Select
                    labelId="area-select-label"
                    id="area-simple-select"
                    value={currentArea}
                    onChange={handleAreaChange}
                  >
                    {areasProgramaticas.map((area) => (
                      <MenuItem value={area.area}>{area.area}</MenuItem>
                    ))}
                  </Select>{" "}
                </p>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSaveEditedMaterial}>Salvar</Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    );
  }
};

export const ImportarMaterialPreviewTable = ({
  colunas,
  dados,
  onUpdateArrayElement,
}) => {
  const [listAreas, setListAreas] = useState(null);
  const [listArmazens, setListArmazens] = useState(null);
  const [listprojectos, setProjectos] = useState(null);
  const [hasFinishedLoading, setHasFinishedLoading] = useState(false);
  const [validatedData, setValidatedData] = useState([]);

  useEffect(() => {
    getAllProjectos()
      .then((data) => {
        setProjectos(data);
        setHasFinishedLoading(true);
      })
      .catch((error) => {
        // Handle error if needed
        console.log(error);
        setHasFinishedLoading(false);
      });
  }, []);

  useEffect(() => {
    getAllAreas()
      .then((data) => {
        setListAreas(data);
        setHasFinishedLoading(true);
      })
      .catch((error) => {
        // Handle error if needed
        console.log(error);
        setHasFinishedLoading(false);
      });
  }, []);

  useEffect(() => {
    getAllArmazens()
      .then((data) => {
        setListArmazens(data);
        setHasFinishedLoading(true);
      })
      .catch((error) => {
        // Handle error if needed
        console.log(error);
        setHasFinishedLoading(false);
      });
  }, []);

  const HandleValidateData = () => {
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
        NotificationManager.error(
          "Nao foi possivel validar os dados tente novamente... erro ao connectar com o servidor",
          "Error",
          4000
        );
        return;
      } else {
        //
        const areas = listAreas.map((area) => area.area);
        const armazens = listArmazens.map((armazem) => armazem.cod_armazem);
        const projectos = listprojectos.map((projecto) => projecto.nome);

        const empty_null_qtd_stock = dados.filter((obj) => {
          return Object.keys(obj).some((key) => {
            // skip qtd_stock if it is less than 0
            if (key === "qtd_stock") {
              const value = obj[key];
              return (
                obj[key] <= 0 ||
                value === null ||
                value === undefined ||
                value === ""
              );
            } else {
              return false;
            }
          });
        });
        const empty_null_armazem = dados.filter((obj) => {
          return Object.keys(obj).some((key) => {
            if (key === "armazem") {
              // check if armazem exists in  armazens array
              const value = obj[key];
              return (
                !armazens.includes(value) ||
                value === null ||
                value === undefined ||
                value === ""
              );
            } else {
              return false;
            }
          });
        });

        const empty_null_area = dados.filter((obj) => {
          return Object.keys(obj).some((key) => {
            if (key === "area") {
              // check if area exists in  area array
              const value = obj[key];
              return (
                !areas.includes(value) ||
                value === null ||
                value === undefined ||
                value === ""
              );
            } else {
              return false;
            }
          });
        });

        const empty_null_descricao = dados.filter((obj) => {
          return Object.keys(obj).some((key) => {
            if (key === "descricao")
              return (
                obj[key] === null || obj[key] === undefined || obj[key] === ""
              );
          });
        });

        const empty_null_projecto = dados.filter((obj) => {
          return Object.keys(obj).some((key) => {
            if (key === "projecto") {
              // check if projecto exists in  projecto array
              const value = obj[key];
              return (
                !projectos.includes(value) ||
                value === null ||
                value === undefined ||
                value === ""
              );
            }
          });
        });

        // if all arrays are empty, then data is valid
        if (
          empty_null_qtd_stock.length === 0 &&
          empty_null_armazem.length === 0 &&
          empty_null_area.length === 0 &&
          empty_null_descricao.length === 0 &&
          empty_null_projecto.length === 0
        ) {
          NotificationManager.success(
            "Dados validados com sucesso. Iniciando a importacao de dados...",
            "Sucesso",
            8000
          );
          // change  dados  properties values (area, armazem, and projecto) to ids based on the  listAreas, listArmazens and listprojectos
          const mappedData = dados.map((obj) => {
            const area = listAreas.find((area) => area.area === obj.area);
            const armazem = listArmazens.find(
              (armazem) => armazem.cod_armazem === obj.armazem
            );
            const projecto = listprojectos.find(
              (projecto) => projecto.projecto === obj.nome
            );
            // if area or armazem or projecto is not found , show a notification to the user and return
            if (!area) {
              NotificationManager.error(
                "Nao foi possivel importar os dados. o Material { " +
                  obj.descricao +
                  " } tem uma area { " +
                  obj.area +
                  " } que nao existe no sistema.",
                "Error",
                6000
              );
              return;
            }
            if (!armazem) {
              NotificationManager.error(
                "Nao foi possivel importar os dados. o Material { " +
                  obj.descricao +
                  " } tem um armazem { " +
                  obj.armazem +
                  " } que nao existe no sistema.",
                "Error",
                6000
              );
              return;
            }
            if (!projecto) {
              NotificationManager.error(
                "Nao foi possivel importar os dados. o Material { " +
                  obj.descricao +
                  " } tem um projecto { " +
                  obj.nome +
                  " } que nao existe no sistema.",
                "Error",
                6000
              );
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
          utils.sheet_add_aoa(
            worksheet,
            [
              [
                "Cod",
                "Descricao",
                "Quantidade",
                "Armazem",
                "Familia",
                "Projecto",
                "Area",
                "Prazo",
              ],
            ],
            { origin: "A1" }
          );
          /* calculate column width ( number of properties from rows object) */
          const max_width = Object.keys(dados[0]).reduce(
            (acc, key) => Math.max(acc, key.length),
            0
          );
          //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
          worksheet["!cols"] = [{ wch: max_width }];

          /* create an XLSX file and try to save to  */
          // get current date
          const date = new Date();
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const day = date.getDate();
          const today = year + "-" + month + "-" + day;
          // concat the file name  and area with the current date
          const fileName = "Material" + today + ".xlsx";
          writeFile(workbook, fileName, { compression: true });
        } else {
          // if any of the arrays is not empty, then data is invalid
          const length_empty_null_qtd_stock = empty_null_qtd_stock.length;
          const length_empty_null_armazem = empty_null_armazem.length;
          const length_empty_null_area = empty_null_area.length;
          const length_empty_null_descricao = empty_null_descricao.length;
          const length_empty_null_projecto = empty_null_projecto.length;

          if (length_empty_null_qtd_stock > 0) {
            NotificationManager.error(
              "Total de Linhas com qtd_stock invalidos: " +
                length_empty_null_qtd_stock,
              "Validacao da Quantidade de Stock",
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
                utils.sheet_add_aoa(
                  worksheet,
                  [
                    [
                      "Cod",
                      "Descricao",
                      "Quantidade",
                      "Armazem",
                      "Familia",
                      "Projecto",
                      "Area",
                      "Prazo",
                    ],
                  ],
                  { origin: "A1" }
                );
                /* calculate column width ( number of properties from rows object) */
                const max_width = Object.keys(empty_null_qtd_stock[0]).reduce(
                  (acc, key) => Math.max(acc, key.length),
                  0
                );
                //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
                worksheet["!cols"] = [{ wch: max_width }];

                /* create an XLSX file and try to save to  */
                // concat the file name  and area with the current date
                const fileName = "Material Stock Invalido.xlsx";
                writeFile(workbook, fileName, { compression: true });

                return;
              },
              true // Whether to show close button or not
            );
          }
          if (length_empty_null_armazem > 0) {
            NotificationManager.error(
              "Total de Linhas com armazem invalidos: " +
                length_empty_null_armazem,
              "Validacao do Armazem",
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
                utils.sheet_add_aoa(
                  worksheet,
                  [
                    [
                      "Cod",
                      "Descricao",
                      "Quantidade",
                      "Armazem",
                      "Familia",
                      "Projecto",
                      "Area",
                      "Prazo",
                    ],
                  ],
                  { origin: "A1" }
                );
                /* calculate column width ( number of properties from rows object) */
                const max_width = Object.keys(empty_null_armazem[0]).reduce(
                  (acc, key) => Math.max(acc, key.length),
                  0
                );
                //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
                worksheet["!cols"] = [{ wch: max_width }];

                /* create an XLSX file and try to save to  */
                // concat the file name  and area with the current date
                const fileName = "Material Armazem Invalido.xlsx";
                writeFile(workbook, fileName, { compression: true });
                return;
              },
              true // Whether to show close button or not
            );
          }
          if (length_empty_null_area > 0) {
            NotificationManager.error(
              "Total de Linhas com area invalidos: " + length_empty_null_area,
              " Validacao da Area",
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
                utils.sheet_add_aoa(
                  worksheet,
                  [
                    [
                      "Cod",
                      "Descricao",
                      "Quantidade",
                      "Armazem",
                      "Familia",
                      "Projecto",
                      "Area",
                      "Prazo",
                    ],
                  ],
                  { origin: "A1" }
                );
                /* calculate column width ( number of properties from rows object) */
                const max_width = Object.keys(empty_null_area[0]).reduce(
                  (acc, key) => Math.max(acc, key.length),
                  0
                );
                //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
                worksheet["!cols"] = [{ wch: max_width }];

                /* create an XLSX file and try to save to  */
                // concat the file name  and area with the current date
                const fileName = "Material Area Invalido.xlsx";
                writeFile(workbook, fileName, { compression: true });
                return;
              },
              true // Whether to show close button or not
            );
          }
          if (length_empty_null_descricao > 0) {
            NotificationManager.error(
              "Total de Linhas com descricao invalidos: " +
                length_empty_null_descricao,
              "Validacao da Descricao do Material",
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
                utils.sheet_add_aoa(
                  worksheet,
                  [
                    [
                      "Cod",
                      "Descricao",
                      "Quantidade",
                      "Armazem",
                      "Familia",
                      "Projecto",
                      "Area",
                      "Prazo",
                    ],
                  ],
                  { origin: "A1" }
                );
                /* calculate column width ( number of properties from rows object) */
                const max_width = Object.keys(empty_null_area[0]).reduce(
                  (acc, key) => Math.max(acc, key.length),
                  0
                );
                //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
                worksheet["!cols"] = [{ wch: max_width }];

                /* create an XLSX file and try to save to  */
                // concat the file name  and area with the current date
                const fileName = "Material descricao Invalido.xlsx";
                writeFile(workbook, fileName, { compression: true });
                return;
              },
              true // Whether to show close button or not
            );
          }
          if (length_empty_null_projecto > 0) {
            NotificationManager.error(
              "Total de Linhas com projecto invalidos: " +
                length_empty_null_projecto,
              "Validacao do Projecto",
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
                utils.sheet_add_aoa(
                  worksheet,
                  [
                    [
                      "Cod",
                      "Descricao",
                      "Quantidade",
                      "Armazem",
                      "Familia",
                      "Projecto",
                      "Area",
                      "Prazo",
                    ],
                  ],
                  { origin: "A1" }
                );
                /* calculate column width ( number of properties from rows object) */
                const max_width = Object.keys(empty_null_projecto[0]).reduce(
                  (acc, key) => Math.max(acc, key.length),
                  0
                );
                //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
                worksheet["!cols"] = [{ wch: max_width }];

                /* create an XLSX file and try to save to  */
                // concat the file name  and area with the current date
                const fileName = "Material descricao Invalido.xlsx";
                writeFile(workbook, fileName, { compression: true });
                return;
              },
              true // Whether to show close button or not
            );
          }

          return;
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
      }
    }
  };

  const handleAPIImportarMateriais = async (jsonData) => {
    const apiUrl = process.env.REACT_APP_API_URL;

    // Send a POST request
    try {
      const response = await axios.post(apiUrl + "/material", jsonData);
      const resposta = response.data;
      const statusText = resposta.statusText;

      console.log("API response:", statusText);
      NotificationManager.success(
        "Dados importados com sucesso. Total :" + jsonData.length,
        "Sucesso",
        5000
      );
      const updatedData = [];
      onUpdateArrayElement(updatedData);
      // Do something with the response, such as updating state or displaying a success message
      return resposta;
    } catch (error) {
      const errorMessage = error.response.data.message;
      NotificationManager.error(
        "Nao foi possivel importar os dados:" + errorMessage,
        "Error",
        10000
      );
      return error;
    }
  };

  const HandleResetTableMaterial = () => {
    const updatedData = [];
    onUpdateArrayElement(updatedData);
  };
  // Hide ID  and ID Area Columns
  const hiddenColumns = ["id", "id_area"]; // Array of columns to hide
  const visibleColumns = colunas.filter(
    (column) => !hiddenColumns.includes(column.accessorKey)
  );

  const handleExportMaterial = (rows) => {
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
    });

    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Material");

    /* fix headers */
    utils.sheet_add_aoa(
      worksheet,
      [
        [
          "Cod",
          "Descricao",
          "Quantidade",
          "Armazem",
          "Familia",
          "Projecto",
          "Area",
          "Prazo",
        ],
      ],
      { origin: "A1" }
    );
    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce(
      (acc, key) => Math.max(acc, key.length),
      0
    );
    //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [{ wch: max_width }];

    /* create an XLSX file and try to save to  */
    // concat the file name  and area with the current date
    const fileName = "Materiais.xlsx";

    writeFile(workbook, fileName, { compression: true });
  };

  return (
    <MaterialReactTable
      columns={visibleColumns}
      data={dados}
      enableRowSelection
      enableRowActions
      enableColumnOrdering
      initialState={{ density: "compact" }}
      positionToolbarAlertBanner="bottom"
      renderTopToolbarCustomActions={({ table }) => (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            color="success"
            disabled={table.getPrePaginationRowModel().rows.length === 0}
            onClick={HandleValidateData}
            variant="contained"
            startIcon={<UploadFileOutlinedIcon />}
          >
            Importar Material
          </Button>
          <Button
            color="success"
            disabled={table.getPrePaginationRowModel().rows.length === 0}
            onClick={HandleResetTableMaterial}
            variant="contained"
            startIcon={<RestartAlt />}
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
export const MaterialUnidadeSanitariaTable = ({
  colunas,
  dados,
  onSetRequisicoes,
}) => {
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [requisicao, updateData] = useState([...dados]);
  //const valores = selectedValues;
  let material = null;

  const csvOptions = {
    fieldSeparator: ",",
    quoteStrings: '"',
    decimalSeparator: ".",
    showLabels: true,
    useBom: true,
    useKeysAsHeaders: false,
    headers: colunas.map((c) => c.header),
  };

  const csvExporter = new ExportToCsv(csvOptions);

  const handleExportRows = (rows) => {
    csvExporter.generateCsv(rows.map((row) => row.original));
  };

  const handleSaveRow = ({ exitEditingMode, row, values }) => {
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
        columnVisibility: {
          id: false,
          material: false,
          requisitante: false,
          us: false,
        },
        density: "compact",
      }}
      editingMode="row"
      enableEditing
      enableRowSelection
      onEditingRowSave={handleSaveRow}
    />
  );
};

// TODO highlight selected row
export const MinhasRequisicoesTable = ({ colunas, dados, tipo }) => {
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

  if (tipo === "pendentes") {
    requisition_type = "pendentes";
  } else if (tipo === "processadas") {
    requisition_type = "processadas";
  } else if (tipo === "entregues") {
    requisition_type = "entregues";
  } else {
    requisition_type = "";
  }

  const fetchResultCancelRequisicao = async (id_requisicao) => {
    // Send a POST request
    const result = await cancelRequisicao(id_requisicao);
    return result;
  };

  const handleExportRows = (rows) => {
    const jsonRows = rows;

    // extract all data from jsonRows and save it to an array
    const rowsArray = jsonRows.map((row) => {
      // Get values from the selected row and create a json object
      requisicao = {
        data_requisicao: row.getValue("data_requisicao"),
        material_descricao: row.getValue("material"),
        quantidade: row.getValue("quantidade"),
        unidade_sanitaria: row.getValue("unidade_sanitaria"),
        requisitante: row.getValue("requisitante"),
        pf_nome: row.getValue("pf_nome"),
        pf_contacto: row.getValue("pf_contacto"),
        nr_guia: row.getValue("nr_guia"),
        notas: row.getValue("notas"),
        area: row.getValue("area"),
      };
      return requisicao;
    });

    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Requisicoes");

    /* fix headers */
    utils.sheet_add_aoa(
      worksheet,
      [
        [
          "Data",
          "Material",
          "Qtd. Requisitada",
          "Unidade Sanitaria",
          "Requisitante",
          "Ponto Focal",
          "Contacto",
          "Numero da Guia",
          "Notas",
          "Area",
        ],
      ],
      { origin: "A1" }
    );

    // Make column names bold by iterating through the header cells
    // const headerCellStyle = { font: { bold: true } };
    // const headerRange = utils.decode_range(worksheet['!ref']);
    // for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    //   const headerCell = utils.encode_cell({ r: headerRange.s.r, c: col });
    //   worksheet[headerCell].s = headerCellStyle;
    // }

    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce(
      (acc, key) => Math.max(acc, key.length),
      0
    );
    //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [{ wch: max_width }];

    // Get current date  an store in the YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const today = year + "-" + month + "-" + day;

    /* create an XLSX file and try to save to  */
    // concat the file name  and area with the current date
    const fileName =
      "Requisicoes " +
      requisition_type +
      "{" +
      rowsArray[0].area +
      "} " +
      today +
      ".xlsx";

    writeFile(workbook, fileName, { compression: true });
  };

  const handleVoidRequisicao = async () => {
    let id_requisicao = selectedRow[0].id;
    //  cancell requisicao
    try {
      const result = await fetchResultCancelRequisicao(id_requisicao);
      if (result[0].canceled === "Yes") {
        NotificationManager.success(
          "Requisicao cancelada com sucesso",
          "Sucesso",
          5000
        );
        // update requisicoes array
        handleClose();
        const updatedRequisicoes = dados.filter(
          (requisicao) => requisicao.id !== id_requisicao
        );
        setUpdateRequisicoes(updatedRequisicoes);
        // refesh the page
        window.location.reload();
      }
    } catch (error) {
      NotificationManager.error(
        "Nao foi possivel cancelar a requisicao: " + error.message,
        "Error",
        5000
      );
    }

    return;
  };

  const handleConfirmVoidRequisicao = (rows) => {
    if (rows.length > 1) {
      // Alert the user can only activate one row at a time, use NotificationManager
      NotificationManager.info(
        "Apenas uma linha pode ser selecionada de cada vez",
        "Info",
        4000
      );
    } else {
      let req = null;
      // get all properties from rows (dados) and store in an array. each row represent a requisicao.
      const requisicao = rows.map((row) => {
        // Get values from the selected row and create a json object
        req = {
          id: row.getValue("id"),
          data_requisicao: row.getValue("data_requisicao"),
          material_descricao: row.getValue("material_descricao"),
          quantidade: row.getValue("quantidade"),
          unidade_sanitaria: row.getValue("unidade_sanitaria"),
          nr_guia: row.getValue("nr_guia"),
          pf_nome: row.getValue("pf_nome"),
          pf_contacto: row.getValue("pf_contacto"),
          requisitante: row.getValue("requisitante"),
          notas: row.getValue("notas"),
        };
        return req;
      });

      setSelectedRow(requisicao);

      handleClickOpen();
    }
  };

  const handleVisualizarGuia = (rows) => {
    // if more than one row is selected, show a popup notification and return
    if (rows.length > 1) {
      NotificationManager.info(
        "Pode visualizar apenas uma Guia de cada vez",
        "Info",
        5000
      );
      return;
    }
    let req = null;
    // get all properties from rows (dados) and store in an array. each row represent a requisicao.
    const requisicoes = rows.map((row) => {
      // Get values from the selected row and create a json object
      req = {
        id: row.getValue("id"),
        data_requisicao: row.getValue("data_requisicao"),
        material_descricao: row.getValue("material_descricao"),
        quantidade: row.getValue("quantidade"),
        unidade_sanitaria: row.getValue("unidade_sanitaria"),
        nr_guia: row.getValue("nr_guia"),
        pf_nome: row.getValue("pf_nome"),
        pf_contacto: row.getValue("pf_contacto"),
        requisitante: row.getValue("requisitante"),
        notas: row.getValue("notas"),
      };
      return req;
    });

    let tempNrGuia = requisicoes[0].nr_guia;

    // if tempNrGuia is null, then show a popup notification and return
    if (tempNrGuia === null) {
      NotificationManager.info(
        "Nao existe nenhuma Guia associada a esta requisicao",
        "Info",
        5000
      );
      return;
    }

    navigate("/visualizarGuia", {
      state: { requisicoes, tempNrGuia },
      replace: true,
    });
  };

  return (
    <div>
      <MaterialReactTable
        columns={colunas}
        data={requisicoes}
        initialState={{
          columnVisibility: {
            id: false,
            requisitante_id: false,
            id_guia: false,
            guia_status: false,
          },
          density: "compact",
          pagination: { pageSize: 30, pageIndex: 0 },
        }}
        enableRowSelection
        enableRowActions
        enableColumnOrdering
        positionToolbarAlertBanner="bottom"
        renderTopToolbarCustomActions={({ table }) => (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              color="success"
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
              onClick={() =>
                handleVisualizarGuia(table.getSelectedRowModel().rows)
              }
              variant="contained"
              startIcon={<ArticleIcon />}
            >
              Ver Guia
            </Button>
            <Button
              disabled={
                table.getFilteredSelectedRowModel().rows.length === 0 ||
                requisition_type === "entregues" ||
                requisition_type === "processadas"
              }
              //export all rows, including from the next page, (still respects filtering and sorting)
              onClick={() =>
                handleConfirmVoidRequisicao(table.getSelectedRowModel().rows)
              }
              startIcon={<DeleteForeverIcon />}
              variant="contained"
            >
              Anular
            </Button>
            <Button
              disabled={table.getPrePaginationRowModel().rows.length === 0}
              //export all rows, including from the next page, (still respects filtering and sorting)
              onClick={() =>
                handleExportRows(table.getPrePaginationRowModel().rows)
              }
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
          <DialogTitle> Confirmar </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem certeza que deseja anular esta requisicao?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleVoidRequisicao}>Sim</Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export const RequisicoesPorAreaTable = ({ colunas, dados, areaInfo }) => {
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [requisicoesSelecionadas, setRequisicoesSelecionadas] = useState([]);
  const [requisicoes, setUpdateRequisicoes] = useState([...dados]);

  const [selectedRow, setSelectedRow] = useState(null);
  let requisicao = null;
  const navigate = useNavigate();
  let requisicoesArea = dados;
  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const [openAnularReq, setOpenAnularReq] = React.useState(false);
  const handleClickOpenAnularReq = () => {
    setOpenAnularReq(true);
  };
  const [selectedUS, setSelectedUS] = useState(null);

  const handleClose = () => {
    setOpen(false);
  };
  const handleCloseAnularReq = () => {
    setOpenAnularReq(false);
  };
  const handleExportRows = (rows) => {
    const jsonRows = rows;

    // extract all data from jsonRows and save it to an array
    const rowsArray = jsonRows.map((row) => {
      // Get values from the selected row and create a json object
      requisicao = {
        data_requisicao: row.getValue("data_requisicao"),
        material_descricao: row.getValue("material_descricao"),
        quantidade: row.getValue("quantidade"),
        area: row.getValue("area"),
        unidade_sanitaria: row.getValue("unidade_sanitaria"),
        pf_nome: row.getValue("pf_nome"),
        pf_contacto: row.getValue("pf_contacto"),
        requisitante: row.getValue("requisitante_nome"),
        notas: row.getValue("notas"),
        projecto: row.getValue("projecto"),
      };
      return requisicao;
    });

    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Requisicoes");

    /* fix headers */
    utils.sheet_add_aoa(
      worksheet,
      [
        [
          "Data",
          "Material",
          "Qtd. Requisitada",
          "Area",
          "Unidade Sanitaria",
          "Ponto Focal",
          "Contacto",
          "Requisitante",
          "Notas",
        ],
      ],
      { origin: "A1" }
    );

    // Make column names bold by iterating through the header cells
    // const headerCellStyle = { font: { bold: true } };
    // const headerRange = utils.decode_range(worksheet['!ref']);
    // for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    //   const headerCell = utils.encode_cell({ r: headerRange.s.r, c: col });
    //   worksheet[headerCell].s = headerCellStyle;
    // }

    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce(
      (acc, key) => Math.max(acc, key.length),
      0
    );
    //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [{ wch: max_width }];

    // Get current date  an store in the YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const today = year + "-" + month + "-" + day;

    /* create an XLSX file and try to save to  */
    // concat the file name  and area with the current date
    const fileName =
      "Requisicoes {" + rowsArray[0].area + "} " + today + ".xlsx";

    writeFile(workbook, fileName, { compression: true });
  };

  const handleConfirmCriarGuia = () => {
    navigate("/novaGuia", {
      state: { requisicoesSelecionadas, areaInfo },
      replace: true,
    });
    setOpen(false);
  };

  const handleCriarGuia = (rows) => {
    // Check if multiple rows are selected
    if (rows.length > 0) {
      // get all properties from rows and store in an array. each row represent a requisicao.

      const materiasRequisitados = rows.map((row) => {
        // Get values from the selected row and create a json object
        requisicao = {
          id_requisicao: row.getValue("id_requisicao"),
          data_requisicao: row.getValue("data_requisicao"),
          material_descricao: row.getValue("material_descricao"),
          quantidade: row.getValue("quantidade"),
          area: row.getValue("area"),
          id_us: row.getValue("id_us"),
          unidade_sanitaria: row.getValue("unidade_sanitaria"),
          pf_nome: row.getValue("pf_nome"),
          pf_contacto: row.getValue("pf_contacto"),
          notas: row.getValue("notas"),
          projecto: row.getValue("projecto"),
        };
        return requisicao;
      });
      // check if all requisicoes are from the same unidade sanitaria
      const us = materiasRequisitados[0].unidade_sanitaria;
      setRequisicoesSelecionadas(materiasRequisitados);
      setSelectedUS(us);
      const isSameUS = materiasRequisitados.every(
        (requisicao) => requisicao.unidade_sanitaria === us
      );
      if (!isSameUS) {
        NotificationManager.error(
          "Apenas requisicoes com mesmo destino podem ser agrupadas numa guia",
          "Error",
          14000
        );
        return;
      }
      // remove all materiaisRequisitados from requisicoesArea and store in remaingRequisicoes

      let remaingRequisicoes = requisicoesArea.filter(
        (requisicao) =>
          !materiasRequisitados.some(
            (material) => material.id_requisicao === requisicao.id_requisicao
          )
      );

      if (remaingRequisicoes.length > 0) {
        // check if there are still requisicoes in remainingRequisicoes array with the same  us
        const remainingRequisicoesWithSameUS = remaingRequisicoes.filter(
          (requisicao) => requisicao.unidade_sanitaria === us
        );

        if (remainingRequisicoesWithSameUS.length > 0) {
          setOpen(true);
        } else {
          // Save idArea and materiasRequisitados to sessionStorage and Route to the requisicao page
          let requisicoesSelecionadas = materiasRequisitados;
          navigate("/novaGuia", {
            state: { requisicoesSelecionadas, areaInfo },
            replace: true,
          });
        }
      } else {
        let requisicoesSelecionadas = materiasRequisitados;
        navigate("/novaGuia", {
          state: { requisicoesSelecionadas, areaInfo },
          replace: true,
        });
      }
    }
  };

  const fetchResultCancelRequisicao = async (id_requisicao) => {
    // Send a POST request
    const result = await cancelRequisicao(id_requisicao);
    return result;
  };

  const handleVoidRequisicao = async () => {
    let id_requisicao = selectedRow[0].id;
    //  cancell requisicao
    try {
      const result = await fetchResultCancelRequisicao(id_requisicao);
      if (result[0].canceled === "Yes") {
        NotificationManager.success(
          "Requisicao cancelada com sucesso",
          "Sucesso",
          5000
        );
        // update requisicoes array
        handleCloseAnularReq();

        const updatedRequisicoes = dados.filter(
          (requisicao) => requisicao.id !== id_requisicao
        );
        setUpdateRequisicoes(updatedRequisicoes);
        // wait 4 sec the refresh the page
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      NotificationManager.error(
        "Nao foi possivel cancelar a requisicao: " + error.message,
        "Error",
        5000
      );
    }

    return;
  };

  const handleConfirmVoidRequisicao = (rows) => {
    if (rows.length > 1) {
      // Alert the user can only activate one row at a time, use NotificationManager
      NotificationManager.info(
        "Apenas uma linha pode ser selecionada de cada vez",
        "Info",
        4000
      );
    } else {
      let req = null;
      // get all properties from rows (dados) and store in an array. each row represent a requisicao.
      const requisicao = rows.map((row) => {
        // Get values from the selected row and create a json object
        req = {
          id: row.getValue("id_requisicao"),
          data_requisicao: row.getValue("data_requisicao"),
          material_descricao: row.getValue("material_descricao"),
          quantidade: row.getValue("quantidade"),
          unidade_sanitaria: row.getValue("unidade_sanitaria"),
          pf_nome: row.getValue("pf_nome"),
          pf_contacto: row.getValue("pf_contacto"),
        };
        return req;
      });

      setSelectedRow(requisicao);

      handleClickOpenAnularReq();
    }
  };

  return (
    <div>
      <MaterialReactTable
        columns={colunas}
        data={requisicoes}
        initialState={{
          columnVisibility: { id_requisicao: false, id_us: false },
          density: "compact",
        }}
        enableRowSelection
        enableRowActions
        enableColumnOrdering
        positionToolbarAlertBanner="bottom"
        renderTopToolbarCustomActions={({ table }) => (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              color="success"
              disabled={table.getSelectedRowModel().rows.length === 0}
              onClick={() => handleCriarGuia(table.getSelectedRowModel().rows)}
              variant="contained"
            >
              Ciar Guia
            </Button>
            <Button
              disabled={
                table.getSelectedRowModel().rows.length === 0 ||
                table.getSelectedRowModel().rows.length > 1
                //|| isEnviarPedidoDisabled
              }
              color="secondary"
              //export all rows, including from the next page, (still respects filtering and sorting)
              onClick={() =>
                handleConfirmVoidRequisicao(table.getSelectedRowModel().rows)
              }
              startIcon={<CancelIcon />}
              variant="contained"
            >
              Cancelar
            </Button>
            <Button
              disabled={table.getPrePaginationRowModel().rows.length === 0}
              //export all rows, including from the next page, (still respects filtering and sorting)
              onClick={() =>
                handleExportRows(table.getPrePaginationRowModel().rows)
              }
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
          <DialogTitle> Confirmar </DialogTitle>
          <DialogContent>
            <DialogContentText></DialogContentText>
            Existem outras requisicoes para esta US: {selectedUS} . Recomenda-se
            que agrupe todos os materiais numa unica guia. Deseja continuar?
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleConfirmCriarGuia}>Continuar</Button>
          </DialogActions>
        </Dialog>
      </div>
      <div>
        <Dialog open={openAnularReq} onClose={handleClickOpenAnularReq}>
          <DialogTitle> Confirmar </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem certeza que deseja anular esta requisicao?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAnularReq}>Cancel</Button>
            <Button onClick={handleVoidRequisicao}>Sim</Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export const GuiasPorAreaTable = ({ colunas, dados, role }) => {
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
        id_guia: row.getValue("nr_guia"),
        data_guia: row.getValue("data_guia"),
        unidade_sanitaria: row.getValue("unidade_sanitaria"),
        area: row.getValue("area"),
        motorista: row.getValue("motorista"),
        previsao_entrega: row.getValue("previsao_entrega"),
        estado: row.getValue("status"),
        observacao: row.getValue("observacao"),
        data_entrega: row.getValue("data_entrega"),
        criador: row.getValue("createdby"),
        confirmador: row.getValue("confirmedby"),
      };
      return guia;
    });

    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Guias de Saida");

    /* fix headers */
    utils.sheet_add_aoa(
      worksheet,
      [
        [
          "Numero da Guia",
          "Data",
          "Unidade Sanitaria",
          "Area",
          "Motorista",
          "Previsao de Entrega",
          "Estado",
          "Observacao",
          "Data de Entrega",
          "Criado Por",
          "Confirmado Por",
        ],
      ],
      { origin: "A1" }
    );

    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce(
      (acc, key) => Math.max(acc, key.length),
      0
    );
    //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [{ wch: max_width }];

    // Get current date  an store in the YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const today = year + "-" + month + "-" + day;

    /* create an XLSX file and try to save to  */
    // concat the file name  and area with the current date
    const fileName =
      "Guias de Saida {" + rowsArray[0].area + "} " + today + ".xlsx";

    writeFile(workbook, fileName, { compression: true });
  };

  const handleVisualizarGuia = (rows) => {
    // Check if multiple rows are selected
    if (rows.length > 0) {
      // if more than one row is selected, show a popup notification and return
      if (rows.length > 1) {
        NotificationManager.info(
          "Apenas uma guia pode ser selecionada de cada vez",
          "Info",
          5000
        );
        return;
      }
      let guia = null;
      // get all properties from rows (dados) and store in an array. each row represent a guia de saida.
      guiaSaida = rows.map((row) => {
        // Get values from the selected row and create a json object
        guia = {
          nr_guia: row.getValue("nr_guia"),
          data_guia: row.getValue("data_guia"),
          estado: row.getValue("status"),
          unidade_sanitaria: row.getValue("unidade_sanitaria"),
          area: row.getValue("area"),
          motorista: row.getValue("motorista"),
          previsao_entrega: row.getValue("previsao_entrega"),
          observacao: row.getValue("observacao"),
          data_entrega: row.getValue("data_entrega"),
          created_by: row.getValue("createdby"),
          confirmed_by: row.getValue("confirmedby"),
        };
        return guia;
      });

      let tempNrGuia = guiaSaida[0].nr_guia;
      let requisicoes = guiaSaida;

      navigate("/visualizarGuia", {
        state: { requisicoes, tempNrGuia },
        replace: true,
      });
    }
  };

  const fetchResultUpdateGuia = async (json) => {
    const resultado = await updateGuia(json);

    return resultado;
  };

  const handleConfirmarEntrega = async (rows) => {
    // Check if multiple rows are selected
    if (rows.length > 0) {
      // if more than one row is selected, show a popup notification and return
      if (rows.length > 1) {
        NotificationManager.info(
          "Apenas uma guia pode ser selecionada de cada vez",
          "Info",
          5000
        );
        return;
      }

      // get userData and isAutheticade from sessionStorage
      const sessionData = sessionStorage.getItem("userData"); // Retrieve data from localStorage
      let userData = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data

      let confirmationStatus = null;
      let numero_guia = null;
      // get all properties from rows (dados) and store in an array. each row represent a guia de saida.
      guiaSaida = rows.map((row) => {
        // Get values from the selected row and create a json object
        // driver id is 0 : driver  who was first assigned the delivery task did no change until the delivery is confirmed
        let guia = {
          id_guia: row.getValue("id"),
          driver_id: 0,
          confirmed_by: userData[0].id,
        };
        confirmationStatus = row.getValue("status");
        numero_guia = row.getValue("nr_guia");
        return guia;
      });
      if (confirmationStatus === "ENTREGUE") {
        NotificationManager.info("Esta guia ja foi confirmada", "Info", 3000);
        return;
      }

      try {
        let res = await fetchResultUpdateGuia(guiaSaida);
        NotificationManager.success(
          "Confirmada a Entrega da Guia: {" + numero_guia + " }",
          "Sucesso",
          3000
        );
        // setEnableConfirmar(true);
        // wait 2 second then navigate to the ListaGuias page
        // wait 2 seconds then redirect to PedidosPendentesArea
        setTimeout(() => {
          // reload the page
          window.location.reload();
        }, 2000);
      } catch (error) {
        // handle any error state, rejected promises, etc..
        NotificationManager.error(
          "Houve erro ao confirmar Entrega : " + error.message,
          "Erro: " + error.code,
          8000
        );
      }
    }
  };

  return (
    <MaterialReactTable
      columns={colunas}
      data={dados}
      initialState={{
        columnVisibility: { id: false },
        density: "compact",
        pagination: { pageSize: 30, pageIndex: 0 },
      }}
      enableRowSelection
      enableRowActions
      enableColumnOrdering
      positionToolbarAlertBanner="bottom"
      renderTopToolbarCustomActions={({ table }) => (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            color="success"
            disabled={table.getSelectedRowModel().rows.length === 0}
            onClick={() =>
              handleVisualizarGuia(table.getSelectedRowModel().rows)
            }
            variant="contained"
          >
            Visualizar Guia
          </Button>
          <Button
            color="success"
            // disable if no row is selected or if the selected row is already confirmed
            disabled={
              table.getSelectedRowModel().rows.length === 0 ||
              table.getSelectedRowModel().rows[0].status === "ENTREGUE" ||
              role !== "Logistica" // only logistica can confirm delivery
            }
            onClick={() =>
              handleConfirmarEntrega(table.getSelectedRowModel().rows)
            }
            variant="contained"
          >
            Confirmar Entrega
          </Button>
          <Button
            disabled={table.getPrePaginationRowModel().rows.length === 0}
            //export all rows, including from the next page, (still respects filtering and sorting)
            //onClick={() => handleExportRows(table.getPrePaginationRowModel().rows)}
            onClick={() =>
              handleExportGuias(table.getPrePaginationRowModel().rows)
            }
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
export const AreasProgramaticasTable = ({ colunas, dados }) => {
  const [areaDescricao, setAreaDescricao] = useState("");
  const [areaNome, setAreaNome] = useState("");
  //const [otherDescription, setOtherDescription] = useState('');

  const handleAreaDescricaoChange = (event) => {
    setAreaDescricao(event.target.value);
  };

  const handleAreaNomeChange = (event) => {
    setAreaNome(event.target.value);
  };

  const [areaToEdit, setAreaToEdit] = useState(null);

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
      NotificationManager.info(
        "Apenas uma linha pode ser selecionada de cada vez",
        "Info",
        4000
      );
    } else {
      // create an area object with the selected row values
      let areTOEdit = null;

      rows.map((row) => {
        // Get values from the selected row and create a json object
        let area = {
          id: row.getValue("id"),
          area: row.getValue("area"),
          descricao: row.getValue("descricao"),
        };
        areTOEdit = area;
      });

      setAreaDescricao(areTOEdit.descricao);
      setAreaNome(areTOEdit.area);
      setAreaToEdit(areTOEdit);

      handleClickOpen();
    } // end of map
  };
  const handleChangeAreaStatus = async (rows) => {
    let area = null;
    // Check if multiple rows are selected
    if (rows.length > 1) {
      // Alert the user can only activate one row at a time, use NotificationManager
      NotificationManager.info(
        "Apenas uma linha pode ser selecionada de cada vez",
        "Info",
        4000
      );
    } else {
      rows.map(async (row) => {
        // Get values from the selected row and create a json object
        let area = {
          id_area: row.getValue("id"),
          area_status: row.getValue("status"),
        };

        // Prompt the user for confirmation using a popup
        // If the user confirms, then update the user status
        // If the user cancels, then do nothing
        if (area.area_status === "Active") {
          area.area_status = "Inactive";
          try {
            let res = await fetchResultUpdateAreaStatus(area);
            if (res.data === "Actualizado com sucesso") {
              NotificationManager.success(
                "Estado da Area alterado com sucesso",
                "Sucesso",
                4000
              );

              // wait for 5 seconds
              setTimeout(() => {
                // refresh the page
                window.location.reload();
              }, 3000);
            }
          } catch (error) {
            // show the error
            NotificationManager.error(
              "Erro ao actualizar a Area" + error.message,
              "Error",
              3000
            );
          }
        } else {
          area.area_status = "Active";
          try {
            let res = await fetchResultUpdateAreaStatus(area);
            if (res.data === "Actualizado com sucesso") {
              NotificationManager.success(
                "Estado da Area alterado com sucesso",
                "Sucesso",
                3000
              );

              // wait for 5 seconds
              setTimeout(() => {
                // refresh the page
                window.location.reload();
              }, 3000);
            }
          } catch (error) {
            // show the error
            NotificationManager.error(
              "Erro ao actualizar a Area" + error.message,
              "Error",
              4000
            );
          }
        }
      });
    }
  };

  const handleSaveEditedArea = async () => {
    // Get the values from the form
    let area = document.getElementById("area-name-edit").value;
    let descricao = document.getElementById("descricao-edit").value;

    // Check if the values are empty
    if (area === "" || descricao === "") {
      NotificationManager.error("Preencha todos os campos", "Error", 4000);
      return;
    }

    // Create an area object with the values
    let newArea = {
      id_area: areaToEdit.id,
      area_name: area,
      area_descricao: descricao,
    };

    // Update the area
    try {
      let res = await fetchResultUpdateArea(newArea);
      if (res.data === "Actualizado com sucesso") {
        NotificationManager.success(
          "Area actualizada com sucesso",
          "Sucesso",
          3000
        );
        // wait for 5 seconds the close the dialog
        setTimeout(() => {
          // refresh the page
          handleClose();
          window.location.reload();
        }, 3000);
      } else {
        NotificationManager.error("Erro ao actualizar a Area", "Error", 3000);
      }
    } catch (error) {
      // show the error
      NotificationManager.error(
        "Erro ao actualizar a Area" + error.message,
        "Error",
        4000
      );
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
        cod: row.getValue("id"),
        descricao: row.getValue("area"),
        status: row.getValue("status"),
      };
    });

    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Areas Programaticas");

    /* fix headers */
    utils.sheet_add_aoa(worksheet, [["ID", "Nome", "Estado"]], {
      origin: "A1",
    });

    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce(
      (acc, key) => Math.max(acc, key.length),
      0
    );
    //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [{ wch: max_width }];

    // Get current date  an store in the YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const today = year + "-" + month + "-" + day;

    /* create an XLSX file and try to save to  */
    // concat the file name  and area with the current date
    const fileName = "Areas Programaticas  " + today + ".xlsx";

    writeFile(workbook, fileName, { compression: true });
  };

  return (
    <div>
      <MaterialReactTable
        columns={colunas}
        data={dados}
        initialState={{
          columnVisibility: { id: false },
          density: "compact",
        }}
        enableRowSelection
        enableRowActions
        enableColumnOrdering
        positionToolbarAlertBanner="bottom"
        renderTopToolbarCustomActions={({ table }) => (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              color="success"
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
              onClick={() =>
                handleChangeAreaStatus(table.getSelectedRowModel().rows)
              }
              variant="contained"
            >
              Activar / Desactivar
            </Button>
            <Button
              disabled={table.getPrePaginationRowModel().rows.length === 0}
              //export all rows, including from the next page, (still respects filtering and sorting)
              onClick={() =>
                handleExportAreas(table.getPrePaginationRowModel().rows)
              }
              startIcon={<FileDownloadIcon />}
              variant="contained"
            >
              Download
            </Button>
            <Button
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
              //export all rows, including from the next page, (still respects filtering and sorting)
              onClick={() => handleEditArea(table.getSelectedRowModel().rows)}
              startIcon={<EditIcon />}
              variant="contained"
            >
              Editar
            </Button>
          </div>
        )}
      />
      <div>
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle> Editar </DialogTitle>
          <DialogContent>
            <DialogContentText></DialogContentText>
            <TextField
              margin="dense"
              id="area-name-edit"
              label="Nome"
              value={areaNome}
              onChange={handleAreaNomeChange}
              sx={{ width: 300 }}
              variant="standard"
            />
            <br></br>
            <TextField
              id="descricao-edit"
              label="Descricao"
              value={areaDescricao}
              onChange={handleAreaDescricaoChange}
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
export const ColaboradoresTable = ({ colunas, dados, areas }) => {
  const [open, setOpen] = React.useState(false);
  const [openEditUser, setOpenEditUser] = React.useState(false);
  const [currentArea, setCurrentArea] = useState(null);
  const [nomeUser, setNomeUser] = useState("");
  const [emailUser, setEmailUser] = useState("");
  const [contactoUser, setContactoUser] = useState("");
  const [areaUser, setAreaUser] = useState("");
  const [cargoUser, setCargoUser] = useState("");
  const [roleUser, setRoleUser] = useState("");
  const [statusUser, setStatusUser] = useState("");
  const [idUsuario, setIdUsuario] = useState("");
  const [userToEdit, setUserToEdit] = useState(null);
  let areasProgramaticas = areas;

  let usuario = null;
  let activactioStatus = null;
  const navigate = useNavigate();

  const handleClose = () => {
    setOpen(false);
  };
  const handleAreaChange = (event) => {
    setCurrentArea(event.target.value);
  };
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleCloseEditUser = () => {
    setOpenEditUser(false);
  };
  const handleClickOpenEditUser = () => {
    setOpenEditUser(true);
  };
  const handleUserNameChange = (event) => {
    setNomeUser(event.target.value);
  };
  const handleUserEmailChange = (event) => {
    setEmailUser(event.target.value);
  };
  const handleUserAreaChange = (event) => {
    setAreaUser(event.target.value);
  };
  const handleUserCargoChange = (event) => {
    setCargoUser(event.target.value);
  };

  const fetchResultUpdateUsuario = async (json) => {
    const resultado = await updateUsuario(json);

    return resultado;
  };

  const fetchResultUpdateUserStatus = async (json) => {
    const resultado = await updateUsuarioStatus(json);

    return resultado;
  };

  const handleChangeUserStatus = async (rows) => {
    // Check if multiple rows are selected
    if (rows.length > 1) {
      // Alert the user can only activate one row at a time, use NotificationManager
      NotificationManager.info(
        "Apenas uma linha pode ser selecionada de cada vez",
        "Info",
        4000
      );
    } else {
      rows.map(async (row) => {
        // Get values from the selected row and create a json object
        usuario = {
          id_usuario: row.getValue("id"),
          user_status: row.getValue("status"),
        };

        // Prompt the user for confirmation using a popup
        // If the user confirms, then update the user status
        // If the user cancels, then do nothing
        if (usuario.user_status === "Active") {
          usuario.user_status = "Inactive";
          try {
            let res = await fetchResultUpdateUserStatus(usuario);
            if (res.data === "Actualizado com sucesso") {
              NotificationManager.success(
                "Estado do utilizador alterado com sucesso",
                "Sucesso",
                4000
              );

              // wait for 5 seconds
              setTimeout(() => {
                // refresh the page
                window.location.reload();
              }, 3000);
            }
          } catch (error) {
            // show the error
            NotificationManager.error(
              "Erro ao actualizar o usuario" + error.message,
              "Error",
              3000
            );
          }
        } else {
          usuario.user_status = "Active";
          try {
            let res = await fetchResultUpdateUserStatus(usuario);
            if (res.data === "Actualizado com sucesso") {
              NotificationManager.success(
                "Estado do utilizador alterado com sucesso",
                "Sucesso",
                3000
              );

              // wait for 5 seconds
              setTimeout(() => {
                // refresh the page
                window.location.reload();
              }, 3000);
            }
          } catch (error) {
            // show the error
            NotificationManager.error(
              "Erro ao actualizar o usuario" + error.message,
              "Error",
              4000
            );
          }
        }
      });
    }
  };

  const handleEditarUtilizador = async (rows) => {
    // Check if multiple rows are selected
    if (rows.length > 1) {
      // Alert the user can only activate one row at a time, use NotificationManager
      NotificationManager.info(
        "Apenas um utilizador pode ser selecionada de cada vez",
        "Info",
        4000
      );
    } else {
      rows.map(async (row) => {
        // Get values from the selected row and create a json object
        usuario = {
          id_usuario: row.getValue("id"),
          email: row.getValue("email"),
          cargo: row.getValue("funcao"),
          area: row.getValue("area"),
          role: row.getValue("role"),
          nome: row.getValue("nome"),
        };

        setUserToEdit(usuario);
        setNomeUser(usuario.nome);
        setEmailUser(usuario.email);
        setCurrentArea(usuario.area);
        setCargoUser(usuario.cargo);
        setRoleUser(usuario.role);
        setIdUsuario(usuario.id_usuario);
        handleClickOpenEditUser();
      });
    }
  };

  const handleSaveEditedUser = async () => {
    // Get the values from the form
    // get nome do usuario
    const nome = document.getElementById("user-name-edit").value;
    // get email do usuario
    const email = document.getElementById("user-email-edit").value;
    // get cargo do usuario
    const cargo = document.getElementById("user-cargo-edit").value;
    // get role do usuario

    const usuarioArea = currentArea;
    // const materialArea2 = document.getElementById("area-simple-select").value;

    // Check if the values are empty
    if (nome === "" || email === "" || !usuarioArea) {
      NotificationManager.error("Preencha todos os campos", "Error", 4000);
      return;
    }

    // from the areasProgramaticas array, get the id value pf the object that matches the currentArea

    const areaObject = areasProgramaticas.find(
      (area) => area.area === usuarioArea
    );
    const areaObjectId = areaObject.id;

    // Create an new usuario object with the values
    let newUsuario = {
      id_usuario: idUsuario,
      u_nome: nome,
      u_email: email,
      cargo: cargo,
      id_area: areaObjectId,
    };

    // Update the new usuario
    try {
      let res = await fetchResultUpdateUsuario(newUsuario);
      if (res.data === "Actualizado com sucesso") {
        NotificationManager.success(
          "Usuario actualizado com sucesso",
          "Sucesso",
          3000
        );
        // wait for 5 seconds the close the dialog
        setTimeout(() => {
          // refresh the page
          handleCloseEditUser();
          window.location.reload();
        }, 3000);
      } else {
        NotificationManager.error(
          "Erro ao actualizar o Usuario",
          "Error",
          3000
        );
      }
    } catch (error) {
      // show the error
      NotificationManager.error(
        "Erro ao actualizar o Usuario" + error.message,
        "Error",
        4000
      );
      handleCloseEditUser();
    }

    // Close the dialog
    handleCloseEditUser();
  };
  const handleExportColaboradores = (rows) => {
    const jsonRows = rows;

    // extract all data from colaboradores  from jsonRows and save it to an array
    // array should contain the following properties: Nome, Email, Contacto, Area, Cargo, Papel
    const rowsArray = jsonRows.map((row) => {
      return {
        Nome: row.getValue("nome"),
        Email: row.getValue("email"),
        Contacto: row.getValue("contacto"),
        Area: row.getValue("area"),
        Cargo: row.getValue("funcao"),
        Papel: row.getValue("role"),
        Estado: row.getValue("status"),
      };
    });

    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Usuarios");

    /* fix headers */
    utils.sheet_add_aoa(
      worksheet,
      [["Nome", "Email", "Contacto", "Area", "Cargo", "Papel"]],
      { origin: "A1" }
    );
    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce(
      (acc, key) => Math.max(acc, key.length),
      0
    );
    //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [{ wch: max_width }];

    // Get current date  an store in the YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const today = year + "-" + month + "-" + day;

    /* create an XLSX file and try to save to  */
    // concat the file name  and area with the current date
    const fileName = "Usuarios  " + today + ".xlsx";

    writeFile(workbook, fileName, { compression: true });
  };

  return (
    <div>
      <MaterialReactTable
        columns={colunas}
        data={dados}
        initialState={{
          columnVisibility: { id: false, id_area: false, id_role: false },
          density: "compact",
          pagination: { pageSize: 30, pageIndex: 0 },
        }}
        enableRowSelection
        enableRowActions
        enableColumnOrdering
        positionToolbarAlertBanner="bottom"
        renderTopToolbarCustomActions={({ table }) => (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              color="success"
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
              onClick={() =>
                handleChangeUserStatus(table.getSelectedRowModel().rows)
              }
              variant="contained"
            >
              Activar / Desactivar
            </Button>
            <Button
              color="success"
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
              onClick={() =>
                handleEditarUtilizador(table.getSelectedRowModel().rows)
              }
              variant="contained"
            >
              Editar
            </Button>
            <Button
              disabled={table.getPrePaginationRowModel().rows.length === 0}
              //export all rows, including from the next page, (still respects filtering and sorting)
              onClick={() =>
                handleExportColaboradores(table.getPrePaginationRowModel().rows)
              }
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

      <div>
        <Dialog open={openEditUser} onClose={handleCloseEditUser}>
          <DialogTitle> Editar Usuario: {userToEdit?.nome} </DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              id="user-name-edit"
              label="Nome"
              value={nomeUser}
              onChange={handleUserNameChange}
              sx={{ width: 300 }}
              variant="standard"
            />
            <br></br>
            <TextField
              margin="dense"
              id="user-email-edit"
              label="Email"
              value={emailUser}
              onChange={handleUserEmailChange}
              sx={{ width: 300 }}
              variant="standard"
            />
            <br></br>
            <TextField
              margin="dense"
              id="user-cargo-edit"
              label="Cargo"
              value={cargoUser}
              onChange={handleUserCargoChange}
              sx={{ width: 300 }}
              variant="standard"
            />
            <br></br>

            <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
              <p>
                Area: &nbsp; &nbsp;
                <Select
                  labelId="area-select-label"
                  id="user-area-select"
                  value={currentArea}
                  onChange={handleAreaChange}
                >
                  {areasProgramaticas.map((area) => (
                    <MenuItem value={area.area}>{area.area}</MenuItem>
                  ))}
                </Select>{" "}
              </p>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditUser}>Cancel</Button>
            <Button onClick={handleSaveEditedUser}>Salvar</Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

// TODO highlight selected row
export const ProjectosTable = ({ colunas, dados }) => {
  const [projectoDescricao, setProjectoDescricao] = useState("");
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
      NotificationManager.info(
        "Apenas uma linha pode ser selecionada de cada vez",
        "Info",
        4000
      );
    } else {
      // create an projecto object with the selected row values

      rows.map((row) => {
        // Get values from the selected row and create a json object
        const projecto = {
          id: row.getValue("id"),
          nome: row.getValue("nome"),
          descricao: row.getValue("descricao"),
        };
        setProjectoDescricao(projecto.descricao);
        setProjectoNome(projecto.nome);
        setProjectoToEdit(projecto);

        handleClickOpen();
        // set the values of the projecto-descricao-edit and projecto-name-edit to the values of the selected row
      });
    } // end of map
  };
  const handleChangeProjectoStatus = async (rows) => {
    // Check if multiple rows are selected
    if (rows.length > 1) {
      // Alert the user can only activate one row at a time, use NotificationManager
      NotificationManager.info(
        "Apenas uma linha pode ser selecionada de cada vez",
        "Info",
        4000
      );
    } else {
      rows.map(async (row) => {
        // Get values from the selected row and create a json object
        let projecto = {
          id_projecto: row.getValue("id"),
          projecto_status: row.getValue("status"),
        };

        // Prompt the user for confirmation using a popup
        // If the user confirms, then update the user status
        // If the user cancels, then do nothing
        if (projecto.projecto_status === "Active") {
          projecto.projecto_status = "Inactive";
          try {
            let res = await fetchResultUpdateProjectoStatus(projecto);
            if (res.data === "Actualizado com sucesso") {
              NotificationManager.success(
                "Estado do Projecto alterado com sucesso",
                "Sucesso",
                4000
              );

              // wait for 5 seconds
              setTimeout(() => {
                // refresh the page
                window.location.reload();
              }, 3000);
            }
          } catch (error) {
            // show the error
            NotificationManager.error(
              "Erro ao actualizar o Projecto" + error.message,
              "Error",
              3000
            );
          }
        } else {
          projecto.projecto_status = "Active";
          try {
            let res = await fetchResultUpdateProjectoStatus(projecto);
            if (res.data === "Actualizado com sucesso") {
              NotificationManager.success(
                "Estado do Projecto alterado com sucesso",
                "Sucesso",
                3000
              );

              // wait for 5 seconds
              setTimeout(() => {
                // refresh the page
                window.location.reload();
              }, 3000);
            }
          } catch (error) {
            // show the error
            NotificationManager.error(
              "Erro ao actualizar o Projecto" + error.message,
              "Error",
              4000
            );
          }
        }
      });
    }
  };

  const handleSaveEditedProjecto = async () => {
    // Get the values from the form
    const projectoName = document.getElementById("projecto-name-edit").value;
    const projectoDescricao = document.getElementById(
      "projecto-descricao-edit"
    ).value;

    // Check if the values are empty
    if (projectoName === "" || projectoDescricao === "") {
      NotificationManager.error("Preencha todos os campos", "Error", 4000);
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
        NotificationManager.success(
          "Projecto actualizada com sucesso",
          "Sucesso",
          3000
        );
        // wait for 5 seconds the close the dialog
        setTimeout(() => {
          // refresh the page
          handleClose();
          window.location.reload();
        }, 3000);
      } else {
        NotificationManager.error(
          "Erro ao actualizar o Projecto",
          "Error",
          3000
        );
      }
    } catch (error) {
      // show the error
      NotificationManager.error(
        "Erro ao actualizar o Projecto" + error.message,
        "Error",
        4000
      );
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
        cod: row.getValue("id"),
        descricao: row.getValue("projecto"),
        status: row.getValue("status"),
      };
    });

    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Projectos");

    /* fix headers */
    utils.sheet_add_aoa(worksheet, [["ID", "Nome", "Estado"]], {
      origin: "A1",
    });

    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce(
      (acc, key) => Math.max(acc, key.length),
      0
    );
    //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [{ wch: max_width }];

    // Get current date  an store in the YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const today = year + "-" + month + "-" + day;

    /* create an XLSX file and try to save to  */
    // concat the file name  and projecto with the current date
    const fileName = "Projectos  " + today + ".xlsx";

    writeFile(workbook, fileName, { compression: true });
  };

  return (
    <div>
      <MaterialReactTable
        columns={colunas}
        data={dados}
        initialState={{
          columnVisibility: { id: false },
          density: "compact",
        }}
        enableRowSelection
        enableRowActions
        enableColumnOrdering
        positionToolbarAlertBanner="bottom"
        renderTopToolbarCustomActions={({ table }) => (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              color="success"
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
              onClick={() =>
                handleChangeProjectoStatus(table.getSelectedRowModel().rows)
              }
              variant="contained"
            >
              Activar / Desactivar
            </Button>
            <Button
              disabled={table.getPrePaginationRowModel().rows.length === 0}
              //export all rows, including from the next page, (still respects filtering and sorting)
              onClick={() =>
                handleExportProjectos(table.getPrePaginationRowModel().rows)
              }
              startIcon={<FileDownloadIcon />}
              variant="contained"
            >
              Download
            </Button>
            <Button
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
              //export all rows, including from the next page, (still respects filtering and sorting)
              onClick={() =>
                handleEditProjecto(table.getSelectedRowModel().rows)
              }
              startIcon={<EditIcon />}
              variant="contained"
            >
              Editar
            </Button>
          </div>
        )}
      />
      <div>
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle> Editar </DialogTitle>
          <DialogContent>
            <DialogContentText></DialogContentText>
            <TextField
              margin="dense"
              id="projecto-name-edit"
              label="Nome"
              value={projectoNome}
              onChange={handleProjectoNomeChange}
              sx={{ width: 300 }}
              variant="standard"
            />
            <br></br>
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

// TODO highlight selected row
export const PontosFocaisTable = ({ colunas, dados, handleUpdate }) => {
  const [open, setOpen] = React.useState(false);
  let pontoFocal = null;
  let activactioStatus = null;
  const navigate = useNavigate();

  const handleClose = () => {
    setOpen(false);
  };
  const fetchResultUpdatePontoFocalStatus = async (json) => {
    const resultado = await updatePontoFocalStatus(json);

    return resultado;
  };
  const fetchResultVoidPontoFocal = async (json) => {
    const resultado = await voidPontoFocal(json);

    return resultado;
  };
  const handleChangePreferred = async (rows) => {
    // Check if multiple rows are selected
    if (rows.length > 1) {
      // Alert the user can only activate one row at a time, use NotificationManager
      NotificationManager.info(
        "Apenas uma linha pode ser selecionada de cada vez",
        "Info",
        4000
      );
    } else {
      rows.map(async (row) => {
        // Get values from the selected row and create a json object
        pontoFocal = {
          id_ponto_focal: row.getValue("id"),
          preferred_status: row.getValue("preferred"),
        };

        // Prompt the user for confirmation using a popup
        // If the user confirms, then update the user status
        // If the user cancels, then do nothing
        if (pontoFocal.preferred_status === "Sim") {
          NotificationManager.success(
            "Estado preferido actualizado com sucesso",
            "Sucesso",
            4000
          );

          // wait for 5 seconds
          setTimeout(() => {
            // refresh the page
            window.location.reload();
          }, 3000);
        } else {
          pontoFocal.preferred_status = "Nao";
          try {
            let res = await fetchResultUpdatePontoFocalStatus(pontoFocal);
            if (res.data === "Estado preferido actualizado com sucesso") {
              NotificationManager.success(
                "Estado preferido actualizado com sucesso",
                "Sucesso",
                4000
              );

              // wait for 5 seconds
              setTimeout(() => {
                // refresh the page
                window.location.reload();
              }, 3000);
            }
          } catch (error) {
            // show the error
            NotificationManager.error(
              "Erro ao actualizar o estado do Ponto Focal" + error.message,
              "Error",
              3000
            );
          }
        }
      });
    }
  };

  const handleExportPontosFocais = (rows) => {
    const jsonRows = rows;

    // extract all data from colaboradores  from jsonRows and save it to an array
    // array should contain the following properties: Nome, Email, Contacto, Area, Cargo, Papel
    const rowsArray = jsonRows.map((row) => {
      return {
        Nome: row.getValue("nome"),
        Contacto: row.getValue("contacto"),
        Area: row.getValue("area"),
        unidadeSanitaria: row.getValue("unidade_sanitaria"),
        Preferido: row.getValue("preferred"),
        Estado: row.getValue("status"),
      };
    });

    /* generate worksheet and workbook */
    const worksheet = utils.json_to_sheet(rowsArray);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Pontos Focais");

    /* fix headers */
    utils.sheet_add_aoa(
      worksheet,
      [
        [
          "Nome",
          "Contacto",
          "Area",
          "Unidade Sanitaria",
          "Preferido",
          "Estado",
        ],
      ],
      { origin: "A1" }
    );
    /* calculate column width ( number of properties from rows object) */
    const max_width = Object.keys(rows[0]).reduce(
      (acc, key) => Math.max(acc, key.length),
      0
    );
    //const max_width = rows.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet["!cols"] = [{ wch: max_width }];

    // Get current date  an store in the YYYY-MM-DD format
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const today = year + "-" + month + "-" + day;

    /* create an XLSX file and try to save to  */
    // concat the file name  and area with the current date
    const fileName = "Pontos Focais  " + today + ".xlsx";

    writeFile(workbook, fileName, { compression: true });
  };
  const handleVoidPontoFocal = async (row) => {
    // Get values from the selected row and create a json object
    pontoFocal = {
      id_ponto_focal: row.getValue("id"),
      preferred_status: row.getValue("preferred"),
    };
    try {
      let res = await fetchResultVoidPontoFocal(pontoFocal);
      // if res contains  contains data property (an array) with at least one element then the ponto focal was removed
      let data = res.data[0].status;
      if (data === "removido") {
        NotificationManager.success(
          "Ponto focal removido com sucesso",
          "Sucesso",
          4000
        );

        // reload Pontos focais
        handleUpdate();
      }
    } catch (error) {
      // show the error
      NotificationManager.error(
        "Erro ao remover o ponto focal" + error.message,
        "Error",
        4000
      );
    }
  };

  return (
    <div>
      <MaterialReactTable
        columns={colunas}
        data={dados}
        initialState={{
          columnVisibility: {
            id: false,
            unidade_sanitaria_id: false,
            area_id: false,
          },
          density: "compact",
          pagination: { pageSize: 30, pageIndex: 0 },
        }}
        enableRowActions
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: "flex", flexWrap: "nowrap", gap: "8px" }}>
            <IconButton
              color="error"
              onClick={() => {
                //  data.splice(row.index, 1); //assuming simple data table
                handleVoidPontoFocal(row);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
        enableColumnOrdering
        positionToolbarAlertBanner="bottom"
        renderTopToolbarCustomActions={({ table }) => (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {/* <Button
              disabled={table.getPrePaginationRowModel().rows.length === 0}
              //export all rows, including from the next page, (still respects filtering and sorting)
              onClick={() =>
                handleVoidPontoFocal(table.getSelectedRowModel().rows)
              }
              startIcon={<DeleteForeverIcon />}
              variant="contained"
            >
              Remover
            </Button> */}
            <Button
              disabled={table.getPrePaginationRowModel().rows.length === 0}
              //export all rows, including from the next page, (still respects filtering and sorting)
              onClick={() =>
                handleExportPontosFocais(table.getPrePaginationRowModel().rows)
              }
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
          <Button onClick={handleChangePreferred}>Alterar</Button>
          <Button onClick={handleClose} autoFocus>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
