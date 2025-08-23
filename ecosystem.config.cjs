module.exports = {
    apps: [{
        name: "antenna",
        script: "dist/antenna.cjs",
        cwd: '.',
        autorestart: true
    }]
}