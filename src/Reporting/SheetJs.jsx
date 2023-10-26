
import { json } from 'react-router-dom';
import XLSX from 'xlsx';
import { read, utils } from 'xlsx';




  export default  async function exportData(jsonArray)  {
    

    // Load your customized Excel template (replace 'template.xlsx' with your file path)
    // const templateFile = '/Users/asamuel/Documents/template_guia.xlsx';
    const templateFile = 'https://www.dropbox.com/scl/fi/gbellmamfelwpnakkp4tl/template_guia.xlsx?rlkey=3mui16s9n1z2abjwsddtc6hzv&dl=0'
   // const templateWorkbook = XLSX.readFile(templateFile);

   
  try {
    // Replace with the URL of your XLSX file
    const xlsxUrl = 'https://www.dropbox.com/scl/fi/gbellmamfelwpnakkp4tl/template_guia.xlsx?rlkey=3mui16s9n1z2abjwsddtc6hzv&dl=0';

   
    const f = await fetch(xlsxUrl);
    const ab = await f.arrayBuffer();
  
    /* parse */
    const wb = read(ab);


  /* generate array of objects from first worksheet */
  //const ws = wb.Sheets[wb.SheetNames[0]]; // get the first worksheet
  // const data = utils.sheet_to_json(ws); // generate objects

    
    // if (!wb.ok) {
    //   throw new Error('Failed to fetch the XLSX file');
    // }

    //const data = await response.arrayBuffer();
   // const workbook = XLSX.read(data, { type: 'array' });
    // const sheetName = workbook.SheetNames[0];
    // const worksheet = workbook.Sheets[sheetName];
   const templateWorkbook = wb;
    // const excelData = XLSX.utils.sheet_to_json(worksheet);
    // setExcelData(excelData);

    const startRow = 23; // Adjust this based on your template (1-based index)

    // Create a new worksheet and insert data
    const newWorksheet = XLSX.utils.aoa_to_sheet(jsonArray);
    //XLSX.utils.sheet_add_aoa(newWorksheet, [["Cod", "Descricao","Qtd Existente","Area","Armazem","Familia","Prazo"]], { origin: "A1" });

    XLSX.utils.book_append_sheet(templateWorkbook, newWorksheet, 'Sheet1', {
        origin: `B${startRow}`, });

    // Generate a new XLSX file with the customized data
    const outputData = XLSX.write(templateWorkbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([outputData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);

    // Create a link to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exported-data.xlsx';
    a.click();

    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error fetching or processing the XLSX file:', error);
  }

      }


