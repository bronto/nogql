# nogql
Utilizes [Node.js][nodejs] to create new host objects in [Nagios][nagios] using a REST request.  This was the result of needing to automatically create new host entries after provisioning an environment.


## Getting Started
It is under the assumption that you are already using [Nagios][nagios]/[NagiosQL][nagiosql].  You will then need to install `nogql` via `npm` like so:

```sh
$ npm install nogql
```

Fire it up by executing:

```sh
$ nogql [options]
```


## Options
`-a` is the hostname to serve from (defautls to localhost)

`-n` is the location of the [NagiosQL][nagiosql] settings.php file

`-p` is the port to utilize (defaults to 8080)

`-s` will suppress logging

`-h` displays usage information


## Usage
You can utilize the API functionality to currenly only add new hosts.  The below is an example of just using a curl request:

```sh
$ nogql -n /path/to/nagiosql/config/settings.php -p 8081 -s &
$ curl -X POST http://localhost:8081/host -d '{"domain":"production", "address":"127.0.0.1", "check_command":"check-host-alive", "host_name":"host-test-001", "use":"generic-host"}' -v
* Connected to localhost (127.0.0.1) port 8081 (#0)
> POST /host HTTP/1.1
> Host: localhost:8081
> Accept: */*
>
< HTTP/1.1 200 OK
< Content-Type: application/json
< Date: Mon, 17 Mar 2014 18:01:41 GMT
< Connection: keep-alive
<
{"id":123}
```


## API
### DELETE: /host
Deactivates a host object.

### GET: /host
Retrieves a host object.

### GET: /registered
List the hosts registred in NagiosQL.

### GET: /list
List the hosts in the specified status(deactive or active).

### POST: /host
Creates a new host object.


## License

    Copyright 2015 Bronto Software, Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

[nagios]:http://www.nagios.org
[nagiosql]:http://www.nagiosql.org
[nodejs]:http://nodejs.org
