FROM php:8.1-cli
RUN apt-get update -yqq \
    && apt-get install -y libicu-dev sqlite3 \
	&& docker-php-ext-install intl mysqli pdo pdo_mysql