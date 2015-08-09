var path = require('path');
var webpack = require('webpack');
var WebpackNotifierPlugin = require('webpack-notifier');

var config = {
    entry: {
        runtime: './ShaderRuntime.js'
    },
    output: {
        filename: 'shaderfrog-runtime.min.js',
        library: 'ShaderFrogRuntime',
        libraryTarget: 'var'
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
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    ]
};

module.exports = config;
