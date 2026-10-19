
/* MH COLLECTION - Corrected app.js */

(function () {
  "use strict";

  function startApp() {
    // Find the application container or create one.
    let app = document.getElementById("app");

    if (!app) {
      app = document.createElement("div");
      app.id = "app";
      document.body.appendChild(app);
    }

    // Remove any old overlay from this application container.
    app.replaceChildren();

    const content = document.createElement("div");
    content.id = "mh-content";
    app.appendChild(content);

    // Ensure input fields can receive keyboard and mouse interaction.
    const style = document.createElement("style");
    style.textContent = `
      #app, #mh-content {
        pointer-events: auto !important;
        position: relative;
        z-index: 1;
      }

      #mh-content input,
      #mh-content select,
      #mh-content textarea {
        pointer-events: auto !important;
        user-select: text !important;
        -webkit-user-select: text !important;
        opacity: 1 !important;
        cursor: text !important;
        position: relative;
        z-index: 2;
      }

      #mh-content label,
      #mh-content form {
        pointer-events: auto !important;
      }

      #mh-content button {
        pointer-events: auto !important;
        cursor: pointer;
      }

      .mh-layout { max-width: 1100px; margin: auto; padding: 16px;
        font-family: Arial, sans-serif; color: #292329; }
      .mh-top { display:flex; justify-content:space-between;
        align-items:center; flex-wrap:wrap; gap:12px; }
      .mh-nav { display:flex; flex-wrap:wrap; gap:8px; margin:20px 0; }
      .mh-layout button { padding:10px 14px; cursor:pointer;
        border:1px solid #ccc; border-radius:6px; background:#fff; }
      .mh-layout input, .mh-layout select {
        display:block; width:100%; box-sizing:border-box;
        padding:11px; margin:6px 0 14px; border:1px solid #999;
        border-radius:5px; background:white; color:#222;
      }
      .mh-form { display:grid; grid-template-columns:
        repeat(auto-fit,minmax(190px,1fr)); gap:10px; }
      .mh-box { border:1px solid #ddd; padding:16px;
        border-radius:8px; margin:14px 0; background:white; }
      .mh-table-wrap { overflow-x:auto; }
      .mh-layout table { width:100%; border-collapse:collapse; }
      .mh-layout th, .mh-layout td { padding:9px;
        border:1px solid #ddd; text-align:left; }
      .mh-active { background:#74264d !important; color:white !important; }
      .mh-message { margin:10px 0; padding:10px; }
    `;
    document.head.appendChild(style);

    const money = n => "₹" + Number(n || 0).toFixed(2);

    const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[ch]);

    // Compatible with the existing db.js storage keys.
    function getProducts() {
      try {
        return JSON.parse(localStorage.getItem("mh_products")) || [];
      } catch {
        return [];
      }
    }

    function saveProducts(products) {
      localStorage.setItem("mh_products", JSON.stringify(products));
    }

    function getSales() {
      try {
        return JSON.parse(localStorage.getItem("mh_sales")) || [];
      } catch {
        return [];
      }
    }

    function saveSales(sales) {
      localStorage.setItem("mh_sales", JSON.stringify(sales));
    }

    function showMessage(message) {
      alert(message);
    }

    function render(page = "dashboard") {
      content.innerHTML = `
        <div class="mh-layout">
          <header class="mh-top">
            <div>
              <h1>MH Collection</h1>
              <p>Ladies' Clothing Shop Management</p>
            </div>
            <button id="mh-backup">Export Backup</button>
          </header>

          <nav class="mh-nav">
            <button data-page="dashboard">Dashboard</button>
            <button data-page="products">Products & Stock</button>
            <button data-page="billing">New Bill</button>
            <button data-page="sales">Sales History</button>
          </nav>

          <section id="mh-page"></section>
          <p>Remember to export backups regularly.</p>
        </div>
      `;

      const pageRoot = content.querySelector("#mh-page");

      content.querySelectorAll("[data-page]").forEach(button => {
        button.classList.toggle("mh-active", button.dataset.page === page);
        button.addEventListener("click", () => render(button.dataset.page));
      });

      content.querySelector("#mh-backup").addEventListener("click", () => {
        const data = {
          products: getProducts(),
          sales: getSales(),
          exportedAt: new Date().toISOString()
        };

        const url = URL.createObjectURL(new Blob(
          [JSON.stringify(data, null, 2)],
          { type: "application/json" }
        ));

        const link = document.createElement("a");
        link.href = url;
        link.download = "mh-collection-backup.json";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });

      if (page === "dashboard") {
        const products = getProducts();
        const sales = getSales();
        const today = new Date().toDateString();
        const todaySales = sales
          .filter(s => new Date(s.date).toDateString() === today)
          .reduce((sum, s) => sum + Number(s.total || 0), 0);

        pageRoot.innerHTML = `
          <h2>Dashboard</h2>
          <div class="mh-form">
            <div class="mh-box">Products<h2>${products.length}</h2></div>
            <div class="mh-box">Stock units<h2>${products.reduce((n,p)=>n+Number(p.stock||0),0)}</h2></div>
            <div class="mh-box">Low stock<h2>${products.filter(p=>p.stock<=5).length}</h2></div>
            <div class="mh-box">Today's sales<h2>${money(todaySales)}</h2></div>
            <div class="mh-box">Total bills<h2>${sales.length}</h2></div>
          </div>
          <button id="mh-open-products" class="mh-active">Add or edit products</button>
        `;

        pageRoot.querySelector("#mh-open-products").addEventListener(
          "click", () => render("products")
        );
      }

      if (page === "products") {
        pageRoot.innerHTML = `
          <h2>Products & Stock</h2>
          <div class="mh-box">
            <h3>Add a new product</h3>
            <form id="mh-product-form">
              <div class="mh-form">
                <label>Product name
                  <input name="name" required placeholder="Cotton Kurti">
                </label>
                <label>Category
                  <select name="category">
                    <option>Saree</option>
                    <option>Kurti</option>
                    <option>Dress</option>
                    <option>Top</option>
                    <option>Leggings</option>
                    <option>Salwar Suit</option>
                    <option>Other</option>
                  </select>
                </label>
                <label>Product code
                  <input name="code" placeholder="Optional">
                </label>
                <label>Purchase price (₹)
                  <input name="costPrice" type="number" min="0"
                    step="0.01" value="0" required>
                </label>
                <label>Selling price (₹)
                  <input name="sellingPrice" type="number" min="0"
                    step="0.01" required>
                </label>
                <label>Stock quantity
                  <input name="stock" type="number" min="0"
                    step="1" value="0" required>
                </label>
              </div>
              <button type="submit" class="mh-active">Save product</button>
            </form>
          </div>

          <div class="mh-box">
            <h3>Current inventory</h3>
            <label>Search
              <input id="mh-search" placeholder="Search product name or code">
            </label>
            <div class="mh-table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Category</th>
                  <th>Purchase</th><th>Selling</th><th>Stock</th>
                  <th>Actions</th></tr></thead>
                <tbody id="mh-products-list"></tbody>
              </table>
            </div>
          </div>
        `;

        const form = pageRoot.querySelector("#mh-product-form");

        form.addEventListener("submit", event => {
          event.preventDefault();

          const data = Object.fromEntries(new FormData(form));
          const name = data.name.trim();
          const stock = Number(data.stock);
          const cost = Number(data.costPrice);
          const price = Number(data.sellingPrice);

          if (!name) return showMessage("Enter a product name.");
          if (!Number.isInteger(stock) || stock < 0) {
            return showMessage("Stock must be a non-negative whole number.");
          }
          if (![cost, price].every(n => Number.isFinite(n) && n >= 0)) {
            return showMessage("Enter valid prices.");
          }

          const products = getProducts();

          products.push({
            id: crypto.randomUUID(),
            name,
            category: data.category,
            code: data.code.trim(),
            costPrice: cost,
            sellingPrice: price,
            stock,
            createdAt: new Date().toISOString()
          });

          try {
            saveProducts(products);
            render("products");
            showMessage("Product saved successfully.");
          } catch (error) {
            showMessage("Could not save product. Check browser storage settings.");
          }
        });

        const list = pageRoot.querySelector("#mh-products-list");
        const search = pageRoot.querySelector("#mh-search");

        function drawProducts() {
          const query = search.value.trim().toLowerCase();

          const products = getProducts().filter(p =>
            String(p.name).toLowerCase().includes(query) ||
            String(p.code || "").toLowerCase().includes(query)
          );

          list.innerHTML = products.map(p => `
            <tr>
              <td>${esc(p.name)}</td>
              <td>${esc(p.category)}</td>
              <td>${money(p.costPrice)}</td>
              <td>${money(p.sellingPrice)}</td>
              <td>${Number(p.stock)}</td>
              <td>
                <button type="button" data-stock="${esc(p.id)}">Update stock</button>
                <button type="button" data-price="${esc(p.id)}">Edit price</button>
                <button type="button" data-delete="${esc(p.id)}">Delete</button>
              </td>
            </tr>
          `).join("") || '<tr><td colspan="6">No products yet.</td></tr>';
        }

        search.addEventListener("input", drawProducts);

        list.addEventListener("click", event => {
          const button = event.target.closest("button");
          if (!button) return;

          const id = button.dataset.stock || button.dataset.price ||
            button.dataset.delete;

          const products = getProducts();
          const product = products.find(p => String(p.id) === id);
          if (!product) return;

          if (button.dataset.stock) {
            const value = prompt("Enter the new total stock quantity:", product.stock);
            if (value === null) return;

            if (value.trim() === "" || !Number.isInteger(Number(value)) ||
                Number(value) < 0) {
              return showMessage("Enter a valid whole number of 0 or more.");
            }

            product.stock = Number(value);
          } else if (button.dataset.price) {
            const value = prompt("Enter the new selling price:", product.sellingPrice);
            if (value === null) return;

            if (value.trim() === "" || !Number.isFinite(Number(value)) ||
                Number(value) < 0) {
              return showMessage("Enter a valid price.");
            }

            product.sellingPrice = Number(value);
          } else if (button.dataset.delete) {
            if (!confirm("Delete " + product.name + "?")) return;
            saveProducts(products.filter(p => String(p.id) !== id));
            drawProducts();
            return;
          }

          saveProducts(products);
          drawProducts();
        });

        drawProducts();
      }

      if (page === "billing") {
        const products = getProducts();

        pageRoot.innerHTML = `
          <h2>New Bill</h2>
          <div class="mh-box">
            <form id="mh-billing-form">
              <label>Customer name
                <input name="customer" placeholder="Walk-in Customer">
              </label>
              <label>Product
                <select name="product" required>
                  ${products.filter(p => p.stock > 0).map(p =>
                    `<option value="${esc(p.id)}">${esc(p.name)} — ${money(p.sellingPrice)} (stock ${p.stock})</option>`
                  ).join("")}
                </select>
              </label>
              <label>Quantity
                <input name="quantity" type="number" min="1" step="1" value="1" required>
              </label>
              <label>Discount (₹)
                <input name="discount" type="number" min="0" step="0.01" value="0">
              </label>
              <label>Payment method
                <select name="payment">
                  <option>Cash</option><option>UPI</option>
                  <option>Card</option><option>Other</option>
                </select>
              </label>
              <button class="mh-active" type="submit">Save bill and print</button>
            </form>
          </div>
        `;

        pageRoot.querySelector("#mh-billing-form").addEventListener(
          "submit", event => {
            event.preventDefault();
            const data = Object.fromEntries(new FormData(event.currentTarget));
            const allProducts = getProducts();
            const product = allProducts.find(p => p.id === data.product);
            const quantity = Number(data.quantity);
            const discount = Number(data.discount);

            if (!product || !Number.isInteger(quantity) || quantity < 1 ||
                quantity > product.stock) {
              return showMessage("Choose a product and a valid available quantity.");
            }

            const subtotal = quantity * Number(product.sellingPrice);
            if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
              return showMessage("Enter a valid discount.");
            }

            const invoice = {
              id: crypto.randomUUID(),
              billNo: "MH-" + Date.now(),
              date: new Date().toISOString(),
              customerName: data.customer.trim() || "Walk-in Customer",
              customerPhone: "",
              items: [{
                productId: product.id,
                name: product.name,
                quantity,
                price: Number(product.sellingPrice),
                amount: subtotal
              }],
              subtotal,
              discount,
              total: subtotal - discount,
              paymentMethod: data.payment
            };

            product.stock -= quantity;
            saveProducts(allProducts);
            saveSales([invoice, ...getSales()]);

            if (window.MHBilling &&
                typeof window.MHBilling.printInvoice === "function") {
              try {
                window.MHBilling.printInvoice(invoice);
              } catch (error) {
                showMessage("Bill saved. Printing failed: " + error.message);
              }
            } else {
              showMessage("Bill saved, but billing.js is not loaded. Check your script tags.");
            }

            render("sales");
          }
        );
      }

      if (page === "sales") {
        pageRoot.innerHTML = `
          <h2>Sales History</h2>
          <div class="mh-box">
            <label>Search bills
              <input id="mh-sales-search" placeholder="Bill number or customer">
            </label>
            <div class="mh-table-wrap">
              <table>
                <thead><tr><th>Bill number</th><th>Date</th>
                  <th>Customer</th><th>Total</th></tr></thead>
                <tbody id="mh-sales-list"></tbody>
              </table>
            </div>
          </div>
        `;

        const search = pageRoot.querySelector("#mh-sales-search");
        const list = pageRoot.querySelector("#mh-sales-list");

        function drawSales() {
          const query = search.value.toLowerCase();
          list.innerHTML = getSales().filter(s =>
            String(s.billNo).toLowerCase().includes(query) ||
            String(s.customerName).toLowerCase().includes(query)
          ).map(s => `
            <tr>
              <td>${esc(s.billNo)}</td>
              <td>${esc(new Date(s.date).toLocaleString("en-IN"))}</td>
              <td>${esc(s.customerName)}</td>
              <td>${money(s.total)}</td>
            </tr>
          `).join("") || '<tr><td colspan="4">No bills found.</td></tr>';
        }

        search.addEventListener("input", drawSales);
        drawSales();
      }
    }

    render("dashboard");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp);
  } else {
    startApp();
  }
})();
