/**
 * UiAutomator - Control and inspect device UI
 * Code written by therne in 2016. 4. 20.
 */
'use strict';

const path = require('path');
const UiObject = require('./UiObject');
const Selector = require('./Selector');
const RpcClient = require('./RpcClient');

const apksDir = path.resolve(`${__dirname}/../../setup`);
const serverPort = 9008;

class UiAutomator {
    /**
     * @param device {Device}
     * @param port [Number] (optional) local port that'll be forwarded
     */
    constructor(device, port) {
        this.device = device;
        this.port = port || serverPort;
        this.rpc = new RpcClient(this.port);
        this.setup();
    }

    setup() {
        const device = this.device;
        if (!this.isInstalled()) {
            device.command(`install ${apksDir}/app-uiautomator.apk`);
            device.command(`install ${apksDir}/app-uiautomator-test.apk`);
        }

        if (!this.isForwarded()) {
            device.command(`forward tcp:${this.port} tcp:${serverPort}`);
        }

        // run instrumentation test to launch server
        device.command('am instrument -w com.github.uiautomator.test/android.support.test.runner.AndroidJUnitRunner')
    }

    isInstalled() {
        return this.device.shell('pm list packages -f')
            .includes('com.github.uiautomator');
    }

    isForwarded() {
        return this.device.command('forward --list').includes(`${this.port}`);
    }

    /**
     * Find UI objects.
     * @param query {Object} selector query.
     * @returns {UiObject}
     */
    find(query) {
        return new UiObject(new Selector(query));
    }

    /**
     * Get the device info.
     * @returns {Object}
     */
    *info() {
        return yield this.rpc.call('deviceInfo');
    }

    /**
     * Click at given coordinates.
     * @param x {Number}
     * @param y {Number}
     */
    *click(x, y) {
        yield this.rpc.call('click', [x, y]);
    }

    /**
     * Long click at given coordinates.
     * @param x {Number}
     * @param y {Number}
     */
    *longClick(x, y) {
        yield this.swipe(x, y, x+1, y+1);
    }

    /**
     * Swipe from one point to another point.
     * @param sx {Number} start X pos
     * @param sy {Number} start Y pos
     * @param ex {Number} end X pos
     * @param ey {Number} end Y pos
     * @param steps {Number} swipe steps. default is 100.
     */
    *swipe(sx, sy, ex, ey, steps) {
        if (!steps) steps = 100;
        yield this.rpc.call('swipe', [sx, sy, ex, ey, steps]);
    }

    /**
     * Drag from one point to another point.
     * @param sx {Number} start X pos
     * @param sy {Number} start Y pos
     * @param ex {Number} end X pos
     * @param ey {Number} end Y pos
     * @param steps {Number} swipe steps. default is 100.
     */
    *drag(sx, sy, ex, ey, steps) {
        if (!steps) steps = 100;
        yield this.rpc.call('swipe', [sx, sy, ex, ey, steps]);
    }

    /**
     * Freeze or unfreeze the device rotation.
     * @param freeze {Boolean} whether freeze or unfreeze (default is true)
     */
    *freeze(freeze) {
        if (!freeze) freeze = true;
        yield this.rpc.call('freeze', [ freeze ]);
    }
}

module.exports = UiAutomator;

