const nodemailer = require('nodemailer');
const router = require('express').Router();
const { ObjectId } = require('mongodb');
const db = require('../data/database');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.email,
        pass: process.env.password
    }
})

router.get('/', async function (req, res, next) {
    let result;

    try {
        result = await db.getDb().collection('library').find().toArray();
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
});

router.post('/add-books', async function (req, res, next) {
    const formData = req.body;
    const bookData = {
        bookName: formData.bookName,
        author: formData.author,
        totalBooks: formData.totalBooks,
        issuedBooks: 0
    };

    let result;
    try {
        result = await db.getDb().collection('library').insertOne(bookData);
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
});

router.post('/delete-books/:bookId', async function (req, res, next) {
    const bookId = req.params.bookId;
    let result;

    try {
        result = await db.getDb().collection('library').deleteOne({ _id: new ObjectId(bookId) });
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
});

router.post('/update-record/:bookId', async function (req, res, next) {
    const bookId = req.params.bookId;
    const formData = req.body;

    let result;

    try {
        result = await db.getDb().collection('library').updateOne({ _id: new ObjectId(bookId) }, { $set: formData });
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
});

router.get('/issued-books', async function (req, res, next) {
    let result;
    try {
        result = await db.getDb().collection('library.issued').find().toArray();
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
});

router.post('/issue-book/:bookId', async function (req, res, next) {
    const bookId = req.params.bookId;
    const formData = req.body;

    let result;

    try {

        const userDetails = await db.getDb().collection('users').findOne({ _id: new ObjectId(formData.userId) });
        const bookDetails = await db.getDb().collection('library').findOne({ _id: new ObjectId(bookId) });

        const issuerDetail = {
            bookId: bookId,
            bookName: bookDetails.bookName,
            returnDate: formData.returnDate,
            userId: formData.userId,
            userName: userDetails.name.firstName + " " + userDetails.name.lastName
        };

        result = await db.getDb().collection('library.issued').insertOne(issuerDetail);

        if (result.insertedId) {
            const bookData = await db.getDb().collection('library').findOne({ _id: new ObjectId(bookId) });

            const result = await db.getDb().collection('library').updateOne({ _id: new ObjectId(bookId) }, { $set: { issuedBooks: bookData.issuedBooks + 1 } });
            console.log(result);
        }
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
});

router.post('/return-book/:bookId', async function (req, res, next) {
    console.log('trying to delete');
    const bookId = req.params.bookId;
    let result;

    try {
        result = await db.getDb().collection('library.issued').deleteOne({ bookId: bookId });

        console.log(result);
        if (result.deletedCount) {
            console.log('trying to update record');
            const bookDetails = await db.getDb().collection('library').findOne({ _id: new ObjectId(bookId) });
            const libraryResult = await db.getDb().collection('library').updateOne({ _id: new ObjectId(bookId) }, { $set: { issuedBooks: bookDetails.issuedBooks - 1 } });
        }
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
});

router.post('/reminder/:issueId', async function (req, res, next) {
    const issueId = req.params.issueId;
    var result;
    try {
        const issueDetails = await db.getDb().collection('library.issued').findOne({ _id: new ObjectId(issueId) });
        const userDetails = await db.getDb().collection('users').findOne({ _id: new ObjectId(issueDetails.userId) });
        const humanReadableDate = new Date(issueDetails.returnDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })

        let mailOptions = {
            from: 'Campus Sphere Library',
            to: userDetails.email,
            subject: 'Reminder: Return Book Issued from Library',
            html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Library Book Reminder</title>
                    <style>
                        /* CSS styles from the HTML template */
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Library Book Reminder</h2>
                        <p>Dear ${userDetails.name.firstName + " " + userDetails.name.lastName},</p>
                        <p>We hope this email finds you well.</p>
                        <p>This is a friendly reminder regarding the book titled "<strong>${issueDetails.bookName}</strong>" that you borrowed from our library. As per our records, the due date for returning the book is <strong>${humanReadableDate}</strong>.</p>
                        <p>We kindly request you to return the book by the due date to avoid any inconvenience. Should you require an extension or have any concerns regarding the return, please don't hesitate to contact us at <strong>Library</strong>.</p>
                        <p>Thank you for your cooperation in maintaining the smooth functioning of our library services.</p>
                        <p>Best regards,</p>
                        <p><strong>Campus Sphere</strong></p>
                    </div>
                </body>
                </html>
            `
        };


        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                result = {
                    message: 'Something went wrong while sending email!'
                }
            } else {
                console.log('Email sent: ' + info.response);
                result = {
                    message: 'Reminder has been sent!'
                }

                return res.json(result);
            }
        });

    } catch (error) {
        console.log(error);
        next();
    }

});

router.get('/my-issues', async function (req, res, next) {
    const studentId = res.locals.userId;
    let result;

    try {
        result = await db.getDb().collection('library.issued').find({ userId: studentId }).toArray();
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
});

module.exports = router;