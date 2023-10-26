import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';

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
  
  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
      border: 0,
    },
  }));
const MaterialGuia = ({ rows  }) => {

    const materiais = rows;
    // add  condicao and sector properties to each material
    materiais.forEach((material) => {
        material.condicao = "Bom";
    });

    return(
      <ThemeProvider theme={theme}>
        <TableContainer component={Paper}>
        <Table sx={{ minWidth: 350 }} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <StyledTableCell align="center"><b>DESCRIÇÃO</b> </StyledTableCell>
              <StyledTableCell align="center"><b>QUANTIDADE</b></StyledTableCell>
              <StyledTableCell align="center"><b>CONDIÇÃO DA MERCADORIA</b></StyledTableCell>
              <StyledTableCell align="center"><b>A SER ALOCADO NO SECTOR DE :</b></StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materiais.map((row) => (
              <StyledTableRow
                key={row.requisicao_id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
        
                <StyledTableCell align="left">{row.material_descricao}</StyledTableCell>
                <StyledTableCell align="center">{row.quantidade}</StyledTableCell>
                <StyledTableCell align="center">{row.condicao}</StyledTableCell>
                <StyledTableCell align="left">{row.unidade_sanitaria } &nbsp; / &nbsp; {"{"} {row.area} {"}"} <br>
              </br>  {"P. Focal: {"+ row.pf_nome + "/" + row.pf_contacto +"}"}</StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </ThemeProvider>
    );

   
};

export default MaterialGuia;
