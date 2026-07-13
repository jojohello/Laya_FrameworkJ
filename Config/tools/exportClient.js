/**
 * Client-side config export tool.
 *
 * Source of truth: Config/csv/*.csv
 * Output:
 * - Config/generated/json/client/<table-name>.json
 * - Client/LayaProject/assets/config/<table-name>.json
 * - Client/LayaProject/assets/config/config-manifest.json
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
    csvDir: path.join(__dirname, '../csv'),
    jsonOutputDir: path.join(__dirname, '../generated/json/client'),
    clientConfigDir: path.join(__dirname, '../../Client/LayaProject/assets/config'),
};

function normalizeTableFileName(tableName) {
    return tableName;
}

function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
    const lines = content.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 5) {
        throw new Error(`CSV format error, expected 4 header rows and at least 1 data row: ${filePath}`);
    }

    const titleRow = parseCSVLine(lines[0]);
    const typeRow = parseCSVLine(lines[1]);
    const descriptionRow = parseCSVLine(lines[2]);
    const usedSizeRow = parseCSVLine(lines[3]);

    if (titleRow.length !== typeRow.length ||
        titleRow.length !== descriptionRow.length ||
        titleRow.length !== usedSizeRow.length) {
        throw new Error(`CSV header column count mismatch: ${filePath}`);
    }

    const fields = [];
    for (let i = 0; i < titleRow.length; i++) {
        const usedSize = usedSizeRow[i].trim().toLowerCase();
        if (usedSize === 'c' || usedSize === 'cs') {
            fields.push({
                title: titleRow[i].trim(),
                type: typeRow[i].trim().toLowerCase(),
                description: descriptionRow[i].trim(),
                usedSize,
                index: i,
            });
        }
    }

    const dataRows = [];
    for (let i = 4; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('//') || line.startsWith('#')) {
            continue;
        }

        const values = parseCSVLine(line);
        const rowData = {};

        fields.forEach(field => {
            const value = values[field.index] || '';
            rowData[field.title] = convertValue(value.trim(), field.type);
        });

        dataRows.push(rowData);
    }

    return { fields, dataRows };
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const next = line[i + 1];

        if (char === '"' && inQuotes && next === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

function convertValue(value, type) {
    if (!value) {
        switch (type) {
            case 'int': return 0;
            case 'float': return 0;
            case 'bool': return false;
            case 'str': return '';
            default: return value;
        }
    }

    switch (type) {
        case 'int': {
            const parsed = Number.parseInt(value, 10);
            return Number.isNaN(parsed) ? 0 : parsed;
        }
        case 'float': {
            const parsed = Number.parseFloat(value);
            return Number.isNaN(parsed) ? 0 : parsed;
        }
        case 'bool':
            return value.toLowerCase() === 'true' || value === '1';
        case 'str':
        default:
            return value;
    }
}

function findIdKey(rows) {
    if (!rows.length) {
        return null;
    }

    const keys = Object.keys(rows[0]);
    return keys.find(key => key.toLowerCase() === 'id') || null;
}

function assertUniqueIds(tableName, rows) {
    const idKey = findIdKey(rows);
    if (!idKey) {
        throw new Error(`${tableName}: client config must include an ID field marked as c or cs`);
    }

    const seen = new Set();
    for (const row of rows) {
        const id = row[idKey];
        if (seen.has(id)) {
            throw new Error(`${tableName}: duplicate ID ${id}`);
        }
        seen.add(id);
    }
}

function writeJSON(tableName, data) {
    const fileName = normalizeTableFileName(tableName);
    const json = `${JSON.stringify(data.dataRows, null, 2)}\n`;

    fs.mkdirSync(CONFIG.jsonOutputDir, { recursive: true });
    fs.mkdirSync(CONFIG.clientConfigDir, { recursive: true });

    const generatedPath = path.join(CONFIG.jsonOutputDir, `${fileName}.json`);
    const clientPath = path.join(CONFIG.clientConfigDir, `${fileName}.json`);

    fs.writeFileSync(generatedPath, json, 'utf-8');
    fs.writeFileSync(clientPath, json, 'utf-8');

    console.log(`  - JSON: ${path.relative(process.cwd(), generatedPath)}`);
    console.log(`  - Client asset: ${path.relative(process.cwd(), clientPath)}`);

    return {
        name: tableName,
        file: `${fileName}.json`,
        path: `config/${fileName}.json`,
        rows: data.dataRows.length,
    };
}

function writeManifest(tables) {
    const manifest = {
        version: 1,
        tables,
    };

    const generatedPath = path.join(CONFIG.jsonOutputDir, 'config-manifest.json');
    const clientPath = path.join(CONFIG.clientConfigDir, 'config-manifest.json');
    const content = `${JSON.stringify(manifest, null, 2)}\n`;

    fs.mkdirSync(CONFIG.jsonOutputDir, { recursive: true });
    fs.mkdirSync(CONFIG.clientConfigDir, { recursive: true });
    fs.writeFileSync(generatedPath, content, 'utf-8');
    fs.writeFileSync(clientPath, content, 'utf-8');

    console.log(`\nManifest: ${path.relative(process.cwd(), generatedPath)}`);
    console.log(`Client manifest: ${path.relative(process.cwd(), clientPath)}`);
}

function processCSVFile(csvFilePath) {
    const tableName = path.basename(csvFilePath, '.csv');
    console.log(`\nProcessing ${tableName}.csv`);

    const data = parseCSV(csvFilePath);
    if (data.fields.length === 0) {
        console.warn(`  - skipped: no client fields marked as c/cs`);
        return null;
    }

    try {
        assertUniqueIds(tableName, data.dataRows);
    } catch (error) {
        console.warn(`  - skipped: ${error.message}`);
        return null;
    }

    console.log(`  - fields: ${data.fields.length}`);
    console.log(`  - rows: ${data.dataRows.length}`);
    return writeJSON(tableName, data);
}

function main() {
    console.log('=== Client config export ===');

    if (!fs.existsSync(CONFIG.csvDir)) {
        console.error(`CSV directory not found: ${CONFIG.csvDir}`);
        process.exit(1);
    }

    const csvFiles = fs.readdirSync(CONFIG.csvDir)
        .filter(file => file.endsWith('.csv'))
        .sort((a, b) => a.localeCompare(b))
        .map(file => path.join(CONFIG.csvDir, file));

    const tables = [];
    let failCount = 0;

    for (const csvFile of csvFiles) {
        try {
            const table = processCSVFile(csvFile);
            if (table) {
                tables.push(table);
            }
        } catch (error) {
            failCount++;
            console.error(`  - failed: ${error.message}`);
        }
    }

    writeManifest(tables);

    console.log('\n=== Export complete ===');
    console.log(`Success: ${tables.length}`);
    console.log(`Failed: ${failCount}`);

    if (failCount > 0) {
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    parseCSV,
    parseCSVLine,
    convertValue,
    normalizeTableFileName,
};
