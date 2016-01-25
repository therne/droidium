/**
 * Created by vista on 2015. 12. 19..
 */
'use strict';

const Device = require('./device');
const ViewServer = require('./view-server');

module.exports = function*() {
    let device = Device.connect();
    let vs = new ViewServer(device);

    let node = yield vs.dump();
    console.log(node);
};

