let ObjectId = require('mongodb').ObjectId;
let bcrypt = require('bcryptjs');
let db = require('../data/database');

class User {
    constructor(userData, userId) {
        this.firstName = userData.firstName;
        this.lastName = userData.lastName;
        this.middleName = userData.middleName;
        this.colony = userData.colonyName;
        this.landmark = userData.landmark;
        this.area = userData.area;
        this.city = userData.city;
        this.pincode = userData.pincode;
        this.dob = userData.dob;
        this.gender = userData.gender;
        this.email = userData.email;
        this.password = userData.password;
        this.primaryNo = userData.primaryNo;
        this.alternateNo = userData.alternativeNo || null;
        this.desg = userData.desg;
        this.dept = userData.dept;
        this.id = userId;
    }

    static async fetchAll() {
        let result;
        try {
            result = await db.getDb().collection('users').find().toArray();
        } catch (error) {
            console.log(error);
            next();
            return;
        }

        return result;
    }

    static async fetchUser(userId) {
        let result;
        try {
            result = await db.getDb().collection('users').findOne({_id: new ObjectId(userId)});
        } catch (error) {
            console.log(error);
            next();
            return;
        }

        return result;
    }

    static async fetchAvailableMentor(deptId) {
        let result;
        try {
            result = await db.getDb().collection('users').find({ desg: "Faculty", mentoring: null, deptId: new ObjectId(deptId) }, { projection: { name: 1 } }).toArray();
        } catch (error) {
            console.log(error);
            next();
            return;
        }

        return result;
    }

    static async fetchAvailableHOD(deptId) {
        let result;
        try {
            console.log(deptId);
            result = await db.getDb().collection('users').find({ desg: "Faculty", deptId: new ObjectId(deptId) }, { projection: { name: 1 } }).toArray();
        } catch (error) {
            console.log(error);
            next();
            return;
        }

        return result;
    }

    static async fetchAllStudents() {
        let result;

        try {
            result = await db.getDb().collection('users').find({ desg: "Student" }).sort({ name: 1 }).toArray();
        } catch (error) {
            console.log(error);
            next();
        }

        return result;
    }

    async saveUser(batch) {

        if (this.id) {
            // Updating user

            const data = {
                name: { firstName: this.firstName, lastName: this.lastName },
                middleName: this.middleName,
                address: { colonyName: this.colony, landmark: this.landmark, area: this.area, city: this.city, pincode: this.pincode },
                dob: new Date(this.date),
                gender: this.gender,
                email: this.email,
                contact: { primaryNo: this.primaryNo, alternativeNo: this.alternateNo },
                desg: this.desg,
                dept: this.dept
            };

            const result = db.getDb().collection('users').updateOne({ _id: new ObjectId(this.id) }, { $set: data });

            return result;
        } else {

            // Creating new user
            const existingUser = await db.getDb().collection('users').findOne({ email: this.email });

            // Checking if user exists or not

            if (existingUser) {
                return { message: "User already exists!", userExist: true };
            }


            const hasedPassword = await bcrypt.hash(this.password, 12);

            const data = {
                name: { firstName: this.firstName, lastName: this.lastName },
                middleName: this.middleName,
                address: { colonyName: this.colony, landmark: this.landmark, area: this.area, city: this.city, pincode: this.pincode },
                dob: new Date(this.date),
                doj: new Date(),
                gender: this.gender,
                email: this.email,
                password: hasedPassword,
                contact: { primaryNo: this.primaryNo, alternativeNo: this.alternateNo },
                desg: this.desg,
            };
            if (this.desg == "Student" || this.desg == "Faculty") {
                data.deptId = new ObjectId(this.dept)
            }
            if (this.desg == "Student") {
                data.batch = batch;
            }

            let result;

            try {
                return result = await db.getDb().collection('users').insertOne(data);
            } catch (error) {
                console.log(result);
                next();
                return;
            }
        }

    }
}

module.exports = User;