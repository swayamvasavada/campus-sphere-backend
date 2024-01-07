const db = require('../data/database');
const dotenv = require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const { ObjectId } = require('mongodb');

const router = require('express').Router();

router.get('/pending-fees', async function (req, res, next) {
    let result;

    try {
        const userData = await db.getDb().collection('users').findOne({ _id: new ObjectId(res.locals.userId) });
        result = await db.getDb().collection('batch').findOne({ _id: new ObjectId(userData.batch) });

        // Filtering out pending fees
        for (let i = 1; i <= result.noOfSemester; i++) {
            if (userData.fees[`semester${i}Fees`]) {
                delete result.fees[`semester${i}Fees`];
                delete result.fees[`fees${i}Due`];
            }
        }

    } catch (error) {
        console.log(error);
        next();
    }
    res.json(result);
});

router.get('/paid-fees', async function (req, res, next) {
   let result;
   
   try {
    result = await db.getDb().collection('users').findOne({_id: new ObjectId(res.locals.userId), fees: {$exists: true}}, { projection: {_id: 0, name: 1, email: 1, fees: 1}});
   } catch (error) {
    console.log(error);
    next();
   }

   res.json(result);
});

router.post('/pay-now/:semesterNo', async function (req, res, next) {
    const semesterNo = req.params.semesterNo;
    let result;

    try {
        const userData = await db.getDb().collection('users').findOne({ _id: new ObjectId(res.locals.userId) });
        result = await db.getDb().collection('batch').findOne({ _id: new ObjectId(userData.batch) });

        const fees = result.fees[`semester${semesterNo}Fees`];
        const actualDueDate = result.fees[`fees${semesterNo}Due`];
        const penalty = new Date().getTime() > new Date(actualDueDate).getTime() ? 3000 : 0;

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: 'Tution Fees'
                        },
                        unit_amount: fees * 100
                    },
                    quantity: 1,
                },
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: 'Penalty'
                        },
                        unit_amount: penalty * 100
                    },
                    quantity: 1,
                }
            ],
            mode: 'payment',
            success_url: `${process.env.SERVER_URL}/handle-payment/${res.locals.userId}/${semesterNo}/${fees}/${penalty}`,
            cancel_url: `${process.env.FRONTEND_URL}/fees/failure`,
        });

        res.redirect(303, session.url);
    } catch (error) {
        console.error(error);
        next();
    }
});

module.exports = router;