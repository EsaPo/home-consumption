### Home consumption app / Omakotitalon kulutusseuranta
This app is designed for homes and allows you to track your electricity, heat and water consumption. You can also see monthly consumption graphs as you add up your readings month by month. This is an old-fashioned way of tracking your home's consumption and you need to read the meter monthly and add data to this app.

This app is created so that there is `node.js` backend by which your data is saved to SQLite database. Frontend is pure html file which communicate with this `node.js` backend.

#### How to install

First you have to clone this repo and go to backend folder. Here you run command `npm install` which install needed files. You can start backend with command `node server.js` in your `backend/db/` folder. 

After that you go to your frontend folder and install `http-server` with command `npm install http-server`. You can start the `http-server` with command `npx http-server -p 8080`. You can also set some other web server e.g. Apache, Nginx or caddy etc. to serve your files.

Next you have to go to web browser and open the ip address with port where your files are installed e.g. http://127.0.0.1:8080.
