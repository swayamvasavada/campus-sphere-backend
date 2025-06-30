function filterFees(userData, semesterNo) {
    for (const feesData of userData.fees) {
        if (feesData.semesterNo === semesterNo) return true;
    }
}

module.exports = filterFees;