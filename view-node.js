/**
 * Created by vista on 2015. 12. 19..
 */

'use strict';

class ViewNode {
    constructor(className, address) {
        this.className = className;
        this.address = address;
        this.children = [];
        this.properties = {};
        this.level = 0;
    }

    static fromDump(dumpLine) {
        let pattern = /([\w.$]+)@([\w\d]+)/g;
        let match = pattern.exec(dumpLine);
        let node = new ViewNode(match[1], match[2]);

        let propPattern = /(?:([\w\.\:\(\)\/]+)=([\w\d\,\.\-]+))+/g;
        match = propPattern.exec(dumpLine);
        while (match != null) {
            node.addProperty(match[1], match[2]);
            match = propPattern.exec(dumpLine);
        }

        return node;
    }

    addChild(node) {
        node.parent = this;
        node.level = this.level + 1;
        this.children.push(node);
    }

    addProperty(key, value) {
        this.properties[key] = value;
    }

    inspect() {
        let result = '';
        for (let i=0; i<this.level; i++) result += '  ';
        result += this.className + '(' + this.level + ')\n';
        this.children.forEach(child => result += child.inspect());
        return result;
    }
}

module.exports = ViewNode;