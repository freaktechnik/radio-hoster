import test from 'ava';
import Ajv from 'ajv';
import ignoreSchema from '../schemas/ignore-livestate.json';
import ignoreEN from '../data/ignore-livestate.en.json';

test('Schema', (t) => {
    const ajv = new Ajv();

    const valid = ajv.validate(ignoreSchema, ignoreEN);
    if(!valid) {
        t.fail(ajv.errorsText());
    }
    else {
        t.true(valid);
    }
});
