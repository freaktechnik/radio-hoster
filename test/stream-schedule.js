import test from 'ava';
import Ajv from 'ajv';
import scheduleSchema from '../schemas/stream-schedule.json';
import scheduleEN from '../data/stream-schedule.en.json';

test('Schema', (t) => {
    const ajv = new Ajv();

    const valid = ajv.validate(scheduleSchema, scheduleEN);
    if(!valid) {
        t.fail(ajv.errorsText());
    }
    else {
        t.true(valid);
    }
});
