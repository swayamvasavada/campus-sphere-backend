const router = require('express').Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);

router.post('/request-reset', authController.requestReset);

router.post('/reset-password/:token', authController.resetPassword);

module.exports = router