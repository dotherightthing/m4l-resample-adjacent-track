"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

/**
 * @file Raw polyfill as the babel/core-js internal require system wasn't respected by Max
 * @see {@link https://raw.githubusercontent.com/behnammodi/polyfill/master/string.polyfill.js}
 */

/**
 * String.padStart()
 * version 1.0.1
 * Feature	        Chrome  Firefox Internet Explorer   Opera	Safari	Edge
 * Basic support	57   	51      (No)	            44   	10      15
 * -------------------------------------------------------------------------------
 */
if (!String.prototype.padStart) {
  Object.defineProperty(String.prototype, 'padStart', {
    configurable: true,
    writable: true,
    value: function value(targetLength, padString) {
      targetLength = targetLength >> 0; //floor if number or convert non-number to 0;

      padString = String(typeof padString !== 'undefined' ? padString : ' ');

      if (this.length > targetLength) {
        return String(this);
      } else {
        targetLength = targetLength - this.length;

        if (targetLength > padString.length) {
          padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
        }

        return padString.slice(0, targetLength) + String(this);
      }
    }
  });
}
/* exported loadbang, renameSelectedTrack, resampleSelectedTrack */
// inlets and outlets


inlets = 1;
outlets = 1; // global functions and variables

/**
 * @function bang
 * @summary Runs automatically when 'live.thisdevice' left outlet is connected to 'js script-name.js' inlet
 */

function bang() {// eslint-disable-line no-unused-vars
  // this_device = the Max for Live Device object that contains this JavaScript code
  // in the max object, live.thisdevice determines when the Max Device has completely loaded
  // and sends a bang from its left outlet when the Device is fully initialized, including the Live API).
}
/**
 * @function loadbang
 * @summary Executes when the Max patch opens
 */


function loadbang() {
  console.log('m4l-helpers initialized.'); // eslint-disable-line no-console
}
/**
 * @function renameSelectedTrack
 * @summary Rename the selected track
 * @param {string} trackName Track name
 */


function renameSelectedTrack(trackName) {
  var selectedTrackObj = getSelectedTrackObj();

  if (_typeof(selectedTrackObj) === 'object') {
    selectedTrackObj.set('name', trackName);
  }
}
/**
 * @function resampleSelectedTrack
 * @summary Resample the selected track
 * @param {string} insertPosition Insert position relative to selected track (before|after)
 */


function resampleSelectedTrack(insertPosition) {
  var onMasterTrack = selfOnMasterTrack();

  if (onMasterTrack) {
    var selectedTrackObj = getSelectedTrackObj();

    if (typeof selectedTrackObj === 'object' && selectedTrackObj !== null) {
      var selectedTrackHasAudioOutput = Boolean(Number(selectedTrackObj.get('has_audio_output')));
      var selectedTrackHasMidiOutput = Boolean(Number(selectedTrackObj.get('has_midi_output')));
      var selectedTrackId = selectedTrackObj.id;
      var selectedTrackColor = String(selectedTrackObj.get('color'));
      var newTrackType;

      if (selectedTrackHasAudioOutput) {
        newTrackType = 'audio';
      } else if (selectedTrackHasMidiOutput) {
        newTrackType = 'midi';
      }

      if (typeof newTrackType === 'string') {
        var newTrackObj = insertTrack(selectedTrackId, newTrackType, insertPosition);

        if (!newTrackObj || newTrackObj === null) {
          return;
        } // get selectedTrackName after insertion as an insert to the left will change its numeric suffix


        var selectedTrackName = String(selectedTrackObj.get('name'));
        var newTrackInputRoutingTypes = newTrackObj.get('available_input_routing_types');
        var newTrackName = createTrackName(selectedTrackName, true);
        var newTrackInputType = getTrackInputType(newTrackInputRoutingTypes, selectedTrackName);
        newTrackObj.set('name', newTrackName);
        newTrackObj.set('color', selectedTrackColor);
        newTrackObj.set('input_routing_type', newTrackInputType);
        newTrackObj.set('arm', 1); // move focus from new track back to selected track

        var viewObj = new LiveAPI('live_set view');
        viewObj.set('selected_track', 'id', selectedTrackId);
      }
    }
  }
} // local functions and variables


log.local = 1;
getSelectedTrackObj.local = 1;
selfOnMasterTrack.local = 1; // support console.log

console = {
  log: log
}; // eslint-disable-line no-unused-vars

/**
 * @function log
 * @see {@link http://compusition.com/writings/js-live-selectedTrackObj-logging}
 */

function log() {
  post('------------\n');

  for (var i = 0, len = arguments.length; i < len; i += 1) {
    var message = arguments[i];

    if (message && message.toString) {
      var s = message.toString();

      if (s.indexOf('[object ') >= 0) {
        s = JSON.stringify(message);
      }

      post(s);
    } else if (message === null) {
      post('<null>');
    } else {
      post(message);
    }
  }

  post('\n');
}
/**
 * @function createTrackName
 * @param {string} baseName Base name
 * @param {boolean} timeStamp Whether to output a trailing timestamp (aids debugging)
 * @returns {string} trackName
 */


function createTrackName(baseName) {
  var timeStamp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var timeStampStr = '';
  var trackName = '';

  if (timeStamp) {
    var date = new Date();
    timeStampStr = "".concat(String(date.getHours()).padStart(2, '0'), ":").concat(String(date.getMinutes()).padStart(2, '0'));
  }

  timeStampStr = timeStamp ? " (".concat(timeStampStr, ")") : '';
  trackName = "[".concat(baseName, "]").concat(timeStampStr);
  return trackName;
}
/**
 * @function getSelectedTrackObj
 * @summary Checks whether the selected track is an Audio/Midi/Instrument track and not a Return/Master track
 * @returns {object} selectedTrackObj
 */


function getSelectedTrackObj() {
  var selectedTrackObj = new LiveAPI('live_set view selected_track');

  if (selectedTrackObj) {
    var sourceTrackCanBeArmed = Boolean(Number(selectedTrackObj.get('can_be_armed'))); // Excludes return and master tracks

    if (!sourceTrackCanBeArmed) {
      selectedTrackObj = null;
    }
  }

  return selectedTrackObj;
}
/**
 * @function getTrackIds
 * @returns {Array} trackIds
 */


function getTrackIds() {
  var setObj = new LiveAPI('live_set'); // setObj fails if Preview is off

  if (!setObj) {
    return null;
  }

  var setTracks = setObj.get('tracks');
  var trackIds = setTracks.filter(function (key) {
    return key !== 'id';
  }); // remove 'id' strings from [id,11,id,12,id,13,id,1,id,7,id,8,id,9]

  return trackIds;
}
/**
 * @function getTrackInputType
 * @param {string} availableInputTypes Stringified array of objects
 * @param {symbol} sourceTrackName Name of existing track to use as the audio source
 * @returns {object} inputType
 * @see {@link https://github.com/weston-bailey/m4l-plugins/blob/067fd5b9da8350229d1539ae97a2be7f5ed6c19c/max-projects/FFX%20Freq%20Seq%20Proj/code/fsTracker.js#L116}
 */


function getTrackInputType() {
  var availableInputTypes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var sourceTrackName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var sourceTrackNameStr = String(sourceTrackName);
  var trackInputType;
  var routing = JSON.parse(availableInputTypes); // de-string

  routing.available_input_routing_types.forEach(function (type) {
    if (type.display_name === sourceTrackNameStr) {
      trackInputType = type;
    }
  });
  return trackInputType;
}
/**
 * @function insertTrack
 * @param {string} sourceTrackId ID of existing track to insert the new track next to
 * @param {string} trackType Type of new track (audio|midi)
 * @param {string} insertPosition Position of new track relative to existing track (after|before)
 * @returns {object|null} newTrackObj
 * @todo setObj fails if Preview is off - is this expected?
 */


function insertTrack(sourceTrackId) {
  var trackType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'audio';
  var insertPosition = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'after';
  var setObj = new LiveAPI('live_set'); // setObj fails if Preview is off

  if (!setObj) {
    return null;
  }

  var trackId = Number(sourceTrackId);
  var trackIds = getTrackIds();
  var trackIndex = trackIds.indexOf(trackId);
  var newTrackIndex = insertPosition === 'before' ? trackIndex : trackIndex + 1;
  setObj.call("create_".concat(trackType, "_track"), newTrackIndex);
  var newTrackObj = new LiveAPI('live_set tracks ' + newTrackIndex);
  return newTrackObj;
}
/**
 * @function selfOnMasterTrack
 * @summary Checks whether the max device is on the Master track
 * @returns {boolean} isOnMasterTrack
 */


function selfOnMasterTrack() {
  var isOnMasterTrack = false;
  var deviceTrackObj = new LiveAPI('this_device canonical_parent');
  var deviceTrackName = String(deviceTrackObj.get('name'));
  var hostTrackObj = new LiveAPI('live_set master_track');

  if (hostTrackObj) {
    var hostTrackName = String(hostTrackObj.get('name'));

    if (hostTrackName === deviceTrackName) {
      isOnMasterTrack = true;
    }
  }

  return isOnMasterTrack;
}