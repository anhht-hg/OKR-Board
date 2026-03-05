import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

export interface StrategicData {
  objectiveIndex: number;
  objectiveTitle: string;
  strategicPillar: string | null;
  deadline: string | null;
  pic: string | null;
  scope: string | null;
  krs: {
    code: string;
    title: string;
    description: string | null;
    successMetric: string | null;
    targetValue: string | null;
    measureFormula: string | null;
    corporateKRLinkage: string | null;
    owner: string | null;
    deadline: string | null;
    notes: string | null;
  }[];
}

function cleanText(text: string): string {
  return text
    .replace(/\u200b/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function getCellText($: cheerio.CheerioAPI, cell: cheerio.Element): string {
  const $cell = $(cell);
  const inner = $cell.find('.softmerge-inner');
  const raw = inner.length ? inner.text() : $cell.text();
  return cleanText(raw);
}

function getRowCells($: cheerio.CheerioAPI, row: cheerio.Element): string[] {
  return $(row).find('td').toArray().map(c => getCellText($, c));
}

export function parseFile2(): StrategicData[] {
  const filePath = path.join(__dirname, 'raw', 'OBject View Only.html');
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html);

  const results: StrategicData[] = [];
  const rows = $('table tr').toArray();

  let i = 0;
  while (i < rows.length) {
    const cells = getRowCells($, rows[i]);

    // Detect "OBJECTIVE N" header by checking first non-empty cell
    const firstCell = cells.find(c => c.trim() !== '') || '';
    const objMatch = firstCell.match(/^OBJECTIVE\s+(\d+)$/);

    if (!objMatch) { i++; continue; }

    const objectiveIndex = parseInt(objMatch[1]);
    let objectiveTitle = '';
    let strategicPillar: string | null = null;
    let objDeadline: string | null = null;
    let pic: string | null = null;
    let scope: string | null = null;
    const krs: StrategicData['krs'] = [];

    i++;

    while (i < rows.length) {
      const subCells = getRowCells($, rows[i]);
      const subFirst = subCells.find(c => c.trim() !== '') || '';

      // Next OBJECTIVE marker = end of this section
      if (/^OBJECTIVE\s+\d+$/.test(subFirst)) break;

      // "Trụ cột chiến lược" is the header row for the objective metadata section
      if (subCells.some(c => c === 'Trụ cột chiến lược')) {
        // Next row is the actual data
        i++;
        if (i < rows.length) {
          const dataCells = getRowCells($, rows[i]);
          // Structure: [indent, title(colspan), strategicPillar, deadline, pic, scope, ...]
          // Find non-empty cell for title (it comes after possibly empty indent)
          let titleIdx = 0;
          while (titleIdx < dataCells.length && !dataCells[titleIdx]) titleIdx++;
          objectiveTitle = dataCells[titleIdx] || '';
          strategicPillar = dataCells[titleIdx + 1] || null;
          objDeadline = dataCells[titleIdx + 2] || null;
          pic = dataCells[titleIdx + 3] || null;
          scope = dataCells[titleIdx + 4] || null;
        }
        i++;
        continue;
      }

      // "KRs" column header row
      if (subCells.some(c => c === 'KRs')) {
        i++;
        continue;
      }

      // "KEY RESULTS" section label
      if (subCells.some(c => c.includes('KEY RESULTS'))) {
        i++;
        continue;
      }

      // KR data rows: look for a cell matching "KR1", "KR2", etc.
      let krCode: string | null = null;
      let krCodeIdx = -1;
      for (let ci = 0; ci < subCells.length; ci++) {
        if (/^KR\s*\d+$/.test(subCells[ci])) {
          krCode = subCells[ci].replace(/\s+/, '');
          krCodeIdx = ci;
          break;
        }
      }

      if (krCode && krCodeIdx >= 0) {
        // notes: the cell before KR code (if any)
        const notes = krCodeIdx > 0 ? subCells[krCodeIdx - 1] : null;
        const title = subCells[krCodeIdx + 1] || '';
        const successMetric = subCells[krCodeIdx + 2] || null;
        const targetValue = subCells[krCodeIdx + 3] || null;
        const measureFormula = subCells[krCodeIdx + 4] || null;
        const corporateKRLinkage = subCells[krCodeIdx + 5] || null;
        const owner = subCells[krCodeIdx + 6] || null;
        const krDeadline = subCells[krCodeIdx + 7] || null;

        krs.push({
          code: krCode,
          title,
          description: null,
          successMetric: successMetric || null,
          targetValue: targetValue || null,
          measureFormula: measureFormula || null,
          corporateKRLinkage: corporateKRLinkage || null,
          owner: owner || null,
          deadline: krDeadline || null,
          notes: notes || null,
        });
      }

      i++;
    }

    results.push({
      objectiveIndex,
      objectiveTitle,
      strategicPillar: strategicPillar || null,
      deadline: objDeadline || null,
      pic: pic || null,
      scope: scope || null,
      krs,
    });
  }

  return results;
}
