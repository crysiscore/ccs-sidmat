import React, { Fragment } from 'react'
import ccsLogo from '../img/ccs_logo.png'
import { saveAs } from 'file-saver'
import * as ExcelJS from 'exceljs'
import CCSLOGO from '../img/imageresources.js'

export function createLinesRequisicoesDaGuia (rows) {
  const data = []
  let totallinhaNr = 0
  let totallinhaDC = 0

/*   for (const row in rows) {
      totallinhaNr += rows[row].totalPatients
      totallinhaDC += rows[row].cumunitaryClinic
  } */
  const createRow1 = []

    createRow1.push('Total')
  
  createRow1.push(totallinhaNr)
  createRow1.push(totallinhaDC)

  data.push(createRow1)

  return data
}

export  async function VisualizarGuiSaida(nr_guia, guiaSaida, requisicoesDaGuia)  {

const tableData = [];
// format guiaSaida data to look  fit the table, the first row is the header and
// must have the following format ['DESCRIÇÃO', 'Referencia', 'Quant.', 'A SER ALOCADO NO SECTOR DE :'const header = ['DESCRIÇÃO', 'Referencia', 'Quant.', 'A SER ALOCADO NO SECTOR DE :'];
//tableData.push(header);

requisicoesDaGuia.forEach((item) => {
  const data = [];
  data.push(item.material_descricao);
  data.push(item.condicao);
  data.push(item.quantidade);
  data.push(item.sector);
  tableData.push(data);
});


// Create a new workbook
const workbook = new ExcelJS.Workbook();

workbook.creator = 'Agnaldo Samuel';
workbook.lastModifiedBy = 'CCS';
workbook.created = new Date();
workbook.modified = new Date();

// Force workbook calculation on load
      //workbook.calcProperties.fullCalcOnLoad = true;
      const worksheet = workbook.addWorksheet("Guia Saida");
       const image = workbook.addImage({
        base64: 'data:image/png;base64,' + CCSLOGO,
         extension: 'png',
       });
   /* const image = workbook.addImage({
    filename: '../img/ccs_logo.png', // Replace with the actual path to your image file
    extension: 'png',
  }); */

  // Add the image to a worksheet
// worksheet.addImage(image, {
//   tl: { col: 2, row: 2 }, // Specify the cell where the top left corner of the image should be placed
//   ext: { width: 200, height: 150 }, // Specify the dimensions of the image
// });


      //const image = new Image();
      // image.src = ccsLogo;
        // Get Cells
        const cellCCSLogo = worksheet.getCell('B2');
        const cellGuiaSaidaLabel = worksheet.getCell('D2');
        const cellGuiaSaidaValue = worksheet.getCell('E2');
        const cellProjectoLabel = worksheet.getCell('D3');
        const cellProjectoValue= worksheet.getCell('E3');
        const cellCCS = worksheet.getCell('B7');
        const cellEndereco = worksheet.getCell('B8');
        const cellProvince = worksheet.getCell('B9');
        const cellTelef = worksheet.getCell('B10');
        const cellNomeLabel = worksheet.getCell('D7');
        const cellDestinoLabel = worksheet.getCell('D8');
        const cellMotoristaLabel = worksheet.getCell('D9');
        const cellNomeValue = worksheet.getCell('E7');
        const cellDestinoValue= worksheet.getCell('E8');
        const cellMotoristaValue= worksheet.getCell('E9');
  
        const cellObservacaoLabel = worksheet.getCell('B12');
        const cellObservacaoValue = worksheet.getCell('B13');
        const celldataLabel = worksheet.getCell('D12');
        const celldataValue = worksheet.getCell('E12');
        const cellDataEntregeLabel = worksheet.getCell('D13');
        const cellDataEntregeValue = worksheet.getCell('E13');

        const responsavelSegLabel = worksheet.getCell('B24');
        const responsavelRequisLabel = worksheet.getCell('D24');

        // Get Rows
        const headerRow = worksheet.getRow(15);
  
        //Get Columns
        const colA = worksheet.getColumn('A');
        const colB = worksheet.getColumn('B');
        const colC = worksheet.getColumn('C');
        const colD = worksheet.getColumn('D');
        const colE = worksheet.getColumn('E');

        // Format Table Cells
        // Alignment Format
        cellGuiaSaidaLabel.alignment =
        cellProjectoLabel.alignment =
        cellNomeLabel.alignment =
        cellDestinoLabel.alignment =
        cellMotoristaLabel.alignment =
        cellDataEntregeLabel.alignment =
        celldataLabel.alignment =
        {
            vertical: 'middle',
            horizontal: 'right',
         //   wrapText: true,
          };
        
          cellCCS.alignment =
          cellEndereco.alignment =
            cellProvince.alignment =
            cellTelef.alignment =
            cellObservacaoLabel.alignment =
            {
                vertical: 'middle',
                horizontal: 'left',
            }
          
            cellGuiaSaidaValue.alignment =
            cellProjectoValue.alignment =
            cellNomeValue.alignment =
            cellDestinoValue.alignment =
            cellMotoristaValue.alignment =
            cellDataEntregeValue.alignment =
            celldataValue.alignment =
            cellObservacaoValue.alignment =
            {
                vertical: 'middle',
                horizontal: 'left',
                wrapText: true,
            }
            // merge  cell B13 and B14

            worksheet.mergeCells('B13:B14');


      // Assign Value to Cell
      cellGuiaSaidaLabel.value="Guia de Saida N*";
      cellGuiaSaidaValue.value=nr_guia;
      //cellProjectoLabel.value=guiaSaida[0].projecto;
      cellProjectoLabel.value="Projecto";
      cellCCS.value="Centro de Colaboração em Saúde";
      cellEndereco.value="Av. Damiao de Gois nº: 370 R/C - Maputo";
      cellProvince.value="Cidade de Maputo";
      cellTelef.value="Tel.: +258 21 320 435,  Fax.:+258 21 320 437";
      cellObservacaoLabel.value="Observação:";
      cellObservacaoValue.value=guiaSaida.observacao;
      celldataLabel.value="Data:";
      cellDestinoLabel.value="Destino:";
      cellDestinoValue.value=guiaSaida.unidade_sanitaria;
      cellDataEntregeLabel.value="Data de Entrega:";
      cellDataEntregeValue.value=guiaSaida.data_entrega;
      celldataValue.value=guiaSaida.data_guia;
      cellMotoristaValue.value=guiaSaida.motorista;
      cellMotoristaLabel.value="Motorista:";
      
      const cellDecricaoLabel = worksheet.getCell('B15');
      const cellReferenciaLabel = worksheet.getCell('C15');
      const cellQuantidadeLabel = worksheet.getCell('D15');
      const cellAserAlocadoLabel = worksheet.getCell('E15');

      cellDecricaoLabel.alignment =
      cellReferenciaLabel.alignment =
      cellQuantidadeLabel.alignment =
      cellAserAlocadoLabel.alignment =
      {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
       };
        // add height size to Columns
      // add width size to Columns
      colA.width = 5;
      colB.width = 40;
      colC.width = 20;
      colD.width = 25;
      colE.width = 35;



      // make all Label cells bold
      cellGuiaSaidaLabel.font =
      cellProjectoLabel.font =
      cellNomeLabel.font =
      cellDestinoLabel.font =
      cellMotoristaLabel.font =
      cellDataEntregeLabel.font =
      celldataLabel.font =
      cellObservacaoLabel.font =
      {
        name: 'Arial',
        color: { argb: '000000' },
        family: 2,
        size: 11,
        italic: false,
        bold: true
      }




      // Add Image
      worksheet.addImage(image, "B2:B5" );

      // Cereate Table
      worksheet.addTable({
        name: "GUIA DE SAIDA",
        ref: 'B15',
        headerRow: true,
        totalsRow: false,
        style: {
          showRowStripes: false,
        },
        columns: [
          { name: 'DESCRIÇÃO', totalsRowLabel: 'Totals:', filterButton: false },
          { name: 'Referencia', totalsRowFunction: 'none', filterButton: false },
          { name: 'Quant.', totalsRowFunction: 'none', filterButton: false },
          { name: 'A SER ALOCADO NO SECTOR DE :', totalsRowFunction: 'none', filterButton: false },
         
        ],
        rows: tableData,
      });

// Format all data cells
const lastRowNum =worksheet.lastRow.number !== undefined ? worksheet.lastRow.number : 0
const lastTableRowNum = lastRowNum

// Loop through all table's row
for (let i = 15; i <= lastTableRowNum; i++) {
const row = worksheet.getRow(i)

// Now loop through every row's cell and finally set alignment
row.eachCell({ includeEmpty: true }, (cell) => {
/*   cell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  } */
  cell.alignment = {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: true
  }
  if (i === 15) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1fa37b' },
      bgColor: { argb: '1fa37b' }
    }
    cell.font = {
      name: 'Arial',
      color: { argb: 'FFFFFFFF' },
      family: 2,
      size: 11,
      italic: false,
      bold: true
    }
  }
})
}

//remove gridlines from worksheet
worksheet.views = [
  {
    showGridLines: false,
  }
];

      console.log(workbook);
      const buffer =  await workbook.xlsx.writeBuffer();

     const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const fileExtension = '.xlsx';

    const blob = new Blob([buffer], { type: fileType });

    saveAs(blob, "Guia de saida {" + nr_guia+ "}"+ fileExtension);

      // Generate a new XLSX file with the customized data
   /*  const outputData = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    }); */

    // const blob = new Blob([outputData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    //const url = URL.createObjectURL(blob);

    // Create a link to trigger the download
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = 'guia-sajda.xlsx';
    // a.click();

    // URL.revokeObjectURL(url);
      
}

