/**
 * ═══════════════════════════════════════════════════
 * MODULE: excel-handler.js
 * PURPOSE: Save visitor data to office_visitors.xlsx
 * ═══════════════════════════════════════════════════
 *
 * INTEGRATION POINT: Called by server.js POST /api/save-visitor
 * Does NOT modify any existing HTML/CSS/JS code.
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Output file path — saved in project root
const EXCEL_FILE = path.join(__dirname, '..', 'office_visitors.xlsx');

// Column headers for the Excel file
const HEADERS = ['Name', 'Email', 'Phone', 'Question', 'Timestamp'];

/**
 * Ensures the Excel file exists with the correct header row.
 * If the file doesn't exist, creates it automatically.
 * @returns {object} XLSX workbook
 */
function ensureWorkbook() {
    if (fs.existsSync(EXCEL_FILE)) {
        try {
            return XLSX.readFile(EXCEL_FILE);
        } catch (err) {
            console.error('[excel-handler] Error reading existing file, recreating:', err.message);
        }
    }

    // Create new workbook with headers
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([HEADERS]);

    // Style the header row width
    ws['!cols'] = HEADERS.map(() => ({ wch: 25 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, EXCEL_FILE);
    console.log('[excel-handler] Created new office_visitors.xlsx with updated schema');
    return wb;
}

/**
 * Saves a visitor record to the Excel file.
 * @param {object} data - Lead data object
 * @param {string} data.name - Full name
 * @param {string} data.email - Email address
 * @param {string} [data.phone] - Phone number
 * @param {string} [data.query] - Question
 * @returns {object} { success: boolean, message: string, rowNumber: number }
 */
function saveVisitor(data) {
    if (!data.name || !data.email) {
        throw new Error('Name and Email are required');
    }

    const name = String(data.name).trim();
    const email = String(data.email).trim().toLowerCase();
    const phone = String(data.phone || '').trim();
    const question = String(data.query || '').trim();
    const timestamp = new Date().toLocaleString('en-IN');

    const newRow = [name, email, phone, question, timestamp];

    try {
        const wb = ensureWorkbook();
        const ws = wb.Sheets['Leads'];

        const existingData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const nextRow = existingData.length + 1;

        XLSX.utils.sheet_add_aoa(ws, [newRow], { origin: -1 });
        XLSX.writeFile(wb, EXCEL_FILE);

        console.log(`[excel-handler] Saved Lead: ${name} at row ${nextRow}`);
        return { success: true, message: `Lead saved successfully`, rowNumber: nextRow };
    } catch (err) {
        console.error('[excel-handler] Failed to save visitor:', err.message);
        throw new Error(`Failed to save visitor data: ${err.message}`);
    }
}

/**
 * Reads all visitors from the Excel file.
 * @returns {Array} Array of visitor objects
 */
function getAllVisitors() {
    try {
        const wb = ensureWorkbook();
        // Sheet is named 'Leads' (was incorrectly 'Visitors')
        const ws = wb.Sheets['Leads'];
        if (!ws) return [];
        const data = XLSX.utils.sheet_to_json(ws);
        return data;
    } catch (err) {
        console.error('[excel-handler] Failed to read visitors:', err.message);
        return [];
    }
}

module.exports = { saveVisitor, getAllVisitors, EXCEL_FILE };
