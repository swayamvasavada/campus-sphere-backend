const jwt = require('jsonwebtoken');
const ObjectId = require('mongodb').ObjectId;
const dotenv = require('dotenv').config();

const db = require('../data/database');

async function checkRole(userId) {
    const result = await db.getDb().collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { _id: 0, desg: 1 } })
    return result.desg;
}

function verifyToken(req, res, next) {
    let authCredentials = req.cookies["authToken"];
    
    if (!authCredentials) {
        return res.status(401).json({ message: 'Auth token unavailable!' });
    }
    
    authCredentials = JSON.parse(authCredentials);
    
    let decodedData;

    jwt.verify(authCredentials.token, process.env.JWT_SECRET, async function (err, decode) {
        if (err) {
            console.log(err);
            return res.status(401).json({ message: 'Unauthorised user!' });
        }

        decodedData = decode.data;

        res.locals.userId = decodedData.id;
        res.locals.desg = await checkRole(decodedData.id);

        next();
    });
}

module.exports = verifyToken;