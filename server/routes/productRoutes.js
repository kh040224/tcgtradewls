const express = require('express');
const router = express.Router();
const ProductModel = require('../models/productModel');

router.get('/', async (req, res) => {
  try {
    const products = await ProductModel.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, items, password } = req.body;
    if (!title || !items || !password) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
    }
    const newProduct = await ProductModel.addProduct({ title, items, password });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: '비밀번호가 필요합니다.' });
    }
    
    await ProductModel.deleteProduct(req.params.id, password);
    res.status(204).send();
  } catch (error) {
    if (error.message === 'Product not found') {
      res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    } else if (error.message === 'Incorrect password') {
      res.status(400).json({ error: '비밀번호가 일치하지 않습니다.' });
    } else {
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  }
});

module.exports = router;