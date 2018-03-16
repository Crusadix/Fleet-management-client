'use strict';
/* eslint linebreak-style: ["error", "windows"]*/
/* global $ google */

let fleetManagerRestBuses = 'http://127.0.0.1:4567/buses';
let fleetManagerRestStops = 'http://127.0.0.1:4567/stops';
let fleetManagerRestPassengers = 'http://127.0.0.1:4567/passengers';
// let fleetManagerRestBuses = 'https://sohjoa-sim-fleet-manager.herokuapp.com/buses'; // for heroku hosted service
// let fleetManagerRestStops = 'https://sohjoa-sim-fleet-manager.herokuapp.com/stops';
// let fleetManagerRestPassengers = 'https://sohjoa-sim-fleet-manager.herokuapp.com/passengers';

function getStops() {
    clearStopMarkers();
    $.ajax({
        url: (fleetManagerRestStops),
        method: 'GET',
        datatype: 'json',
        data: {
        },
        success: function(respond) {
            let tempString = '';
            for (let i = 0; i < respond.length; i++) {
                tempString = tempString + '<p> Stop id: ' + respond[i].id +
                    ' location: ' + respond[i].location + '</p>';
                setMarkerStop(respond[i].locationCoords, respond[i].id);
            }
            $('#stops').html(tempString);
        },
    });
}

function getPassengers() {
    clearPassengerMarkers();
    $.ajax({
        url: (fleetManagerRestPassengers),
        method: 'GET',
        datatype: 'json',
        data: {
        },
        success: function(respond) {
            for (let i = 0; i < respond.length; i++) {
                if (typeof respond[i].currentCoords
                     === 'undefined' || !respond[i].currentCoords) {
                continue;
            } else {
                    setMarkerPassenger(respond[i].currentCoords, respond[i].id);
                }
            }
        },
    });
}

function getBusInfoSetCurrentDestination(busId) {
    $.ajax({
        url: (fleetManagerRestBuses + '/' + busId),
        method: 'GET',
        datatype: 'json',
        success: function(respond) {
            console.log(respond);
            if (typeof respond.currentDestination !== 'undefined') {
                let timeToCurrentDestination = 0;
                let currentDestination = {
                    lat: respond.currentDestination.lat,
                    lng: respond.currentDestination.lng,
                };
                let date = new Date();
                let currentTimeMillis = date.getTime();
                timeToCurrentDestination = respond.timeToCurrentDestination -
                    ((currentTimeMillis - respond.destinationUpdateTimeStamp)
                     / 1000);
                // the latter part is for removing ajax call processing time
                refreshBusInfoWindow(busId, respond);
                animateMarkerMovement(currentDestination,
                    timeToCurrentDestination, busId, respond);
                setTimeout(function() {
                    getBusInfoSetCurrentDestination(busId);
                }
                    , (timeToCurrentDestination * 1000 + 500));
                    refreshMap();
            } else {
                clearPath(busId);
            }
        },
    });
}

function getBusInfoSetCurrentDestinationOnDemand(busId) {
    $.ajax({
        url: (fleetManagerRestBuses + '/' + busId),
        method: 'GET',
        datatype: 'json',
        success: function(respond) {
            console.log(respond);
            if (typeof respond.currentDestination !== 'undefined') {
                let timeToCurrentDestination = 0;
                let currentDestination = {
                    lat: respond.currentDestination.lat,
                    lng: respond.currentDestination.lng,
                };
                let date = new Date();
                let currentTimeMillis = date.getTime();
                timeToCurrentDestination = respond.timeToCurrentDestination -
                    ((currentTimeMillis - respond.destinationUpdateTimeStamp)
                     / 1000);
                // the latter part is for removing ajax call processing time
                refreshBusInfoWindow(busId, respond);
                animateMarkerMovement(currentDestination,
                    timeToCurrentDestination, busId, respond);
                setTimeout(function() {
                    getBusInfoSetCurrentDestinationOnDemand(busId);
                }
                    , (timeToCurrentDestination * 1000 + 500));
                    refreshMap();
            } else {
                clearPath(busId);
            }
        },
    });
}

function getDirections(origin, destination, waypoints, busId) {
    $.ajax({
        url: (fleetManagerRestBuses + '/' + busId),
        method: 'PUT',
        datatype: 'json',
        data: {
            origin: origin,
            destination: destination,
            waypoints: waypoints,
            zone: 'Espoo',
        },
        success: function(respond) {
            drawPath(decodePolyline(respond.routes[0].overviewPolyline.points),
            busId);
            setMarkerBus(respond.routes[0].legs[0].startLocation, busId);
        },
    });
}

function getDirectionsOnDemand(origin, destination, busId) {
    $.ajax({
        url: (fleetManagerRestBuses + '/' + busId),
        method: 'PUT',
        datatype: 'json',
        data: {
            origin: origin,
            destination: destination,
            waypoints: 'onDemand',
            zone: 'Espoo',
        },
        success: function(respond) {
            clearPath(busId);
            drawPath(decodePolyline(respond.routes[0].overviewPolyline.points),
             busId);
            setMarkerBus(respond.routes[0].legs[0].startLocation, busId);
        },
    });
}

function updateDirectionsOnDemand(busId) {
    $.ajax({
        url: (fleetManagerRestBuses + '/' + busId),
        method: 'GET',
        datatype: 'json',
        success: function(respond) {
            clearPath(busId);
            drawPath(decodePolyline(respond.directionsOverview.routes[0].
                overviewPolyline.points), busId);
            setMarkerBus(respond.directionsOverview.routes[0].legs[0].
                startLocation, busId);
        },
    });
}

function setToDriveMetro(busId) {
    $.ajax({
        url: (fleetManagerRestBuses + '/' + busId),
        method: 'POST',
        datatype: 'json',
        data: {
            operationType: 'metro',
        },
        success: function(respond) {
            getBusInfoSetCurrentDestination(busId);
        },
    });
}

function setToDriveBusRoute(busId) {
    $.ajax({
        url: (fleetManagerRestBuses + '/' + busId),
        method: 'POST',
        datatype: 'json',
        data: {
            operationType: 'busRoute',
        },
        success: function(respond) {
            getBusInfoSetCurrentDestination(busId);
        },
    });
}

function setToDriveOnDemand(busId) {
    $.ajax({
        url: (fleetManagerRestBuses + '/' + busId),
        method: 'POST',
        datatype: 'json',
        data: {
            operationType: 'onDemand',
        },
        success: function(respond) {
            getBusInfoSetCurrentDestinationOnDemand(busId);
        },
    });
}

function addBus() {
    $.ajax({
        url: (fleetManagerRestBuses),
        method: 'PUT',
        datatype: 'json',
        data: {
            origin: origin,
        },
        success: function(respond) {
            return respond;
        },
    });
}

function addPassenger(origin, destination) {
    $.ajax({
        url: (fleetManagerRestPassengers),
        method: 'PUT',
        data: {
            origin: origin,
            destination: destination,
        },
        success: function(respond) {
            return respond;
        },
    });
}

function addStop(location, stopType) {
    if (stopType == 'Station') {
        $.ajax({
            url: fleetManagerRestStops,
            method: 'PUT',
            datatype: 'json',
            data: {
                location: location,
                fuelType: 'electric',
                storageType: 'hall',
            },
            success: function(respond) {
                return respond;
            },
        });
    } else {
        $.ajax({
            url: fleetManagerRestStops,
            method: 'PUT',
            datatype: 'json',
            data: {
                location: location,
            },
            success: function(respond) {
                return respond;
            },
        });
    }
}
