
/* MH Collection - Local Database */

const MHDB = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem("mh_" + key)) ?? [];
    } catch {
      return [];
    }
  },

  save(key, data) {
    localStorage.setItem("mh_" + key, JSON.stringify(data));
  },

  getProducts() {
    return this.get("products");
  },

  saveProducts(products) {
    this.save("products", products);
  },

  getSales() {
    return this.get("sales");
  },

  saveSales(sales) {
    this.save("sales", sales);
  },

  addProduct(product) {
    const products = this.getProducts();

    const newProduct = {
      id: crypto.randomUUID(),
      name: product.name.trim(),
      category: product.category || "Other",
      code: product.code || "",
      costPrice: Number(product.costPrice) || 0,
      sellingPrice: Number(product.sellingPrice) || 0,
      stock: Math.max(0, Number(product.stock) || 0),
      createdAt: new Date().toISOString()
    };

    if (!newProduct.name) {
      throw new Error("Product name is required.");
    }

    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  },

  updateProduct(id, updates) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      throw new Error("Product not found.");
    }

    products[index] = {
      ...products[index],
      ...updates,
      sellingPrice: Number(
        updates.sellingPrice ?? products[index].sellingPrice
      ),
      costPrice: Number(
        updates.costPrice ?? products[index].costPrice
      ),
      stock: Math.max(
        0,
        Number(updates.stock ?? products[index].stock)
      )
    };

    this.saveProducts(products);
    return products[index];
  },

  deleteProduct(id) {
    this.saveProducts(
      this.getProducts().filter(p => p.id !== id)
    );
  },

  recordSale(sale) {
    const sales = this.getSales();
    sales.unshift(sale);
    this.saveSales(sales);
  },

  getSummary() {
    const sales = this.getSales();
    const products = this.getProducts();

    const today = new Date().toDateString();

    const todaySales = sales
      .filter(s => new Date(s.date).toDateString() === today)
      .reduce((sum, s) => sum + Number(s.total || 0), 0);

    return {
      totalProducts: products.length,
      totalStock: products.reduce(
        (sum, p) => sum + Number(p.stock || 0), 0
      ),
      lowStock: products.filter(
        p => p.stock <= 5
      ).length,
      todaySales,
      totalBills: sales.length
    };
  }
};

window.MHDB = MHDB;
