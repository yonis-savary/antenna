up:
	@npm run build
	@node dist/antenna.cjs

prod:
	@git pull
	@npm run build
	@pm2 restart ecosystem.config.cjs