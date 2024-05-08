const db = require('../data/database');
const router = require('express').Router();

router.get('/', async function (req, res, next) {
    const result = await db.getDb().collection('batch').find().toArray();

    res.json(result)
})

router.post('/create-batch', async function (req, res, next) {
    const batchData = req.body;
    let result;

    try {
        const deptList = await db.getDb().collection('dept').find({}, { projection: { deptName: 1 } }).toArray();

        const data = {
            year: batchData.year,
            noOfSemester: batchData.noOfSemester,
            fees: {}
        }

        for (let i = 1; i <= batchData.noOfSemester; i++) {
            data.fees[`semester${i}Fees`] = batchData[`semester${i}Fees`];
            data.fees[`fees${i}Due`] = batchData[`fees${i}Due`];
        }
        
        let i = 0;

        while (i != deptList.length) {
            const branch = deptList[i].deptName
            data[branch] = { mentorId: null, mentorName: null };
            i++;
        }

        result = await db.getDb().collection('batch').insertOne(data);
    } catch (error) {
        console.log(error);
        next();
    }

    res.json(result);
});

module.exports = router;