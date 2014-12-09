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

### POST: /host
Creates a new host object.


## License
Copyright (c) 2014 Bronto Software, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[nagios]:http://www.nagios.org
[nagiosql]:http://www.nagiosql.org
[nodejs]:http://nodejs.org
