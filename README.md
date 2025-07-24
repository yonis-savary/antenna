# Antenna

Basic NodeJs Webhooks server

## Features

- Configurable routes / commands
- SHA256 Secret support

## Installation

```sh
git clone https://github.com/yonis-savary/antenna.git
cd antenna

# direct launch
make up

# build only
make build

# start with pm2
make prod
```

## Configuration example

### Application Configuration

`.env` :

```conf
CONFIG_FILE=/home/foo/antenna.yml
APP_PORT=3000

# If set to true, will allow the definition of a /ping
# route that can be used to check the service status
ALLOW_PING_ROUTE=true # (true by default)
```

### Service configuration

`antenna.yml` :

```yml
my-service:
  # URL to launch the webhook
  url: "/my-service"
  # Shell commands to execute
  commands:
    - "echo 'Hello!' >> output"
  # Working directory for commands
  directory: "/home/foo/my-project"
  # Debounce delay (seconds, optionnal, 0 by default)
  delay: 10
  # SHA256 Secret (optionnal)
  secret: 'supersecret'

webhook-that-prints:
  url: '/print-body'
  directory: "/home/foo/my-project"
  # Request body can also be given to your commands
  # "injection: pipe" executes echo <body> | <your-command>
  injection: 'pipe'
  # Async simply launch the command and return a 200 response with no body 
  # Note: any delay on a webhook makes it async
  # (async is false by default)
  async: true
  commands:
   - 'cat',

webhook-that-prints-variable:
  url: '/print-body/variable'
  directory: "/home/foo/my-project"
  # If your command does not support stdin
  # You can pass the request through a variable
  # "injection: variable" executes MY_VARIABLE=<body>; <your-command>
  injection: variable
  injection_variable: MY_VARIABLE
  commands:
   - 'echo "$MY_VARIABLE"'
```

Tests with
```sh
curl -vX POST http://localhost:3000/my-service \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=ca2a85992c486d33a9b753013138edbd3d885c083d43790f0f83405a7af707b4" \
  -d '{"message":"Hello from curl!"}'
```