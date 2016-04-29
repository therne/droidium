/**
 * Created by vista on 2015. 12. 19..
 */

'use strict';

class ViewNode {
    constructor(className, address) {
        this.className = className;
        this.address = address;
        this.children = [];
        this.props = {};
        this.properties = {};
        this.propertiesGroup = {};
        this.level = 0;
    }

    static fromDump(dumpLine) {
        dumpLine = dumpLine.trimLeft();

        const firstSpaceIndex = dumpLine.indexOf(' ');
        let classNamePart = dumpLine.slice(0, firstSpaceIndex),
            propPart = dumpLine.slice(firstSpaceIndex + 1);

        // className 추출
        const atSignIndex = classNamePart.indexOf('@');
        let node = new ViewNode(classNamePart.slice(0, atSignIndex),
                                classNamePart.slice(atSignIndex + 1));

        let index = 0;
        while (index < propPart.length) {
            // property parsing
            let key = '', value = '', group = 'miscellaneous';
            while (propPart[index] !== '=') key += propPart[index++];
            if (key.includes(':')) {
                let colonIndex = key.indexOf(':');
                group = key.slice(0, colonIndex);
                key = key.slice(colonIndex + 1);
            }

            // skip =
            index++;

            // value 구조는 (valueLength),(value)식으로 되어있다. 먼저 카운트를 읽음.
            let valueLength = '';
            while (propPart[index] !== ',') valueLength += propPart[index++];
            valueLength = Number(valueLength);

            index++;

            // 이제 value를 읽는다
            for (let i=0; i<valueLength; i++) value += propPart[index++];

            node.addProperty(key, value, group);
            index++;
        }
/*
        // TODO: , 값만큼만 읽어야됨. 안그러면 짤린다.
        let propPattern = /(?:([\w\.\:\(\)\/]+)=([\w\d\,\.\-]+))+/g;
        let match = propPattern.exec(dumpLine);
        while (match != null) {
            // parse properties
            let group, key, value;
            const keyPart = match[1], valuePart = match[2];
            const colonIndex = keyPart.indexOf(':');
            if (colonIndex !== -1) {
                group =  keyPart.slice(0, colonIndex);
                key = keyPart.slice(colonIndex + 1)
            }
            else {
                group = 'miscellaneous';
                key = keyPart;
            }

            value = match[2].slice(match[2].indexOf(',') + 1);

            node.addProperty(key, value, group);
            match = propPattern.exec(dumpLine);
        }*/

        this.fillAdditional(node);

        return node;
    }

    /**
     * 덤프 정보로부터 노드의 부가정보를 채운다.
     */
    static fillAdditional(node) {
        // Layout information
        const prop = node.properties;
        const group = node.propertiesGroup;
        node.props = {
            id: prop['mID'],
            x: Number(prop['locationOnScreen_x']) || 0,
            y: Number(prop['locationOnScreen_y']) || 0,
            description: prop['contentDescription'],
            width: Number(prop['width']) || 0,
            height: Number(prop['height']) || 0,
            visibility: prop['visibility'] || 'GONE',
            isClickable: Boolean(prop['isClickable']) || false,
            isEnabled: Boolean(prop['isEnabled']) || false,
            willNotDraw: Boolean(prop['willNotDraw']) || false,
            textColor: (group['Text'] && group['Text']['mCurTextColor']
                    ? '#' + (Number(group['Text']['mCurTextColor']) >>> 0).toString(16)
                    : '#00000000')
        };

        /**
         * NOTE:
         * accessibility:contentDescription
         * drawing:elevation (0?)
         * drawing:z (z축 => elevation => 그림자인듯?)
         * drawing:hasShadow
         *
         * mID
         *
         * isClickable
         * isEnabled
         *
         * visibility
         *
         * text:typefaceStyle
         * text:mCurTextColor = 텍스트 색상 - ARGB. (추출법: '#' + (Number(colorStr) >>> 0).toString(16)  )
         * text:textSize = 실측 사이즈 (원래 * density)
         * text:scaledTextSize = 원래 텍스트 사이즈
         *
         */
    }

    addChild(node) {
        node.parent = this;
        node.level = this.level + 1;
        this.children.push(node);
    }

    addProperty(key, value, group) {
        if (key.endsWith('()')) {
            key = key.slice(0, key.length - 2);
            if (key.startsWith('get')) {
                // remove getter / setter
                key = key.charAt(3).toLowerCase() + key.slice(4);
            }
        }
        this.properties[key] = value;
        if (group) {
            const groupName = group.charAt(0).toUpperCase() + group.slice(1);
            this.propertiesGroup[groupName] = this.propertiesGroup[groupName] || {};
            this.propertiesGroup[groupName][key] = value;
        }
    }

    inspect() {
        let result = '';

        for (let i=0; i<this.level; i++) result += '    '; // Indent
        result += `<${this.className}`;
        //Object.keys(this.properties).forEach(key => {
        //    result += `\n`;
        //    for (let i=0; i<this.level+1; i++) result += '    ';
        //    result += `${key}="${this.properties[key]}"`;
        //});

        Object.keys(this.propertiesGroup).forEach(group => {
            result += `\n`;
            for (let i=0; i<this.level+1; i++) result += '    ';
            result += `${group} => `;
            Object.keys(this.propertiesGroup[group]).forEach(key => {
                result += `\n`;
                for (let i=0; i<this.level+2; i++) result += '    ';
                result += `${key}="${this.propertiesGroup[group][key]}"`;
            });
        });

        if (this.children.length > 1) {
            result += '>\n';
            this.children.forEach(child => result += child.inspect());
            for (let i=0; i<this.level; i++) result += '    '; // Indent
            result += `</${this.className}>\n`;
        }
        // self-closing
        else result += ' />\n';

        return result;
    }
}

module.exports = ViewNode;