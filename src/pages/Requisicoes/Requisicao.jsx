import React , {useRef} from "react";
import Navbar from "../../components/Navbar/Index";
import { useOutletContext } from "react-router-dom";
import MaterialInfo from "../../components/Material/MaterialInfo";
import { useLocation } from "react-router-dom";
import { useState ,useCallback} from "react";
import { getMaterialById } from "../../middleware/MaterialService";
import { useEffect } from "react";
import {  Spacer, Text } from '@nextui-org/react';
import { getAllUnidadesSanitarias } from "../../middleware/GenericService";
import { MaterialUnidadeSanitariaTable } from "../../components/Datatables/CustomTable";
import { MaterialReactTable } from "material-react-table";
import { NotificationManager} from 'react-notifications';
import { ClipLoader } from "react-spinners";
import {createRequisicao} from "../../middleware/RequisicoesService";
import {CheckboxGroup,Spinner,Select,SelectItem} from "@nextui-org/react";
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';


const columnNamesUSDistribuicao = [

  {
    accessorKey: 'id',
    header: 'ID',
    size: 40,
  },
  {
    accessorKey: 'us',
    header: 'Unidade Sanitaria ID',
    size: 120,
  },
  {
    accessorKey: 'us_nome',
    header: 'Unidade Sanitaria',
    size: 120,
  },
  {
    accessorKey: 'quantidade',
    header: 'Quantidade',
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
    accessorKey: 'material',
    header: 'Material',
  },
  {
    accessorKey: 'requisitante',
    header: 'Requisitante',
  },
  {
    accessorKey: 'notas',
    header: 'Notas',
  }
];
// create an JSON ARRAY from 1-28 with value, labels and  false  state
// this ARRAY represent the 28 unidades sanitarias initially unchecked
const unidadesSanitariasObject = [
  { value: 1, label: "1 de Junho PS", checked: false },
  { value: 2, label: "Albasine PS", checked: false },
  { value: 3, label: "Hulene PSA", checked: false },
  { value: 4, label: "Mavalane CS", checked: false },
  { value: 5, label: "Mavalane HG", checked: false },
  { value: 6, label: "Pescadores PS", checked: false },
  { value: 7, label: "Romão PSA", checked: false },
  { value: 8, label: "1 de Maio PS", checked: false },
  { value: 9, label: "Polana Caniço CS II", checked: false },
  { value: 10, label: "Alto-Maé CSURB", checked: false },
  { value: 11, label: "HCM Pediatrico", checked: false },
  { value: 12, label: "Malhangalene CS", checked: false },
  { value: 13, label: "Maxaquene CSURB", checked: false },
  { value: 14, label: "Polana Cimento CSURB", checked: false },
  { value: 15, label: "Porto CSURB", checked: false },
  { value: 16, label: "Bagamoio CS III", checked: false },
  { value: 17, label: "HPI", checked: false },
  { value: 18, label: "Inhagoia CS", checked: false },
  { value: 19, label: "Magoanine PS", checked: false },
  { value: 20, label: "Magoanine Tenda PSA", checked: false },
  { value: 21, label: "Zimpeto PS", checked: false },
  { value: 22, label: "Inhaca PS", checked: false },
  { value: 23, label: "Catembe CS II", checked: false },
  { value: 24, label: "Incassane", checked: false },
  { value: 25, label: "Chamanculo CS", checked: false },
  { value: 26, label: "Jose Macamo CS", checked: false },
  { value: 27, label: "José Macamo HG", checked: false },
  { value: 28, label: "Xipamanine CSURB", checked: false },
  /* create OCB based on the values in the FormControlLabels */
  { value: 40, label: "OCB – Kuyakana", checked: false },
  { value: 41, label: "OCB – RENCONTRO", checked: false },
  { value: 42, label: "OCB-KUTENGA", checked: false },
  { value: 43, label: "TDM FORMACOES", checked: false },
  { value: 44, label: "OCB-ASCODECHA", checked: false },
  { value: 45, label: "CS Chamissava", checked: false },
  { value: 46, label: "OCB-HIXIKAMWE", checked: false },
  { value: 47, label: "HEAD OFFICE", checked: false },
  { value: 48, label: "DEPOSITO DE MEDICAMENTOS", checked: false },
  { value: 49, label: "SERVICOS DE SAUDE DA CIDADE DE MAPUTO – SSCM", checked: false },
  /* create ESCOLA SECUNDARIA on the values in the FormControlLabels */
  { value: 50, label: "ESCOLA SECUNDARIA EDUARDO MONDLANE", checked: false },
  { value: 51, label: "ESCOLA SECUNDARIA ESTRELA VERMELHA", checked: false },
  { value: 52, label: "ESCOLA SECUNDARIA FRANCISCO MANYANGA", checked: false },
  { value: 53, label: "ESCOLA SECUNDARIA SAMORA MACHEL", checked: false },
  { value: 54, label: "ESCOLA COMUNITARIA DA POLANA", checked: false },
  { value: 55, label: "ESCOLA SECUNDARIA SANTO ANTONIO DA POLANA", checked: false },

  { value: 56, label: "CS Chiango", checked: false },
  { value: 57, label: "PS 3 de Fevereiro", checked: false },
  { value: 58, label: "CS Base aerea Mavalane", checked: false },
  { value: 59, label: "CS Nº 14", checked: false },
  { value: 60, label: "CS Mutsekua", checked: false },
  //  { value: 61, label: "HM Maputo", checked: false },
  { value: 62, label: "HM Maputo", checked: false },
  { value: 63, label: "PS Cadeia Civil", checked: false },
  { value: 64, label: "PS Assembleia da Republica", checked: false },
  { value: 65, label: "PS Nº 2 Tribunal (PRM)", checked: false },
  { value: 66, label: "H. Privado Marinha de Guerra", checked: false },
  { value: 67, label: "Centro Para a crianca", checked: false },
  { value: 68, label: "Clinica UEM", checked: false },
  { value: 69, label: "Dream", checked: false },
  
];


// Parse unidadesSanitariasObject to JSON
//const unidadesSanitarias = JSON.parse(JSON.stringify(unidadesSanitariasObject));


function NovaRequisicao() {
  const [sidebarToggle] = useOutletContext();
  const [loading,setHasFinishedLoading] = useState(false);
  const [materialRequisicao, setData] = useState([]);
  const [errorSaveRequisicao, setErrorSaveRequisicao] = useState(null);
  const [errorGetMaterial, setErrorGetMaterial] = useState(null);
  const location = useLocation();
  let material = [];
  let tempRequisicao = [];
  const [selected, setSelected] = useState([]);
  const selectedRef = useRef(selected);
  const [unidadesSanitarias,setUnidadesSanitarias] = useState(unidadesSanitariasObject);
  const [requisicoes, setRequisicoes] = useState([]);
  // este estado vai ser usado para controlar o numero de requisicoes
  const [totalQuantidadeReq, setTotalQuantidadeReq] = useState(0);
  const totalQuantidadeReqRef = useRef(totalQuantidadeReq);
  const [idArray, setIdArray] = useState([]);
  const requisicoesRef = useRef(requisicoes);
  const [counterRequisicoes, setCounterRequisicoes] = useState(0);
  const [loadingRequisicao, setLoadingRequisicao] = useState(false);
  const [requisicoesEnviadas, setRequisicoesEnviadas] = useState(null);
  const requisicoesEnviadasRef = useRef(requisicoesEnviadas);
  const [checked1, setChecked1] = React.useState(false);
  const [checked2, setChecked2] = React.useState(false);
  const [checked3, setChecked3] = React.useState(false);
  const [checked4, setChecked4] = React.useState(false);
  const [checked5, setChecked5] = React.useState(false);
  const [checked6, setChecked6] = React.useState(false);
  const [checked7, setChecked7] = React.useState(false);
  const [checked8, setChecked8] = React.useState(false);
  const [checked9, setChecked9] = React.useState(false);
  const [checked10, setChecked10] = React.useState(false);
  const [checked11, setChecked11] = React.useState(false);
  const [checked12, setChecked12] = React.useState(false);
  const [checked13, setChecked13] = React.useState(false);
  const [checked14, setChecked14] = React.useState(false);
  const [checked15, setChecked15] = React.useState(false);
  const [checked16, setChecked16] = React.useState(false);
  const [checked17, setChecked17] = React.useState(false);
  const [checked18, setChecked18] = React.useState(false);
  const [checked19, setChecked19] = React.useState(false);
  const [checked20, setChecked20] = React.useState(false);
  const [checked21, setChecked21] = React.useState(false);
  const [checked22, setChecked22] = React.useState(false);
  const [checked23, setChecked23] = React.useState(false);
  const [checked24, setChecked24] = React.useState(false);
  const [checked25, setChecked25] = React.useState(false);
  const [checked26, setChecked26] = React.useState(false);
  const [checked27, setChecked27] = React.useState(false);
  const [checked28, setChecked28] = React.useState(false);
  /* create checked40 up to 56 */
  const [checked40, setChecked40] = React.useState(false);
  const [checked41, setChecked41] = React.useState(false);
  const [checked42, setChecked42] = React.useState(false);
  const [checked43, setChecked43] = React.useState(false);
  const [checked44, setChecked44] = React.useState(false);
  const [checked45, setChecked45] = React.useState(false);
  const [checked46, setChecked46] = React.useState(false);
  const [checked47, setChecked47] = React.useState(false);
  const [checked48, setChecked48] = React.useState(false);
  const [checked49, setChecked49] = React.useState(false);
  const [checked50, setChecked50] = React.useState(false);
  const [checked51, setChecked51] = React.useState(false);
  const [checked52, setChecked52] = React.useState(false);
  const [checked53, setChecked53] = React.useState(false);
  const [checked54, setChecked54] = React.useState(false);
  const [checked55, setChecked55] = React.useState(false);

  const [checked56, setChecked56] = React.useState(false);
  const [checked57, setChecked57] = React.useState(false);
  const [checked58, setChecked58] = React.useState(false);
  const [checked59, setChecked59] = React.useState(false);
  const [checked60, setChecked60] = React.useState(false);
  const [checked61, setChecked61] = React.useState(false);
  const [checked62, setChecked62] = React.useState(false);
  const [checked63, setChecked63] = React.useState(false);
  const [checked64, setChecked64] = React.useState(false);
  const [checked65, setChecked65] = React.useState(false);
  const [checked66, setChecked66] = React.useState(false);
  const [checked67, setChecked67] = React.useState(false);
  const [checked68, setChecked68] = React.useState(false);
  const [checked69, setChecked69] = React.useState(false);




  let selectedUnidadesSanitarias = [];

  

  useEffect(() => {
    // update the ref whenever the totalQuantidadeReq state changes
    totalQuantidadeReqRef.current = totalQuantidadeReq;
  }, [totalQuantidadeReq]);

  useEffect(() => {
    // update the ref whenever the requisicoes state changes
    requisicoesRef.current = requisicoes;
  }, [requisicoes]);

  useEffect (() => {
    // update the ref whenever the selected state changes
    selectedRef.current = selected;
  });

  useEffect(() => {
    // update the ref whenever the requisicoes state changes
    requisicoesEnviadasRef.current = requisicoesEnviadas;
  }, [requisicoesEnviadas]);



  const handleChange1 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked1( event.target.checked);
    NotificationManager.info( " label: " +label + " checked: " +checked , 'Info', 2000);
    // if checked is true then add value to selectedUnidadesSanitarias else remove value from selectedUnidadesSanitarias
    if(checked){
       addSelectedUS(value);
      
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value)
  };

  const handleChange2 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked2( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value)
  };

  const handleChange3 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked3( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };

  const handleChange4 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked4( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  const handleChange5 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked5( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange6 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked6( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange7 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked7( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange8 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked8( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange9 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked9( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange10 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked10( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange11 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked11( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange12 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked12( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange13 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked13( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange14 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked14( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange15 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked15( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange16 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked16( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange17 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked17( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange18 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked18( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange19 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked19( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange20 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked20( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange21 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked21( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange22 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked22( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  
  const handleChange23 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked23( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange24 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked24( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange25 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked25( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange26 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked26( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange27 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked27( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  const handleChange28 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;
    setChecked28( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
       addSelectedUS(value);
    }else{
       removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  };
  
  /* Create handleChange40 up to 56 */
  const handleChange40 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked40( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  }

  const handleChange41 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked41( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  }

  const handleChange42 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked42( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  }

  const handleChange43 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked43( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  }

  const handleChange44 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked44( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  }

  const handleChange45 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked45( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected 
    handleSetSelected(value);
  }

  const handleChange46 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked46( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected
    handleSetSelected(value);
  }

  const handleChange47 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked47( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected
    handleSetSelected(value);
  }
  const handleChange48 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked48( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected
    handleSetSelected(value);
  }
  
  const handleChange49 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked49( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected
    handleSetSelected(value);
  }
  
  const handleChange50 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked50( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected
    handleSetSelected(value);
  }

  const handleChange51 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked51( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected
    handleSetSelected(value);
  }
  const handleChange52 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked52( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected
    handleSetSelected(value);
  }
  
  const handleChange53 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked53( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected
    handleSetSelected(value);
  }
  
  const handleChange54 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked54( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected
    handleSetSelected(value);
  }
  
  const handleChange55 = (event) => {
    const value = event.target.value;
    const label = event.target.labels[0].innerText;
    const checked = event.target.checked;

    setChecked55( event.target.checked);
    NotificationManager.info(" US: " +label + " checked: " +checked , 'Info', 2000);
    if(checked){
      addSelectedUS(value);
    }else{
      removeSelectedUS(value);
    }
    // set selectedUnidadesSanitarias to selected
    handleSetSelected(value);
  }
  
    const handleChange56 = (event) => {
      const value = event.target.value;
      const label = event.target.labels[0].innerText;
      const checked = event.target.checked;
      
      setChecked56(event.target.checked);
      NotificationManager.info(" US: " + label + " checked: " + checked, 'Info', 2000);
      if (checked) {
        addSelectedUS(value);
      } else {
        removeSelectedUS(value);
      }
      // set selectedUnidadesSanitarias to selected
      handleSetSelected(value);
    }

    const handleChange57 = (event) => {
      const value = event.target.value;
      const label = event.target.labels[0].innerText;
      const checked = event.target.checked;
      
      setChecked57(event.target.checked);
      NotificationManager.info(" US: " + label + " checked: " + checked, 'Info', 2000);
      if (checked) {
        addSelectedUS(value);
      } else {
        removeSelectedUS(value);
      }
      // set selectedUnidadesSanitarias to selected
      handleSetSelected(value);
    }

    const handleChange58 = (event) => {
      const value = event.target.value;
      const label = event.target.labels[0].innerText;
      const checked = event.target.checked;
      
      setChecked58(event.target.checked);
      NotificationManager.info(" US: " + label + " checked: " + checked, 'Info', 2000);
      if (checked) {
        addSelectedUS(value);
      } else {
        removeSelectedUS(value);
      }
      // set selectedUnidadesSanitarias to selected
      handleSetSelected(value);
    }

    const handleChange59 = (event) => {
      const value = event.target.value;
      const label = event.target.labels[0].innerText;
      const checked = event.target.checked;
      
      setChecked59(event.target.checked);
      NotificationManager.info(" US: " + label + " checked: " + checked, 'Info', 2000);
      if (checked) {
        addSelectedUS(value);
      } else {
        removeSelectedUS(value);
      }
      // set selectedUnidadesSanitarias to selected
      handleSetSelected(value);
    }

    const handleChange60 = (event) => {
      const value = event.target.value;
      const label = event.target.labels[0].innerText;
      const checked = event.target.checked;
      
      setChecked60(event.target.checked);
      NotificationManager.info(" US: " + label + " checked: " + checked, 'Info', 2000);
      if (checked) {
        addSelectedUS(value);
      } else {
        removeSelectedUS(value);
      }
      // set selectedUnidadesSanitarias to selected
      handleSetSelected(value);
    }

    const handleChange61 = (event) => {
      const value = event.target.value;
      const label = event.target.labels[0].innerText;
      const checked = event.target.checked;
      
      setChecked61(event.target.checked);
      NotificationManager.info(" US: " + label + " checked: " + checked, 'Info', 2000);
      if (checked) {
        addSelectedUS(value);
      } else {
        removeSelectedUS(value);
      }
      // set selectedUnidadesSanitarias to selected
      handleSetSelected(value);
    }

    const handleChange62 = (event) => {
      const value = event.target.value;
      const label = event.target.labels[0].innerText;
      const checked = event.target.checked;
      
      setChecked62(event.target.checked);
      NotificationManager.info(" US: " + label + " checked: " + checked, 'Info', 2000);
      if (checked) {
        addSelectedUS(value);
      } else {
        removeSelectedUS(value);
      }
      // set selectedUnidadesSanitarias to selected
      handleSetSelected(value);
    }

    const handleChange63 = (event) => {
      const value = event.target.value;
      const label = event.target.labels[0].innerText;
      const checked = event.target.checked;
      
      setChecked63(event.target.checked);
      NotificationManager.info(" US: " + label + " checked: " + checked, 'Info', 2000);
      if (checked) {
        addSelectedUS(value);
      } else {
        removeSelectedUS(value);
      }
      // set selectedUnidadesSanitarias to selected
      handleSetSelected(value);
    }

    const handleChange64 = (event) => {
      const value = event.target.value;
      const label = event.target.labels[0].innerText;
      const checked = event.target.checked;
      
      setChecked64(event.target.checked);
      NotificationManager.info(" US: " + label + " checked: " + checked, 'Info', 2000);
      if (checked) {
        addSelectedUS(value);
      } else {
        removeSelectedUS(value);
      }
      // set selectedUnidadesSanitarias to selected
      handleSetSelected(value);
    }

    const handleChange65 = (event) => {
      const value = event.target.value;
      const label = event.target.labels[0].innerText;
      const checked = event.target.checked;
      
      setChecked65(event.target.checked);
      NotificationManager.info(" US: " + label + " checked: " + checked, 'Info', 2000);
      if (checked) {
        addSelectedUS(value);
      } else {
        removeSelectedUS(value);
      }
      // set selectedUnidadesSanitarias to selected
      handleSetSelected(value);
    }

    const handleChange66 = (event) => {
      const value = event.target.value;
      const label = event.target.labels[0].innerText;
      const checked = event.target.checked;
      
      setChecked66(event.target.checked);
      NotificationManager.info(" US: " + label + " checked: " + checked, 'Info', 2000);
      if (checked) {
        addSelectedUS(value);
      } else {
        removeSelectedUS(value);
      }
      // set selectedUnidadesSanitarias to selected
      handleSetSelected(value);
    }

    const handleChange67 = (event) => {
      const value = event.target.value;
      const label = event.target.labels[0].innerText;
      const checked = event.target.checked;
      
      setChecked67(event.target.checked);
      NotificationManager.info(" US: " + label + " checked: " + checked, 'Info', 2000);
      if (checked) {
        addSelectedUS(value);
      } else {
        removeSelectedUS(value);
      }
      // set selectedUnidadesSanitarias to selected
      handleSetSelected(value);
    }

    const handleChange68 = (event) => {
      const value = event.target.value;
      const label = event.target.labels[0].innerText;
      const checked = event.target.checked;
      
      setChecked68(event.target.checked);
      NotificationManager.info(" US: " + label + " checked: " + checked, 'Info', 2000);
      if (checked) {
        addSelectedUS(value);
      } else {
        removeSelectedUS(value);
      }
      // set selectedUnidadesSanitarias to selected
      handleSetSelected(value);
    }

    const handleChange69 = (event) => {
      const value = event.target.value;
      const label = event.target.labels[0].innerText;
      const checked = event.target.checked;
      
      setChecked69(event.target.checked);
      NotificationManager.info(" US: " + label + " checked: " + checked, 'Info', 2000);
      if (checked) {
        addSelectedUS(value);
      } else {
        removeSelectedUS(value);
      }
      // set selectedUnidadesSanitarias to selected
      handleSetSelected(value);
    }



  const kamavota = (
    <Box 
    sx={{ display: 'flex', 
    flexDirection: 'column',
    fontSize: 8,
     ml: 2 }}>
      < FormControlLabel
        label="1 de Junho PS"
        value="1"
        control={<Checkbox checked={checked1} onChange={handleChange1} />}
      />
      < FormControlLabel
        label="Albasine PS"
        value="2"
        control={<Checkbox checked={checked2} onChange={handleChange2} />}
      />
      < FormControlLabel
        label="Hulene PSA"
        value="3"
        control={<Checkbox checked={checked3} onChange={handleChange3} />}
      />
      < FormControlLabel
        label="Mavalane CS"
        value="4"
        control={<Checkbox checked={checked4} onChange={handleChange4} />}
      />
       <FormControlLabel
        label="Mavalane HG"
        value="5"
        control={<Checkbox checked={checked5} onChange={handleChange5} />}
      />
       <FormControlLabel
        label="Pescadores PS"
        value="6"
        control={<Checkbox checked={checked6} onChange={handleChange6} />}
      />
       <FormControlLabel
        label="Romão PSA"
        value="7"
        control={<Checkbox checked={checked7} onChange={handleChange7} />}
      />
        <FormControlLabel
        label="CS Chiango"
        value="56"
        control={<Checkbox checked={checked56} onChange={handleChange56} />}
      />
        <FormControlLabel
        label="PS 3 de Fevereiro"
        value="57"
        control={<Checkbox checked={checked57} onChange={handleChange57} />}
      />
        <FormControlLabel
        label="CS Base aerea Mavalane"
        value="58"
        control={<Checkbox checked={checked58} onChange={handleChange58} />}
      />
         <FormControlLabel
        label="OCB – Kuyakana"
        value="40"
        control={<Checkbox checked={checked40} onChange={handleChange40} />}
      />
    <FormControlLabel
        label="OCB – RENCONTRO"
        value="41"
        control={<Checkbox checked={checked41} onChange={handleChange41} />}
      />
    </Box>) ;


  const kamaxakeni = (
    <Box  sx={{ display: 'flex', 
    flexDirection: 'column',
    fontSize: 8,
     ml: 2 }}>
      < FormControlLabel
        label="1 de Maio PS"
        value="8"
        control={<Checkbox checked={checked8} onChange={handleChange8} />}
      />
      < FormControlLabel
        label="Polana Caniço CS II"
        value="9"
        control={<Checkbox checked={checked9} onChange={handleChange9} />}
      />
         < FormControlLabel
        label="Clinica UEM"
        value="68"
        control={<Checkbox checked={checked68} onChange={handleChange68} />}
      />
        < FormControlLabel
        label="OCB-KUTENGA"
        value="42"
        control={<Checkbox checked={checked42} onChange={handleChange42} />}
      />
      </Box>);

  const kampfumu = (
    <Box  sx={{ display: 'flex', 
    flexDirection: 'column',
    fontSize: 8,
     ml: 2 }}>
      < FormControlLabel
        label="Alto-Maé CSURB"
        value="10"
        control={<Checkbox checked={checked10} onChange={handleChange10} />}
      />
      < FormControlLabel
        label="HCM Pediatrico"
        value="11"
        control={<Checkbox checked={checked11} onChange={handleChange11} />}
      />
      < FormControlLabel
        label="Malhangalene CS"
        value="12"
        control={<Checkbox checked={checked12} onChange={handleChange12} />}
      />
      < FormControlLabel
        label="Maxaquene CSURB"
        value="13"
        control={<Checkbox checked={checked13} onChange={handleChange13} />}
      />
      < FormControlLabel
        label="Polana Cimento CSURB"
        value="14"
        control={<Checkbox checked={checked14} onChange={handleChange14} />}
      />
      < FormControlLabel
        label="Porto CSURB"
        value="15"
        control={<Checkbox checked={checked15} onChange={handleChange15} />}
      />
      < FormControlLabel
      label="PS Cadeia Civil"
      value="63"
      control={<Checkbox checked={checked63} onChange={handleChange63} />}
      />
     < FormControlLabel
        label="PS Assembleia da Republica"
        value="64"
        control={<Checkbox checked={checked64} onChange={handleChange64} />}
      />
      < FormControlLabel
        label="PS Tribinal N2 (PRM)"
        value="65"
        control={<Checkbox checked={checked65} onChange={handleChange65} />}
      />
      < FormControlLabel
        label="H. Privado Marinha de Guerra"
        value="66"
        control={<Checkbox checked={checked66} onChange={handleChange66} />}
      />
      < FormControlLabel
        label="Centro Para a Crianca"
        value="67"
        control={<Checkbox checked={checked67} onChange={handleChange67} />}
      />
  < FormControlLabel
        label="HM Maputo"
        value="62"
        control={<Checkbox checked={checked62} onChange={handleChange62} />}
      />
       < FormControlLabel
        label="DEPOSITO DE MEDICAMENTOS"
        value="48"
        control={<Checkbox checked={checked48} onChange={handleChange48} />}
      />
       < FormControlLabel
        label="SERVICOS DE SAUDE DA CIDADE DE MAPUTO – SSCM"
        value="49"
        control={<Checkbox checked={checked49} onChange={handleChange49} />}
      />
      < FormControlLabel
        label="TDM FORMACOES"
        value="43"
        control={<Checkbox checked={checked43} onChange={handleChange43} />}
      />

< FormControlLabel
        label="HEAD OFFICE"
        value="47"
        control={<Checkbox checked={checked47} onChange={handleChange47} />}
      />

      </Box>);

  const kamubukwana = (
    <Box  sx={{ display: 'flex', 
    flexDirection: 'column',
    fontSize: 8,
     ml: 2 }}>
      < FormControlLabel
        label="Bagamoio CS III"
        value="16"
        control={<Checkbox checked={checked16} onChange={handleChange16} />}
      />
      < FormControlLabel
        label="HPI"
        value="17"
        control={<Checkbox checked={checked17} onChange={handleChange17} />}
      />
      < FormControlLabel
        label="Inhagoia CS"
        value="18"
        control={<Checkbox checked={checked18} onChange={handleChange18} />}
      />
      < FormControlLabel
        label="Magoanine PS"
        value="19"
        control={<Checkbox checked={checked19} onChange={handleChange19} />}
      />
      < FormControlLabel
        label="Magoanine Tenda PSA"
        value="20"
        control={<Checkbox checked={checked20} onChange={handleChange20} />}
      />
      < FormControlLabel
        label="Zimpeto PS"
        value="21"
        control={<Checkbox checked={checked21} onChange={handleChange21} />}
      />
         < FormControlLabel
        label="OCB-HIXIKAMWE"
        value="46"
        control={<Checkbox checked={checked46} onChange={handleChange46} />}
      />
           < FormControlLabel
        label="Dream"
        value="69"
        control={<Checkbox checked={checked69} onChange={handleChange69} />}
      />
     </Box>);

  const katembe = (
    <Box  sx={{ display: 'flex', 
    flexDirection: 'column',
    fontSize: 8,
     ml: 2 }}>
      < FormControlLabel
        label="Inhaca PS"
        value="22"
        control={<Checkbox checked={checked22} onChange={handleChange22} />}
      />
      < FormControlLabel
        label="Catembe CS II"
        value="23"
        control={<Checkbox checked={checked23} onChange={handleChange23} />}
      />
      < FormControlLabel
        label="Incassane"
        value="24"
        control={<Checkbox checked={checked24} onChange={handleChange24} />}
      />
       < FormControlLabel
        label="CS Chamissava"
        value="45"
        control={<Checkbox checked={checked45} onChange={handleChange45} />}
      />
             < FormControlLabel
        label="CS Mutsekua"
        value="60"
        control={<Checkbox checked={checked60} onChange={handleChange60} />}
      />
      </Box>);

  const nlhamankulu = (
    <Box  sx={{ display: 'flex', 
    flexDirection: 'column',
    fontSize: 8,
     ml: 2 }}>
      < FormControlLabel
        label="Chamanculo CS"
        value="25"
        control={<Checkbox checked={checked25} onChange={handleChange25} />}
      />
      < FormControlLabel
        label="Jose Macamo CS"
        value="26"
        control={<Checkbox checked={checked26} onChange={handleChange26} />}
      />
      < FormControlLabel
        label="José Macamo HG"
        value="27"
        control={<Checkbox checked={checked27} onChange={handleChange27} />}
      />
      < FormControlLabel  
        label="Xipamanine CSURB"
        value="28"
        control={<Checkbox checked={checked28} onChange={handleChange28} />}
      />
       < FormControlLabel
        label="CS Nº 14"
        value="59"
        control={<Checkbox checked={checked59} onChange={handleChange59} />}
      />
       < FormControlLabel  
        label="OCB-ASCODECHA"
        value="44"
        control={<Checkbox checked={checked44} onChange={handleChange44} />}
      />
      </Box>);

const outrosDestinos = (
  <Box  sx={{ display: 'flex', 
  flexDirection: 'column',
  fontSize: 8,
   ml: 2 }}>
    < FormControlLabel
      label="ESCOLA SECUNDARIA EDUARDO MONDLANE"
      value="50"
      control={<Checkbox checked={checked50} onChange={handleChange50} />}
    />
    < FormControlLabel
      label="ESCOLA SECUNDARIA ESTRELA VERMELHA"
      value="51"
      control={<Checkbox checked={checked51} onChange={handleChange51} />}
    />
        < FormControlLabel
      label="ESCOLA SECUNDARIA FRANCISCO MANYANGA"
      value="52"
      control={<Checkbox checked={checked52} onChange={handleChange52} />}
    />
    < FormControlLabel
      label="ESCOLA SECUNDARIA JOSINA MACHEL"
      value="53"
      control={<Checkbox checked={checked53} onChange={handleChange53} />}
    />
        < FormControlLabel
      label="ESCOLA COMUNITARIA DA POLANA"
      value="54"
      control={<Checkbox checked={checked54} onChange={handleChange54} />}
    />
    < FormControlLabel
      label="ESCOLA SECUNDARIA SANTO ANTONIO DA POLANA"
      value="55"
      control={<Checkbox checked={checked55} onChange={handleChange55} />}
    />
    </Box>);

  material = location.state ? location.state.material : null; // Parse the retrieved data
  // get id from material
  let id_material = material ? material.id : null; // Parse the retrieved data
  
  
//get Material by area 
useEffect(() => {
  getMaterialById(id_material) 
    .then(material => { 
      setData(material)
      setHasFinishedLoading(true);
    } )
    .catch(err => {
      // handle any error state, rejected promises, etc..
      setErrorGetMaterial(err);
      setHasFinishedLoading(true);
    });

}, []);
// Get ruserInfo from sessionStorage
const sessionData = sessionStorage.getItem('userData'); // Retrieve data from localStorage
//parse sessionData to JSON
let userInfo = [];
userInfo = sessionData ? JSON.parse(sessionData) : null; // Parse the retrieved data


const removeRequisicao = (idToRemove) => {

// get quantidade from the object to be removed
let quantidadeToRemove = requisicoes.find((item) => item.us === idToRemove).quantidade;
// if quanityToRemove is empty, then set it to zero
if(quantidadeToRemove === ""){
  quantidadeToRemove = 0;
}
setTotalQuantidadeReq(prevState => prevState - parseInt(quantidadeToRemove));
const updatedRequisicoesArray = requisicoes.filter((obj) => obj.us !== idToRemove);
setRequisicoes(updatedRequisicoesArray);
};

const addRequisicao = (newObject) => {
  // add newObject to requisicoes array
 const newUpdatedRequisicoesArray = [...requisicoes, newObject];
  setRequisicoes(newUpdatedRequisicoesArray);
  
};

const addSelectedUS = (newObject) => {

  const updatedArray = [...selected, newObject];
  setSelected(updatedArray);
  selectedRef.current = updatedArray;

};

const removeSelectedUS = (idToRemove) => {
  let updatedArray = selected.filter(obj => obj !== idToRemove);
  setSelected(updatedArray);
  selectedRef.current = updatedArray;
};


const updateRequisicoes = (arrayObject) => {
  setRequisicoes(arrayObject);
};

const fetchResult = async (json) => {

  setLoadingRequisicao(true);
  
  const resultado = await createRequisicao(json);

  setRequisicoesEnviadas(resultado);


  return resultado;
  
};

const handleEnviarRequisicao = async () => {

  // if there is one requisicao object with quantidade empty, then show error message
  let requisicoesWithEmptyQuantidade = requisicoes.filter((item) => {
    return item.quantidade === "";
  } );

  if(requisicoesWithEmptyQuantidade.length > 0){
    NotificationManager.error("Houve erro: Todas  as requisicoes devem ter  quantidade superior a zero. corrija os dados" , 'Erro', 8000);
    return;
  }

  // remove us_nome property from requisicoes array
  let requisicoesArray = requisicoes.map(({ us_nome, ...item }) => item);
  // rename the us property to unidade_sanitaria
  requisicoesArray = requisicoesArray.map(({ us, ...item }) => ({ ...item, unidade_sanitaria: us }));
  // change quantidade type to integer
  requisicoesArray = requisicoesArray.map(({ quantidade, ...item }) => ({ ...item, quantidade: parseInt(quantidade) }));
  let updatedRequisicoesArray = requisicoesArray.map((requisicao) => {
    return {
      ...requisicao,
      quantidade: parseInt(requisicao.quantidade)
    };
  });
  //convert the array to json

  // const requisicoesJSON = JSON.stringify(updatedRequisicoesArray);
  // call createRequisicao function using the useffect hook

  try {
    let res = await fetchResult(updatedRequisicoesArray);


   NotificationManager.success("Foram gravados com sucesso:" +res.length + " Requisicoes" , 'Sucesso', 5000);
   //NotificationManager.success("Requisicao enviada com sucesso" , 'Sucesso', 8000);
   setLoadingRequisicao(false);
        //refresh the page
        setTimeout(() => {
          window.location.reload();
      }, 3000);
        //refresh the page
  


  } catch (error) {
       // handle any error state, rejected promises, etc..
       setErrorSaveRequisicao(error);
       NotificationManager.error("Houve erro ao gravar as requisicoes: " +error.message , 'Erro: ' +error.code, 8000);
       setLoadingRequisicao(false);
  
  }



};



// function handleChange2 to capture the value and label  of the selected checkbox
const handleSetSelected = (usID) => {

  // check if requisicoes  array is empty
  if(requisicoes.length === 0){
  
    let tempSeedArray = [usID];
    let tempidArray =  tempSeedArray.map((item) => {
      return parseInt(item);
    });
    setIdArray(tempidArray);
  
  // add values to tempRequisicao using object from unidadesSanitariasObject based on the selected value  object
  tempRequisicao =[];
  tempRequisicao = unidadesSanitariasObject.filter((item) => {
    return  tempidArray.includes(item.value);
  });
  console.log("tempRequisicao", tempRequisicao);
  //create an array of requisicao object using a loop, the properties should match those from the
  // columnNamesUSDistribuicao. user a for loop
  let requisicaoArray = [];
  for (let i = 0; i < tempRequisicao.length; i++) {
    requisicaoArray.push({
      us: tempRequisicao[i].value,
      us_nome: tempRequisicao[i].label,
      quantidade: "",
      pf_nome: "",
      pf_contacto: "",
      material: id_material,
      requisitante: userInfo[0].id,
      notas: ""
    });
  }
  console.log("requisicaoArray", requisicaoArray);
   updateRequisicoes(requisicaoArray);
   //increment counterRequisicoes state
   setCounterRequisicoes(prevState => prevState + 1);
   selectedUnidadesSanitarias =tempidArray;
  } else {
  // if idArray is greater than counterRequisicoes, then add new requisicao

  let tempSeedArray = selectedRef.current;
  if(tempSeedArray.length > counterRequisicoes){
   
  let idLastValue = tempSeedArray[(tempSeedArray.length -1)]
  let newRequisicao =[];

    newRequisicao = unidadesSanitariasObject.filter((item) => {
      return  item.value === parseInt(idLastValue);
    });
    
    // 
    const newObj = {
    us: newRequisicao[0].value,
    us_nome: newRequisicao[0].label,
    quantidade: "",
    pf_nome: "",
    pf_contacto: "",
    material: id_material,
    requisitante: userInfo[0].id,
    notas: ""
  };

  addRequisicao(newObj);
  //increment counterRequisicoes
  setCounterRequisicoes(prevState => prevState + 1);
  
  let tempidArray =  tempSeedArray.map((item) => {
    return parseInt(item);
  });
  setIdArray(tempidArray);

  } else {

    //if value is empty then remove the last object from requisicoes Array
    let tempSeedArray = selectedRef.current;
    if(tempSeedArray.length === 0){
    // remove the last object from requisicoes Array
    //update requisicoes state
      updateRequisicoes([]);
      setIdArray([]);
      setSelected([]);
      setCounterRequisicoes(0);
      setTotalQuantidadeReq(0);
    } else {
   // which object exists in idARRray but not in value
    let idLastValue = idArray.find((item) => { return !tempSeedArray.map(Number).includes(item); });
    
    // This works too
    //const integersNotInValue = idArray.filter((num) => !value.map(Number).includes(num));
    
    // remove the non existing object (idLastValue) from requisicoes Array 
    removeRequisicao(idLastValue);

    //decrement counterRequisicoes
    setCounterRequisicoes(prevState => prevState - 1);
    let tempidArray =  tempSeedArray.map((item) => {
      return parseInt(item);
    } 
    );
    setIdArray(tempidArray);
    
  }
  }
  }
};

const handleSaveRow =  ({ exitEditingMode, row, values }) => {
  //if using flat data and simple accessorKeys/ids, you can just do a simple assignment here.

   // get the original row object
    const originalRequisicao = row.original;
    const constidUSModifiedReq = originalRequisicao.us;

    // get values from edited object
    const phoneRegex = /^\d{9}$/;
    const phoneNumber = values.pf_contacto;
    const quantidade = values.quantidade;
  // access the totalQuantidadeReq value using the current property of the ref
      const totalQuantidadeReqValue = totalQuantidadeReqRef.current;
      console.log("totalQuantidadeReqValue", totalQuantidadeReqValue);
    
    // validate quantidade and phone number
    if( totalQuantidadeReqValue === materialRequisicao[0].qtd_stock){
      NotificationManager.error("Houve erro: Nao existe stock disponivel" , 'Erro', 8000);
      exitEditingMode();  //required to exit editing mode
      return;
    } else if(quantidade === "" || isNaN(quantidade)){  
      // Show a notification error using the notification manager
      NotificationManager.error("Houve erro: A quantidade deve ser um numero" , 'Erro', 8000);
      exitEditingMode(); //required to exit editing mode
      return;
    } else if(parseInt(quantidade) + totalQuantidadeReqValue > materialRequisicao[0].qtd_stock){
      NotificationManager.error("Houve erro: As quantidades requisitadas sao superiores ao stock" , 'Erro', 8000);
      exitEditingMode();  //required to exit editing mode
      return;
    }else if(phoneNumber !== "" && !phoneRegex.test(phoneNumber)){
      // Show a notification error using the notification manager
      NotificationManager.error("Houve erro: O contacto deve ter 9 digitos" , 'Erro', 8000);
      exitEditingMode();  //required to exit editing mode
      return;
    } else if( parseInt(quantidade) > materialRequisicao[0].qtd_stock){
      // Show a notification error using the notification manager
      NotificationManager.error("Houve erro: A quantidade requisitada é superior ao stock" , 'Erro', 8000);
      exitEditingMode();  //required to exit editing mode
      return;
    } else if( parseInt(quantidade)  === 0){
      // Show a notification error using the notification manager
      NotificationManager.error("Houve erro: A quantidade requisitada deve ser maior que zero" , 'Erro', 8000);
      exitEditingMode();  //required to exit editing mode
      return;
    }  else if( totalQuantidadeReq > materialRequisicao[0].qtd_stock){
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
    setTotalQuantidadeReq(prevState => prevState - parseInt(originalRequisicao.quantidade)+ parseInt(quantidade));
  exitEditingMode(); //required to exit editing mode
  } else {

    setTotalQuantidadeReq(prevState => prevState + parseInt(quantidade));
    exitEditingMode(); //required to exit editing mode
  }


};

  if(!materialRequisicao){

    return (
      <>
        <main className="h-full">
          <Navbar toggle={sidebarToggle} />
  
          {/* Main Content */}
          <div className="mainCard">
              <div className="border w-full border-gray-200 bg-white py-4 px-6 rounded-md ">
                  <MaterialInfo  />
                  <ClipLoader color="#36d7b7" /><span className="ml-2">A carregar dados...</span>
              </div>
      </div>
      </main>
      </>
       );
  } else{


  //if error has data

    
  if (errorGetMaterial !==null) {   
    // Show a notification error using the notification manager
    NotificationManager.error("Houve um erro : " +errorGetMaterial.message , 'Erro', 8000);
    return (
      <>
        <main className="h-full">
          <Navbar toggle={sidebarToggle} />
  
          {/* Main Content */}
          <div className="mainCard">
              <div className="border w-full border-gray-200 bg-white py-4 px-6 rounded-md ">
                  <MaterialInfo  />
                  <p className="text-red-500 text-center">{errorGetMaterial}</p>
              </div>
      </div>
      </main>
      </>
    );
   } 
  // check if materialRequisicao.length is empty or null
  else if (materialRequisicao.length === 0) {
    // Show a notification error using the notification manager
    return (
      <>
        <main className="h-full">
          <Navbar toggle={sidebarToggle} />
  
          {/* Main Content */}
          <div className="mainCard">
              <div className="border w-full border-gray-200 bg-white py-4 px-6 rounded-md ">
                  <MaterialInfo  />
                  <p className="text-red-500 text-center">Erro ao Buscar o Material</p>
              </div>
      </div>
      </main>
      </>
    );
  } else {
  // Use the 'data' object as needed in your component
  return (
    <>
      <main className="h-full">
        <Navbar toggle={sidebarToggle} />

        {/* Main Content */}
        <div className="mainCard">
            <div className="border w-full border-gray-200 bg-white py-4 px-6 rounded-md ">
                <MaterialInfo {...materialRequisicao[0]} />
                
            </div>
            {materialRequisicao.length>0 ? <span> <div className="border w-full border-gray-200 bg-white py-4 px-6 rounded-md us-header ">
                <p>Selecione os destinos para onde prentende distribuir o Material: </p>
{/* 
              <div className="inline-grid  grid-cols-4 destino-distritos"> */}

            <div className="inline-flex  ">
             <div>
             <FormControlLabel
                label="Kamavota"
                control={
                  <Checkbox
                    checked={false }
                    indeterminate={false}
                    //onChange={handleChange1}
                  />
                }
              />
              {kamavota}
             </div>
             
            <Spacer x={2} />
            <div>
            <FormControlLabel
                label="Kampfumu"
                control={
                  <Checkbox
                  checked={false }
                  indeterminate={false}
                  />
                }
              />
              {kampfumu}
            </div>
            <Spacer x={2} />
            <div>
            <FormControlLabel
                label="Kamubukwana"
                control={
                  <Checkbox
                  checked={false }
                  indeterminate={false}
                  />
                }
              />
              {kamubukwana}
            </div>
            <Spacer x={2} />
            <div>
            <FormControlLabel
                label="Kamaxakeni"
                control={
                  <Checkbox
                  checked={false }
                  indeterminate={false}
                  />
                }
              />
              {kamaxakeni}
            </div>
            <Spacer x={2} />
           
            </div>
            <div className="inline-flex  ">
            <div>
            <FormControlLabel
                label="Katembe/Kanyaka"
                control={
                  <Checkbox
                  checked={false }
                  indeterminate={false}
                  />
                }
              />
              {katembe}
            </div>
            
            <Spacer x={2} />
            <div>
            <FormControlLabel
                label="Kalhamanculo"
                control={
                  <Checkbox
                  checked={false }
                  indeterminate={false}
                  />
                }
              />
              {nlhamankulu}
            </div>
            <Spacer x={2} />
            <div> 
            <FormControlLabel
                label="Outros Destinos"
                control={
                  <Checkbox
                  checked={false }
                  indeterminate={false}
                  />
                }
              />
              {outrosDestinos}
            </div>
            <Spacer y={2} />
              </div>
                    
            </div>
            <span>US Selecionadas: {selected.length}</span>
            <div className="border w-full border-gray-200 bg-white py-4 px-6 rounded-md ">
            <MaterialReactTable  
                columns={columnNamesUSDistribuicao}
                data={requisicoes}
                initialState={{
                  columnVisibility: { id: false,material: false,requisitante: false ,us:false},
                  density: 'compact',
                  pagination: { pageSize: 20, pageIndex: 0 }

                  }}
                  editingMode="row"
                  enableEditing
                  enableRowSelection
                  onEditingRowSave={handleSaveRow}
           /> <p>&nbsp;</p>   <span className="alert-saldo">Saldo Remanescente: {materialRequisicao[0].qtd_stock -totalQuantidadeReq}</span>
             { loadingRequisicao ? <span className="req-button" >     <Spinner label="Loading..." color="warning" /></span> : null}
               
              {requisicoes.length === 0 ? <span className="req-button"> <Button  disabled variant="contained" size="medium">
                 Enviar Pedido </Button></span> :<span className="req-button">   <Button color="success" variant="contained" size="medium" onClick={handleEnviarRequisicao} >Enviar Pedido </Button></span> 
            }
                 <p>&nbsp;</p>
            </div> </span> : null}

        </div>
      </main>
    </>
  );

  }

}



  }


export default NovaRequisicao;
