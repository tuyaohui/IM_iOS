/*global QlobberFSQ: false */
/*jslint node: true, unparam: true */
"use strict";

/**
`start` event

`QlobberFSQ` objects fire a `start` event when they're ready to publish messages. Don't call [`publish`](#qlobberfsqprototypepublishtopic-payload-options-cb) until the `start` event is emitted or the message may be dropped. You can [`subscribe`](#qlobberfsqprototypesubscribetopic-options-handler-cb) to messages before `start` is fired, however.

A `start` event won't be fired after a [`stop`](#qlobberfsqeventsstop) event.
*/
QlobberFSQ.events.start = function () { return undefined; };

/**
`stop` event

`QlobberFSQ` objects fire a `stop` event after you call [`stop_watching`](#qlobberfsqprototypestop_watchingcb) and they've stopped scanning for new messages. Messages already read may still be being processed, however.
*/
QlobberFSQ.events.stop = function () { return undefined; };

/**
`error` event

`QlobberFSQ` objects fire an `error` event if an error occurs before [`start`](#qlobberfsqeventsstart) is emitted. The `QlobberFSQ` object is unable to continue at this point and is not scanning for new messages.

@param {Object} err The error that occurred.
*/
QlobberFSQ.events.error = function (err) { return undefined; };

/**
`warning` event

`QlobberFSQ` objects fire a `warning` event if an error occurs after [`start`](#qlobberfsqeventsstart) is emitted. The `QlobberFSQ` object will still be scanning for new messages after emitting a `warning` event.

@param {Object} err The error that occurred.
*/
QlobberFSQ.events.warning = function (err) { return undefined; };

/**
`single_disabled` event

`QlobberFSQ` objects fire a `single_disabled` event if they can't support work queue semantics.

@param {Object} err The error that caused single-subscriber messages not to be supported.
*/
QlobberFSQ.events.single_disabled = function (err) { return undefined; };
