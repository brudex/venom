const path = require('path');
const rootPath = path.normalize(__dirname + '/..');
const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    root: rootPath,
    app: {
      name: 'nodeapp'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/nodeapp-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'nodeapp'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://mongo/nodeapp-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'nodeapp'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://mongo:27017/nodeapp' //docker service name is mongo
  }
};

module.exports = config[env];
