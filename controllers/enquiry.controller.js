const db = require('../data/database');

async function getAllEnquiries(req, res, next) {
    const enquiries = await db.getDb().collection('enquiries').find().toArray();
    console.log(enquiries);
    res.json(enquiries);
}

async function addEnquiry(req, res, next) {
    const enquiryData = req.body;

    const data = {
        name: enquiryData.name,
        email: enquiryData.email,
        mobile: enquiryData.mobile,
        specialization: enquiryData.specialization,
        status: 'Waiting'
    }

    let result;

    try {
        result = await db.getDb().collection('enquiries').insertOne(data);
    } catch (error) {
        console.log(error);
        next();
        return;
    }

    res.json({
        message: "Enquiry added!"
    });
}

module.exports = {
    getAllEnquiries: getAllEnquiries,
    addEnquiry: addEnquiry
}