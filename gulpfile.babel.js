import * as pkg from './package.json';

import gulp from 'gulp';
import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import { terser } from "rollup-plugin-terser";


const inFile = './index.js',
    outFile = 'dist/' + pkg.name,
    globalName = 'svgPathNormalizer';


export async function bundle() {
    const bundle = await rollup({
        input: inFile,
        plugins: [
            babel(/* See options in src/.babelrc */),
        ],
    });

    await bundle.write({
        file: outFile + '.mjs',
        format: 'es',
    });

    await bundle.write({
        file: outFile + '.js',
        format: 'umd',
        name: globalName,
    });
    await bundle.write({
        file: outFile + '.min.js',
        format: 'umd',
        name: globalName,
        plugins: [
            terser({
                compress: {
                    passes: 2,
                },
                mangle: {
                    //Mangle the properties on our internal classes..
                    properties: {
                        //..but don't mangle the UMD wrapper:
                        reserved: [/*module.*/'exports', /*define.*/'amd', globalName, 'data', 'warnings'],
                    },
                }
            }),
        ],
    });
}


//const build = gulp.series(bundle);


export default bundle;
