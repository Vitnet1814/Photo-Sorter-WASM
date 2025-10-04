const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    
    return {
        mode: isProduction ? 'production' : 'development',
        
        entry: {
            main: './js/main.js',
            'file-handler': './js/file-handler.js',
            'wasm-loader': './js/wasm-loader.js',
            i18n: './js/i18n.js'
        },
        
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: isProduction ? 'js/[name].[contenthash].min.js' : 'js/[name].js',
            clean: true
        },
        
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader'
                    ]
                }
            ]
        },
        
        plugins: [
            new MiniCssExtractPlugin({
                filename: isProduction ? 'css/[name].[contenthash].min.css' : 'css/[name].css'
            }),
            
            new HtmlWebpackPlugin({
                template: './index.html',
                filename: 'index.html',
                inject: 'body',
                minify: isProduction ? {
                    removeComments: true,
                    removeRedundantAttributes: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    useShortDoctype: true,
                    minifyCSS: true,
                    minifyJS: true,
                    collapseWhitespace: true,
                    removeEmptyAttributes: true
                } : false
            }),
            
            // Копіювання статичних файлів
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: 'wasm/photo-processor.wasm',
                        to: 'wasm/photo-processor.wasm'
                    },
                    {
                        from: 'wasm/photo-processor.js',
                        to: 'wasm/photo-processor.js'
                    },
                    {
                        from: 'js/locales',
                        to: 'js/locales'
                    },
                    {
                        from: 'css/styles.css',
                        to: 'css/styles.css'
                    }
                ]
            })
        ],
        
        optimization: {
            minimize: isProduction,
            minimizer: [
                // Мінімізація JavaScript з видаленням коментарів
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: true, // Видаляє console.log в продакшені
                            drop_debugger: true, // Видаляє debugger
                            pure_funcs: ['console.log', 'console.info', 'console.debug'] // Видаляє конкретні функції
                        },
                        mangle: true, // Зменшує назви змінних
                        format: {
                            comments: false // Видаляє ВСІ коментарі
                        }
                    },
                    extractComments: false // Не створює файл з витягнутими коментарями
                }),
                
                // Мінімізація CSS
                new CssMinimizerPlugin({
                    minimizerOptions: {
                        preset: [
                            'default',
                            {
                                discardComments: { removeAll: true }, // Видаляє всі коментарі з CSS
                                normalizeWhitespace: true,
                                normalizeUnicode: true
                            }
                        ]
                    }
                })
            ],
            
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all'
                    }
                }
            }
        },
        
        // Копіювання статичних файлів
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'js'),
                '@css': path.resolve(__dirname, 'css'),
                '@wasm': path.resolve(__dirname, 'wasm')
            }
        }
    };
};
