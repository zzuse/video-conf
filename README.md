# Nodejs conference mediasoup app

## Install nodejs, create front end using vite

1. npm create vite@latest  
   ✔ Project name: … front-end  
   ✔ Select a framework: › Vanilla  
   ✔ Select a variant: › JavaScript  
   cd front-end  
   npm install socket.io-client  
   npm install mediasoup-client  

2. Above is creating from zero, if you already have the project in front-end just `npm install`  
   to run: <del>npm run dev</del>  
   npm run dev --https  
   or in tmux `npm run dev --https --  --host`  
   <del>nohup npm run dev --https --  --host >front.log 2>&1 &</del>  
   open browser access https://$IP:5173/  

## Create backend

1. cd back-end  
2. generate and using letsencrypt certificate  
  <del>npm install mkcert -g</del>   
  <del>mkcert create-ca</del>  
  <del>mkcert create-cert (and move all ca and cert to ./config)</del>  
5. OPTIONAL: to run it locally, update the files with your local IP  
6. npm install express mediasoup socket.io  
7. nodemon ./server.js  

## Open firewall port
5173 -- front-end  
8181 -- back-end  
40000/41000 -- RTP  
