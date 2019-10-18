module.exports = {
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
}
