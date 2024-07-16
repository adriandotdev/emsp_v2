#Pull node latest version, current version 21 as of 11/30/2023
FROM node:21.6.2-alpine3.18

#Install PM2
RUN npm install -g pm2@latest

#Set work directory
WORKDIR /var/www/emsp

#Copy all content of the current dir to WORKDIR
COPY . .

#Install Apps
RUN npm i 

#Image port
EXPOSE 4021

#Script to start apps (specific setup of pm2)
CMD [ "pm2-runtime", "start" , "./ecosystem.config.js" ]