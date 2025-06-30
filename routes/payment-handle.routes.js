const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const { ObjectId } = require('mongodb');
const db = require('../data/database');

const router = require('express').Router();

router.get('/handle-payment/:sessionId/', function (req, res, next) {
    req.url = `/handle-success/${req.params.sessionId}`;
    req.method = 'POST';
    router.handle(req, res, next);
});

router.post('/handle-success/:sessionId', async function (req, res, next) {
    let result;
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
        if (!session || session.payment_status !== 'paid') {
            next(new Error("Something went wrong!"));
            return;
        }

        const feesDetails = await stripe.checkout.sessions.listLineItems(req.params.sessionId, {
            limit: 2,
        });

        console.log("Fees details: ", feesDetails);
        

        const { userId, semesterNo } = session.metadata || {};
        if (!userId || !semesterNo) {
            return res.status(400).json({ hasError: true, message: 'Invalid session metadata' });
        }

        const paymentData = {
            payment_status: session.payment_status,
            title: feesDetails.data[0].description,
            amount: feesDetails.data[0].price.unit_amount / 100,
            paidOn: new Date(),
            paidBy: new ObjectId(userId)
        };
        
        if (feesDetails.data.length > 1) paymentData.penalty = feesDetails.data[1].price.unit_amount / 100;
        const paymentResult = await db.getDb().collection('payments').insertOne(paymentData);

        const userData = await db.getDb().collection('users').findOne({ _id: new ObjectId(userId) });
        if (!userData.fees) userData.fees = [];

        const feesData = {
            semesterNo: +semesterNo,
            title: feesDetails.data[0].description,
            paymentInfo: paymentResult.insertedId
        }
        
        userData.fees.push(feesData);

        result = await db.getDb().collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: userData });
    } catch (error) {
        console.log(error);
        next(error);
    }

    res.redirect(303, `${process.env.FRONTEND_URL}/success`);
});

module.exports = router;