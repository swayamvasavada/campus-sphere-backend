const router = require('express').Router();
const enquiryController = require('../controllers/enquiry.controller');

router.get('/', enquiryController.getAllEnquiries);

router.post('/submit-enquiry', enquiryController.addEnquiry);

router.post('/update-enquiry', )

module.exports = router;