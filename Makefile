clean:
	rm -rf dist/
dist: clean
	yarn run build
	mv build dist
