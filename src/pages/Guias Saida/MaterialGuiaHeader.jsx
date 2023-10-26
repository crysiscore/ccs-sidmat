import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { NoMeals } from '@mui/icons-material';
import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';


let theme = createTheme({
  palette: {
    primary: {
      main: '#8a8686',
    },
    secondary: {
      main: '#edf2ff',
    },
    green : {
      main: '#4caf50',
  }
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
  
  
  const StyledTableCellSuccess = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor:  theme.palette.green.main,
      color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14,
    },
  }));

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
      //backgroundColor: theme.palette.action.hover,
      // make a green background for the rows with the status "Finalizada"
      backgroundColor: theme.palette.success.light,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
      border: 0,
    },
  }));
  const StyledTableCellWithBorder = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14,
      border: 1,
    },
  }));
  
const MaterialGuiaHeader = ( props) => {

  // get current date
  const today = new Date();
  // get current date in format dd/mm/yyyy
  const current_date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
  
  const [nrGuiaValue, setNRGuiaValue] = useState('');
  //setNRGuiaValue(props.nr_guia);
  let nrGuiaRef = useRef(nrGuiaValue);

  // Update the component value when the nr_guia prop changes
  useEffect(() => {
    setNRGuiaValue(`${props.nr_guia}`);
  }, [props.nr_guia]);


  // Update the component value when the nr_guia prop changes
  useEffect(() => {
    nrGuiaRef.current = nrGuiaValue;
  }
  , [nrGuiaValue]);


    return(

      <div>
  <ThemeProvider theme={theme}>
        <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>
              < img src="https://i.ibb.co/kH561Tc/ccs-logo.png" 
                alt="Logo-CCS"
                border={0}
                style={{ width: 300, height: 100 }}></img>
            </TableCell>
            <TableCell align="left">
            <b>
            <font face="Calibri" size={3}>
              CCS - Centro de Colaboração em Saúde
              <br />
              Av. Damiao de Gois nº: 370 R/C - Maputo
              <br />
              Tel.: +258 21 320 435, Fax.:+258 21 320 437
              <br />
              Moçambique
            </font>
          </b>

            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
            <TableRow
            >
              
              <TableCell align="right"></TableCell>
              <TableCell align="right"></TableCell>

            </TableRow>
        </TableBody>
      </Table>
    </TableContainer>

        <TableContainer component={Paper}>
        <Table sx={{ minWidth: 350 }} size="small" aria-label="a dense table">
          <TableHead>
            {/*  make a green table row for guia with data_entrega*/}
            {props.data_entrega? <TableRow>
              <StyledTableCellSuccess align="center">{"           "} </StyledTableCellSuccess>
              <StyledTableCellSuccess align="center">{ props.nr_guia? "GUIA ENTREGA : {" + props.nr_guia+"}" :  "GUIA ENTREGA"  }</StyledTableCellSuccess> 
              <StyledTableCellSuccess align="center">{"           "}</StyledTableCellSuccess>
              <StyledTableCellSuccess align="center">{"           "}</StyledTableCellSuccess>
            </TableRow>

            :
            <TableRow>
              <StyledTableCell align="center">{"           "} </StyledTableCell>
              <StyledTableCell align="center">{ props.nr_guia? "GUIA ENTREGA : {" + props.nr_guia+"}" :  "GUIA ENTREGA"  }</StyledTableCell> 
              <StyledTableCell align="center">{"           "}</StyledTableCell>
              <StyledTableCell align="center">{"           "}</StyledTableCell>
            </TableRow>
            }
          </TableHead>
          <TableBody>
              <TableRow
                key={props.user}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
        
                <TableCell align="left"> <b>Mercadoria despachada por: </b></TableCell>
                <TableCell align="center">{"           "}</TableCell>
                <TableCell align="center"><b> Guia de Entrega #: </b>&nbsp;</TableCell>
                <TableCell align="left"> {nrGuiaValue} </TableCell>
              </TableRow>
              <TableRow
                key={props.user}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
        
                <TableCell align="left">  {props.user}</TableCell>
                <TableCell align="center">{"           "}</TableCell>
                <TableCell align="center">{"           "}</TableCell>
                <TableCell align="center">{"           "}</TableCell>
              </TableRow>
              <TableRow
                key={props.user}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
        
                <TableCell align = "left">Centro de Colaboração em Saúde</TableCell>
                <TableCell align = "center">{"           "}</TableCell>
                <TableCell align = "center"> { props.data_entrega? <b style={{ color: '#4caf50' }}>Data de entrega:</b> : <b>Data de entrega:</b> }</TableCell>
                <TableCell align = "left">	 <b style={{ color: '#4caf50' }}>{props.data_entrega}{"           "}</b></TableCell>
              </TableRow>
              <TableRow
                key={props.user}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
        
                <TableCell align="left">Maputo</TableCell>
                <TableCell align="center">{"           "}</TableCell>
                <TableCell align="center">{"           "}</TableCell>
                <TableCell align="center">{"           "}	</TableCell>
              </TableRow>
              <TableRow
                key={props.user}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
        
                <TableCell align="left"><b>Assinatura e data:</b></TableCell>
                <TableCell align="center"> {"           "}</TableCell>
                <TableCell align="center"> &nbsp;  &nbsp;  &nbsp;  &nbsp;  <b>{"Segurança:"}</b> </TableCell>
                <TableCell align="center"> {"           "}	</TableCell>
              </TableRow>
              <TableRow
                key={props.user}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
        
                <TableCell align="left">  {"           "}</TableCell>
                <TableCell align="center">{"           "}</TableCell>
                <TableCell align="center">{"           "}</TableCell>
                <TableCell align="center">{"           "}	</TableCell>
              </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
   
      </ThemeProvider>
      </div>
    );

   
};

export default MaterialGuiaHeader;
