const fs = require('fs');

const csvFile = 'c:\\Portal OPE\\Genral_uats.csv';
const content = fs.readFileSync(csvFile, 'latin1');
const lines = content.split('\n');

let validRows = 0;
for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(';');
    if (columns[1] && columns[1].trim() !== '') {
        validRows++;
    }
}

console.log(`Total lines: ${lines.length}`);
console.log(`Valid rows (id_casop): ${validRows}`);
console.log(`Expected parts (500 rows per part): ${Math.ceil(validRows / 500)}`);
