# Fleet-management-client

This application serves as the client for the [fleet-management system](https://github.com/Crusadix/Spark_fleet) for autonomous vehicles developed for the [Sohjoa]( http://sohjoa.fi/) project aimed to facilitate new know-how, business and job-opportunities in Finland associated with autonomous vehicles.

### Usage

The client is live [here](http://users.metropolia.fi/~hermannq/Sohjoa/Fleet_management/home.html) currently running on Heroku and Metropolia private cloud (running on free dynos, may take a few minutes to start up!).
Using the client was kept as simple as possible, but is sufficient to experiment various public transportation situations. All operation requires a route to be set up for a bus first, route building shown in the image below ![alt text](http://users.metropolia.fi/~hermannq/Sohjoa/images/routes.PNG)
Entities (such as more buses, passengers or bus-stops) can be added after toggling the form visibility seen in the image above.

After a route has been set, a bus can be sent to drive the route with the specified operation-type as can be seen in the image below ![alt text](http://users.metropolia.fi/~hermannq/Sohjoa/images/onRoute.PNG)
Data of the bus operation can be seen in the info-window of the bus, with additional details in the console of the browser. 
