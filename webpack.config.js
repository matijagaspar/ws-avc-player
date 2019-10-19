const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'
const CopyWebpackPlugin = require('copy-webpack-plugin')
const BroadwayDir = path.resolve(__dirname, 'Broadway/Player')
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
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
                // the loader which should be applied, it'll be resolved relative to the context
                // -loader suffix is no longer optional in webpack2 for clarity reasons
                // see webpack 1 upgrade guide
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                '@babel/preset-env',
                                {
                                    useBuiltIns: 'usage',
                                    targets: '> 0.25%, not dead',
                                    corejs: '3',
                                    modules: 'amd',
                                },
                            ],
                        ],
                        plugins: [ '@babel/plugin-proposal-class-properties' ],
                    },
                },
            },

            // {
            //     test: /Decoder\.js$/,
            //     loader: 'string-replace-loader',
            //     options: {
            //         search: 'wasmBinaryFile="avc.wasm"',
            //         replace: 'wasmBinaryFile=require(\'Broadway/avc.wasm\')',
            //     },
            // },
            // {
            //     test: /Player\.js$/,
            //     loader: 'string-replace-loader',
            //     options: {
            //         search: 'this._config.workerFile = this._config.workerFile || "Decoder.js";',
            //         replace: 'this._config.workerFile = this._config.workerFile || require(\'Broadway/Decoder.js\')',
            //     },
            // },
            // {
            //     test: /Decoder\.js$/i,
            //     // type: 'javascript/auto',
            //     use: [
            //         {
            //             loader: 'file-loader',
            //         },
            //     ],
            // },
            // {
            //     test: /\.wasm$/i,
            //     type: 'javascript/auto',
            //     use: [
            //         {
            //             loader: 'file-loader',
            //             options: {
            //                 name: '[name].[contenthash].[ext]',
            //             },
            //         },
            //     ],
            // },
        ],
    },

    resolve: {
        modules: [ path.resolve(__dirname, 'player'), 'node_modules' ],
        alias: {
            Broadway: BroadwayDir,
        },
    },
    node: {
        fs: 'empty',
    },
    optimization: {
        minimize: isProduction,
        usedExports: isProduction,
    },
    mode: isProduction ? 'production' : 'development',
    plugins: [
        new CopyWebpackPlugin([
            {
                from: path.resolve(BroadwayDir, 'Decoder.js'),
                to: './',
            },
            {
                from: path.resolve(BroadwayDir, 'avc.wasm'),
                to: './',
            },
        ]),
    ],
}

module.exports = webpackConfig
