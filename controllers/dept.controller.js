const ObjectId = require('mongodb').ObjectId;
const db = require('../data/database');

async function fetchDept(req, res, next) {
    if (res.locals.desg !== "Admin" && res.locals.desg !== "Librarian") return res.status(403).json({
        hasError: true,
        message: "Only Authorized roles can access this data"
    });

    const result = await db.getDb().collection('dept').find().toArray();

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
        result = await db.getDb().collection('dept').countDocuments();
    } catch (error) {
        console.log("Error: ", error);
        next(error);
    }

    return res.json({
        hasError: false,
        result: result
    });
}

async function findDept(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    const deptId = req.params.deptId;
    const result = await db.getDb().collection('dept').findOne({ _id: new ObjectId(deptId) });

    res.json({
        hasError: false,
        data: result
    });
}

async function createDept(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    const deptData = req.body;
    let result;

    try {
        result = await db.getDb().collection('dept').insertOne({
            deptName: deptData.deptName,
        })
    } catch (error) {
        console.log(error);
        next(error);
    }

    res.json(result);
}

async function updateDept(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    const deptData = req.body;
    const deptId = req.params.deptId;
    let result;

    try {
        result = await db.getDb().collection('dept').updateOne({ _id: new ObjectId(deptId) }, {
            $set: {
                deptName: deptData.deptName,
            }
        });
    } catch (error) {
        console.log(error);
        next(error);
    }

    return res.json({
        hasError: false,
        message: 'Department updated successfully'
    });
}

async function deleteDept(req, res, next) {
    if (res.locals.desg !== "Admin") return res.status(403).json({
        hasError: true,
        message: "Only Authorized Admin can access this data"
    });

    const deptId = req.params.deptId;

    let result;
    try {
        result = await db.getDb().collection('dept').deleteOne({ _id: new ObjectId(deptId) });
    } catch (error) {
        console.log(error);
        next(error);
    }

    return res.json({
        hasError: false,
        messaage: "Department deleted successfully!"
    });
}

module.exports = {
    fetchDept: fetchDept,
    fetchSummary: fetchSummary,
    findDept: findDept,
    createDept: createDept,
    updateDept: updateDept,
    deleteDept: deleteDept
}