FROM nginx:alpine

ARG NGINX_CONF=nginx.conf

COPY . /usr/share/nginx/html
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf

EXPOSE 80