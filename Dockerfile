#Pull node latest version, current version 21 as of 11/30/2023
FROM node:21.6.2-alpine3.18

# Environment Variables
ENV PORT=4021
ENV DB_HOST=192.46.227.227
ENV DB_USER=root
ENV DB_PASSWORD=4332wurx
ENV DB_DATABASE=emsp_v2
ENV DB_CONNECTION_LIMIT=20
ENV NODEMAILER_NAME=hostgator
ENV NODEMAILER_HOST=mail.sysnetph.com
ENV NODEMAILER_PORT=465
ENV NODEMAILER_USER=no-reply@sysnetph.com
ENV NODEMAILER_PASSWORD=4332wurx-2023
ENV NODEMAILER_TRANSPORT=smtp
ENV NODEMAILER_SECURE=false
ENV JWT_ACCESS_KEY=emobility-4332wurx-access
ENV JWT_REFRESH_KEY=emobility-4332wurx-refresh
ENV USERNAME=emobility
ENV PASSWORD=4332wurxemobility
ENV WINSTON_LOGGER_MAX_SIZE=52428800
ENV WINSTON_LOGGER_MAX_FILES=5
ENV GOOGLE_GEO_API_KEY=AIzaSyASXoodW78ADiwCRsBog4MI9U_he10aTV8
ENV PARKNCHARGE_SECRET_KEY=sysnetintegratorsinc:emobility
ENV CRYPTO_ALGORITHM=aes-256-cbc
ENV CRYPTO_SECRET_KEY=d6F3Efeqd6F3Efeqd6F3Efeqd6F3Efeq
ENV CRYPTO_IV=3bd269bc5b740457

#Install PM2
RUN npm install -g pm2@latest

#Set work directory
WORKDIR /var/www/emsp

RUN mkdir -p public/csv

RUN mkdir -p public/images

#Copy all content of the current dir to WORKDIR
COPY . .

#Install Apps
RUN npm i 

#Image port
EXPOSE 4021

#Script to start apps (specific setup of pm2)
CMD [ "pm2-runtime", "start" , "./ecosystem.config.js" ]