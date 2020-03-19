FROM nginx:1.17.9

COPY . /app
WORKDIR /app

RUN ["chmod", "+x", "./init_pod.sh"]
ENTRYPOINT ["./init_pod.sh"]

