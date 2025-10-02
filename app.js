const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname)));

// Pretty URLs for /camera and /barcode
app.get('/camera', (req, res) => {
    res.sendFile(path.join(__dirname, 'camera.html'));
});
app.get('/barcode', (req, res) => {
    res.sendFile(path.join(__dirname, 'barcode.html'));
});

const CSV_PATH = path.join(__dirname, 'barcodes.csv');

app.get('/get-product/:barcode', (req, res) => {
    const { barcode } = req.params;
    fs.readFile(CSV_PATH, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading CSV:", err);
            return res.status(500).json({ error: 'Failed to read product database' });
        }

        const lines = data.trim().split('\n');
        // Skip header row by starting loop at 1
        for (let i = 1; i < lines.length; i++) {
            const [csvBarcode, name, price] = lines[i].split(',');
            if (csvBarcode && csvBarcode.trim() === barcode) {
                return res.json({ name: name.trim(), price: parseFloat(price) });
            }
        }

        // If no product is found
        return res.status(404).json({ error: 'Product not found' });
    });
});

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
    console.log(`App running at http://localhost:${PORT}`);
    // Open the default browser to the home page
    openBrowser(`http://localhost:${PORT}/index.html`);
});

// Remove or comment out any code that tries to open a new terminal window.
// The exec in openBrowser only opens the browser, not a terminal window.

function openBrowser(url) {
    const start = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    require('child_process').exec(`${start} "${url}"`);
}
