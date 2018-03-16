'use strict';
/* eslint linebreak-style: ["error", "windows"]*/
/* global $ google */

function decodePolyline(encoded) {
    if (!encoded) {
        return [];
    }
    let poly = [];
    let index = 0;
    let len = encoded.length;
    let lat = 0;
    let lng = 0;
    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result = result | ((b & 0x1f) << shift);
            shift += 5;
        } while (b >= 0x20);
        let dlat = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
        lat += dlat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result = result | ((b & 0x1f) << shift);
            shift += 5;
        } while (b >= 0x20);
        let dlng = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
        lng += dlng;
        let p = {
            lat: lat / 1e5,
            lng: lng / 1e5,
        };
        poly.push(p);
    }
    return poly;
}
