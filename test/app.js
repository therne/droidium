/**
 * Created by vista on 2015. 12. 19..
 */
'use strict';

const droinium = require('.');
const ViewServer = require('../view-server');
const UiAutomator = require('../uiautomator');

module.exports = function*() {
    let device = droinium.connect();
    let vs = new ViewServer(device);

    // uiautomator test
    let ui = new UiAutomator(device);
    yield ui.info();


    // find scrollView
    let scrollView = ui.find({ scrollable: true }).at(0);
    if (!(yield scrollView.exists())) {
        console.log('No scroll :(');
        return;
    }

    yield scrollView.flingToBeginning();

    let titleText, descText, descHeight = 0;

    while (yield scrollView.scrollForward(null, 80)) {
        let texts = ui.find({ className: "android.widget.TextView" });
        let count = yield texts.getCount();

        for (let i=0; i<count; i++) {
            let text = texts.at(i);
            let info = yield text.getInfo();

            if (info.resourceName != null) console.log(info.resourceName);
            console.log(info.text);

            if (!titleText) titleText = info.text;

            let height = info['bounds']['bottom'] - info['bounds']['top'];
            if (descHeight < height) {
                descHeight = height;
                descText = info.text;
            }
        }
    }

    console.log('Title : ' + titleText);
    console.log('Descr : ' + descText);


    // viewserver test
    //let node = yield vs.dump();
    //console.log(node);
};

