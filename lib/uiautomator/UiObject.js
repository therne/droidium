/**
 * UiObject - Device's UI object
 * Code written by therne in 2016. 4. 20.
 */
'use strict';

const Selector = require('./Selector');

class UiObject {

    /**
     * @param uiAutomator {UiAutomator}
     * @param selector {Selector}
     */
    constructor(uiAutomator, selector) {
        this.selector = selector || new Selector();
        this.uiAutomator = uiAutomator;
        this.device = uiAutomator.device;
        this.rpc = uiAutomator.rpc;
        this.viewServer = uiAutomator.viewServer;
    }

    /**
     * Select the object's children.
     * @param query {Object}
     * @returns {UiObject}
     */
    child(query) {
        return new UiObject(this.uiAutomator, this.selector.clone().child(query));
    }

    /**
     * Select the object's siblings.
     * @param query {Object}
     * @returns {UiObject}
     */
    sibling(query) {
        return new UiObject(this.uiAutomator, this.selector.clone().sibling(query));
    }

    /**
     * Get object's information. Uses UIAutomator.
     */
    *getInfo() {
        return yield this.rpc.call('objInfo', [this.selector]);
    }

    /**
     * Get matched objects count.
     */
    *getCount() {
        return yield this.rpc.call('count', [this.selector]);
    }

    /**
     * @returns {UiObject} nth-element of matched objects.
     */
    at(index) {
        if (typeof index !== 'number' || index < 0) throw Error('index must be at least 0');
        const selector = this.selector.clone();
        selector.set('instance', index);
        return new UiObject(this.uiAutomator, selector);
    }

    /**
     * Get object's full information. Uses ViewServer.
     * NOTE: This may take a while.
     */
    *getFullInfo() {
        if (!this.viewServer)
            throw Error('You need to attach ViewServer to get full information about an object.');

        return yield this.viewServer.findView(this.selector);
    }


    /**
     * Check if the object exists in current window.
     */
    *exists() {
        return yield this.rpc.call('exist', [this.selector]);
    }

    /**
     * Click on the object.
     * @param action [String] (optional) tl|topleft|br|bottomright
     *                        (default is center click)
     */
    *click(action) {
        yield this.rpc.call('click', action ? [this.selector, action] : [this.selector]);
    }

    /**
     * Click on the object and wait for the new window.
     * @param timeout [Number] (Optional) default is 3000
     */
    *clickAndWait(timeout) {
        yield this.rpc.call('click', [this.selector, timeout]);
    }

    /**
     * Pinch into the object.
     * @param percent [Number] (Optional) default is 100%
     * @param steps [Number] (Optional) default is 50 step
     */
    *pinchIn(percent, steps) {
        percent = percent || 100;
        steps = steps || 50;
        yield this.rpc.call('pinchIn', [this.selector, percent, steps]);
    }

    /**
     * Pinch out of the object.
     * @param percent [Number] (Optional) default is 100%
     * @param steps [Number] (Optional) default is 50 step
     */
    *pinchOut(percent, steps) {
        percent = percent || 100;
        steps = steps || 50;
        yield this.rpc.call('pinchOut', [this.selector, percent, steps]);
    }

    /**
     * Perform swipe action. if device platform greater than API 18,
     * percent can be used and value between 0 and 1.
     * @param direction {String} left | right | up | down
     * @param steps [Number] (Optional) default is 50.
     * @param percent [Number] (Optional) 0~1. default is 1.
     */
    *swipe(direction, steps, percent) {
        if (['up','down','left','right'].indexOf(direction) != -1)
            throw Error('You must give the direction. (left or right or up or down)');

        if (percent == 1) yield this.rpc.call('swipe', [this.selector, direction, steps]);
        else yield this.rpc.call('swipe', [this.selector, direction, percent, steps]);
    }

    /**
     * Wait until the UI object gone.
     * @param timeout [Number] (Optional) default is 3000 (3s).
     */
    *waitUntilGone(timeout) {
        timeout = timeout || 3000;
        yield this.rpc.call('waitUntilGone', [this.selector, timeout]);
    }

    /**
     * Wait for the UI object exist.
     * @param timeout [Number] (Optional) default is 3000 (3s).
     */
    *waitForExists(timeout) {
        timeout = timeout || 3000;
        yield this.rpc.call('waitForExists', [this.selector, timeout]);
    }

    *__fling(direction, action, maxSwipes) {
        if (direction == 'horizontal') direction = 'horizental';

        maxSwipes = maxSwipes || 1000;
        let param = [this.selector, direction];
        if (action.startsWith('To')) param.push(maxSwipes);
        yield this.rpc.call(`fling${action}`, param);
    }

    /**
     * Perform fling forward action.
     * @param direction [String] horizontal | vertical
     */
    *flingForward(direction) {
        direction = (direction || 'vertical') == 'vertical';
        yield this.__fling(direction, 'Forward');
    }

    /**
     * Perform fling backward action.
     * @param direction [String] horizontal | vertical
     */
    *flingBackward(direction) {
        direction = (direction || 'vertical') == 'vertical';
        yield this.__fling(direction, 'Backward');
    }

    /**
     * Perform fling to the begin of scroll.
     * @param direction [String] horizontal | vertical.
     * @param maxSwipes [Number] (Optional) default is 1000
     */
    *flingToBeginning(direction, maxSwipes) {
        direction = (direction || 'vertical') == 'vertical';
        maxSwipes = maxSwipes || 1000;
        yield this.__fling(direction, 'ToBeginning', maxSwipes);
    }

    /**
     * Perform fling to the begin of scroll.
     * @param direction [String] horizontal | vertical.
     * @param maxSwipes [Number] (Optional) default is 1000
     */
    *flingToEnd(direction, maxSwipes) {
        direction = (direction || 'vertical') == 'vertical';
        maxSwipes = maxSwipes || 1000;
        yield this.__fling(direction, 'ToEnd', maxSwipes);
    }

    *__scroll(direction, action, steps, maxSwipes) {
        if (direction == 'horizontal') direction = 'horizental';
        steps = steps || 1000;
        maxSwipes = maxSwipes || 1000;

        let param = [this.selector, direction];
        if (action.startsWith('To')) param.push(maxSwipes);
        param.push(steps);

        return yield this.rpc.call(`scroll${action}`, param);
    }

    /**
     * Perform scroll forward action.
     *
     * @param direction [String] horizontal | vertical
     * @param steps [Number] (Optional) default is 100px
     * @returns true if it's able to scroll more
     */
    *scrollForward(direction, steps) {
        direction = (direction || 'vertical') == 'vertical';
        return yield this.__scroll(direction, 'Forward', steps);
    }

    /**
     * Perform scroll backward action.
     *
     * @param direction [String] horizontal | vertical
     * @param steps [Number] (Optional) default is 100px
     * @returns true if it's able to scroll more
     */
    *scrollBackward(direction, steps) {
        direction = (direction || 'vertical') == 'vertical';
        return yield this.__scroll(direction, 'Backward', steps);
    }

    /**
     * Perform scroll to the begin of scroll.
     *
     * @param direction [String] horizontal | vertical.
     * @param steps [Number] (Optional) default is 100px
     * @param maxSwipes [Number] (Optional) default is 1000
     * @returns true if it's able to scroll more
     */
    *scrollToBeginning(direction, steps, maxSwipes) {
        direction = (direction || 'vertical') == 'vertical';
        maxSwipes = maxSwipes || 1000;
        steps = steps || 100;
        return yield this.__fling(direction, 'ToBeginning', steps, maxSwipes);
    }

    /**
     * Perform scroll to the begin of scroll.
     *
     * @param direction [String] horizontal | vertical.
     * @param steps [Number] (Optional) default is 100px
     * @param maxSwipes [Number] (Optional) default is 1000
     * @returns true if it's able to scroll more
     */
    *scrollToEnd(direction, steps, maxSwipes) {
        direction = (direction || 'vertical') == 'vertical';
        maxSwipes = maxSwipes || 1000;
        steps = steps || 100;
        return yield this.__fling(direction, 'ToEnd', steps, maxSwipes);
    }
}

module.exports = UiObject;