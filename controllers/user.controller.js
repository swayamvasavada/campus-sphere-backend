const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

const User = require('../models/user.model');

dotenv.config()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.email,
        pass: process.env.password
    }
})

async function getAllUser(req, res, next) {
    let result;
    try {
        result = await User.fetchAll();
    } catch (error) {
        console.log(error);
        next();
        return;
    }

    res.json(result);
}

async function getUser(req, res, next) {
    const userId = req.params.id;
    let result;
    try {
        result = await User.fetchUser(userId);
    } catch (error) {
        console.log(error);
        next();
        return;
    }

    res.json(result);
}

async function registerUser(req, res, next) {
    const enteredData = req.body;
    console.log("inserting");
    let result;
    try {

        const userData = new User({ ...enteredData });
        result = await userData.saveUser(enteredData.batch);
    } catch (error) {
        console.log(error);
        return next();
    }

    const mailOptions = {
        from: 'Campus Sphere Addmission',
        to: enteredData.email,
        subject: 'Welcome to Campus Sphere!',
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registration Confirmation</title>
            <style>
                /* Media Queries */
                @media only screen and (max-width: 600px) {
                    .container {
                        width: 100% !important;
                    }
                }
            </style>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
        
        <!-- Container -->
        <table class="container" cellpadding="0" cellspacing="0" border="0" align="center" style="width: 600px; margin: auto;">
            <!-- Header -->
            <tr>
                <td align="center" bgcolor="#f8f8f8" style="padding: 40px 0;">
                    <h1 style="color: #333333;">Registration Confirmation</h1>
                </td>
            </tr>
            <!-- Content -->
            <tr>
                <td bgcolor="#ffffff" style="padding: 40px 30px;">
                    <p>Dear John,</p>
                    <p>Thank you for registering with us. Your account has been successfully created.</p>
                    <p>You can now <a href="http://https://campus-sphere-frontend.onrender.com/login">login here</a> to start exploring our services.</p>
                    <p>If you have any questions or need further assistance, feel free to contact us.</p>
                    <p>Best regards,<br>Example Company</p>
                </td>
            </tr>
            <!-- Footer -->
            <tr>
                <td bgcolor="#f8f8f8" align="center" style="padding: 20px 0;">
                    <p style="font-size: 14px; color: #999999;">This email was sent to you as a part of your registration with Campus Sphere. If you believe you have received this email in error, please disregard.</p>
                </td>
            </tr>
        </table>
        
        </body>
        </html>`
    };
    if (result.userExist) {
        return res.json(result);
    } else {
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        })
    }

    res.json(result);
}


async function updateUser(req, res, next) {
    const enteredData = req.body;
    const userId = req.params.id;

    let result;
    try {

        const userData = new User({ ...enteredData }, userId);
        result = await userData.saveUser();
    } catch (error) {
        console.log(error);
        return next();
    }

    res.json(result);
}

async function availableMentor(req, res, next) {
    let result;
    const deptId = req.params.deptId;

    try {
        result = await User.fetchAvailableMentor(deptId);
    } catch (error) {
        console.log(error);
        return next()
    }

    res.json(result);
}

async function availableHOD(req, res, next) {
    const deptId = req.params.deptId;
    let result;

    try {
        result = await User.fetchAvailableHOD(deptId);
    } catch (error) {
        console.log(error);
        return next();
    }

    console.log(result);
    res.json(result);
}

async function fetchAllStudents(req, res, next) {
    let result;

    try {
        result = await User.fetchAllStudents();
    } catch (error) {
        console.log(error);
        next();
    }

    console.log(result);
    res.json(result);
}

module.exports = {
    getUser: getUser,
    getAllUser: getAllUser,
    registerUser: registerUser,
    updateUser: updateUser,
    availableHOD: availableHOD,
    availableMentor: availableMentor,
    fetchAllStudents: fetchAllStudents
}