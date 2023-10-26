import {React} from "react";
import { NotificationManager } from "react-notifications";
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function RequisicoesPendentesAreaScrolledCard({ data, ...props }) {
  const navigate = useNavigate();

const handleClickRequisicoesUnidadeSanitaria = (data) => {
  // Show a notification of the area clicked
  NotificationManager.info(`Requisições da ${data.unidade_sanitaria} `);
  // Redirect to requisicoesByArea page
  navigate('/guiaPreview', {
    state: { data },
    replace: true,
  });

};


/* 
    // Define the data you want to insert into the template
    const dataToInsert = [
      ['John Doe', 30, 'Novo','john@example.com'],
      ['Jane Smith', 25, 'Novo', 'jane@example.com'],
      // Add more rows as needed
    ];
    // Starting cell where you want to insert the data
    const startCell = XLSX.utils.decode_cell('B23');
 // create workbook and worksheet
 const workbook = XLSX.utils.book_new();
 const worksheet = XLSX.utils.json_to_sheet(dataToInsert);
 XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
 // customize header names
 XLSX.utils.sheet_add_aoa(worksheet, [
   ["Name", "Age", "Category", "Email"],
 ]);
 XLSX.writeFile(workbook, "Exployes2023.xlsx", { compression: true }); 
  
}; */

 // Function to handle data insertion
 const insertDataToTemplate = async () => {
  try {
    // Load the Excel template
    const templateFile = '/home/agnaldo/Downloads/Template_Guia_SAIDA.xlsx';
    const reader = new FileReader();

    const workbook = XLSX.readFile(templateFile);

    // Assuming you have a single sheet in your template, get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Define the data you want to insert into the template
    const dataToInsert = [
      ['John Doe', 30, 'Novo','john@example.com'],
      ['Jane Smith', 25, 'Novo', 'jane@example.com'],
      // Add more rows as needed
    ];

    // Starting cell where you want to insert the data
    const startCell = XLSX.utils.decode_cell('B23');

    // Insert data into the worksheet
    dataToInsert.forEach((row, rowIndex) => {
      row.forEach((cellValue, colIndex) => {
        const cellAddress = {
          c: startCell.c + colIndex,
          r: startCell.r + rowIndex,
        };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        worksheet[cellRef] = { t: 's', v: cellValue };
      });
    });

    // Generate a new workbook with the updated data
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, worksheet, sheetName);

    // Save the updated Excel file
    const newFile = XLSX.write(newWorkbook, { type: 'array' });
    saveAs(new Blob([newFile], { type: 'application/octet-stream' }), '/home/agnaldo/Downloads/newWorkbook.xlsx');
  } catch (error) {
    NotificationManager.info('Criando Guia de Saida...' + error);
  }
};

     return (
        <div onClick={(e) => handleClickRequisicoesUnidadeSanitaria(data)} className={`scrolledCard ${data.color} text-slate-50 flex flex-col`}>
          <h1 className="pb-3 font-semibold">{data.unidade_sanitaria}</h1>

          {data.total_materiais > 1 ? <div className="text-medium">&nbsp;{data.total_materiais} Materiais Solicitados </div> : <div className="text-medium">&nbsp;{data.total_materiais} Material Solicitado </div> }
          <div className="flex flex-row justify-between items-center gap-3">
            <span className="text-[0.7rem] font-semibold">&nbsp;&nbsp;&nbsp;</span>
            <span className="text-xs px-2 py-1 rounded-full bg-white">
              {data.total_materiais} 
            </span>
          </div>
        </div>
      ); 
    }
export default RequisicoesPendentesAreaScrolledCard;