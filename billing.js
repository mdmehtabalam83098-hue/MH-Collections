
/* MH Collection - Billing and A4 Invoice */

const MHBilling = {
  createInvoice({
    customerName = "Walk-in Customer",
    customerPhone = "",
    items = [],
    discount = 0,
    paymentMethod = "Cash"
  }) {
    if (!items.length) {
      throw new Error("Add at least one product.");
    }

    const products = MHDB.getProducts();
    const invoiceItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      const quantity = Number(item.quantity);

      if (!product) {
        throw new Error("A selected product was not found.");
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Quantity must be a positive whole number.");
      }

      if (product.stock < quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stock}`
        );
      }

      invoiceItems.push({
        productId: product.id,
        name: product.name,
        quantity,
        price: Number(item.price ?? product.sellingPrice),
        amount: quantity * Number(item.price ?? product.sellingPrice)
      });
    }

    if (invoiceItems.some(i => !Number.isFinite(i.price) || i.price < 0)) {
      throw new Error("Product prices must be valid and non-negative.");
    }

    const subtotal = invoiceItems.reduce(
      (sum, item) => sum + item.amount, 0
    );

    discount = Number(discount) || 0;

    if (discount < 0 || discount > subtotal) {
      throw new Error("Discount must be between zero and the subtotal.");
    }

    const invoice = {
      id: crypto.randomUUID(),
      billNo: "MH-" + Date.now(),
      date: new Date().toISOString(),
      customerName,
      customerPhone,
      items: invoiceItems,
      subtotal,
      discount,
      total: subtotal - discount,
      paymentMethod
    };

    // Update stock only after validating all invoice items.
    for (const item of invoiceItems) {
      const product = products.find(p => p.id === item.productId);
      product.stock -= item.quantity;
    }

    MHDB.saveProducts(products);
    MHDB.recordSale(invoice);

    return invoice;
  },

  printInvoice(invoice) {
    const money = value =>
      "₹" + Number(value).toFixed(2);

    const escapeHTML = value =>
      String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]);

    const rows = invoice.items.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHTML(item.name)}</td>
        <td>${item.quantity}</td>
        <td>${money(item.price)}</td>
        <td>${money(item.amount)}</td>
      </tr>
    `).join("");

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      throw new Error(
        "Printing window blocked. Allow pop-ups for this website."
      );
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${escapeHTML(invoice.billNo)}</title>
        <style>
          @page { size: A4; margin: 18mm; }
          body {
            font-family: Arial, sans-serif;
            color: #222;
            font-size: 12px;
          }
          header {
            text-align: center;
            border-bottom: 2px solid #222;
            padding-bottom: 15px;
          }
          h1 { margin-bottom: 5px; }
          .details {
            display: flex;
            justify-content: space-between;
            margin: 25px 0;
            gap: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #aaa;
            padding: 10px;
            text-align: left;
          }
          th { background: #eee; }
          .totals {
            width: 280px;
            margin: 20px 0 0 auto;
          }
          .totals p {
            display: flex;
            justify-content: space-between;
          }
          .grand-total {
            font-size: 17px;
            font-weight: bold;
            border-top: 2px solid #222;
            padding-top: 10px;
          }
          footer {
            margin-top: 60px;
            text-align: center;
          }
          @media screen {
            body { max-width: 180mm; margin: 20px auto; }
          }
        </style>
      </head>
      <body>
        <header>
          <h1>MH COLLECTION</h1>
          <p>Ladies' Clothing Store</p>
          <p>Thank you for shopping with us!</p>
        </header>

        <section class="details">
          <div>
            <strong>Customer:</strong>
            ${escapeHTML(invoice.customerName)}<br>
            <strong>Phone:</strong>
            ${escapeHTML(invoice.customerPhone || "Not provided")}
          </div>
          <div>
            <strong>Bill No:</strong> ${escapeHTML(invoice.billNo)}<br>
            <strong>Date:</strong>
            ${escapeHTML(new Date(invoice.date).toLocaleString("en-IN"))}<br>
            <strong>Payment:</strong> ${escapeHTML(invoice.paymentMethod)}
          </div>
        </section>

        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="totals">
          <p><span>Subtotal</span><strong>${money(invoice.subtotal)}</strong></p>
          <p><span>Discount</span><strong>${money(invoice.discount)}</strong></p>
          <p class="grand-total">
            <span>Grand Total</span><span>${money(invoice.total)}</span>
          </p>
        </div>

        <footer>
          <p>Goods sold subject to store policy.</p>
          <p>Thank you! Visit MH Collection again.</p>
        </footer>

        <script>
          window.onload = () => {
            window.print();
          };
        <\/script>
      </body>
      </html>
    `);

    printWindow.document.close();
  }
};

window.MHBilling = MHBilling;
