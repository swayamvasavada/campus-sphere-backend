const router = require('express').Router();
const deptController = require('../controllers/dept.controller');

router.get('/', deptController.fetchDept);

router.get('/summary', deptController.fetchSummary);

router.get('/:deptId', deptController.findDept);

router.post('/create-dept', deptController.createDept);

router.post('/update-dept/:deptId', deptController.updateDept);

router.post('/delete-dept/:deptId', deptController.deleteDept);

module.exports = router;