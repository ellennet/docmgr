FROM node:14

ENV APP_ID="skdocmgr" \
    MONGO_URL="mongodb://root:52524567@localhost/skdocmgr" \
    ADMIN_PASS="admin" \
    MINIO_HOST="" \
    MINIO_PORT="" \
    MINIO_AK="" \
    MINIO_SK="" \
    MINIO_BUCKET=""

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . /app

EXPOSE 3010

CMD node ./bin/www ${APP_ID} ${MONGO_URL} ${ADMIN_PASS} ${MINIO_HOST} ${MINIO_PORT} ${MINIO_AK} ${MINIO_SK} ${MINIO_BUCKET}