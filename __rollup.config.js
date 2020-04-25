import * as pkg from './package.json';

import babel from 'rollup-plugin-babel';
import { uglify } from "rollup-plugin-uglify";


const inFile = './index.js',
    outFile = 'dist/' + pkg.name,
    globalName = 'svgPathNormalizer';

/*
const config = {
    input: inFile,
    output: [],
};
//https://rollupjs.org/guide/en/#outputformat
const formats = ['amd', 'cjs', 'es', 'iife', 'umd', 'system'];
formats.forEach(f => {
    config.output.push({
        file: `dist/test.${f}.js`,
        format: f,
        name: globalName,
    });
});
export default config;
//*/

/*/
export default {
    input: inFile,
    output: {
        file: outFile + '.min.js',
        format: 'umd',
        name: globalName,
    },
    plugins: [
        babel({
            exclude: 'node_modules/**',
        }),
        uglify({
            compress: {
                passes: 2,
            },
            mangle: {
                //Mangle the properties on our internal classes..
                properties: {
                    //..but don't mangle the UMD wrapper:
                    reserved: ['exports', 'amd', globalName ],
                },
            }
        }),
    ]
};
//*/

export default {

    input: inFile,
    plugins: [
        babel({
            exclude: 'node_modules/**',
        }),
    ],
    output: [
        {
            file: outFile + '.mjs',
            format: 'es',
        },
        {
            file: outFile + '.js',
            format: 'umd',
            name: globalName,
        },
        {
            file: outFile + '.min.js',
            format: 'umd',
            name: globalName,
            plugins: [
                uglify({
                    compress: {
                        passes: 2,
                    },
                    mangle: {
                        //Mangle the properties on our internal classes..
                        properties: {
                            //..but don't mangle the UMD wrapper:
                            reserved: [/*module.*/'exports', /*define.*/'amd', globalName],
                        },
                    }
                }),
            ],
        },
    ],

};
