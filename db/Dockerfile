FROM mysql:8.0 AS base
ENV MYSQL_DATABASE=Accessibility

COPY 01-setup.sql /docker-entrypoint-initdb.d/01-setup.sql

COPY 02-db.sql /docker-entrypoint-initdb.d/02-db.sql
COPY 03-dev-default-user.sql /docker-entrypoint-initdb.d/03-dev-default-user.sql

FROM base AS development

EXPOSE 3306

FROM base AS production


EXPOSE 3306
