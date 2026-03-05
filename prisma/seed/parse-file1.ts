import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

export interface ParsedItem {
  code: string | null;
  title: string;
  type: string;
  sortOrder: number;
  project: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  owner: string | null;
  stakeholder: string | null;
  chotFlag: string | null;
  isOptional: boolean;
  indentLevel: number; // 0=Objective, 1=SuccessFactor/KR, 2=Feature, 3=UC/Adoption/Impact
}

function cleanText(text: string): string {
  return text
    .replace(/\u200b/g, '') // zero-width space
    .replace(/\u00a0/g, ' ') // non-breaking space
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function parseDateVN(dateStr: string): Date | null {
  if (!dateStr || !dateStr.match(/\d/)) return null;
  // Format: DD/MM/YYYY
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const [, d, m, y] = match;
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
}

function getCellText($: cheerio.CheerioAPI, cell: cheerio.Element): string {
  const $cell = $(cell);
  // Handle softmerge inner div
  const inner = $cell.find('.softmerge-inner');
  if (inner.length) return cleanText(inner.text());
  // Handle span for badges
  const span = $cell.find('span');
  if (span.length) return cleanText(span.text());
  return cleanText($cell.text());
}

export function parseFile1(): ParsedItem[] {
  const filePath = path.join(__dirname, 'raw', 'Mục Tiêu Và Kế Hoạch Tính năng.html');
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html);

  const items: ParsedItem[] = [];
  let sortOrder = 0;

  // Skip header rows (rows 0-4 are col headers, title, empty rows)
  const rows = $('table tr').toArray();

  // Skip first 5 rows (header row + 3 blank/title rows + column header row)
  const dataRows = rows.slice(5);

  for (const row of dataRows) {
    const cells = $(row).find('td').toArray();
    if (cells.length < 5) continue;

    // Count leading s0 (empty indent) cells
    let indentLevel = 0;
    for (const cell of cells) {
      const cls = $(cell).attr('class') || '';
      const text = cleanText($(cell).text());
      if (cls.includes('s0') && !text) {
        indentLevel++;
      } else {
        break;
      }
    }

    // Get the type cell - it's the 5th actual column (after OKR colspan=4)
    // After indentLevel leading s0 cells, we have content cells, then type cell
    // The type is explicitly in a cell with a span containing the type name
    let typeText = '';
    let titleText = '';
    let projectText = '';
    let statusText = '';
    let startDateText = '';
    let endDateText = '';
    let ownerText = '';
    let stakeholderText = '';
    let chotText = '';

    // Find the type by looking at all cells for known type keywords
    const allCellTexts = cells.map(c => getCellText($, c));

    const knownTypes = ['Objectives', 'Success Factor', 'Key Result', 'Feature', 'User Capability', 'Adoption', 'Impact'];

    // Type is always in a specific column - find it by checking span content
    let typeColIdx = -1;
    for (let ci = 0; ci < cells.length; ci++) {
      const $cell = $(cells[ci]);
      const span = $cell.find('span');
      const spanText = span.length ? cleanText(span.text()) : cleanText($cell.text());
      if (knownTypes.includes(spanText)) {
        typeColIdx = ci;
        typeText = spanText;
        break;
      }
    }

    if (typeColIdx < 0) continue; // Skip non-data rows

    // Map type string to our internal type name
    const typeMap: Record<string, string> = {
      'Objectives': 'Objective',
      'Success Factor': 'SuccessFactor',
      'Key Result': 'KeyResult',
      'Feature': 'Feature',
      'User Capability': 'UserCapability',
      'Adoption': 'Adoption',
      'Impact': 'Impact',
    };
    const type = typeMap[typeText];
    if (!type) continue;

    // Columns after the type col: project, status, startDate, endDate, owner, stakeholder, chot
    const afterType = cells.slice(typeColIdx + 1);
    projectText = getCellText($, afterType[0]);
    statusText = getCellText($, afterType[1]);
    startDateText = getCellText($, afterType[2]);
    endDateText = getCellText($, afterType[3]);
    ownerText = getCellText($, afterType[4]);
    stakeholderText = afterType[5] ? getCellText($, afterType[5]) : '';
    chotText = afterType[6] ? getCellText($, afterType[6]) : '';

    // Title: look at cells between indent and type col
    const contentCells = cells.slice(indentLevel, typeColIdx);
    for (const cc of contentCells) {
      const t = getCellText($, cc);
      if (t) { titleText = t; break; }
    }

    if (!titleText) continue;

    // Extract code from title (e.g., "01 Xây dựng...", "KR1 ...", "FE-1 ...")
    let code: string | null = null;
    const codeMatch = titleText.match(/^([A-Z\-0-9]+[\d]+)\s/i);
    if (codeMatch) code = codeMatch[1];

    // Determine status
    const validStatuses = ['Chưa bắt đầu', 'Đang triển khai', 'Hoàn thành'];
    const status = validStatuses.includes(statusText) ? statusText : 'Chưa bắt đầu';

    items.push({
      code,
      title: titleText,
      type,
      sortOrder: sortOrder++,
      project: projectText || null,
      status,
      startDate: parseDateVN(startDateText),
      endDate: parseDateVN(endDateText),
      owner: ownerText || null,
      stakeholder: stakeholderText || null,
      chotFlag: chotText || null,
      isOptional: false,
      indentLevel,
    });
  }

  return items;
}
