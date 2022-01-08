import test from 'ava';
import Ajv from 'ajv';
import { promises as fs } from "node:fs";

test.before(async (t) => {
    t.context.ignoreSchema = JSON.parse(await fs.readFile(new URL('../schemas/ignore-livestate.json', import.meta.url)));
    t.context.ignoreEN = JSON.parse(await fs.readFile(new URL('../data/ignore-livestate.en.json', import.meta.url)));
});

test('Schema', (t) => {
    const ajv = new Ajv();

    const valid = ajv.validate(t.context.ignoreSchema, t.context.ignoreEN);
    if(!valid) {
        t.fail(ajv.errorsText()); // eslint-disable-line ava/assertion-arguments
    }
    else {
        t.true(valid);
    }
});
