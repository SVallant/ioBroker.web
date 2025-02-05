'use strict';
// const expect  = require('chai').expect;
const setup = require('@iobroker/legacy-testing');
const tests = require('./lib/tests');

let objects = null;
let states  = null;

process.env.HTTPS_PROXY   = '';
process.env.HTTP_PROXY    = '';
process.env.TEST_PORT     = 18803;
process.env.TEST_PROTOCOL = 'https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function initTests() {
    for (const test in tests.tests) {
        if (tests.tests.hasOwnProperty(test)) {
            it(`Test WEB(${(process.env.TEST_PROTOCOL === 'https') ? 'SSL' : 'NO SSL'}): ${test}`, tests.tests[test]);
        }
    }
}

function checkConnectionOfAdapter(cb, counter) {
    counter = counter || 0;
    if (counter > 20) {
        return cb && cb('Cannot check connection');
    }

    states.getState('system.adapter.web.0.alive', (err, state) => {
        err && console.error(err);
        if (state && state.val) {
            cb && cb();
        } else {
            setTimeout(() => checkConnectionOfAdapter(cb, counter + 1), 1000);
        }
    });
}

describe(`Test WEB(${(process.env.TEST_PROTOCOL === 'https') ? 'SSL' : 'NO SSL'})`, () => {
    before(`Test WEB(${(process.env.TEST_PROTOCOL === 'https') ? 'SSL' : 'NO SSL'}): Start js-controller`, function (_done) {
        this.timeout(600000); // because of first install from npm
        setup.adapterStarted = false;

        setup.setupController(async () => {
            const config = await setup.getAdapterConfig();
            // enable adapter
            config.common.enabled  = true;
            config.common.loglevel = 'debug';

            config.native.port        = process.env.TEST_PORT;
            config.native.secure      = process.env.TEST_PROTOCOL === 'https';
            config.native.cache       = false;
            config.native.certPublic  = config.native.secure ? 'defaultPublic' : '';
            config.native.certPrivate = config.native.secure ? 'defaultPrivate' : '';

            await setup.setAdapterConfig(config.common, config.native);

            setup.startController(true, null, null, (_objects, _states) => {
                objects = _objects;
                states  = _states;
                _done();
            });
        });
    });

    it(`Test WEB(${(process.env.TEST_PROTOCOL === 'https') ? 'SSL' : 'NO SSL'}): Check if adapter started`, done => {
        checkConnectionOfAdapter(() => setTimeout(() => done(), 2000));
    }).timeout(10000);

    initTests();

    after(`Test WEB(${(process.env.TEST_PROTOCOL === 'https') ? 'SSL' : 'NO SSL'}): Stop js-controller`, function (done) {
        this.timeout(6000);

        setup.stopController(normalTerminated => {
            console.log(`Adapter normal terminated: ${normalTerminated}`);
            setTimeout(done, 3000);
        });
    });
});
