const router = require('express').Router();
const userController = require('../controllers/user.controller');

router.get('/users', userController.getAllUser);

router.get('/user-info', userController.getUserInfo);

router.get('/user/:id', userController.getUser);

router.get('/users/dept/:deptId', userController.getDeptUser);

router.get('/user-summary', userController.getSummary);

router.post('/create-user', userController.registerUser);

router.post('/update-user/:id', userController.updateUser);

router.post('/update-password', userController.updatePassword);

router.post('/delete-user/:id', userController.deleteUser);

router.get('/students', userController.fetchAllStudents);

module.exports = router;