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
            console.log("Error: ", error);
            throw error;
        }

        return result;
    }

    static async fetchUser(userId) {
        let result;
        try {
            result = await db.getDb().collection('users').findOne({ _id: new ObjectId(userId) });

            const deptData = await db.getDb().collection('dept').findOne({ _id: new ObjectId(result.dept) });
            result.dept = deptData;

            const batchData = await db.getDb().collection('batch').findOne({ _id: new ObjectId(result.batch) });
            result.batch = batchData;
        } catch (error) {
            console.log("Error: ", error);
            throw error;
        }

        return result;
    }

    static async fetchDeptUser(deptId) {
        try {
            const result = await db.getDb().collection('users').find({ dept: new ObjectId(deptId) }).toArray();
            console.log("Users: ", result);

            return result;
        } catch (error) {
            throw error;
        }
    }

    static async fetchSummary() {
        let result;

        try {
            result = await db.getDb().collection('users').countDocuments();
        } catch (error) {
            console.log("Error: ", error);
            throw error;
        }

        return result;
    }

    static async fetchAllStudents() {
        let result;

        try {
            result = await db.getDb().collection('users').find({ desg: "Student" }).sort({ name: 1 }).toArray();
        } catch (error) {
            console.log(error);
            throw error;
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
                dob: new Date(this.dob),
                gender: this.gender,
                email: this.email,
                contact: { primaryNo: this.primaryNo, alternativeNo: this.alternateNo },
                desg: this.desg,
                dept: new ObjectId(this.dept)
            };

            if (this.desg === "Student") {
                data.batch = batch;
            }
            
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
                dob: new Date(this.dob),
                doj: new Date(),
                gender: this.gender,
                email: this.email,
                password: hasedPassword,
                contact: { primaryNo: this.primaryNo, alternativeNo: this.alternateNo },
                desg: this.desg,
            };
            if (this.desg == "Student" || this.desg == "Faculty") {
                data.dept = new ObjectId(this.dept)
            }
            if (this.desg == "Student") {
                data.batch = batch;
            }

            console.log(data);


            let result;

            try {
                return result = await db.getDb().collection('users').insertOne(data);
            } catch (error) {
                console.log("Error: ", error);
                throw error;
            }
        }

    }

    static async updatePassword(newPassword, userId) {
        let result;
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            result = db.getDb().collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { password: hashedPassword } });
            return result;
        } catch (error) {
            console.log("Error: ", error);
            throw error;
        }
    }

    static async deleteUser(userId) {
        let result;

        try {
            result = await db.getDb().collection('users').deleteOne({ _id: new ObjectId(userId) });
            return result;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;