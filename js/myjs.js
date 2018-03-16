'use strict';
/* eslint linebreak-style: ["error", "windows"]*/
/* global $ google */

let map;
const busMarkers = [];
const passengerMarkers = [];
const stopMarkers = [];
const paths = [];
const infoWindows = [];
let loc = window.location.pathname;
let currentDir = loc.substring(0, loc.lastIndexOf('/'));
let generatedMarkerPath = [];

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 60.203,
            lng: 24.656,
        },
        zoom: 13,
    });
}

function setMarkerBus(position, busId) {
    for (let i = 0; i < busMarkers.length; i++) {
        if (busMarkers[i].id == busId) {
            busMarkers[i].stepIndex = 0,
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
        stepIndex: 0,
        id: busId,
    });
    let contentString = '<div id='+ '"infoWindow' +busId +'"'+'>' +
     '<p>Bus id: ' + busId + '</p>' +
        '<button onclick="setToDriveMetro(' + busId +
        ')">Drive metro</button>' +
        '<button onclick="setToDriveBusRoute(' + busId +
        ')">Drive bus-route</button>' +
        '<button onclick="setToDriveOnDemand(' + busId +
        ')">Drive on-demand</button>';
    let infowindow = new google.maps.InfoWindow({
        content: contentString,
        Id: busId,
    });
    infoWindows.push(infowindow);
    marker.addListener('click', function() {
        infowindow.open(map, marker);
    });
    busMarkers.push(marker);
}

function setMarkerStop(position, stopId) {
    let marker = new google.maps.Marker({
        map: map,
        icon: {
            url: currentDir + '/icons/stop.png',
            scaledSize: new google.maps.Size(30, 30),
        },
        position: position,
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
    let marker = new google.maps.Marker({
        map: map,
        icon: {
            url: currentDir + '/icons/passenger.png',
            scaledSize: new google.maps.Size(30, 30),
        },
        position: position,
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

function drawPath(pathCoordinates, busId) {
    let date = new Date();
    let currentTimeMillis = date.getTime();
    let polyLine = new google.maps.Polyline({
        path: pathCoordinates,
        pathCoords: pathCoordinates,
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

function fixPathCoords(destination, busData, busMarker) {
    for (let y = 0; y < busData.currentRoute.length; y++) {
        if (destination.lat == busData.currentRoute[y].endLocation.lat
            && destination.lng == busData.currentRoute[y].endLocation.lng) {
            console.log('Correction done');
            busMarker.stepIndex = y;
            busMarker.stepIndex++;
            return decodePolyline(busData.currentRoute[y].polyline.points);
        }
    }
}

function getPathCoords(busMarker, destination, busId, busData) {
    let coordsToDestination = [];
    let formattedCoordsAtDestination;
    for (let i = 0; i < paths.length; i++) {
        if (paths[i].id == busId) {
            for (let x = 0; x < busData.currentRoute.length; x++) {
                if (x == busMarker.stepIndex) {
                    if (destination.lat != busData.
                        currentRoute[x].endLocation.lat && destination.lng
                        != busData.currentRoute[x].endLocation.lng) {
                        return fixPathCoords(destination, busData, busMarker);
                    }
                    busMarker.stepIndex++;
                    return decodePolyline(busData.currentRoute[x].
                        polyline.points);
                }
            }
        }
    }
}

function moveMarker(busMarker, timePerJump, coordsToDestination, index) {
    busMarker.setDuration(timePerJump);
    busMarker.setPosition(coordsToDestination[index]);
    if (index < coordsToDestination.length - 1) {
        setTimeout(function() {
            moveMarker(busMarker, timePerJump, coordsToDestination, index +1);
        }, timePerJump);
    }
}

function animateMarkerMovement(destination, durationSeconds, busId, busData) {
    let busMarker;
    for (let i = 0; i < busMarkers.length; i++) {
        if (busMarkers[i].id == busId) {
            busMarker = busMarkers[i];
        }
    }
    let coordsToDestination = getPathCoords(busMarker,
         destination, busId, busData);
    let numberOfCoords = coordsToDestination.length;
    let durationToDestination = durationSeconds * 1000;
    let timePerJump = durationToDestination / numberOfCoords;
    let index = 0;
    moveMarker(busMarker, timePerJump, coordsToDestination, index);
}

function clearPassengerMarkers() {
    for (let i = 0; i < passengerMarkers.length; i++) {
        passengerMarkers[i].setMap(null);
    }
    passengerMarkers.length = 0;
}

function clearStopMarkers() {
    for (let i = 0; i < stopMarkers.length; i++) {
        stopMarkers[i].setMap(null);
    }
    stopMarkers.length = 0;
}

function refreshMap(busId, responseData) {
    getStops();
    getPassengers();
}

function refreshBusInfoWindow(busId, responseData) {
    let contentString = '<div id='+ '"infoWindow' +busId +'"'+
    '> <p>Bus id: ' + busId + '</p>' +
    '<p>Bus status: ' + responseData.busStatus + '</p>' +
    '<p>Latest coords ' + responseData.locationCoords.lat +
    ',' + responseData.locationCoords.lng + '</p>' +
    '<button onclick="setToDriveMetro(' + busId +
    ')">Drive metro</button>' +
    '<button onclick="setToDriveBusRoute(' + busId +
    ')">Drive bus-route</button>' +
    '<button onclick="setToDriveOnDemand(' + busId +
    ')">Drive on-demand</button> </div>';
    for (let i = 0; i < infoWindows.length; i++) {
        if (infoWindows[i].Id == busId) {
            if (infoWindows[i].getMap() != null) {
                document.getElementById('infoWindow'+busId).
                innerHTML = contentString;
            }
        }
    }
}

initMap();
refreshMap();
toggleFormVisibility();
window.addEventListener('load', loadRoute, false);
window.addEventListener('load', loadBusAddForm, false);
window.addEventListener('load', loadStopAddForm, false);
window.addEventListener('load', loadPassengerAddForm, false);

function loadRoute() {
    document.getElementById('routeForm').addEventListener('submit',
        function(event) {
            event.preventDefault();
            let busId = document.getElementById('busId').value;
            let origin = document.getElementById('origin').value;
            let destination = document.getElementById('destination').value;
            let waypoints;
            if (!document.getElementById('waypointsCheck').checked) {
                waypoints = document.getElementById('waypoints').value;
            } else {
                waypoints = document.getElementById('waypointsCheck').value;
            }
            if (waypoints == 'onDemand') {
                getDirectionsOnDemand(origin, destination, busId);
            } else if (waypoints.length < 1) {
                waypoints = 0;
                getDirections(origin, destination, waypoints, busId);
            } else {
                getDirections(origin, destination, waypoints, busId);
            }
        },
        false);
}

function loadBusAddForm() {
    document.getElementById('busAddForm').addEventListener('submit',
        function(event) {
            event.preventDefault();
            let origin = document.getElementById('originBus').value;
            addBus(origin);
        },
        false);
}

function loadStopAddForm() {
    document.getElementById('stopAddForm').addEventListener('submit',
        function(event) {
            event.preventDefault();
            let location = document.getElementById('location').value;
            let stopType =
                document.querySelector('input[name="stopTypeRadio"]:checked').
                value;
            addStop(location, stopType);
        },
        false);
}

function loadPassengerAddForm() {
    document.getElementById('passengerAddForm').addEventListener('submit',
        function(event) {
            event.preventDefault();
            let origin = document.getElementById('originPassenger').value;
            let destination =
                document.getElementById('destinationPassenger').value;
            addPassenger(origin, destination);
        },
        false);
}

function toggleFormVisibility() {
    if (document.getElementById('busAddForm').style.visibility === 'hidden') {
    document.getElementById('busAddForm').style.visibility = 'visible';
    document.getElementById('stopAddForm').style.visibility = 'visible';
    document.getElementById('passengerAddForm').style.visibility = 'visible';
    } else {
        document.getElementById('busAddForm').style.visibility = 'hidden';
        document.getElementById('stopAddForm').style.visibility = 'hidden';
        document.getElementById('passengerAddForm').style.visibility = 'hidden';
    }
}

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
