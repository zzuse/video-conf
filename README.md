# Nodejs conference mediasoup app

## Install nodejs
## Front end using vite

1. npm create vite@latest  
   ✔ Project name: … front-end  
   ✔ Select a framework: › Vanilla  
   ✔ Select a variant: › JavaScript  
   cd front-end  
   npm install socket.io-client  
   npm install mediasoup-client  

2. Above is creating from zero, if you already have the project in front-end just `npm install`  
   <del>OPTIONAL: local http: `npm run dev`</del>  
   OPTIONAL: local https: `npm run dev --https`  
   `npm run dev --https --  --host`  
   <del>nohup npm run dev --https --  --host >front.log 2>&1 &</del>  
   open browser access https://YOUR_IP:5173/  

## Backend

1. cd back-end  
2. OPTIONAL: to run it locally, update these with your local IP or domain  
   back-end/server.js  
   back-end/config/config.js  
   front-end/main.js  
3. npm install express mediasoup socket.io  
4. nodemon ./server.js  

## CA for https

1. using letsencrypt certificate, change cert path in  
   front-end/vite.config.js  
   back-end/server.js  
  OPTIONAL: use mkcert for local  
  <del>npm install mkcert -g</del>  
  <del>mkcert create-ca</del>  
  <del>mkcert create-cert (and move all ca and cert to ./config)</del>  

## Firewall open port

*  5173 -- front-end  
*  8181 -- back-end  
*  40000/41000 -- RTP  
