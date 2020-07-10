HUGO_VERSION ?= 0.73.0

.PHONY: server
server:
	@docker run --rm -it \
		-p 1313:1313 \
		-v $(shell pwd):/src \
		klakegg/hugo:${HUGO_VERSION} \
		server -D

.PHONY: check
check:
	@docker run --rm -it \
		-v $(shell pwd):/src \
		klakegg/hugo:${HUGO_VERSION} \
		check

.PHONY: config
config:
	@docker run --rm -it \
		-v $(shell pwd):/src \
		klakegg/hugo:${HUGO_VERSION} \
		config
