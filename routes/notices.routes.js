const router = require('express').Router();
const nodemailer = require('nodemailer');
const { ObjectId } = require('mongodb');
const db = require('../data/database');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.email,
        pass: process.env.password
    }
});

router.get('/', async function (req, res, next) {
    let result;

    try {
        result = await db.getDb().collection('notices').find().toArray();
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
});

router.get('/view/:noticeId', async function (req, res, next) {
    const noticeId = req.params.noticeId;
    let result;

    try {
        result = await db.getDb().collection('notices').findOne({ _id: new ObjectId(noticeId) });
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
})

router.get('/student-notices', async function (req, res, next) {
    let result;

    try {
        result = await db.getDb().collection('notices').find({ $or: [{ noticeLevel: '1' }, { noticeLevel: '2' }] }).sort({ issuedOn: -1 }).toArray();
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
});

router.get('/faculty-notices', async function (req, res, next) {
    let result;

    try {
        result = await db.getDb().collection('notices').find({ $or: [{ noticeLevel: '1' }, { noticeLevel: '3' }] }).sort({ issuedOn: -1 }).toArray();
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
});

router.post('/issue-notice', async function (req, res, next) {
    const formData = req.body;
    console.log(res.locals);
    console.log(res.locals.userId);
    let result;
    let noticeData;
    try {
        noticeData = {
            noticeTitle: formData.noticeTitle,
            noticeMessage: formData.noticeMessage,
            issuedBy: res.locals.userId,
            issuedOn: new Date(),
            noticeLevel: formData.noticeLevel
        };

        result = await db.getDb().collection('notices').insertOne(noticeData);
    } catch (error) {
        console.log(error);
        next();
    }

    let users;

    if (noticeData.noticeLevel == 1) {
        console.log('check 1');
        users = await db.getDb().collection('users').find({ $or: [{ desg: "Student" }, { desg: "Faculty" }] }).toArray();
    }

    if (noticeData.noticeLevel == 2) {
        users = await db.getDb().collection('users').find({ desg: 'Student' }).toArray();
    }

    if (noticeData.noticeLevel == 3) {
        users = await db.getDb().collection('users').find({ desg: 'Faculty' }).toArray();
    }
    console.log(users);
    for (const user of users) {
        let mailOptions = {
            from: '"Campus Sphere Notice', // Sender name and email address
            to: `${user.email}`, // Recipient email address
            subject: 'New Notice: Important Update from Campus Sphere', // Subject line
            text: 'There is new notice for you. This notice is sent by Campus Sphere.', // Plain text body
            html: '<p>There is new notice for you. This notice is sent by Campus Sphere.</p>, <a href="https://campus-sphere-frontend.onrender.com/dashboard"> Open Campus Sphere </a>' // HTML body
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message %s sent: %s', info.messageId, info.response);
        });
    }

    res.json(result);
});

module.exports = router;