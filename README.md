### Home consumption app
This app is designed for homes and allows you to track your electricity, heat and water consumption. You can also see monthly consumption graphs as you add up your readings month by month. This is an old-fashioned way of tracking your home's consumption and you need to read the meter monthly and add data to this app.

This app is created so that there is `node.js` backend by which your data is saved to SQLite database. Frontend is pure html file which communicate with this `node.js` backend.

### How to install

First you have to clone this repo and go to backend folder. Here you run command `npm install` which install needed files. You can start backend with command `node server.js` in your `backend/db/` folder. After that you go to your frontend folder and install `http-server` with command `npm install http-server`. You can start the `http-server` with command `npx http-server -p 8080`. Next you go to web browser and open IP address e.g http://127.0.0.1:8080' and port which is port number 8080.
