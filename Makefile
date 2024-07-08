VERSION="v1"

build:
	docker build --rm --force-rm -t sserver:${VERSION} .

clean:
	docker rmi sserver:${VERSION}
checkcode:
	npm run formatcheck
repaircode:
	npm run doformat
linter:
	npm run fixlint
checklint:
	npm run checklint
test:
	npm run test

rundev:
	npm run dev