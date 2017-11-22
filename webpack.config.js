const path = require('path')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const webpackConfig = {
    entry: {
        WSAvcPlayer: path.resolve(__dirname, 'player/WSAvcPlayer.js'),
    },
    output: {
        // options related to how webpack emits results

        path: path.resolve(__dirname, 'lib'), // string
        // the target directory for all output files
        // must be an absolute path (use the Node.js path module)
        filename: `[name].js`,
        library: '[name]',
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                // the loader which should be applied, it'll be resolved relative to the context
                // -loader suffix is no longer optional in webpack2 for clarity reasons
                // see webpack 1 upgrade guide

                options: {
                    presets: [
                        'stage-1',
                        [ 'env', {
                            'targets': {
                                'browsers': [ '>= 5%' ],
                            },
                        }],
                    ],
                },
            },
        ],
    },
    resolve: {
        modules: [ path.resolve(__dirname, 'player'), 'node_modules' ],
    },
    node: {
        fs: 'empty',
    },
    plugins: [],

}
if (process.env.NODE_ENV === 'production')
    webpackConfig.plugins.push(new UglifyJsPlugin())

module.exports = webpackConfig