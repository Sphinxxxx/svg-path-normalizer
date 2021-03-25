//https://stackoverflow.com/questions/39883960/what-is-the-typescript-2-0-es2015-way-to-import-assert-from-node-js
import { strict as assert } from 'assert';
import normalizer from '../dist/svg-path-normalizer.mjs';
import normalizerMin from '../dist/svg-path-normalizer.min.js';


describe('Normalizer', function () {

    function assertOutput(input, expectedData, expectedWarns = []) {
        const result = normalizer(input, typeof (expectedData) !== 'string');

        assert.deepEqual(result.data, expectedData);

        const warningsContainMessage = result.warnings.map((w, i) => w.includes(expectedWarns[i]));
        assert.deepEqual(warningsContainMessage, expectedWarns.map(w => true), `Unexpected warning(s): ${JSON.stringify(result.warnings, null, 4)}`);
    }

    context('Valid path data', function () {

        it('should strip unnecessary whitespace', () => {
            assertOutput('  M  12.3.4.5.6z ', 'M 12.3 .4 .5 .6 z');
        });

        it('should separate integers', () => {
            assertOutput('M210,3,456,7z', 'M 210 3 456 7 z');
            assertOutput('M-210-3-456-7z', 'M -210 -3 -456 -7 z');
        });

        it('should separate decimals', () => {
            assertOutput('M210.987,3.2', 'M 210.987 3.2');
            assertOutput('M-210.987-3.2', 'M -210.987 -3.2');
        });
        it('should separate compact decimals', () => {
            assertOutput('M.321.4.5.6 z', 'M .321 .4 .5 .6 z');
            assertOutput('M-.321-.4-.5-.6z', 'M -.321 -.4 -.5 -.6 z');
        });

        it('should separate exponents', () => {
            assertOutput('M   1.2e3    -9.8e-7  4e5.67', 'M 1.2e3 -9.8e-7 4e5 .67');
            assertOutput('M 23.45e67 -98.76e-54',        'M 23.45e67 -98.76e-54');
        });

        it('should separate arc flags', () => {
            assertOutput('a60,60 0 1,1 99,11', 'a 60 60 0 1 1 99 11');
            assertOutput('a60,60 0 11 99,11',  'a 60 60 0 1 1 99 11');
            assertOutput('a60,60 0 1 199,11',  'a 60 60 0 1 1 99 11');
            assertOutput('a60,60 0 1199,11',   'a 60 60 0 1 1 99 11');
            assertOutput('a60,60 0 1 0.99, 11','a 60 60 0 1 0 .99 11');
            assertOutput('a60,60 0 10.99, 11', 'a 60 60 0 1 0 .99 11');
            assertOutput('a60,60 0 1 0.99, 11 60,60 0 10.99, 11', 'a 60 60 0 1 0 .99 11 60 60 0 1 0 .99 11');
        });

        it('should separate multiple commands', () => {
            assertOutput(
                'M.23.45a60,60 0 1199,11 c43,21 .98.7 -1-23',
                'M .23 .45 a 60 60 0 1 1 99 11 c 43 21 .98 .7 -1 -23'
            );
        });

        it('should return structured array', () => {
            assertOutput(
                'M.23.45a60,60 0 1199,11 60,60 0 11.99, 11',
                [
                    ["M", [".23", ".45"]],
                    ["a", ["60", "60", "0", "1", "1", "99", "11", "60", "60", "0", "1", "1", ".99", "11"]],
                ]
            );
        });

    });

    context('Invalid path data', function () {

        it('should accept path without command', () => {
            //Although invalid SVG, our job is only to normalize the path data as best we can.
            assertOutput('.321,456', '.321 456');
        });

        it("should accept but warn about incomplete numbers", () => {
            assertOutput(
                'M .. -. 23. 45e 67e.',
                'M . . -. 23. 45e 67e .',
                ['.', '.', '-.', '23.', '45e', '67e', '.']
            );
        });

        it("should accept but warn about invalid exponents (because it's probably supposed to be a number)", () => {
            //An exponent without a significand (number before "e") is invalid.
            assertOutput('Me23,e-45', 'M e23 e-45', ['e23', 'e-45']);
        });

    });

});


describe('Build', function () {

    context('Minification', function () {

        it("shouldn't ruin anything", () => {
            //We use UglifyJS with `--mangle-props`, so just check that everything still works.
            assert.deepEqual(
                normalizerMin('.23.45a60,60 0 1199,11-.65e12,60 0 11.99, 11'),
                {
                    data: '.23 .45 a 60 60 0 1 1 99 11 -.65e12 60 0 1 1 .99 11',
                    warnings: [],
                }
            );
            assert.deepEqual(
                normalizerMin('.23.45a60,60 0 1199,11-.65e12,60 0 11.99, e11', true),
                {
                    data: [
                        ["", [".23", ".45"]],
                        ["a", ["60", "60", "0", "1", "1", "99", "11", "-.65e12", "60", "0", "1", "1", ".99", "e11"]],
                    ],
                    warnings: [
                        'Invalid number at 42: "e11"',
                    ],
                }
            );
        });

    });

});
