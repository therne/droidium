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

    /**
     * Sends a text through keyboard.
     * @param text {String}
     */
    text(text) {
        this.device.command(`am broadcast -a ADB_INPUT_TEXT --es msg "${text}"`);
    }

    /**
     * Sends given key code.
     * @param code {Number} a key code
     * @see d.android.com/reference/android/view/KeyEvent.html
     */
    keyCode(code) {
        if (typeof code !== 'number') throw Error("You must give valid key code.");
        this.device.command(`am broadcast -a ADB_INPUT_CODE --ei code ${code}`);
    }

    /**
     * Sends back key code.
     */
    back() {
        this.keyCode(2);
    }
}

module.exports = Keyboard;