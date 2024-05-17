const router = require('express').Router();
const ObjectId = require('mongodb').ObjectId;

const db = require('../data/database');

router.get('/', async function (req, res, next) {
    const result = await db.getDb().collection('dept').find().toArray();

    res.json(result);
})

router.get('/:deptId', async function (req, res, next) {
    const deptId = req.params.deptId;
    const result = await db.getDb().collection('dept').findOne({ _id: new ObjectId(deptId) });

    res.json(result);
});

router.post('/create-dept', async function (req, res, next) {
    const deptData = req.body;
    let result;

    try {
        result = await db.getDb().collection('dept').insertOne({
            deptName: deptData.deptName,
            hodInfo: null
        })
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
});

router.post('/update-dept/:deptId', async function (req, res, next) {

    const deptId = req.params.deptId;
    const deptData = req.body;

    let userData = await db.getDb().collection('users').findOne({ _id: new ObjectId(deptData.hodId) }, { projection: { name: 1 } });
    let result;
    const deptInfo = {
        deptName: deptData.deptName,
        hodInfo: {
            hodId: new ObjectId(userData._id),
            hodName: userData.name.firstName + " " + userData.name.lastName
        }
    }
    try {
        result = await db.getDb().collection('dept').updateOne({ _id: new ObjectId(deptId) }, { $set: deptInfo });
    } catch (error) {
        console.log(error);
        next();
    }
    res.json(result);
});

router.post('/delete-dept/:deptId', async function (req, res, next) {
    const deptId = req.params.deptId;

    let result;
    try {
        result = await db.getDb().collection('dept').deleteOne({ _id: new ObjectId(deptId) });
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
})

module.exports = router;