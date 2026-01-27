FROM mysql:8.0.35 AS base

COPY ./02-db.sql /docker-entrypoint-initdb.d/02-db.sql
COPY ./03-dev-default-user.sql /docker-entrypoint-initdb.d/03-dev-default-user.sql

FROM base AS development

EXPOSE 3306

FROM base AS production


EXPOSE 3306
