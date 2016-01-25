/**
 * Abstracted Android Device.
 */

'use strict';

const shell = require('shelljs');

/**
 * Executes adb command and returns the result.
 * @param command {String}
 * @returns {String} command result (output)
 */
function adb(command) {
    return shell.exec('adb ' + command, {silent: true}).output;
}

class Device {
    shell(command) {
        return this.adb('shell ' + command);
    }

    command(command) {
        return adb(command);
    }

    static connect() {
        // check it's connected
        adb('start-server');
        let connections = adb('devices')
                .split('\n')
                .filter(line => line.length > 1)
                .slice(1);

        if (connections.length == 0) {
            throw new Error("Device is not connected. Please connect to the device.");
        }

        // TODO : chose connection
        return new Device();
    }
}

module.exports = Device;
