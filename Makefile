clean:
	rm -rf build
build: clean
	yarn run build
deploy: build
	git worktree add -b deploy deploying/ origin/deploy
	rm -rf deploying/*
	cp -r build/* deploying/
	- cd deploying/ && \
		git add . && \
		git commit -am "Publishing" && \
		git push
	git worktree remove deploying
	git branch -d deploy
