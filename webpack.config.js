const path = require('path');
const fs = require('fs');

const CopyWebpackPlugin = require('copy-webpack-plugin');

let lwnConfig;
try {
    lwnConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../lwn.config.json")));
} catch(e) {}

module.exports = {
    mode: "development",
    devtool: "eval-source-map",
    entry: {
        main: "../../src/main.ts",
    },
    output: {
        path: path.resolve(__dirname, '../../build'),
        filename: "[name].bundle.js"
    },
    resolve: {
        // Add ".ts" and ".tsx" as resolvable extensions.
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            // CUSTOM PACKAGES:
            '/': path.resolve(__dirname, '../..'),
        }
    },
    module: {
        rules: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            { test: /\.tsx?$/, use: ["ts-loader", "./loaders/ts-component.loader.js"] },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    {
                        loader: 'css-loader',
                        options: {
                            modules: false
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sassOptions: () => {
                                return {
                                    includePaths: [path.resolve('../../')].concat(
                                        (lwnConfig?.style?.includePaths ?? [])
                                            .map(url => path.resolve(__dirname, '../..', url))
                                    ),
                                };
                            },
                        },
                    },
                ],
            },
            { test: /\.html$/, loader: "./loaders/html.loader.js" }
        ],
    },
    plugins: [
        new CopyWebpackPlugin([
            {from: '../../static', to: 'static'},
            {from: '../../index.html'}
        ]),
    ],
    devServer: {
        compress: true,
        port: 8080,
        hot: true,
        historyApiFallback: true
    }
};
