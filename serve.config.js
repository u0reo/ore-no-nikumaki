const serve = require('webpack-serve');
const config = require('./webpack.config.js');
const argv = {}
const options = { config, content: 'public/' ,open: true, port: 80 }

// serve({}, { config });
serve(argv, options);