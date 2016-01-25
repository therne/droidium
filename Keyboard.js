/**
 * Code written by vista in 2016. 1. 25.. Licensed Under MIT License.
 */
'use strict';
 
class Keyboard {
    constructor(device) {
        if (!device) throw Error("You must give device.");
        this.device = device;
    }

    /**
     * Installs and uses APK Keyboard to type text.
     */
    setup() {
        this.device.command(`install ${__dirname}/setup/adb-keyboard.apk`);
        this.device.shell('ime set com.android.adbkeyboard/.AdbIME');
    }

    text() {
        this.device.send('')
    }
}

module.exports = Keyboard;