var path = require('path');
var webpack = require('webpack');
var WebpackNotifierPlugin = require('webpack-notifier');

var config = {
    entry: {
        runtime: './ShaderRuntime.js'
    },
    output: {
        path: 'lib',
        filename: 'shaderfrog-runtime.js'
    },
    resolveLoader: {
        root: path.join(__dirname, 'scripts/loaders')
    },
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel-loader'
        }]
    },
    externals: {
        THREE: 'THREE',
        three: 'THREE'
    },
    plugins: [
        new webpack.NoErrorsPlugin()
    ]
};

module.exports = config;
