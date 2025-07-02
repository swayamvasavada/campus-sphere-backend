const router = require('express').Router();
const batchController = require('../controllers/batch.controller');

router.get('/', batchController.fetchBatch);

router.get('/summary', batchController.fetchSummary);

router.get('/:batchId', batchController.findBatch);

router.post('/create-batch', batchController.createBatch);

router.post('/update-batch/:batchId', batchController.updateBatch);

router.post('/delete-batch/:batchId', batchController.deleteBatch);

module.exports = router;