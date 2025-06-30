const nodemailer = require('nodemailer');
const { ObjectId } = require('mongodb');
const db = require('../data/database');
const User = require('../models/user.model');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.email,
        pass: process.env.password
    }
});

async function getNotices(req, res, next) {
    let result;

    if (res.locals.desg === "Admin") {
        try {
            result = await db.getDb().collection('notices').find().toArray();
        } catch (error) {
            console.log(error);
            next(error);
        }
    } else if (res.locals.desg === "Faculty") {
        try {
            result = await db.getDb().collection('notices').find({ $or: [{ noticeLevel: 1 }, { noticeLevel: 2 }] }).sort({ issuedOn: -1 }).toArray();
        } catch (error) {
            console.log(error);
            next(error);
        }
    } else if (res.locals.desg === "Student") {
        try {
            result = await db.getDb().collection('notices').find({ $or: [{ noticeLevel: 1 }, { noticeLevel: 3 }] }).sort({ issuedOn: -1 }).toArray();
        } catch (error) {
            console.log(error);
            next(error);
        }
    } else {
        next(new Error("Something went wrong"));
    }

    res.json({
        hasError: false,
        data: result
    });
}

async function getSummary(req, res, next) {
    let result;
    
    if (res.locals.desg === "Admin") {
        try {
            result = await db.getDb().collection('notices').find().sort({ issuedOn: -1 }).limit(5).toArray();
        } catch (error) {
            next(error);
        }

        return res.json({
            hasError: false,
            data: result
        });
    } else if (res.locals.desg === "Student") {
        try {
            result = await db.getDb().collection('notices').find({ $or: [{ noticeLevel: 1 }, { noticeLevel: 3 }] }).sort({issuedOn: -1}).limit(5).toArray();
        } catch (error) {
            next(error);
        }

        return res.json({
            hasError: false,
            data: result
        });
    } else if (res.locals.desg === "Faculty" || res.locals.desg === "Librarian") {
        try {
            result = await db.getDb().collection('notices').find({ $or: [{ noticeLevel: 1 }, { noticeLevel: 2 }] }).sort({issuedOn: -1}).limit(5).toArray();
        } catch (error) {
            next(error);
        }

        return res.json({
            hasError: false,
            data: result
        });
    }
 
    return res.status(403).json({
        hasError: true,
        message: "Only authorized Admin can access this data"
    });
}

async function getNoticeById(req, res, next) {
    const noticeId = req.params.noticeId;
    let noticeResult;
    let userData;

    try {
        noticeResult = await db.getDb().collection('notices').findOne({ _id: new ObjectId(noticeId) });
        userData = await User.fetchUser(noticeResult.issuedBy);
    } catch (error) {
        console.log(error);
        next(error);
    }

    res.json({
        hasError: false,
        noticeData: noticeResult,
        userData: userData
    });
}

async function issueNotice(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    const formData = req.body;
    let result;
    let noticeData;
    try {
        noticeData = {
            noticeTitle: formData.noticeTitle,
            noticeMessage: formData.noticeMessage,
            issuedBy: res.locals.userId,
            issuedOn: new Date(),
            noticeLevel: +formData.noticeLevel
        };

        result = await db.getDb().collection('notices').insertOne(noticeData);
    } catch (error) {
        console.log(error);
        next(error);
    }

    let users;

    if (noticeData.noticeLevel === 1) {
        users = await db.getDb().collection('users').find({ $or: [{ desg: "Student" }, { desg: "Faculty" }, { desg: "Librarian" }] }).toArray();
    }

    if (noticeData.noticeLevel === 2) {
        users = await db.getDb().collection('users').find({ $or: [{ desg: "Faculty" }, { desg: "Librarian" }] }).toArray();
    }

    if (noticeData.noticeLevel === 3) {
        users = await db.getDb().collection('users').find({ desg: 'Student' }).toArray();
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

    res.json({
        hasError: false,
        message: "Notice has been issued successfully"
    });
}

module.exports = {
    getNotices: getNotices,
    getSummary: getSummary,
    getNoticeById: getNoticeById,
    issueNotice: issueNotice
}