SRC = $(shell /usr/bin/find ./src -type f)
DOCKER_TAG = $(shell git rev-parse --short HEAD)

.PHONY: default install install-dep test test-gen clean docker-image release

default: install-dep install

install: .bin/srclib-typescript.js

.bin/srclib-typescript.js: node_modules ${SRC} tsconfig.json tsd.json package.json
	tsc -p .

install-dep:
	npm install

test: install
	srclib -v test

test-gen: install
	srclib -v test --gen

clean:
	rm -f .bin/*.js

docker-image:
	docker build -t srclib/srclib-typescript:$(DOCKER_TAG) .

release: docker-image
	docker push srclib/srclib-typescript:$(DOCKER_TAG)