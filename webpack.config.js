const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'
const CopyWebpackPlugin = require('copy-webpack-plugin')
const BroadwayDir = path.resolve(__dirname, 'Broadway/Player')
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const webpackConfig = {
    entry: {
        WSAvcPlayer: path.resolve(__dirname, 'player/WSAvcPlayer.js'),
        Decoder: path.resolve(BroadwayDir, 'Decoder.js'),
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
        globalObject: 'this',
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
            // npm install url-loader --save-dev


            // {
            //     test: /Player\.js$/,
            //     loader: 'string-replace-loader',
            //     options: {
            //         search: 'this._config.workerFile = this._config.workerFile || "Decoder.js";',
            //         replace: 'this._config.workerFile = this._config.workerFile || require(\'url-loader!Broadway/Decoder.js\')',
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
            {
                test: /\.wasm$/i,
                type: 'javascript/auto',
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            // limit: false,
                            // name: '[name].[ext]',
                        },
                    },
                ],
            },
            {
                test: /Decoder\.js$/,
                loader: 'string-replace-loader',
                options: {
                    search: 'wasmBinaryFile="avc.wasm"',
                    replace: 'wasmBinaryFile=require(\'Broadway/avc.wasm\')',
                },
            },

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
    performance: {
        maxAssetSize: 500000,
        maxEntrypointSize: 500000,
    },
    mode: isProduction ? 'production' : 'development',
    plugins: [
        new CopyWebpackPlugin([
            // {
            //     from: path.resolve(BroadwayDir, 'Decoder.js'),
            //     to: './',
            // },
            // {
            //     from: path.resolve(BroadwayDir, 'avc.wasm'),
            //     to: './',
            // },
        ]),
    ],
}

module.exports = webpackConfig
