FROM nginx:alpine

# Create non-root user
RUN addgroup -S nginxgroup && adduser -S nginxuser -G nginxgroup

# Copy config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/www/media && \
    chown -R nginxuser:nginxgroup /var/cache/nginx /var/log/nginx /var/www /etc/nginx

USER nginxuser

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
