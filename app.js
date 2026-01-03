const cluster = require('cluster');
const os = require('os');
const server = require('./server');

const numCpus = os.cpus().length;

if (cluster.isPrimary) {
    for (let i = 0; i < numCpus; i++) {
        cluster.fork();        
    }
} else {
    server();
}