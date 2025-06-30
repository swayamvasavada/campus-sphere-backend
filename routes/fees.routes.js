const router = require('express').Router();
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const { ObjectId } = require('mongodb');
const dotenv = require('dotenv').config();

const db = require('../data/database');
const filterFees = require('../util/filter-fees');

router.get('/payment-summary', async function (req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });
    let result;

    try {
        const today = new Date("2025-07-08");
        const startDate = new Date();
        startDate.setDate(today.getDate() - 30);

        result = await db.getDb().collection('payments').find({ paidOn: { $gte: startDate, $lte: today } }).toArray();
    } catch (error) {
        next(error);
    }

    res.json({
        hasError: false,
        data: result
    });
});

router.get('/pending-fees', async function (req, res, next) {
    let result;

    try {
        const userData = await db.getDb().collection('users').findOne({ _id: new ObjectId(res.locals.userId) });
        result = await db.getDb().collection('batch').findOne({ _id: new ObjectId(userData.batch) });
        console.log("result: ", result);

        // Filtering out pending fees
        let count = 0;
        for (let i = 1; i <= result.noOfSemester; i++) {
            if (userData.fees && filterFees(userData, i)) {
                result.fees.splice(i - count - 1, 1);
                count++;
            }
        }

    } catch (error) {
        console.log(error);
        next(error);
    }
    res.json({
        hasError: false,
        data: result
    });
});

router.get('/paid-fees', async function (req, res, next) {
    let result;

    if (res.locals.desg === "Admin") {
        try {
            result = await db.getDb().collection('payments').find().toArray();
            for (let i = 0; i < result.length; i++) {
                const userData = await db.getDb().collection('users').findOne({ _id: new ObjectId(result[i].paidBy) }, { projection: { name: 1 } });
                result[i].userData = userData;
            }
        } catch (error) {
            next(error);
        }

        return res.json({
            hasError: false,
            data: result
        });
    } else if (res.locals.desg === "Student") {
        try {
            result = await db.getDb().collection('payments').find({ paidBy: new ObjectId(res.locals.userId) }).toArray();
        } catch (error) {
            console.log(error);
            next(error);
        }

        return res.json({
            hasError: false,
            data: result
        });
    }

    return res.status(403).json({
        hasError: true,
        message: "Access Denied!"
    })
});

router.post('/pay-now/:semesterNo', async function (req, res, next) {

    const semesterNo = req.params.semesterNo;
    let result;

    try {
        const userData = await db.getDb().collection('users').findOne({ _id: new ObjectId(res.locals.userId) });
        result = await db.getDb().collection('batch').findOne({ _id: new ObjectId(userData.batch) });

        if (!userData) {
            return res.status(404).json({
                hasError: true,
                message: 'User not found'
            });
        }
        if (!result) {
            return res.status(404).send({
                hasError: true,
                message: 'Batch not found'
            });
        }

        const fees = result.fees[semesterNo - 1][`fees`];
        const actualDueDate = result.fees[semesterNo - 1][`dueDate`];

        const todayDate = new Date().toISOString().split('T')[0]; // '2025-06-25'
        const dueDate = new Date(actualDueDate).toISOString().split('T')[0];

        const penalty = todayDate > dueDate ? 3000 : 0;

        if (!fees || !actualDueDate) {
            return res.status(400).json({
                hasError: true,
                message: 'Invalid semester fee data'
            });
        }

        const lineItems = [{
            price_data: {
                currency: 'inr',
                product_data: {
                    name: `Tution Fees - Sem ${semesterNo}`
                },
                unit_amount: fees * 100
            },
            quantity: 1,
        }];

        if (penalty > 0) {
            lineItems.push({
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: 'Penalty'
                    },
                    unit_amount: penalty * 100
                },
                quantity: 1,
            });
        }

        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.SERVER_URL}/handle-payment/{CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/fees/failure`,
            payment_intent_data: {
                metadata: {
                    userId: res.locals.userId,
                    semesterNo: semesterNo
                }
            },
            metadata: {
                userId: res.locals.userId,
                semesterNo: semesterNo
            }
        });

        res.redirect(303, session.url);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;