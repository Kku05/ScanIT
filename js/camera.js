// camera.js
let cart = {};

/** -------- SCANNER -------- */
function onScanSuccess(decodedText) {
  validateAndAdd(decodedText);
}

// Init html5-qrcode
const html5QrCode = new Html5Qrcode("reader");
html5QrCode.start(
  { facingMode: "environment" },
  { fps: 10, qrbox: { width: 300, height: 200 } },
  onScanSuccess
).catch(err => console.error("Camera init failed:", err));

/** -------- MANUAL ENTRY -------- */
document.getElementById("manual-submit").addEventListener("click", () => {
  const code = document.getElementById("manual-barcode").value.trim();
  if (code) {
    validateAndAdd(code);
    document.getElementById("manual-barcode").value = "";
  }
});

/** -------- DISCOUNT -------- */
document.getElementById("discount").addEventListener("input", () => {
  renderCart(); // Re-render the cart to apply the discount
});

/** -------- VALIDATION + CART -------- */
function validateAndAdd(barcode) {
  fetch(`/get-product/${barcode}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Product not found for barcode: ${barcode}`);
      }
      return res.json();
    })
    .then(product => {
      addToCart(barcode, product);
    })
    .catch(err => {
      alert(`❌ ${err.message}`);
    });
}

function addToCart(barcode, product) {
  if (!cart[barcode]) {
    // Only add the product if it's not already in the cart.
    // Quantity will now only be managed by the manual buttons.
    cart[barcode] = { name: product.name, price: product.price, qty: 1 };
  }
  renderCart();
}

function updateQuantity(barcode, change) {
  if (cart[barcode]) {
    cart[barcode].qty += change;
    if (cart[barcode].qty <= 0) {
      // If quantity is 0 or less, remove the item from the cart
      delete cart[barcode];
    }
    renderCart();
  }
}

function removeFromCart(barcode) {
  if (cart[barcode]) {
    delete cart[barcode];
    renderCart();
  }
}

function renderCart() {
  const tbody = document.getElementById("cart-body");
  tbody.innerHTML = "";
  let total = 0;
  let index = 1;

  for (const barcode in cart) {
    const item = cart[barcode];
    const row = document.createElement("tr");

    // Serial Number
    const serialCell = document.createElement("td");
    serialCell.textContent = index++;
    row.appendChild(serialCell);

    // Barcode
    const barcodeCell = document.createElement("td");
    barcodeCell.textContent = barcode;
    row.appendChild(barcodeCell);

    // Name
    const nameCell = document.createElement("td");
    nameCell.textContent = item.name;
    row.appendChild(nameCell);

    // Price
    const priceCell = document.createElement("td");
    priceCell.textContent = `₹${parseFloat(item.price).toFixed(2)}`;
    row.appendChild(priceCell);

    // Qty (manual + and - buttons)
    const qtyCell = document.createElement("td");
    const minusBtn = document.createElement("button");
    minusBtn.textContent = "-";
    minusBtn.onclick = function() {
      if (item.qty > 1) {
        item.qty--;
        renderCart();
      }
    };
    const qtySpan = document.createElement("span");
    qtySpan.textContent = ` ${item.qty} `;
    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";
    plusBtn.onclick = function() {
      item.qty++;
      renderCart();
    };
    qtyCell.appendChild(minusBtn);
    qtyCell.appendChild(qtySpan);
    qtyCell.appendChild(plusBtn);
    row.appendChild(qtyCell);

    // Total
    const totalCell = document.createElement("td");
    const rowTotal = item.qty * parseFloat(item.price);
    totalCell.textContent = `₹${rowTotal.toFixed(2)}`;
    row.appendChild(totalCell);

    // Remove button
    const removeCell = document.createElement("td");
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => removeFromCart(barcode);
    removeCell.appendChild(removeBtn);
    row.appendChild(removeCell);

    tbody.appendChild(row);

    total += rowTotal;
  }

  // Update totals
  document.getElementById("sub-total").textContent = `₹${total.toFixed(2)}`;
  const discountPercent = parseFloat(document.getElementById("discount").value) || 0;
  const discountAmount = total * (discountPercent / 100);
  document.getElementById("discount-amount").textContent = `₹${discountAmount.toFixed(2)}`;
  document.getElementById("grand-total").textContent = `₹${(total - discountAmount).toFixed(2)}`;

  // Show discount percent as text for print
  let discountText = document.getElementById("discount-text");
  if (!discountText) {
    discountText = document.createElement("span");
    discountText.id = "discount-text";
    document.getElementById("discount").parentNode.appendChild(discountText);
  }
  discountText.textContent = ` (${discountPercent}%)`;
}

/** -------- PRINT BILL -------- */
function printBill() {
  // Get the current HTML (with values) of the bill
  const billContent = document.getElementById('bill').outerHTML;
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write('<html><head><title>Print Bill</title>');
  printWindow.document.write('<link rel="stylesheet" href="css/styles.css">');
  printWindow.document.write('<style>@media print { th:last-child, td:last-child, button { display: none !important; } }</style>');
  printWindow.document.write('</head><body>');
  printWindow.document.write(billContent);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  // Do not close the window automatically
}

document.getElementById('print-bill-btn').addEventListener('click', printBill);
