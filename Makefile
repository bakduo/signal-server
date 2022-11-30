VERSION="v1"

build:
	docker build --rm --force-rm -t sserver:${VERSION} .

clean:
	docker rmi sserver:${VERSION}