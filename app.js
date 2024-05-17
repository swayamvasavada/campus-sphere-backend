const express = require('express');
const db = require('./data/database');
const authRoutes = require('./routes/auth.routes');
const enquiryRoutes = require('./routes/enquiry.routes');
const userRoutes = require('./routes/user.routes');
const batchRoutes = require('./routes/batch.routes');
const deptRoutes = require('./routes/dept.routes');
const libraryRoutes = require('./routes/library.routes');
const noticeRoutes = require('./routes/notices.routes');
const feesRoutes = require('./routes/fees.routes');
const paymentHandleRoutes = require('./routes/fees-handle.routes');
const cors = require('cors');
const tokenVerification = require('./middlewares/jwt-verify');

const app = express();

app.use(cors());
// app.use(enableCors);
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
        message: 'Something went wrong!',
    });
});

db.connectToDatabase().then(function () {
    app.listen(5000);
});