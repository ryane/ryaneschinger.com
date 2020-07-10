HUGO_IMAGE			?= klakegg/hugo
HUGO_VERSION		?= 0.73.0
HTMLTEST_IMAGE		?= wjdp/htmltest
HTMLTEST_VERSION	?= v0.12.0

.PHONY: build
build:
	@docker run --rm -it \
		-v $(shell pwd):/src \
		${HUGO_IMAGE}:${HUGO_VERSION}

.PHONY: server
server:
	@docker run --rm -it \
		-p 1313:1313 \
		-v $(shell pwd):/src \
		${HUGO_IMAGE}:${HUGO_VERSION} \
		server -D

.PHONY: check
check:
	@docker run --rm -it \
		-v $(shell pwd):/src \
		${HUGO_IMAGE}:${HUGO_VERSION} \
		check

.PHONY: config
config:
	@docker run --rm -it \
		-v $(shell pwd):/src \
		${HUGO_IMAGE}:${HUGO_VERSION} \
		config

.PHONY: htmltest
htmltest:
	docker run --rm -it \
		-v $(shell pwd):/test ${HTMLTEST_IMAGE}:${HTMLTEST_VERSION} \
		htmltest -c htmltest.yaml
