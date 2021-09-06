import test from 'ava';
import Ajv from 'ajv';
import { promises as fs } from 'fs';

test.before(async (t) => {
    t.context.scheduleSchema = JSON.parse(await fs.readFile(new URL('../schemas/stream-schedule.json', import.meta.url), { encoding: 'utf8' }));
    t.context.scheduleEN = JSON.parse(await fs.readFile(new URL('../data/stream-schedule.en.json', import.meta.url), { encoding: 'utf8' }));
});

test('Schema', (t) => {
    const ajv = new Ajv();

    const valid = ajv.validate(t.context.scheduleSchema, t.context.scheduleEN);
    if(!valid) {
        t.fail(ajv.errorsText());
    }
    else {
        t.true(valid);
    }
});
