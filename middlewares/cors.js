function enableCors(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Access-Token');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    next();
}

module.exports = enableCors;