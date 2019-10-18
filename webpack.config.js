const path = require('path')
const isProduction = process.env.NODE_ENV === 'production'
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
                exclude: /node_modules|Decoder\.js/,
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
                                    modules: false,
                                },
                            ],
                        ],
                        plugins: [ '@babel/plugin-proposal-class-properties' ],
                    },
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
    optimization: {
        minimize: isProduction,
        usedExports: isProduction,
    },
    mode: isProduction ? 'production' : 'development',
}

module.exports = webpackConfig
