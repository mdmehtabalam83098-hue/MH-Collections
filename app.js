
/* MH Collection - Main Application */

(() => {
  const root = document.getElementById("app");

  if (!root) {
    console.error('MH Collection requires <div id="app"></div> in index.html');
    return;
  }

  const money = n => "₹" + Number(n || 0).toFixed(2);

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[c]);

  const categories = [
    "Saree", "Kurti", "Dress", "Top",
    "Leggings", "Salwar Suit", "Other"
  ];

  let cart = [];

  root.innerHTML = `
    <div class="mh-app">
      <header class="mh-header">
        <div>
          <h1>MH Collection</h1>
          <p>Ladies' Clothing Store Management</p>
        </div>
        <button id="mh-export">Export Backup</button>
      </header>

      <nav class="mh-nav">
        <button data-page="dashboard">Dashboard</button>
        <button data-page="products">Products & Stock</button>
        <button data-page="billing">New Bill</button>
        <button data-page="sales">Sales History</button>
      </nav>

      <main id="mh-content"></main>
      <p class="mh-note">
        Local storage is used on this device. Export backups regularly.
      </p>
    </div>
  `;

  // Application styling is injected here so no additional CSS file is needed.
  const style = document.createElement("style");
  style.textContent = `
    .mh-app { max-width:1100px; margin:auto; padding:18px;
      font-family:Arial,sans-serif; color:#242424; }
    .mh-header { display:flex; justify-content:space-between;
      align-items:center; gap:12px; flex-wrap:wrap; }
    .mh-header h1 { margin-bottom:5px; }
    .mh-header p,.mh-note { color:#666; }
    .mh-nav { display:flex; flex-wrap:wrap; gap:8px;
      margin:20px 0; }
    .mh-app button { padding:10px 14px; cursor:pointer;
      border:1px solid #bbb; border-radius:6px; background:#fff; }
    .mh-app button:hover { background:#f4e8ef; }
    .mh-app input,.mh-app select { width:100%; box-sizing:border-box;
      padding:10px; margin:5px 0 12px; border:1px solid #bbb;
      border-radius:5px; }
    .mh-grid { display:grid; grid-template-columns:
      repeat(auto-fit,minmax(180px,1fr)); gap:12px; }
    .mh-card,.mh-panel { border:1px solid #ddd; border-radius:8px;
      padding:15px; margin-bottom:15px; background:#fff; }
    .mh-card strong { display:block; font-size:24px; margin-top:8px; }
    .mh-form { display:grid; grid-template-columns:
      repeat(auto-fit,minmax(200px,1fr)); gap:10px; }
    .mh-table-wrap { overflow-x:auto; }
    .mh-app table { border-collapse:collapse; width:100%;
      margin:12px 0; }
    .mh-app th,.mh-app td { border:1px solid #ddd; padding:9px;
      text-align:left; white-space:nowrap; }
    .mh-app th { background:#f5f1f3; }
    .mh-primary { background:#74264d !important; color:white; }
    .mh-danger { color:#a11; }
    .mh-total { text-align:right; font-size:20px; font-weight:bold; }
    @media(max-width:600px) {
      .mh-app { padding:10px; }
      .mh-nav button { flex:1 1 40%; }
    }
  `;
  document.head.appendChild(style);

  const content = root.querySelector("#mh-content");

  function showPage(page) {
    root.querySelectorAll("[data-page]").forEach(button => {
      button.classList.toggle("mh-primary", button.dataset.page === page);
    });

    if (page === "dashboard") renderDashboard();
    if (page === "products") renderProducts();
    if (page === "billing") renderBilling();
    if (page === "sales") renderSales();
  }

  function renderDashboard() {
    const summary = MHDB.getSummary();
    const products = MHDB.getProducts();

    content.innerHTML = `
      <h2>Dashboard</h2>
      <div class="mh-grid">
        <div class="mh-card">Sales today
          <strong>${money(summary.todaySales)}</strong></div>
        <div class="mh-card">Products
          <strong>${summary.totalProducts}</strong></div>
        <div class="mh-card">Units in stock
          <strong>${summary.totalStock}</strong></div>
        <div class="mh-card">Low-stock products
          <strong>${summary.lowStock}</strong></div>
        <div class="mh-card">Bills recorded
          <strong>${summary.totalBills}</strong></div>
      </div>
      <section class="mh-panel">
        <h3>Low-stock alert (5 units or fewer)</h3>
        ${products.filter(p => p.stock <= 5).length
          ? products.filter(p => p.stock <= 5).map(p =>
            `<p>${escapeHTML(p.name)} — ${p.stock} left</p>`
          ).join("")
          : "<p>No low-stock products.</p>"}
      </section>
    `;
  }

  function renderProducts() {
    const products = MHDB.getProducts();

    content.innerHTML = `
      <h2>Products & Stock</h2>
      <form id="mh-product-form" class="mh-panel">
        <h3>Add a product</h3>
        <div class="mh-form">
          <label>Product name
            <input name="name" required placeholder="e.g. Cotton Kurti">
          </label>
          <label>Category
            <select name="category">
              ${categories.map(c =>
                `<option>${escapeHTML(c)}</option>`).join("")}
            </select>
          </label>
          <label>Product code
            <input name="code" placeholder="Optional">
          </label>
          <label>Purchase price (₹)
            <input name="costPrice" type="number" min="0"
              step="0.01" value="0">
          </label>
          <label>Selling price (₹)
            <input name="sellingPrice" type="number" min="0"
              step="0.01" required>
          </label>
          <label>Opening stock
            <input name="stock" type="number" min="0"
              step="1" value="0" required>
          </label>
        </div>
        <button class="mh-primary">Save product</button>
      </form>

      <section class="mh-panel">
        <h3>Inventory</h3>
        <label>Search products
          <input id="mh-product-search" placeholder="Search by name or code">
        </label>
        <div class="mh-table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Category</th>
              <th>Code</th><th>Purchase</th><th>Selling</th>
              <th>Stock</th><th>Actions</th></tr></thead>
            <tbody id="mh-product-rows"></tbody>
          </table>
        </div>
      </section>
    `;

    const form = content.querySelector("#mh-product-form");

    form.addEventListener("submit", event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));

      try {
        MHDB.addProduct(data);
        renderProducts();
      } catch (error) {
        alert(error.message);
      }
    });

    const rows = content.querySelector("#mh-product-rows");
    const search = content.querySelector("#mh-product-search");

    function drawRows() {
      const query = search.value.toLowerCase();
      const filtered = MHDB.getProducts().filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query)
      );

      rows.innerHTML = filtered.map(p => `
        <tr>
          <td>${escapeHTML(p.name)}</td>
          <td>${escapeHTML(p.category)}</td>
          <td>${escapeHTML(p.code)}</td>
          <td>${money(p.costPrice)}</td>
          <td>${money(p.sellingPrice)}</td>
          <td>${p.stock}</td>
          <td>
            <button data-stock="${p.id}">Update stock</button>
            <button data-price="${p.id}">Edit price</button>
            <button data-delete="${p.id}" class="mh-danger">Delete</button>
          </td>
        </tr>
      `).join("") || '<tr><td colspan="7">No products found.</td></tr>';
    }

    search.addEventListener("input", drawRows);

    rows.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;

      const id = button.dataset.stock ||
        button.dataset.price || button.dataset.delete;
      const product = MHDB.getProducts().find(p => p.id === id);
      if (!product) return;

      if (button.dataset.stock) {
        const value = prompt("Enter the new total stock:", product.stock);
        if (value === null) return;
        if (value.trim() === "" || !Number.isInteger(Number(value)) ||
            Number(value) < 0) {
          alert("Enter a valid non-negative whole number.");
          return;
        }
        MHDB.updateProduct(id, { stock: Number(value) });
      }

      if (button.dataset.price) {
        const value = prompt("Enter the new selling price:", product.sellingPrice);
        if (value === null) return;
        if (value.trim() === "" || !Number.isFinite(Number(value)) ||
            Number(value) < 0) {
          alert("Enter a valid price.");
          return;
        }
        MHDB.updateProduct(id, { sellingPrice: Number(value) });
      }

      if (button.dataset.delete) {
        if (confirm(`Delete ${product.name}?`)) {
          MHDB.deleteProduct(id);
        }
      }

      drawRows();
    });

    drawRows();
  }

  function renderBilling() {
    cart = [];

    const products = MHDB.getProducts();

    content.innerHTML = `
      <h2>New Bill</h2>
      <section class="mh-panel">
        <form id="mh-bill-form">
          <div class="mh-form">
            <label>Customer name
              <input name="customerName" placeholder="Walk-in Customer">
            </label>
            <label>Phone number
              <input name="customerPhone" type="tel" placeholder="Optional">
            </label>
            <label>Payment method
              <select name="paymentMethod">
                <option>Cash</option><option>UPI</option>
                <option>Card</option><option>Other</option>
              </select>
            </label>
          </div>

          <h3>Add items</h3>
          <label>Product
            <select id="mh-cart-product">
              ${products.filter(p => p.stock > 0).map(p =>
                `<option value="${p.id}">
                  ${escapeHTML(p.name)} — ${money(p.sellingPrice)}
                  (stock ${p.stock})
                </option>`).join("")}
            </select>
          </label>
          <label>Quantity
            <input id="mh-cart-quantity" type="number" min="1" value="1">
          </label>
          <button type="button" id="mh-add-item">Add to bill</button>

          <div class="mh-table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Qty</th>
                <th>Rate</th><th>Amount</th><th>Action</th></tr></thead>
              <tbody id="mh-cart-rows"></tbody>
            </table>
          </div>

          <label>Discount (₹)
            <input id="mh-discount" type="number" min="0" value="0" step="0.01">
          </label>
          <p id="mh-bill-total" class="mh-total">Total: ₹0.00</p>
          <button class="mh-primary">Save bill and print A4 invoice</button>
        </form>
      </section>
    `;

    const form = content.querySelector("#mh-bill-form");
    const rows = content.querySelector("#mh-cart-rows");
    const discountInput = content.querySelector("#mh-discount");

    function drawCart() {
      rows.innerHTML = cart.map((item, index) => `
        <tr>
          <td>${escapeHTML(item.name)}</td>
          <td>${item.quantity}</td>
          <td>${money(item.price)}</td>
          <td>${money(item.quantity * item.price)}</td>
          <td><button type="button" data-remove="${index}">Remove</button></td>
        </tr>
      `).join("");

      const subtotal = cart.reduce(
        (sum, item) => sum + item.quantity * item.price, 0
      );
      const discount = Number(discountInput.value) || 0;

      content.querySelector("#mh-bill-total").textContent =
        "Total: " + money(Math.max(0, subtotal - discount));
    }

    content.querySelector("#mh-add-item").addEventListener("click", () => {
      const id = content.querySelector("#mh-cart-product").value;
      const quantity = Number(
        content.querySelector("#mh-cart-quantity").value
      );
      const product = MHDB.getProducts().find(p => p.id === id);

      if (!product) {
        alert("Add a product to inventory first.");
        return;
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        alert("Enter a valid quantity.");
        return;
      }

      const existing = cart.find(item => item.productId === id);
      const alreadyAdded = existing ? existing.quantity : 0;

      if (quantity + alreadyAdded > product.stock) {
        alert(`Available stock: ${product.stock}`);
        return;
      }

      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({
          productId: id,
          name: product.name,
          price: product.sellingPrice,
          quantity
        });
      }

      drawCart();
    });

    rows.addEventListener("click", event => {
      const button = event.target.closest("[data-remove]");
      if (!button) return;
      cart.splice(Number(button.dataset.remove), 1);
      drawCart();
    });

    discountInput.addEventListener("input", drawCart);

    form.addEventListener("submit", event => {
      event.preventDefault();

      if (!cart.length) {
        alert("Add at least one product.");
        return;
      }

      const data = Object.fromEntries(new FormData(form));

      try {
        // Open a print window before saving the bill, where possible.
        const invoice = MHBilling.createInvoice({
          customerName: data.customerName.trim() || "Walk-in Customer",
          customerPhone: data.customerPhone.trim(),
          paymentMethod: data.paymentMethod,
          items: cart,
          discount: Number(discountInput.value) || 0
        });

        alert("Bill saved. Your invoice is ready to print.");
        MHBilling.printInvoice(invoice);
        showPage("sales");
      } catch (error) {
        alert(error.message);
      }
    });

    drawCart();
  }

  function renderSales() {
    const sales = MHDB.getSales();

    content.innerHTML = `
      <h2>Sales History</h2>
      <div class="mh-panel">
        <label>Search bill number or customer
          <input id="mh-sales-search" placeholder="Search sales">
        </label>
        <div class="mh-table-wrap">
          <table>
            <thead><tr><th>Bill No.</th><th>Date</th>
              <th>Customer</th><th>Items</th><th>Payment</th>
              <th>Total</th><th>Action</th></tr></thead>
            <tbody id="mh-sales-rows"></tbody>
          </table>
        </div>
      </div>
    `;

    const rows = content.querySelector("#mh-sales-rows");
    const search = content.querySelector("#mh-sales-search");

    function drawSales() {
      const query = search.value.toLowerCase();
      const filtered = MHDB.getSales().filter(s =>
        s.billNo.toLowerCase().includes(query) ||
        s.customerName.toLowerCase().includes(query)
      );

      rows.innerHTML = filtered.map(s => `
        <tr>
          <td>${escapeHTML(s.billNo)}</td>
          <td>${escapeHTML(new Date(s.date).toLocaleString("en-IN"))}</td>
          <td>${escapeHTML(s.customerName)}</td>
          <td>${s.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
          <td>${escapeHTML(s.paymentMethod)}</td>
          <td>${money(s.total)}</td>
          <td><button data-reprint="${s.id}">Reprint</button></td>
        </tr>
      `).join("") || '<tr><td colspan="7">No sales found.</td></tr>';
    }

    search.addEventListener("input", drawSales);

    rows.addEventListener("click", event => {
      const button = event.target.closest("[data-reprint]");
      if (!button) return;
      const invoice = MHDB.getSales().find(s => s.id === button.dataset.reprint);
      if (invoice) MHBilling.printInvoice(invoice);
    });

    drawSales();
  }

  root.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.page));
  });

  root.querySelector("#mh-export").addEventListener("click", () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      products: MHDB.getProducts(),
      sales: MHDB.getSales()
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mh-collection-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  });

  showPage("dashboard");
})();
