/**
 * Abstracted Android Device.
 */

'use strict';

const shell = require('shelljs');
const mkdirp = require('mkdirp');
const path = require('path');
const Keyboard = require('./inputs/Keyboard');

/**
 * Executes adb command and returns the result.
 * @param command {String}
 * @returns {String} command result (output)
 */
function adb(command) {
    return shell.exec(`adb ${command}`, {silent: true}).output;
}

class Device {
    constructor(deviceId) {
        this.deviceId = deviceId;
        this.keyboard = new Keyboard(this);
    }

    shell(command) {
        return this.command(`shell '${command}'`);
    }

    command(command) {
        if (this.deviceId) command = `-s ${this.deviceId} ${command}`;
        return adb(command);
    }

    /**
     * Take a screenshot of the device.
     * @param outputFile {String} output file path.
     */
    screenShot(outputFile) {
        mkdirp.sync(path.resolve(outputFile, '..'));
        this.shell('screencap -p /sdcard/screen.png');
        this.command(`pull /sdcard/screen.png '${outputFile}'`);
    }

    static connect() {
        // DDMS hack - check http://d.android.com/tools/performance/hierarchy-viewer/setup.html
        shell.env['ANDROID_HVPROTO'] = 'ddm';

        // check it's connected
        adb('start-server');
        let connections = adb('devices')
                .split('\n')
                .filter(line => line.length > 1)
                .slice(1) // delete "List of devices attached" line
                .map(line => {
                    const matched = /(\w+)\s+(\w+)/.exec(line);
                    return { id: matched[1], type: matched[2] };
                });

        if (connections.length == 0) {
            throw new Error("Device is not connected. Please connect to the device.");

        } else if (connections.length > 1) {
            // TODO : should be able to choose connection
        }
        return new Device();
    }
}

module.exports = Device;
