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

Services can be customized with a bunch of options, to explore them, see the [Service Configuration](./docs/services.md) documentation

Here is an example of a configured service 

`antenna.yml` :
```yml
my-first-service:
  url: "/my-service"
  commands:
    - "echo 'Hello!' >> output"
  directory: "/home/foo/my-project"
```

And its usage

```sh
curl -vX POST http://localhost:3000/my-service
```