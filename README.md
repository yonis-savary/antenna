# Antenna

Basic NodeJs Webhooks server

# Features

- Configurable routes / commands
- SHA256 Secret support

## Example configuration

`.env`
```conf
CONFIG_FILE=/home/foor/apps/antenna/.env
APP_PORT=3000
```

`antenna.yml` :
```yml
my-service:
  # URL to launch the webhook
  url: "/my-service"
  # Shell commands to execute
  commands:
    - "echo 'Hello!' >> output"
  # Directory to use for commands
  directory: "/home/foo/my-project"
  #Cooldown between executions (seconds, optionnal, 0 by default)
  delay: 10
  # SHA256 Signature (optionnal)
  secret: 'supersecret'
```

Tests with
```sh
curl -vX POST http://localhost:3000/my-service \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=ca2a85992c486d33a9b753013138edbd3d885c083d43790f0f83405a7af707b4" \
  -d '{"message":"Hello from curl!"}'
```

# Installation

```sh
git clone https://github.com/yonis-savary/antenna.git
cd antenna
npm i && \
    npm run build && \
    node dist/antenna.cjs
```