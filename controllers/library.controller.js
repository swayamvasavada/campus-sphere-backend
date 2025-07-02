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

async function fetchBooks(req, res, next) {
    let result;

    try {
        result = await db.getDb().collection('library').find().toArray();
    } catch (error) {
        console.log(error);
        next(error);
    }

    res.json({
        hasError: false,
        data: result
    });
}

async function fetchSummary(req, res, next) {
    let result = {};

    if (res.locals.desg === "Admin") {
        try {
            result = await db.getDb().collection('library').aggregate([{ $group: { _id: null, totalBooks: { $sum: "$totalBooks" } } }]).toArray();
        } catch (error) {
            next(error);
        }

        return res.json({
            hasError: false,
            data: result[0]
        });
    } else if (res.locals.desg === "Librarian") {
        try {
            result.totalBooks = await db.getDb().collection('library').countDocuments();
            const totalNoBooks = await db.getDb().collection('library').aggregate([{ $group: { _id: null, totalNoBooks: { $sum: "$totalBooks" } } }]).toArray();
            const totalIssued = await db.getDb().collection('library').aggregate([{ $group: { _id: null, totalIssued: { $sum: "$issuedBooks" } } }]).toArray();

            result.totalNoBooks = totalNoBooks[0]["totalNoBooks"];
            result.totalIssued = totalIssued[0]["totalIssued"];

            return res.json({
                hasError: false,
                data: result
            })
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
        message: "Only Authorized Personnel can access this data"
    });
}

async function fetchIssuedBook(req, res, next) {
    if (res.locals.desg !== "Librarian") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Librarian can access this data"
    });

    let result;
    try {
        result = await db.getDb().collection('library.issued').find().toArray();
    } catch (error) {
        console.log(error);
        next(error);
    }

    res.json({
        hasError: false,
        data: result
    });
}

async function sendAutoRemainder(req, res, next) {
    const tomorrowStart = new Date();
    tomorrowStart.setHours(24, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    let issuerList;
    let result;
    try {
        issuerList = await db.getDb().collection('library.issued').find({ returnDate: { $gte: tomorrowStart, $lt: tomorrowEnd } }).toArray();;
    } catch (error) {
        next(error);
    }

    if (issuerList.length === 0) {
        return res.json({
            hasError: false,
            message: "No remainders to send"
        });
    }

    for (const issuer of issuerList) {
        console.log("Issuer: ", issuer);

        const userDetail = await User.fetchUser(issuer.userId);
        const humanReadableDate = new Date(issuer.returnDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        let mailOptions = {
            from: 'Campus Sphere Library',
            to: userDetail.email,
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
                        <p>Dear ${userDetail.name.firstName + " " + userDetail.name.lastName},</p>
                        <p>We hope this email finds you well.</p>
                        <p>This is a friendly reminder regarding the book titled "<strong>${issuer.bookName}</strong>" that you borrowed from our library. As per our records, the due date for returning the book is <strong>${humanReadableDate}</strong>.</p>
                        <p>We kindly request you to return the book by the due date to avoid any inconvenience. In case, you require an extension or have any concerns regarding the return, please don't hesitate to contact us at <strong>Library</strong>.</p>
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
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }

    return res.json({
        hasError: false,
        message: "Reminder has been send!"
    });
}

async function findBook(req, res, next) {
    if (res.locals.desg !== "Librarian") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Librarian can access this data"
    });

    const bookId = req.params.bookId;

    try {
        const result = await db.getDb().collection("library").findOne({ _id: new ObjectId(bookId) })
        if (!result._id) {
            return res.status(404).json({
                hasError: true,
                message: "Seems like this book has been deleted"
            });
        }

        return res.json({
            hasError: false,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

async function addBook(req, res, next) {
    if (res.locals.desg !== "Librarian") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Librarian can access this data"
    });

    const formData = req.body;
    const bookData = {
        bookName: formData.bookName,
        author: formData.author,
        totalBooks: +formData.totalBooks,
        issuedBooks: 0
    };

    let result;
    try {
        result = await db.getDb().collection('library').insertOne(bookData);
    } catch (error) {
        console.log(error);
        next(error);
    }

    res.json(result);
}

async function deleteBook(req, res, next) {
    if (res.locals.desg !== "Librarian") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Librarian can access this data"
    });

    const bookId = req.params.bookId;
    let result;

    try {
        result = await db.getDb().collection('library').deleteOne({ _id: new ObjectId(bookId) });
    } catch (error) {
        console.log(error);
        next(error);
    }

    res.json(result);
}

async function updateBook(req, res, next) {
    if (res.locals.desg !== "Librarian") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Librarian can access this data"
    });

    const bookId = req.params.bookId;
    const bookData = {
        bookName: req.body.bookName,
        author: req.body.author,
        totalBooks: +req.body.totalBooks,
    };

    let result;

    try {
        result = await db.getDb().collection('library').updateOne({ _id: new ObjectId(bookId) }, { $set: bookData });
    } catch (error) {
        console.log(error);
        next(error);
    }

    res.json(result);
}

async function issueBook(req, res, next) {
    if (res.locals.desg !== "Librarian") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Librarian can access this data"
    });

    const bookId = req.params.bookId;
    const formData = req.body;

    let result;

    try {

        const userDetails = await db.getDb().collection('users').findOne({ _id: new ObjectId(formData.userId) });
        const bookDetails = await db.getDb().collection('library').findOne({ _id: new ObjectId(bookId) });

        if (bookDetails.totalBooks === bookDetails.issuedBooks) {
            return res.status(409).json({
                hasError: true,
                message: 'This book is currently not available to issue!'
            });
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        const issuerDetail = {
            bookId: bookId,
            bookName: bookDetails.bookName,
            issuedOn: new Date(),
            returnDate: dueDate,
            userId: formData.userId,
            username: userDetails.name.firstName + " " + userDetails.name.lastName
        };

        result = await db.getDb().collection('library.issued').insertOne(issuerDetail);

        if (result.insertedId) {
            const bookData = await db.getDb().collection('library').findOne({ _id: new ObjectId(bookId) });

            result = await db.getDb().collection('library').updateOne({ _id: new ObjectId(bookId) }, { $set: { issuedBooks: bookData.issuedBooks + 1 } });
        }
    } catch (error) {
        console.log(error);
        next(error);
    }

    res.json(result);
}

async function issuerDetail(req, res, next) {
    const issuerId = req.params.issuerId;
    let issuerDetails, userDetails, bookDetails;
    try {
        issuerDetails = await db.getDb().collection('library.issued').findOne({ _id: new ObjectId(issuerId) });
        userDetails = await db.getDb().collection('users').findOne({ _id: new ObjectId(issuerDetails.userId) });
        bookDetails = await db.getDb().collection('library').findOne({ _id: new ObjectId(issuerDetails.bookId) });

        const detpData = await db.getDb().collection('dept').findOne({ _id: new ObjectId(userDetails.dept) });
        userDetails.dept = detpData;

        const batchData = await db.getDb().collection('batch').findOne({ _id: new ObjectId(userDetails.batch) });
        userDetails.batch = batchData;
    } catch (error) {
        next(error);
    }

    res.json({
        hasError: false,
        issuerDetails: issuerDetails,
        userDetails: userDetails,
        bookDetails: bookDetails
    });
}

async function returnBook(req, res, next) {
    if (res.locals.desg !== "Librarian") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Librarian can access this data"
    });

    const issuerId = req.params.issuerId;
    console.log("Issuer id: ", issuerId);

    let result;

    try {
        const issuerData = await db.getDb().collection('library.issued').findOne({ _id: new ObjectId(issuerId) });
        console.log("Issuer data: ", issuerData);

        result = await db.getDb().collection('library.issued').deleteOne({ _id: new ObjectId(issuerId) });
        console.log("Result: ", result);

        if (result.deletedCount) {
            const bookDetails = await db.getDb().collection('library').findOne({ _id: new ObjectId(issuerData.bookId) });
            const libraryResult = await db.getDb().collection('library').updateOne({ _id: new ObjectId(issuerData.bookId) }, { $set: { issuedBooks: bookDetails.issuedBooks - 1 } });
        }
    } catch (error) {
        console.log(error);
        next(error);
    }

    res.json({
        hasError: false,
        message: "Book has been returned!"
    });
}

async function manualRemainder(req, res, next) {
    const issueId = req.params.issueId;
    let result;
    try {
        const issueDetails = await db.getDb().collection('library.issued').findOne({ _id: new ObjectId(issueId) });
        const userDetails = await db.getDb().collection('users').findOne({ _id: new ObjectId(issueDetails.userId) });
        const humanReadableDate = new Date(issueDetails.returnDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

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
                        <p>We kindly request you to return the book by the due date to avoid any inconvenience. In case, you require an extension or have any concerns regarding the return, please don't hesitate to contact us at <strong>Library</strong>.</p>
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
                    hasError: false,
                    message: 'Something went wrong while sending email!'
                }
            } else {
                console.log('Email sent: ' + info.response);
                result = {
                    hasError: false,
                    message: 'Reminder has been sent!'
                }

            }
            return res.json(result);
        });

    } catch (error) {
        console.log(error);
        next(error);
    }

}

async function userIssues(req, res, next) {
    const studentId = res.locals.userId;
    let result;

    try {
        result = await db.getDb().collection('library.issued').find({ userId: studentId }).toArray();
    } catch (error) {
        console.log(error);
        next(error);
    }

    res.json(result);
}

module.exports = {
    fetchBooks: fetchBooks,
    fetchSummary: fetchSummary,
    fetchIssuedBook: fetchIssuedBook,
    sendAutoRemainder: sendAutoRemainder,
    findBook: findBook,
    addBook: addBook,
    deleteBook: deleteBook,
    updateBook: updateBook,
    issueBook: issueBook,
    issuerDetail: issuerDetail,
    returnBook: returnBook,
    manualRemainder: manualRemainder,
    userIssues: userIssues
}