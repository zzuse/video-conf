# create front end using vite

1. npm create vite@latest
   ✔ Project name: … front-end
   ✔ Select a framework: › Vanilla
   ✔ Select a variant: › JavaScript
2. cd front-end
   npm install
   npm run dev
   open browser access http://localhost:5173/
   npm install socket.io-client
   npm install mediasoup-client

# create backend

1. cd back-end
2. npm install mkcert -g
3. mkcert create-ca
4. mkcert create-cert (and move all ca and cert to ./config)
5. OPTIONAL: to run it locally, update the files with your local IP
6. npm install express mediasoup socket.io
7. nodemon ./server.js
