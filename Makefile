clean:
	rm -rf build

build: clean
	REACT_APP_VERSION=`date +"%Y.%m.%d"` yarn run build

release: build
	git worktree add -b deploy deploying/ origin/deploy
	- cd deploying/ && \
		git rm -rf . && \
		git clean -fxd && \
		cp -r ../build/* ./ && \
		git add . && \
		git commit -am "Publishing" && \
		git push
	git worktree remove deploying
	git branch -d deploy

release-prod: release
	git tag -f `date +"%Y.%m.%d"`-published
	git tag -f `date +"%Y.%m.%d"` origin/deploy
	git push --tags -f
