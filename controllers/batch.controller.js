const ObjectId = require('mongodb').ObjectId
const db = require('../data/database');

async function fetchBatch(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });
    const result = await db.getDb().collection('batch').find().toArray();

    res.json({
        hasError: false,
        data: result
    });
}

async function fetchSummary(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });
    let result;

    try {
        result = await db.getDb().collection('batch').countDocuments();
    } catch (error) {
        console.log("Error: ", error);
        next(error);
    }

    return res.json({
        hasError: false,
        result: result
    });
}

async function findBatch(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    const batchId = req.params.batchId;
    try {
        const result = await db.getDb().collection('batch').findOne({ _id: new ObjectId(batchId) });
        if (result._id) {
            return res.json({
                hasError: false,
                data: result
            });
        }

        return res.status(404).json({
            hasError: true,
            message: "Batch not found!"
        });
    } catch (error) {
        console.log("Error: ", error);
        next(error);
    }
}

async function createBatch(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    const batchData = req.body;
    let result;

    try {
        const data = {
            year: batchData.year,
            noOfSemester: batchData.noOfSemester,
            fees: []
        }

        for (let i = 1; i <= batchData.noOfSemester; i++) {
            const fees = {};
            fees.semesterNo = +i;
            fees.fees = batchData[`semester${i}Fees`];
            fees.dueDate = batchData[`fees${i}Due`];

            data.fees.push(fees);
        }

        result = await db.getDb().collection('batch').insertOne(data);
    } catch (error) {
        console.log(error);
        next(error);
    }

    res.json({
        hasError: false,
        message: "Batch created successfully"
    });
}

async function updateBatch(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    const batchData = req.body;
    const batchId = req.params.batchId;
    let result;

    try {
        const data = {
            year: batchData.year,
            noOfSemester: batchData.noOfSemester,
            fees: []
        }

        for (let i = 1; i <= batchData.noOfSemester; i++) {
            const fees = {};
            fees.semesterNo = +i;
            fees.fees = batchData[`semester${i}Fees`];
            fees.dueDate = batchData[`fees${i}Due`];

            data.fees.push(fees);
        }

        result = await db.getDb().collection('batch').updateOne({ _id: new ObjectId(batchId) }, { $set: data });
    } catch (error) {
        console.log(error);
        next(error);
    }

    res.json({
        hasError: false,
        message: "Batch created successfully"
    });
}

async function deleteBatch(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    const batchId = req.params.batchId;

    let result;
    try {
        result = await db.getDb().collection('batch').deleteOne({ _id: new ObjectId(batchId) });
    } catch (error) {
        console.log(error);
        next(error);
    }

    if (result.deletedCount) {
        return res.json({
            hasError: false,
            messaage: "Batch deleted successfully!"
        });
    }

    res.json({
        hasError: true,
        message: "Something went wrong!"
    });
}

module.exports = {
    fetchBatch: fetchBatch,
    fetchSummary: fetchSummary,
    findBatch: findBatch,
    createBatch: createBatch,
    updateBatch: updateBatch,
    deleteBatch: deleteBatch
}