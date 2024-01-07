const { ObjectId } = require('mongodb');
const db = require('../data/database');

const router = require('express').Router();

router.get('/handle-payment/:userId/:semesterNo/:fees/:penalty', function (req, res, next) {
    req.url = `/handle-success/${req.params.userId}/${req.params.semesterNo}/${req.params.fees}/${req.params.penalty}`;
    req.method = 'POST';

    router.handle(req, res, next);
});

router.post('/handle-success/:userId/:semesterNo/:fees/:penalty', async function (req, res, next) {
    let result;

    try {
        const semesterNo = req.params.semesterNo;
        const userData = await db.getDb().collection('users').findOne({ _id: new ObjectId(req.params.userId) });
        
        if (!userData.fees) {
            userData.fees = {};
        }

        userData.fees[`semester${semesterNo}Fees`] = {
            isPaid: true,
            paidOn: new Date(),
            amount: req.params.fees,
            penalty: req.params.penalty
        };

        result = await db.getDb().collection('users').updateOne({ _id: new ObjectId(req.params.userId) }, { $set: userData });
    } catch (error) {
        console.log(error);
        next();
    }

    res.redirect(303, 'http://localhost:3000/success');
});

module.exports = router;