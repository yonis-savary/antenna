up:
	@npm install
	@npm run build
	@node dist/antenna.cjs

build:
	@git pull
	@npm ci
	@npm run build

deploy:
	@git pull
	@npm ci
	@npm run build
	@pm2 restart ecosystem.config.cjs