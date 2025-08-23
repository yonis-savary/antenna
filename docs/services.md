# Service Configuration

Your webhooks are configured through `antenna.yml` file, here is a simple example

> Note : The configuration file path can be edited with `CONFIG_FILE` in your `.env` (`antenna.yml` by default)

`antenna.yml` :
```yml
my-service:
  # url: route to launch the webhook
  url: "/my-service"
  # directory: Working directory for commands
  # this is optionnal (is Antenna path by default)
  directory: "/home/foo/my-project"
  # commands: Shell commands to execute
  # (don't forget that yaml supports multiline strings !)
  commands:
    - "echo 'Hello!' >> output"
    - >
      make prod &&
      (echo "My Mail" | msmtp any@mail.com)
```

## Secret

With some webhooks services such as GitHub, you can use a secret string to protect your webhooks

SHA256 security checks such as

```test
+-------------------+             +----------------------------------+
| Client            |             | Antenna                          |
| Sends body        |------------>| Check that hash(body, secret)    |
| Sends hashed body |             | is equal to client's hashed body |
+-------------------+             +----------------------------------+
```

You can configure it with `secret`

`antenna.yml` :
```yml
my-service:
  url: "/my-service"
  commands:
    - "echo 'Hello!' >> output"
  directory: "/home/foo/my-project"
  # secret: SHA256 Secret (optionnal)
  # can only be launched with the appropriate signature
  secret: 'supersecret'
```

Tests with
```sh
# Valid signature, should work !
curl -vX POST http://localhost:3000/my-service \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=ca2a85992c486d33a9b753013138edbd3d885c083d43790f0f83405a7af707b4" \
  -d '{"message":"Hello from curl!"}'

# Invalid signature, souldn't work !
curl -vX POST http://localhost:3000/my-service \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=ca2a85992c486d33a9b753013138edbd3d885c083d43790f0f83405a7af707b5" \
  -d '{"message":"Hello from curl!"}'
```

Additionnally, you can configure the secret header to read with `secret_header` (`x-hub-signature-256` by default)

## Rebounce

You can set a `delay` (in seconds) on your services, to schedule the launch of the commands, here is an example

```yml
my-service:
  url: "/my-service"
  commands:
    - "echo 'Hello!' >> output"
  directory: "/home/foo/my-project"
  # Debounce delay (seconds, optionnal, 0 by default)
  delay: 300
```

This way, the `echo` command will launch 5 minutes after the webhook call, meaning that is your webhook is "spammed" or recieve multiple requests in a small amount of time (defined by your `delay`), it will launch only one time

## Async scripts

If your webhook is launching a command that takes some time to be executed, you can add `async` to your service to launch it in background, this way, the response to the client will be immediate and the command execution shall be scheduled

```yml
webhook-that-prints:
  url: '/print-body'
  directory: "/home/foo/my-project"
  async: true
  commands:
   - './rebuild-my-application.sh',
```

## Injection

While working with webhooks, you may want to process some kind of body, to do so, you can inject the request's body in your services

> By default, `none` mode is used, which mean the body is not sent to your commands in any way

### `pipe`

The first way to inject the body is with a pipe, which execute

```bash
echo request-body | your-command
```

Config example

```yml
webhook-that-prints:
  url: '/print-body'
  directory: "/home/foo/my-project"
  # executes "echo <body> | <your-command>"
  injection: 'pipe'
  commands:
   - 'cat',
```

### `variable`

Request's body can also be injected with a bash variable, to do so, you will need to configure two variables: `injection` as `variable` and `injection_variable` as your variable name

Example:
```yml
webhook-that-prints-variable:
  url: '/print-body/variable'
  directory: "/home/foo/my-project"
  # "injection: variable" executes MY_VARIABLE=<body>; <your-command>
  injection: variable
  injection_variable: MY_VARIABLE
  commands:
   - 'echo "$MY_VARIABLE"'
```

### `argv`

The last way to inject the request body is directly with a command parameter (arg)

```yml
python-webhook:
  url: '/launch-some-script'
  directory: '/home/foo/my-script-directory'
  # Will launch /home/foo/my-script-directory/handle_some_json.py --MY_JSON_ARGV=<body>
  injection: argv
  injection_variable: MY_JSON_ARGV
  commands:
    - 'python3 handle_some_json.py'
```

## Output visibility

By default, antenna only gives the client the information if the script was launched or not, if you want to make your command outpout public, you can add `show_output: true` to your service

```yml
webhook-that-prints:
  url: '/print-body'
  directory: "/home/foo/my-project"
  # If not async, will return the commands outputs to the client
  show_output: true
  commands:
   - './rebuild-my-application.sh',
```