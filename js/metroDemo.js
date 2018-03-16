'use strict';
/* eslint linebreak-style: ["error", "windows"]*/
/* global $ google */

let map;
const busMarkers = [];
const passengerMarkers = [];
const stopMarkers = [];
const paths = [];
let loc = window.location.pathname;
let currentDir = loc.substring(0, loc.lastIndexOf('/'));

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 60.203,
            lng: 24.656,
        },
        zoom: 13,
    });
}

function drawPath(pathCoordinates, busId) {
    let date = new Date();
    let currentTimeMillis = date.getTime();
    let polyLine = new google.maps.Polyline({
        path: pathCoordinates,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1,
        strokeWeight: 1,
        map: map,
        id: busId,
        timeStamp: currentTimeMillis,
    });

    for (let i = 0; i < paths.length; i++) {
        if (paths[i].id == busId) {
            clearPath(busId);
            paths[i] = polyLine;
            paths[i].setMap(map);
            return paths[i];
        }
    }
    polyLine.setMap(map);
    paths.push(polyLine);
}

function clearPath(busId) {
    for (let i = 0; i < paths.length; i++) {
        if (paths[i].id == busId) {
            paths[i].setMap(null);
        }
    }
}

function setMarkerBus(position, busId) {
    for (let i = 0; i < busMarkers.length; i++) {
        if (busMarkers[i].id == busId) {
            busMarkers[i].position = position;
            return busMarkers[i];
        }
    }
    let marker = new google.maps.Marker({
        map: map,
        icon: {
            url: currentDir + '/icons/ez10Icon.png',
            scaledSize: new google.maps.Size(40, 40),
        },
        position: position,
        id: busId,
    });
    let contentString = '<p>Bus id: ' + busId + '</p>' +
        '<button onclick="setToDriveMetro(' + busId +
        ')">Drive metro</button>' +
        '<button onclick="setToDriveBusRoute(' + busId +
        ')">Drive bus-route</button>' +
        '<button onclick="setToDriveOnDemand(' + busId +
        ')">Drive on-demand</button>';
    let infowindow = new google.maps.InfoWindow({
        content: contentString,
    });
    marker.addListener('click', function() {
        infowindow.open(map, marker);
    });
    busMarkers.push(marker);
}

function setMarkerStop(position, stopId) {
    let parts = position.split(',');
    let marker = new google.maps.Marker({
        map: map,
        icon: {
            url: currentDir + '/icons/stop.png',
            scaledSize: new google.maps.Size(30, 30),
        },
        position: {
            lat: parseFloat(parts[0]),
            lng: parseFloat(parts[1]),
        },
        id: stopId,
    });
    let contentString = '<p>Stop id: ' + stopId + '</p>';
    let infowindow = new google.maps.InfoWindow({
        content: contentString,
    });
    marker.addListener('click', function() {
        infowindow.open(map, marker);
    });
    stopMarkers.push(marker);
}

function setMarkerPassenger(position, passengerId) {
    let parts = position.split(',');
    let marker = new google.maps.Marker({
        map: map,
        icon: {
            url: currentDir + '/icons/passenger.png',
            scaledSize: new google.maps.Size(30, 30),
        },
        position: {
            lat: parseFloat(parts[0]),
            lng: parseFloat(parts[1]),
        },
        id: passengerId,
    });
    let contentString = '<p>Passenger id: ' + passengerId + '</p>';
    let infowindow = new google.maps.InfoWindow({
        content: contentString,
    });
    marker.addListener('click', function() {
        infowindow.open(map, marker);
    });
    passengerMarkers.push(marker);
}

function animateMarkerMovement(destination, durationSeconds, busId) {
    for (let i = 0; i < busMarkers.length; i++) {
        if (busMarkers[i].id == busId) {
            busMarkers[i].setDuration(durationSeconds * 1000);
            busMarkers[i].setPosition(destination);
            break;
        }
    }
}

function clearPassengerMarkers() {
    for (let i = 0; i < passengerMarkers.length; i++) {
        passengerMarkers[i].setMap(null);
    }
    passengerMarkers.length = 0;
}

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

function refreshMap() {
    getStops();
    getPassengers();
}

initMap();
refreshMap();
getDirections('Sunantie, Espoo', 'Rajamäentie, Espoo', '1,2', 4);

function toggleDisabled(_checked) {
    document.getElementById('waypoints').disabled = _checked ? true : false;
}

$('#driveMetroButton').click(function() {
    setToDriveMetro();
});

$('#driveBusRouteButton').click(function() {
    setToDriveBusRoute();
});

$('#driveOnDemandButton').click(function() {
    setToDriveOnDemand();
});
