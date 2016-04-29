'use strict';

/**
 * ViewServer
 * Dumps view hierarchy from Android devices.
 */
const net = require('net');
const debug = require('debug')('droinium:viewserver');
const ViewNode = require('./ViewNode');

const PORT = 14949;

class ViewServer {
    constructor(device) {
        this.device = device;
    }

    /**
     * Dump the window's view hierarchy.
     * @param [windowId] {String} (currently focused window ID if not given.)
     * @param [callback]
     */
    dump(windowId, callback) {
        if (windowId instanceof Function || !windowId) {
            callback = windowId;
            windowId = this.getFocusedWindowId();
        }
        if (!callback) return (cb) => this.dump(windowId, cb); // to support yield (async-await pattern)

        // dump command
        this.send('DUMP ' + windowId, parse);

        function parse(err, data) {
            if (err) return callback(err, null);

            let lines = data.split('\n');
            let rootNode = new ViewNode('Root');
            let nodeStack = [rootNode], lastIndent = 0;

            for (let line of lines) {
                let node = ViewNode.fromDump(line);
                let indent = getIndentation(line);

                if (indent > lastIndent) {
                    nodeStack[nodeStack.length - 1].addChild(node);
                    nodeStack.push(node);
                    lastIndent++;

                } else if (indent < lastIndent) {
                    while (indent <= lastIndent) {
                        nodeStack.pop();
                        lastIndent--;
                    }
                    nodeStack[nodeStack.length - 1].addChild(node);
                    nodeStack.push(node);
                    lastIndent++;

                } else if (indent != 0) {
                    // replace node
                    nodeStack.pop();
                    nodeStack[nodeStack.length - 1].addChild(node);
                    nodeStack.push(node);
                }
                else nodeStack[nodeStack.length - 1].addChild(node);
            }
            callback(null, rootNode);
        }
    }

    /**
     * Find a view from dumped view hierarchies with given selector.
     *
     * @param windowId [String] (Optional) window ID you want to dump.
     *                          default value is ID of window in front.
     * @param selector {Selector}
     * @param callback [Function] if callback is not given,
     *                            this function will work as Async-await mode.
     * @returns {Function} a yieldable chunk if callback is not given.
     */
    findView(windowId, selector, callback) {
        if (typeof windowId === 'object') {
            callback = selector;
            selector = windowId;
            windowId = this.getFocusedWindowId();
        }
        else if (typeof windowId !== 'string') {
            throw Error('you must give a selector to find view.');
        }
        if (!callback) return (cb) => this.findView(windowId, selector, cb); // to support yield (async-await pattern)

        const comparator = selector.getComparator();

        // dump command
        this.send('DUMP ' + windowId, parse);

        function parse(err, data) {
            if (err) return callback(err, null);

            let lines = data.split('\n');
            for (let line of lines) {
                let node = ViewNode.fromDump(line);
                if (comparator(node)) return callback(null, node);
            }
        }
    }

    getProtocolVersion(callback) {
        if (!callback) return (cb) => this.getProtocolVersion(cb); // to support yield (async-await pattern)

        this.send('PROTOCOL', (err, data) => {
            if (data) callback(err, parseInt(data));
            else callback(err, data);
        });
    }

    send(command, callback) {
        if (!this.isStarted()) {
            this.start();
        }
        var result = '';

        // start socket
        const client = new net.Socket();
        client.on('data', (data) => result += data)
            .on('error', (err) => callback(err, null))
            .on('close', () => {
                if (result.endsWith('DONE.\nDONE\n')) result = result.replace(/DONE.\nDONE\n/g, '');
                if (result.endsWith('\n')) result = result.substring(0, result.length - 1);
                if (!result) {
                    console.error('ViewServer Connection failed!');
                    return;
                }

                callback(null, result)
            });

        client.connect(PORT, '127.0.0.1', () => client.write(command + '\n'));
    }

    getFocusedWindowId() {
        let windowInfo = this.device.shell('dumpsys window windows');
        return /mCurrentFocus\=Window\{([\w\d]+)/g.exec(windowInfo)[1];
    }

    isStarted() {
        return this.device.shell('service call window 3').includes('00000001')
            && this.device.command('forward --list').includes(`${PORT}`);
    }

    start() {
        debug('Starting ViewServer...');

        // kill ViewServer
        this.device.shell('service call window 2');

        // launch ViewServer and forward port to localhost:4939
        this.device.shell('service call window 1 i32 4939');
        this.device.command('forward tcp:'+PORT+' tcp:4939');
    }
}

function getIndentation(line) {
    let indentCount = 0;
    for (let c of line) {
        if (c != ' ') return indentCount;
        else indentCount++;
    }
}

module.exports = ViewServer;