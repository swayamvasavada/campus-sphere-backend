const router = require('express').Router();
const noticeController = require('../controllers/notice.cotroller');

router.get('/', noticeController.getNotices);

router.get('/summary', noticeController.getSummary);

router.get('/view/:noticeId', noticeController.getNoticeById);

router.post('/issue-notice', noticeController.issueNotice);

module.exports = router;