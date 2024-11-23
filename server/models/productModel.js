const db = require('../database');

class ProductModel {
  static getAllProducts() {
    return new Promise((resolve, reject) => {
      db.all("SELECT id, title, items FROM products", [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static addProduct(productData) {
    return new Promise((resolve, reject) => {
      const { title, items, password } = productData;
      db.run("INSERT INTO products (title, items, password) VALUES (?, ?, ?)",
        [title, items, password],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              title,
              items
            });
          }
        }
      );
    });
  }

  static deleteProduct(id, password) {
    return new Promise((resolve, reject) => {
      db.get("SELECT password FROM products WHERE id = ?", [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('Product not found'));
        } else if (row.password !== password) {
          reject(new Error('Incorrect password'));
        } else {
          db.run("DELETE FROM products WHERE id = ?", [id], (err) => {
            if (err) {
              reject(err);
            } else {
              resolve({ success: true });
            }
          });
        }
      });
    });
  }
}

module.exports = ProductModel;