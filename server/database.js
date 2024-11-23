const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./products.db');

// 데이터베이스 초기화
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    items TEXT,
    password TEXT
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS sold_items (
    product_id INTEGER,
    item_index INTEGER,
    is_sold BOOLEAN,
    PRIMARY KEY (product_id, item_index),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`);
});

// 상품 목록 조회
function getProducts() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, title, items FROM products', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// 새 상품 추가
function addProduct(title, items, password) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO products (title, items, password) VALUES (?, ?, ?)',
      [title, items, password],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, title, items });
      }
    );
  });
}

// 상품 삭제
function deleteProduct(id, password) {
  return new Promise((resolve, reject) => {
    db.get('SELECT password FROM products WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else if (!row) reject(new Error('상품을 찾을 수 없습니다.'));
      else if (row.password !== password) reject(new Error('비밀번호가 일치하지 않습니다.'));
      else {
        db.run('DELETE FROM products WHERE id = ?', [id], (err) => {
          if (err) reject(err);
          else {
            db.run('DELETE FROM sold_items WHERE product_id = ?', [id]);
            resolve({ message: '상품이 삭제되었습니다.' });
          }
        });
      }
    });
  });
}

// 상품 수정
function updateProduct(id, title, items, password) {
  return new Promise((resolve, reject) => {
    db.get('SELECT password FROM products WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else if (!row) reject(new Error('상품을 찾을 수 없습니다.'));
      else if (row.password !== password) reject(new Error('비밀번호가 일치하지 않습니다.'));
      else {
        db.run('UPDATE products SET title = ?, items = ? WHERE id = ?', [title, items, id], (err) => {
          if (err) reject(err);
          else resolve({ message: '상품이 수정되었습니다.' });
        });
      }
    });
  });
}

// 판매 상태 변경
function changeSoldStatus(id, password, itemIndex) {
  return new Promise((resolve, reject) => {
    db.get('SELECT password FROM products WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else if (!row) reject(new Error('상품을 찾을 수 없습니다.'));
      else if (row.password !== password) reject(new Error('비밀번호가 일치하지 않습니다.'));
      else {
        db.get('SELECT is_sold FROM sold_items WHERE product_id = ? AND item_index = ?', [id, itemIndex], (err, soldRow) => {
          if (err) reject(err);
          else {
            const newSoldStatus = soldRow ? !soldRow.is_sold : true;
            const query = soldRow
              ? 'UPDATE sold_items SET is_sold = ? WHERE product_id = ? AND item_index = ?'
              : 'INSERT INTO sold_items (is_sold, product_id, item_index) VALUES (?, ?, ?)';
            
            db.run(query, [newSoldStatus, id, itemIndex], (err) => {
              if (err) reject(err);
              else resolve({ message: '판매 상태가 변경되었습니다.', isSold: newSoldStatus });
            });
          }
        });
      }
    });
  });
}

// 판매 상태 조회
function getSoldStatus() {
  return new Promise((resolve, reject) => {
    db.all('SELECT product_id, item_index, is_sold FROM sold_items', (err, rows) => {
      if (err) reject(err);
      else {
        const soldStatus = rows.reduce((acc, row) => {
          if (!acc[row.product_id]) {
            acc[row.product_id] = {};
          }
          acc[row.product_id][row.item_index] = row.is_sold;
          return acc;
        }, {});
        resolve(soldStatus);
      }
    });
  });
}

module.exports = {
  getProducts,
  addProduct,
  deleteProduct,
  updateProduct,
  changeSoldStatus,
  getSoldStatus
};