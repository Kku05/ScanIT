// This file contains the logic for generating an EAN-13 barcode based on the user-provided name and price.

document.getElementById('barcodeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value).toFixed(2);

    // Simple EAN-13 generator: 2 digits for price, 10 digits from name hash, 1 checksum
    function nameToDigits(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash * 31 + str.charCodeAt(i)) % 10000000000;
        }
        return hash.toString().padStart(10, '0');
    }

    const priceDigits = Math.round(price * 100).toString().padStart(2, '0').slice(0,2);
    let base = priceDigits + nameToDigits(name); // 12 digits

    // Calculate EAN-13 checksum
    function ean13Checksum(number) {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(number[i]) * (i % 2 === 0 ? 1 : 3);
        }
        return (10 - (sum % 10)) % 10;
    }
    const checksum = ean13Checksum(base);
    const ean13 = base + checksum;

    // Display barcode info
    document.getElementById('displayName').textContent = name;
    document.getElementById('barcodeResult').style.display = 'block';

    // Save to backend
    fetch('/add-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: ean13, name, price })
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            alert('Failed to save barcode to CSV.');
        }
    })
    .catch(() => {
        alert('Failed to connect to barcode server.');
    });

    // Store for later use
    window.generatedBarcode = { ean13, name };
});

// Show barcodes button logic
document.getElementById('showBarcodesBtn').addEventListener('click', function() {
    const count = parseInt(document.getElementById('barcodeCount').value) || 1;
    const { ean13, name } = window.generatedBarcode || {};
    if (!ean13) return;

    // Get the price value for the label
    const price = document.getElementById('productPrice').value.trim();
    const customCode = `90${price}77`;

    const printBarcodesDiv = document.getElementById('printBarcodes');
    printBarcodesDiv.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const block = document.createElement('div');
        block.className = 'barcode-block';

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('id', `barcode-svg-${i}`);
        svg.setAttribute('jsbarcode-format', 'ean13');
        svg.setAttribute('jsbarcode-value', ean13);
        svg.setAttribute('jsbarcode-textmargin', '0');
        svg.setAttribute('jsbarcode-fontoptions', 'bold');
        svg.setAttribute('width', '160');
        svg.setAttribute('height', '32');

        block.appendChild(svg);

        const label = document.createElement('div');
        label.className = 'barcode-label';
        label.textContent = 'Laxmi Narayan Cloth House';
        block.appendChild(label);

        // Add the custom code below the shop name
        const codeLabel = document.createElement('div');
        codeLabel.className = 'barcode-label';
        codeLabel.textContent = customCode;
        block.appendChild(codeLabel);

        printBarcodesDiv.appendChild(block);

        // Generate barcode
        JsBarcode(svg, ean13, {format: "ean13", displayValue: true, width:2, height:28, fontSize:14});
    }

    document.getElementById('printBarcodesBtn').style.display = 'inline-block';
});

// Print barcodes button logic
document.getElementById('printBarcodesBtn').addEventListener('click', function() {
    window.print();
});