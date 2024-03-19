import ExcelJS from 'exceljs';

export const getTests = async c => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('src/forms/shs_sf_10.xlsx');

    const worksheet = workbook.getWorksheet('FRONT');
    const lastNameCell = worksheet.getCell('F8');

    lastNameCell.value = 'Salili';

    // Set appropriate response headers for Excel download
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename=report.xlsx`);

    const buffer = await workbook.xlsx.writeBuffer();

    return c.body(buffer);
}