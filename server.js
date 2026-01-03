const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const dotenv = require('dotenv').config();

const db = require('./data/database');
const authRoutes = require('./routes/auth.routes');
const enquiryRoutes = require('./routes/enquiry.routes');
const userRoutes = require('./routes/user.routes');
const batchRoutes = require('./routes/batch.routes');
const deptRoutes = require('./routes/dept.routes');
const libraryRoutes = require('./routes/library.routes');
const noticeRoutes = require('./routes/notices.routes');
const feesRoutes = require('./routes/fees.routes');
const paymentHandleRoutes = require('./routes/payment-handle.routes');
const tokenVerification = require('./middlewares/jwt-verify');

function startServer() {

    const app = express();

    app.use(cors({
        credentials: true,
        origin: process.env.FRONTEND_URL
    }));

    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(authRoutes);
    app.use(paymentHandleRoutes);
    app.use(tokenVerification);
    app.use('/enquiry', enquiryRoutes);
    app.use(userRoutes);
    app.use('/dept', deptRoutes);
    app.use('/batch', batchRoutes);
    app.use('/library', libraryRoutes);
    app.use('/notice', noticeRoutes);
    app.use('/fees', feesRoutes);

    app.use(function (error, req, res, next) {
        console.log(error);
        res.status(500).json({
            hasError: true,
            message: 'Something went wrong!',
        });
    });

    db.connectToDatabase().then(function () {
        console.log(`Server started on PORT ${process.env.PORT}`);
        app.listen(process.env.PORT);
    });
}

module.exports = startServer;