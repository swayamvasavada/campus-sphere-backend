const router = require('express').Router();
const userController = require('../controllers/user.controller');

router.get('/users', userController.getAllUser);

router.get('/user/:id', userController.getUser);

router.get('/available-hod/:deptId', userController.availableHOD);

router.get('/available-mentors/:deptId', userController.availableMentor);

router.post('/create-user', userController.registerUser);

router.post('/update-user/:id', userController.updateUser);

router.get('/students', userController.fetchAllStudents);

module.exports = router;