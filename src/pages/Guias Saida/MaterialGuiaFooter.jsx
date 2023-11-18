import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';


  
const MaterialGuiaFooter = ({ guiaSaida }) => {

    return(
      <div>


      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 350 }} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
            <TableCell align="right">           <div>
           <p><br></br><br></br></p>
            </div>  
    </TableCell>
              <TableCell align="right">{"           "}</TableCell>
                <TableCell align="right">{"           "}</TableCell>
                <TableCell align="center">{"           "}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
              <TableRow >
        
                <TableCell align="left"> <b>Mercadoria recebida e inspencionada por: </b></TableCell>
                <TableCell align="center">{"           "}</TableCell>
                <TableCell align="center">{"           "}</TableCell>
                <TableCell align="left"><b>Mercadoria Entregue por:</b></TableCell>
              </TableRow>
              <TableRow >
        
                <TableCell align="left">{"           "}</TableCell>
                <TableCell align="center">{"           "}</TableCell>
                <TableCell align="center">{"           "}</TableCell>
                <TableCell align="left"> <b>CCS MAPUTO  </b>       </TableCell>
              </TableRow>
              <TableRow >
        
                <TableCell align = "left">Data:</TableCell>
                <TableCell align = "center">{"           "}</TableCell>
                <TableCell align = "center"> </TableCell>
                <TableCell align = "left">	Assinatura (Legível)</TableCell>
              </TableRow>
              
              <TableRow  >
        
                <TableCell align="left">    <div>
           <p><br></br></p>
            </div>  </TableCell>
                <TableCell align="center">{"           "}</TableCell>
                <TableCell align="center">{"           "}</TableCell>
                <TableCell align="center">{"           "}	</TableCell>
              </TableRow>
          </TableBody>
        </Table>
      </TableContainer> 

      </div>
    );

   
};

export default MaterialGuiaFooter;
