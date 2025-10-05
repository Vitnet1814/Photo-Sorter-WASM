const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Підтримувані мови
const supportedLanguages = ['uk', 'en', 'ru', 'zh', 'es', 'pt', 'fr', 'de', 'ar', 'ja', 'ko', 'hi', 'it', 'nl', 'sv', 'pl'];

// Локалізовані метатеги для кожної мови
const localizedMetaTags = {
    'uk': {
        title: 'Сортувальник Фото - Автоматичне сортування фотографій',
        description: 'Автоматичне сортування фотографій за датою з використанням EXIF даних. Простий і потужний інструмент для організації ваших фото з підтримкою багатьох форматів файлів.',
        keywords: 'сортування фото, організація фотографій, EXIF дані, автоматичне сортування, фото менеджер, сортування за датою, WebAssembly',
        ogTitle: 'Сортувальник Фото - Автоматичне сортування фотографій',
        ogDescription: 'Автоматичне сортування фотографій за датою з використанням EXIF даних. Простий і потужний інструмент для організації ваших фото.',
        twitterTitle: 'Сортувальник Фото - Автоматичне сортування фотографій',
        twitterDescription: 'Автоматичне сортування фотографій за датою з використанням EXIF даних. Простий і потужний інструмент для організації ваших фото.',
        locale: 'uk_UA',
        geoRegion: 'UA',
        geoCountry: 'Ukraine',
        geoPlacename: 'Ukraine'
    },
    'en': {
        title: 'Photo Sorter - Automatic Photo Sorting',
        description: 'Automatic photo sorting by date using EXIF data. Simple and powerful tool for organizing your photos with support for many file formats.',
        keywords: 'photo sorting, photo organization, EXIF data, automatic sorting, photo manager, date sorting, WebAssembly',
        ogTitle: 'Photo Sorter - Automatic Photo Sorting',
        ogDescription: 'Automatic photo sorting by date using EXIF data. Simple and powerful tool for organizing your photos.',
        twitterTitle: 'Photo Sorter - Automatic Photo Sorting',
        twitterDescription: 'Automatic photo sorting by date using EXIF data. Simple and powerful tool for organizing your photos.',
        locale: 'en_US',
        geoRegion: 'US',
        geoCountry: 'United States',
        geoPlacename: 'United States'
    },
    'ru': {
        title: 'Сортировщик Фото - Автоматическая сортировка фотографий',
        description: 'Автоматическая сортировка фотографий по дате с использованием EXIF данных. Простой и мощный инструмент для организации ваших фото с поддержкой многих форматов файлов.',
        keywords: 'сортировка фото, организация фотографий, EXIF данные, автоматическая сортировка, менеджер фото, сортировка по дате, WebAssembly',
        ogTitle: 'Сортировщик Фото - Автоматическая сортировка фотографий',
        ogDescription: 'Автоматическая сортировка фотографий по дате с использованием EXIF данных. Простой и мощный инструмент для организации ваших фото.',
        twitterTitle: 'Сортировщик Фото - Автоматическая сортировка фотографий',
        twitterDescription: 'Автоматическая сортировка фотографий по дате с использованием EXIF данных. Простой и мощный инструмент для организации ваших фото.',
        locale: 'ru_RU',
        geoRegion: 'RU',
        geoCountry: 'Russia',
        geoPlacename: 'Russia'
    },
    'zh': {
        title: '照片排序器 - 自动照片排序',
        description: '使用EXIF数据按日期自动排序照片。简单而强大的工具，用于组织您的照片，支持多种文件格式。',
        keywords: '照片排序, 照片组织, EXIF数据, 自动排序, 照片管理器, 按日期排序, WebAssembly',
        ogTitle: '照片排序器 - 自动照片排序',
        ogDescription: '使用EXIF数据按日期自动排序照片。简单而强大的工具，用于组织您的照片。',
        twitterTitle: '照片排序器 - 自动照片排序',
        twitterDescription: '使用EXIF数据按日期自动排序照片。简单而强大的工具，用于组织您的照片。',
        locale: 'zh_CN',
        geoRegion: 'CN',
        geoCountry: 'China',
        geoPlacename: 'China'
    },
    'es': {
        title: 'Organizador de Fotos - Ordenamiento Automático de Fotos',
        description: 'Ordenamiento automático de fotos por fecha usando datos EXIF. Herramienta simple y poderosa para organizar tus fotos con soporte para muchos formatos de archivo.',
        keywords: 'ordenamiento de fotos, organización de fotos, datos EXIF, ordenamiento automático, gestor de fotos, ordenamiento por fecha, WebAssembly',
        ogTitle: 'Organizador de Fotos - Ordenamiento Automático de Fotos',
        ogDescription: 'Ordenamiento automático de fotos por fecha usando datos EXIF. Herramienta simple y poderosa para organizar tus fotos.',
        twitterTitle: 'Organizador de Fotos - Ordenamiento Automático de Fotos',
        twitterDescription: 'Ordenamiento automático de fotos por fecha usando datos EXIF. Herramienta simple y poderosa para organizar tus fotos.',
        locale: 'es_ES',
        geoRegion: 'ES',
        geoCountry: 'Spain',
        geoPlacename: 'Spain'
    },
    'pt': {
        title: 'Organizador de Fotos - Ordenação Automática de Fotos',
        description: 'Ordenação automática de fotos por data usando dados EXIF. Ferramenta simples e poderosa para organizar suas fotos com suporte para muitos formatos de arquivo.',
        keywords: 'ordenação de fotos, organização de fotos, dados EXIF, ordenação automática, gerenciador de fotos, ordenação por data, WebAssembly',
        ogTitle: 'Organizador de Fotos - Ordenação Automática de Fotos',
        ogDescription: 'Ordenação automática de fotos por data usando dados EXIF. Ferramenta simples e poderosa para organizar suas fotos.',
        twitterTitle: 'Organizador de Fotos - Ordenação Automática de Fotos',
        twitterDescription: 'Ordenação automática de fotos por data usando dados EXIF. Ferramenta simples e poderosa para organizar suas fotos.',
        locale: 'pt_BR',
        geoRegion: 'BR',
        geoCountry: 'Brazil',
        geoPlacename: 'Brazil'
    },
    'fr': {
        title: 'Organisateur de Photos - Tri Automatique de Photos',
        description: 'Tri automatique de photos par date en utilisant les données EXIF. Outil simple et puissant pour organiser vos photos avec support pour de nombreux formats de fichiers.',
        keywords: 'tri de photos, organisation de photos, données EXIF, tri automatique, gestionnaire de photos, tri par date, WebAssembly',
        ogTitle: 'Organisateur de Photos - Tri Automatique de Photos',
        ogDescription: 'Tri automatique de photos par date en utilisant les données EXIF. Outil simple et puissant pour organiser vos photos.',
        twitterTitle: 'Organisateur de Photos - Tri Automatique de Photos',
        twitterDescription: 'Tri automatique de photos par date en utilisant les données EXIF. Outil simple et puissant pour organiser vos photos.',
        locale: 'fr_FR',
        geoRegion: 'FR',
        geoCountry: 'France',
        geoPlacename: 'France'
    },
    'de': {
        title: 'Foto-Organisator - Automatische Foto-Sortierung',
        description: 'Automatische Foto-Sortierung nach Datum mit EXIF-Daten. Einfaches und leistungsstarkes Tool zur Organisation Ihrer Fotos mit Unterstützung für viele Dateiformate.',
        keywords: 'Foto-Sortierung, Foto-Organisation, EXIF-Daten, automatische Sortierung, Foto-Manager, Sortierung nach Datum, WebAssembly',
        ogTitle: 'Foto-Organisator - Automatische Foto-Sortierung',
        ogDescription: 'Automatische Foto-Sortierung nach Datum mit EXIF-Daten. Einfaches und leistungsstarkes Tool zur Organisation Ihrer Fotos.',
        twitterTitle: 'Foto-Organisator - Automatische Foto-Sortierung',
        twitterDescription: 'Automatische Foto-Sortierung nach Datum mit EXIF-Daten. Einfaches und leistungsstarkes Tool zur Organisation Ihrer Fotos.',
        locale: 'de_DE',
        geoRegion: 'DE',
        geoCountry: 'Germany',
        geoPlacename: 'Germany'
    },
    'ar': {
        title: 'منظم الصور - ترتيب الصور التلقائي',
        description: 'ترتيب الصور التلقائي حسب التاريخ باستخدام بيانات EXIF. أداة بسيطة وقوية لتنظيم صورك مع دعم العديد من تنسيقات الملفات.',
        keywords: 'ترتيب الصور, تنظيم الصور, بيانات EXIF, ترتيب تلقائي, مدير الصور, ترتيب حسب التاريخ, WebAssembly',
        ogTitle: 'منظم الصور - ترتيب الصور التلقائي',
        ogDescription: 'ترتيب الصور التلقائي حسب التاريخ باستخدام بيانات EXIF. أداة بسيطة وقوية لتنظيم صورك.',
        twitterTitle: 'منظم الصور - ترتيب الصور التلقائي',
        twitterDescription: 'ترتيب الصور التلقائي حسب التاريخ باستخدام بيانات EXIF. أداة بسيطة وقوية لتنظيم صورك.',
        locale: 'ar_SA',
        geoRegion: 'SA',
        geoCountry: 'Saudi Arabia',
        geoPlacename: 'Saudi Arabia'
    },
    'ja': {
        title: '写真整理ツール - 自動写真ソート',
        description: 'EXIFデータを使用した日付による自動写真ソート。多くのファイル形式をサポートする、写真を整理するためのシンプルで強力なツール。',
        keywords: '写真ソート, 写真整理, EXIFデータ, 自動ソート, 写真マネージャー, 日付ソート, WebAssembly',
        ogTitle: '写真整理ツール - 自動写真ソート',
        ogDescription: 'EXIFデータを使用した日付による自動写真ソート。シンプルで強力な写真整理ツール。',
        twitterTitle: '写真整理ツール - 自動写真ソート',
        twitterDescription: 'EXIFデータを使用した日付による自動写真ソート。シンプルで強力な写真整理ツール。',
        locale: 'ja_JP',
        geoRegion: 'JP',
        geoCountry: 'Japan',
        geoPlacename: 'Japan'
    },
    'ko': {
        title: '사진 정리 도구 - 자동 사진 정렬',
        description: 'EXIF 데이터를 사용한 날짜별 자동 사진 정렬. 많은 파일 형식을 지원하는 사진을 정리하는 간단하고 강력한 도구.',
        keywords: '사진 정렬, 사진 정리, EXIF 데이터, 자동 정렬, 사진 관리자, 날짜 정렬, WebAssembly',
        ogTitle: '사진 정리 도구 - 자동 사진 정렬',
        ogDescription: 'EXIF 데이터를 사용한 날짜별 자동 사진 정렬. 간단하고 강력한 사진 정리 도구.',
        twitterTitle: '사진 정리 도구 - 자동 사진 정렬',
        twitterDescription: 'EXIF 데이터를 사용한 날짜별 자동 사진 정렬. 간단하고 강력한 사진 정리 도구.',
        locale: 'ko_KR',
        geoRegion: 'KR',
        geoCountry: 'South Korea',
        geoPlacename: 'South Korea'
    },
    'hi': {
        title: 'फोटो सॉर्टर - स्वचालित फोटो सॉर्टिंग',
        description: 'EXIF डेटा का उपयोग करके तारीख के अनुसार स्वचालित फोटो सॉर्टिंग। कई फ़ाइल प्रारूपों के समर्थन के साथ अपनी तस्वीरों को व्यवस्थित करने के लिए सरल और शक्तिशाली उपकरण।',
        keywords: 'फोटो सॉर्टिंग, फोटो संगठन, EXIF डेटा, स्वचालित सॉर्टिंग, फोटो मैनेजर, तारीख सॉर्टिंग, WebAssembly',
        ogTitle: 'फोटो सॉर्टर - स्वचालित फोटो सॉर्टिंग',
        ogDescription: 'EXIF डेटा का उपयोग करके तारीख के अनुसार स्वचालित फोटो सॉर्टिंग। सरल और शक्तिशाली फोटो व्यवस्था उपकरण।',
        twitterTitle: 'फोटो सॉर्टर - स्वचालित फोटो सॉर्टिंग',
        twitterDescription: 'EXIF डेटा का उपयोग करके तारीख के अनुसार स्वचालित फोटो सॉर्टिंग। सरल और शक्तिशाली फोटो व्यवस्था उपकरण।',
        locale: 'hi_IN',
        geoRegion: 'IN',
        geoCountry: 'India',
        geoPlacename: 'India'
    },
    'it': {
        title: 'Organizzatore di Foto - Ordinamento Automatico delle Foto',
        description: 'Ordinamento automatico delle foto per data utilizzando i dati EXIF. Strumento semplice e potente per organizzare le tue foto con supporto per molti formati di file.',
        keywords: 'ordinamento foto, organizzazione foto, dati EXIF, ordinamento automatico, gestore foto, ordinamento per data, WebAssembly',
        ogTitle: 'Organizzatore di Foto - Ordinamento Automatico delle Foto',
        ogDescription: 'Ordinamento automatico delle foto per data utilizzando i dati EXIF. Strumento semplice e potente per organizzare le tue foto.',
        twitterTitle: 'Organizzatore di Foto - Ordinamento Automatico delle Foto',
        twitterDescription: 'Ordinamento automatico delle foto per data utilizzando i dati EXIF. Strumento semplice e potente per organizzare le tue foto.',
        locale: 'it_IT',
        geoRegion: 'IT',
        geoCountry: 'Italy',
        geoPlacename: 'Italy'
    },
    'nl': {
        title: 'Foto Organisator - Automatische Foto Sortering',
        description: 'Automatische foto sortering op datum met EXIF gegevens. Eenvoudig en krachtig hulpmiddel voor het organiseren van uw foto\'s met ondersteuning voor veel bestandsformaten.',
        keywords: 'foto sortering, foto organisatie, EXIF gegevens, automatische sortering, foto manager, sortering op datum, WebAssembly',
        ogTitle: 'Foto Organisator - Automatische Foto Sortering',
        ogDescription: 'Automatische foto sortering op datum met EXIF gegevens. Eenvoudig en krachtig hulpmiddel voor het organiseren van uw foto\'s.',
        twitterTitle: 'Foto Organisator - Automatische Foto Sortering',
        twitterDescription: 'Automatische foto sortering op datum met EXIF gegevens. Eenvoudig en krachtig hulpmiddel voor het organiseren van uw foto\'s.',
        locale: 'nl_NL',
        geoRegion: 'NL',
        geoCountry: 'Netherlands',
        geoPlacename: 'Netherlands'
    },
    'sv': {
        title: 'Foto Organisator - Automatisk Foto Sortering',
        description: 'Automatisk foto sortering efter datum med EXIF data. Enkelt och kraftfullt verktyg för att organisera dina foton med stöd för många filformat.',
        keywords: 'foto sortering, foto organisation, EXIF data, automatisk sortering, foto manager, sortering efter datum, WebAssembly',
        ogTitle: 'Foto Organisator - Automatisk Foto Sortering',
        ogDescription: 'Automatisk foto sortering efter datum med EXIF data. Enkelt och kraftfullt verktyg för att organisera dina foton.',
        twitterTitle: 'Foto Organisator - Automatisk Foto Sortering',
        twitterDescription: 'Automatisk foto sortering efter datum med EXIF data. Enkelt och kraftfullt verktyg för att organisera dina foton.',
        locale: 'sv_SE',
        geoRegion: 'SE',
        geoCountry: 'Sweden',
        geoPlacename: 'Sweden'
    },
    'pl': {
        title: 'Organizator Zdjęć - Automatyczne Sortowanie Zdjęć',
        description: 'Automatyczne sortowanie zdjęć według daty przy użyciu danych EXIF. Proste i potężne narzędzie do organizowania zdjęć z obsługą wielu formatów plików.',
        keywords: 'sortowanie zdjęć, organizacja zdjęć, dane EXIF, automatyczne sortowanie, menedżer zdjęć, sortowanie według daty, WebAssembly',
        ogTitle: 'Organizator Zdjęć - Automatyczne Sortowanie Zdjęć',
        ogDescription: 'Automatyczne sortowanie zdjęć według daty przy użyciu danych EXIF. Proste i potężne narzędzie do organizowania zdjęć.',
        twitterTitle: 'Organizator Zdjęć - Automatyczne Sortowanie Zdjęć',
        twitterDescription: 'Automatyczne sortowanie zdjęć według daty przy użyciu danych EXIF. Proste i potężne narzędzie do organizowania zdjęć.',
        locale: 'pl_PL',
        geoRegion: 'PL',
        geoCountry: 'Poland',
        geoPlacename: 'Poland'
    }
    // Додамо інші мови пізніше
};

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
            
            // Генеруємо HTML для кожної мови
            ...supportedLanguages.map(lang => {
                const metaTags = localizedMetaTags[lang] || localizedMetaTags['en'];
                const canonicalUrl = `https://photo-sorter-wasm-production.up.railway.app/${lang}/`;
                
                return new HtmlWebpackPlugin({
                    template: './index.html',
                    filename: `${lang}/index.html`,
                    inject: 'body',
                    templateParameters: {
                        language: lang,
                        canonicalUrl: canonicalUrl,
                        metaTags: metaTags,
                        supportedLanguages: supportedLanguages
                    },
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
                });
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
                    },
                    {
                        from: 'public/_redirects',
                        to: '_redirects'
                    },
                    {
                        from: 'vercel.json',
                        to: 'vercel.json'
                    },
                    {
                        from: 'railway.json',
                        to: 'railway.json'
                    },
                    // Копіювання favicon файлів в корінь dist
                    {
                        from: 'favicon.ico',
                        to: 'favicon.ico'
                    },
                    {
                        from: 'favicon.svg',
                        to: 'favicon.svg'
                    },
                    // Service Worker файли
                    {
                        from: 'sw.js',
                        to: 'sw.js'
                    },
                    {
                        from: 'js/sw-manager.js',
                        to: 'js/sw-manager.js'
                    },
                    {
                        from: 'js/sw-diagnostics.js',
                        to: 'js/sw-diagnostics.js'
                    },
                    {
                        from: 'js/sw-cleanup.js',
                        to: 'js/sw-cleanup.js'
                    },
                    {
                        from: 'manifest.json',
                        to: 'manifest.json'
                    },
                    {
                        from: 'browserconfig.xml',
                        to: 'browserconfig.xml'
                    }
                ]
            }),
            
            // Копіювання favicon файлів в кожну локалізовану папку
            new CopyWebpackPlugin({
                patterns: supportedLanguages.map(lang => [
                    {
                        from: 'favicon.ico',
                        to: `${lang}/favicon.ico`
                    },
                    {
                        from: 'favicon.svg',
                        to: `${lang}/favicon.svg`
                    },
                    // Service Worker файли для кожної мови
                    {
                        from: 'sw.js',
                        to: `${lang}/sw.js`
                    },
                    {
                        from: 'js/sw-manager.js',
                        to: `${lang}/js/sw-manager.js`
                    },
                    {
                        from: 'js/sw-diagnostics.js',
                        to: `${lang}/js/sw-diagnostics.js`
                    },
                    {
                        from: 'js/sw-cleanup.js',
                        to: `${lang}/js/sw-cleanup.js`
                    },
                    {
                        from: 'manifest.json',
                        to: `${lang}/manifest.json`
                    },
                    {
                        from: 'browserconfig.xml',
                        to: `${lang}/browserconfig.xml`
                    }
                ]).flat()
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
