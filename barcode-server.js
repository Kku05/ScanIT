const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const CSV_PATH = path.join(__dirname, 'barcodes.csv');

app.post('/add-barcode', (req, res) => {
    const { barcode, name, price } = req.body;
    if (!barcode || !name || !price) {
        return res.status(400).json({ error: 'Missing data' });
    }
    const line = `\n${barcode},${name},${price}`;
    fs.appendFile(CSV_PATH, line, err => {
        if (err) {
            return res.status(500).json({ error: 'Failed to write to CSV' });
        }
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Barcode server running at http://localhost:${PORT}`);
});
