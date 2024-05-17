const jwt = require('jsonwebtoken');
const ObjectId = require('mongodb').ObjectId;

const db = require('../data/database');

async function checkRole(userId) {
    const result = await db.getDb().collection('users').findOne({ _id: new ObjectId(userId) }, { projection: { _id: 0, desg: 1 } })
    return result.desg;
}

function verifyToken(req, res, next) {
    const token = req.headers['x-access-token'] || req.body.token;
    
    if (!token) {
        return res.status(403).json({ message: 'Auth token unavailable!' });
    }

    let decodedData;

    jwt.verify(token, 'super-secret', async function (err, decode) {
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