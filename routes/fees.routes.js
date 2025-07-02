const router = require('express').Router();
const feesController = require('../controllers/fees.controller');

router.get('/payment-summary', feesController.fetchSummary);

router.get('/pending-fees', feesController.fetchPendingFees);

router.get('/paid-fees', feesController.fetchPaidFees);

router.post('/pay-now/:semesterNo', feesController.initiatePayment);

module.exports = router;