const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const db = require('../data/database');
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
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    let result;
    try {
        result = await User.fetchAll();
    } catch (error) {
        console.log(error);
        next(error);
        return;
    }

    res.json({
        hasError: false,
        data: result
    });
}

async function getUser(req, res, next) {
    const userId = req.params.id;

    if (userId !== res.locals.userId && res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    let result;
    try {
        result = await User.fetchUser(userId);
    } catch (error) {
        next(error);
        return;
    }

    res.json({
        hasError: false,
        data: result
    });
}

async function getUserInfo(req, res, next) {
    let result;

    try {
        result = await User.fetchUser(res.locals.userId);
    } catch (error) {
        next(error);
    }

    return res.json({
        hasError: false,
        data: result
    });
}

async function getDeptUser(req, res, next) {
    if (res.locals.desg !== "Admin" && res.locals.desg !== "Librarian") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin and Librarian can access this data"
    });

    const deptId = req.params.deptId;
    let result;
    try {
        result = await User.fetchDeptUser(deptId);
    } catch (error) {
        next(error);
    }

    return res.json({
        hasError: false,
        data: result
    });
}

async function getSummary(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });
    let result = {};

    try {
        result.studentCount = await db.getDb().collection('users').countDocuments({desg: "Student"});
        result.facultyCount = await db.getDb().collection('users').countDocuments({desg: "Faculty"});
        result.nonTeachingCount = await db.getDb().collection('users').countDocuments({$or: [{desg: "Admin"}, {desg: "Librarian"}]});
    } catch (error) {
        console.log("Error: ", error);
        next(error);
    }

    return res.json({
        hasError: false,
        result: result
    });
}

async function registerUser(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    const enteredData = req.body;
    let result;
    try {
        const userData = new User({ ...enteredData });
        result = await userData.saveUser(enteredData.batch);
    } catch (error) {
        console.log(error);
        return next(error);
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

    if (!userId === res.locals.userId && res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    let result;
    try {

        const userData = new User({ ...enteredData }, userId);
        result = await userData.saveUser(enteredData.batch);
    } catch (error) {
        console.log(error);
        return next(error);
    }

    res.json({
        hasError: false,
        dataL: result
    });
}

async function updatePassword(req, res, next) {
    try {
        if (req.body.password !== req.body['confirm-password']) {
            return res.status(400).json({
                hasError: true,
                message: "Password and Confirm password are not same!"
            });
        }

        const userData = await User.fetchUser(res.locals.userId);
        console.log("user data: ", userData);

        const passwordMatched = await bcrypt.compare(req.body["current-password"], userData.password);

        if (!passwordMatched) {
            return res.status(400).json({
                hasError: true,
                message: "Current Password is incorrect"
            });
        }

        const updateResult = await User.updatePassword(req.body.password, res.locals.userId);
        console.log(updateResult);

        if (updateResult.modifiedCount === 1) {
            return res.json({
                hasError: false,
                message: "Password has been updated"
            });
        }
    } catch (error) {
        console.log("Error: ", error);
        next(error);
    }
}

async function deleteUser(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    const userId = req.params.id;
    let result;

    try {
        result = await User.deleteUser(userId);

        if (result.deletedCount) {
            return res.json({
                hasError: false,
                message: "User deleted successfully!"
            });
        }
    } catch (error) {
        console.log("Error: ", error);
        next(error);
    }
}

async function fetchAllStudents(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    let result;
    try {
        result = await User.fetchAllStudents();
    } catch (error) {
        console.log(error);
        next(error);
    }

    res.json(result);
}

module.exports = {
    getUser: getUser,
    getUserInfo: getUserInfo,
    getDeptUser: getDeptUser,
    getAllUser: getAllUser,
    getSummary: getSummary,
    registerUser: registerUser,
    updateUser: updateUser,
    updatePassword: updatePassword,
    deleteUser: deleteUser,
    fetchAllStudents: fetchAllStudents
}