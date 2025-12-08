const express = require('express');
const router = express.Router();
const {
  createBorrow,
  returnBook,
  extendBorrow,
  deleteBorrow
} = require('../controllers/borrowController');

router.post('/', createBorrow);
router.put('/:id/return', returnBook);
router.put('/:id', extendBorrow);
router.delete('/:id', deleteBorrow);

module.exports = router;