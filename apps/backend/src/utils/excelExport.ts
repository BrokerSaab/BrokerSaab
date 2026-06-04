import ExcelJS from 'exceljs';
import { Response } from 'express';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export async function exportToExcel(
  res: Response,
  filename: string,
  sheetName: string,
  columns: ExcelColumn[],
  rows: Record<string, any>[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BrokerSaab Admin';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ ...c, width: c.width ?? 20 }));

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FF071527' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD4AF37' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 22;

  rows.forEach((row) => sheet.addRow(row));

  // Zebra stripe data rows
  for (let i = 2; i <= rows.length + 1; i++) {
    const dataRow = sheet.getRow(i);
    dataRow.alignment = { vertical: 'middle' };
    if (i % 2 === 0) {
      dataRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8F4E3' },
      };
    }
  }

  const safeFilename = `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

  await workbook.xlsx.write(res);
  res.end();
}
