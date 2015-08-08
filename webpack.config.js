var path = require('path');
var webpack = require('webpack');
var WebpackNotifierPlugin = require('webpack-notifier');

var config = {
    entry: {
        runtime: './ShaderRuntime.js'
    },
    output: {
        path: path.join(__dirname, 'public/'),
        filename: 'shaderfrog-runtime.min.js',
        publicPath: 'http://s3-us-west-1.amazonaws.com/shader-frog/'
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
        THREE: 'THREE'
    },
    plugins: [
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    ]
};

module.exports = config;
