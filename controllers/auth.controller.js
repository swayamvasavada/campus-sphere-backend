const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../data/database');

const dotenv = require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.email,
        pass: process.env.password
    }
});

async function login(req, res, next) {
    const enteredData = req.body;

    console.log("login");
    console.log(enteredData);

    let userData;
    try {
        userData = await db.getDb().collection('users').findOne({ email: enteredData.email }, { projection: { _id: 1, email: 1, password: 1, desg: 1 } });
    } catch (error) {
        console.log(error);
        next();
    }

    if (!userData) {
        return res.json({
            message: 'User does not exists',
            hasError: true
        });
    }

    const passwordAreEqual = await bcrypt.compare(enteredData.password, userData.password);

    if (!passwordAreEqual) {
        return res.json({
            message: 'Invalid password!',
            hasError: true
        });
    }

    const token = jwt.sign({ data: { id: userData._id, desg: userData.desg } }, 'super-secret', { expiresIn: 24 * 60 * 60 })
    res.json({
        token: token,
        desg: userData.desg
    });
}

async function requestReset(req, res, next) {
    const email = req.body.email;
    const userData = await db.getDb().collection('users').findOne({ email: email });

    console.log(userData);
    console.log(email);

    if (!userData) {
        return res.status(404).json({
            message: 'User does not exists',
            hasError: true
        });
    }

    try {
        const resetToken = jwt.sign({ email: userData.email }, 'super-secret', { expiresIn: 15 * 60 });
        const mailOptions = {
            from: 'Campus Sphere Technical Team',
            to: email,
            subject: 'Reset link for password!',
            html: `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset password</title>
            </head>
            <body>
                <p>Dear User,</p>
                <p>We received a request to reset your password. If you made this request, please click the link below to reset your password:</p>
                <p><a href="https://campus-sphere-frontend.onrender.com/reset-password/${resetToken}">Reset Password</a></p>
                <p>The link will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
                <p>Best regards,<br>Campus Sphere</p>
            </body>
            </html>`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return res.json({
                    message: 'Unfortunately! We could not reset your password at a moment!',
                    hasError: true
                })
            } else {
                console.log('Email sent: ' + info.response);
                return res.json({
                    message: 'We have sent you reset link on email'
                });
            }
        });
    } catch (error) {
        console.log(error);
        next();
    }
}

async function resetPassword(req, res, next) {
    const resetToken = req.params.token;
    const formData = req.body;

    let userEmail;
    jwt.verify(resetToken, 'super-secret', async function (err, decode) {
        if (err) {
            console.log(err);
            return res.json({ message: 'Reset link expired!' });
        }

        userEmail = decode.email;
        console.log(userEmail);
    });

    try {
        const hasedPassword = await bcrypt.hash(formData.password, 12);
        const result = await db.getDb().collection('users').updateOne({ email: userEmail }, { $set: { password: hasedPassword } });

        res.json({ message: "Password reseted" });
    } catch (error) {
        console.log(error);
        next();
    }
}

async function requestReset(req, res, next) {
    const email = req.body.email;
    const userData = await db.getDb().collection('users').findOne({ email: email });

    console.log(userData);
    console.log(email);

    if (!userData) {
        return res.status(404).json({
            message: 'User does not exists',
            hasError: true
        });
    }

    try {
        const resetToken = jwt.sign({ email: userData.email }, 'super-secret', { expiresIn: 15 * 60 });
        const mailOptions = {
            from: 'Campus Sphere Technical Team',
            to: email,
            subject: 'Reset link for password!',
            html: `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset password</title>
            </head>
            <body>
                <p>Dear User,</p>
                <p>We received a request to reset your password. If you made this request, please click the link below to reset your password:</p>
                <p><a href="http://localhost:3000/reset-password/${resetToken}">Reset Password</a></p>
                <p>The link will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
                <p>Best regards,<br>Campus Sphere</p>
            </body>
            </html>`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return res.json({
                    message: 'Unfortunately! We could not reset your password at a moment!',
                    hasError: true
                })
            } else {
                console.log('Email sent: ' + info.response);
                return res.json({
                    message: 'We have sent you reset link on email'
                });
            }
        });
    } catch (error) {
        console.log(error);
        next();
    }
}

async function resetPassword(req, res, next) {
    const resetToken = req.params.token;
    const formData = req.body;

    let userEmail;
    jwt.verify(resetToken, 'super-secret', async function (err, decode) {
        if (err) {
            console.log(err);
            return res.json({ message: 'Reset link expired!' });
        }

        userEmail = decode.email;
        console.log(userEmail);
    });

    try {
        const hasedPassword = await bcrypt.hash(formData.password, 12);
        const result = await db.getDb().collection('users').updateOne({ email: userEmail }, { $set: { password: hasedPassword } });

        res.json({ message: "Password reseted" });
    } catch (error) {
        console.log(error);
        next();
    }
}

module.exports = {
    login: login,
    requestReset: requestReset,
    resetPassword: resetPassword
}