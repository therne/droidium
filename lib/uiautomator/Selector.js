/**
 * UiObject - Device's UI object
 * Code written by therne in 2016. 4. 20.
 */
'use strict';

const fields = {
    text: 0x01,  // MASK_TEXT,
    textContains: 0x02,  // MASK_TEXTCONTAINS,
    textMatches: 0x04,  // MASK_TEXTMATCHES,
    textStartsWith: 0x08,  // MASK_TEXTSTARTSWITH,
    className: 0x10,  // MASK_CLASSNAME
    classNameMatches: 0x20,  // MASK_CLASSNAMEMATCHES
    description: 0x40,  // MASK_DESCRIPTION
    descriptionContains: 0x80,  // MASK_DESCRIPTIONCONTAINS
    descriptionMatches: 0x0100,  // MASK_DESCRIPTIONMATCHES
    descriptionStartsWith: 0x0200,  // MASK_DESCRIPTIONSTARTSWITH
    checkable: 0x0400,  // MASK_CHECKABLE
    checked: 0x0800,  // MASK_CHECKED
    clickable: 0x1000,  // MASK_CLICKABLE
    longClickable: 0x2000,  // MASK_LONGCLICKABLE,
    scrollable: 0x4000,  // MASK_SCROLLABLE,
    enabled: 0x8000,  // MASK_ENABLED,
    focusable: 0x010000,  // MASK_FOCUSABLE,
    focused: 0x020000,  // MASK_FOCUSED,
    selected: 0x040000,  // MASK_SELECTED,
    packageName: 0x080000,  // MASK_PACKAGENAME,
    packageNameMatches: 0x100000,  // MASK_PACKAGENAMEMATCHES,
    resourceId: 0x200000,  // MASK_RESOURCEID,
    resourceIdMatches: 0x400000,  // MASK_RESOURCEIDMATCHES,
    index: 0x800000,  // MASK_INDEX,
    instance: 0x01000000  // MASK_INSTANCE,
};

function codeEscape(v) {
    return typeof v === 'string' ? '"' + v + '+' : v;
}

class Selector {
    constructor(query) {
        this.mask = 0;
        this.childOrSibling = [];
        this.childOrSiblingSelector = [];

        if (!query) return;
        for (const key in query) {
            if (!fields.hasOwnProperty(key)) throw Error(`query ${key} is not allowed.`);
            if (key.endsWith('Matches') && !(query[key] instanceof RegExp)) throw Error(`${key} field requires RegExp.`);
            this.set(key, query[key]);
            // FIXME: regexp will be converted into empty braces {}
        }
    }

    set(key, value) {
        if (!(key in fields)) return;
        this[key] = value;
        this.mask |= fields[key];
    }

    remove(key) {
        if (!(key in fields)) return;
        delete this[key];
        this.mask &= ~fields[key];
    }

    child(query) {
        this.childOrSibling.push('child');
        this.childOrSiblingSelector.push(new Selector(query));
    }

    sibling(query) {
        this.childOrSibling.push('sibling');
        this.childOrSiblingSelector.push(new Selector(query));
    }

    clone() {
        const clone = new Selector();

        // copy all properties
        for (const key in this) {
            if (['mask', 'childOrSibling', 'childOrSiblingSelector'].indexOf(key) != -1) continue;
            clone[key] = this[key];
        }
        clone.mask = this.mask;
        clone.childOrSibling = this.childOrSibling.concat();
        clone.childOrSiblingSelector = this.childOrSiblingSelector.concat();
        return clone;
    }

    getComparator() {
        let code = '';
        for (let key in fields) {
            if (this.mask & fields[key]) {
                const val = codeEscape(this[key]);
                if (key === 'textContains') code += `if (node.properties.text && node.properties.text.includes(${val})) return true;\n`;
                else if (key === 'textMatches') code += `if (${val}.test(node.properties.text)) return true;\n`;
                else if (key === 'textStartsWith') code += `if (node.properties.text && node.properties.text.startsWith(${val})) return true;\n`;
                else if (key === 'className') code += `if (node.className == ${val}) return true;\n`;
                else if (key === 'classNameMatches') code += `if (${val}.test(node.className)) return true;\n`;
                else if (key === 'description') code += `if (node.props.description === ${val}) return true;\n`;
                else if (key === 'descriptionContains') code += `if (node.props.description && node.props.description.includes(${val})) return true;\n`;
                else if (key === 'descriptionMatches') code += `if (${val}.test(node.props.description)) return true;\n`;
                else if (key === 'descriptionStartsWith') code += `if (node.props.description && node.props.description.startsWith(${val})) return true;\n`;
                else if (key === 'resourceId') code += `if (node.props.id === ${val}) return true;\n`;
                else if (key === 'resourceIdMatches') code += `if (${val}.test(node.props.id)) return true;\n`;
                else code += `if (node.properties.${key} == ${val}) return true;\n`
            }
        }
        return new Function('node', code);
    }
}

module.exports = Selector;