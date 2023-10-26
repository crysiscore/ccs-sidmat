import React, { Fragment } from 'react'
import ccsLogo from '../img/ccs_logo.png'
import { saveAs } from 'file-saver'
import * as ExcelJS from 'exceljs'


export  async function createDownloadUploadTemplate()  {

const tableData = [];

// insert  5 empty rows in the table tableData
for (let i = 0; i < 100; i++) {
    tableData.push([]);
    }



// Create a new workbook
const workbook = new ExcelJS.Workbook();

workbook.creator = 'Agnaldo Samuel';
workbook.lastModifiedBy = 'CCS';
workbook.created = new Date();
workbook.modified = new Date();


      const worksheet = workbook.addWorksheet("Materiais");

        // Get Cells
      /*   const cellDescricaoLabel= worksheet.getCell('B3');
        const cellCodLabel = worksheet.getCell('B4');
        const cellQuantidadeLabel = worksheet.getCell('D3');
        const cellArmazemLabel = worksheet.getCell('E3');
        const cellFamiliaLabel = worksheet.getCell('F8');
        const cellPrazoLabel = worksheet.getCell('G3');
        const cellAreaLabel = worksheet.getCell('H3');
        const cellProjectoLabel= worksheet.getCell('I3'); */
        
        // Get Rows
        const headerRow = worksheet.getRow(3);
  
        //Get Columns
        const colA = worksheet.getColumn('A');
        const colB = worksheet.getColumn('B');
        const colC = worksheet.getColumn('C');
        const colD = worksheet.getColumn('D');
        const colE = worksheet.getColumn('E');
        const colF = worksheet.getColumn('F');
        const colG = worksheet.getColumn('G');
        const colH = worksheet.getColumn('H');
        const colI = worksheet.getColumn('I');

        // Format Table Cells
        // Alignment Format
       /*  cellDescricaoLabel.alignment =
        cellCodLabel.alignment =
        cellQuantidadeLabel.alignment =
        cellArmazemLabel.alignment =
        cellFamiliaLabel.alignment =
        cellPrazoLabel.alignment =
        cellAreaLabel.alignment =
        cellProjectoLabel.alignment =
        {
            vertical: 'middle',
            horizontal: 'center',
         //   wrapText: true,
          };
        


      // Assign Value to Cell
        cellDescricaoLabel.value = "Descricao";
        cellCodLabel.value = "Cod";
        cellQuantidadeLabel.value = "Quantidade";
        cellArmazemLabel.value = "Armazem";
        cellFamiliaLabel.value = "Familia";
        cellPrazoLabel.value = "Prazo";
        cellAreaLabel.value = "Area";
        cellProjectoLabel.value = "Projecto";
       */


        // add height size to Columns
      // add width size to Columns
      colA.width = 5;
      colB.width = 40;
      colC.width = 10;
      colD.width = 15;
      colE.width = 10;
      colF.width = 15;
        colG.width = 10;
        colH.width = 10;
        colI.width = 15;



      // make all Label cells bold
     /*  cellDescricaoLabel.font = 
      cellAreaLabel.font =
        cellCodLabel.font =
        cellQuantidadeLabel.font =
        cellArmazemLabel.font =
        cellFamiliaLabel.font =
        cellPrazoLabel.font =
        cellProjectoLabel.font =
        {
          name: 'Arial',
          color: { argb: '000000' },
          family: 2,
          size: 11,
          italic: false,
          bold: true
        }
     */

     

      // Cereate Table
      worksheet.addTable({
        name: "Material",
        ref: 'B3',
        headerRow: true,
        totalsRow: false,
        style: {
          showRowStripes: true,
        },
        columns: [
            { name: 'Descricao', filterButton: true },
            { name: 'Cod', filterButton: true },
            { name: 'Quantidade', filterButton: true },
            { name: 'Armazem', filterButton: true },
            { name: 'Familia', filterButton: true },
            { name: 'Prazo', filterButton: true },
            { name: 'Area', filterButton: true },
            { name: 'Projecto', filterButton: true },
            ],

        rows: tableData,
      });


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

    saveAs(blob, "template_importar_material"+ fileExtension);

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

