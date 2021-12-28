Integromat connection refresher
===============================

This is a helper tool to refresh the credentials of a service connection
at [Integromat](https://integromat.com/) automation tool.

It seems, as if Integromat does not automatically refresh
obtained service credentials for a connection nor checks whether they have expired or not.
The [documentation for connections](https://www.integromat.com/en/help/connecting-to-services)
states:

> Integromat usually obtains access rights to a given service for an unlimited period of time.
> However, this is not always the case. With some services, the access permission must
> be renewed after a certain period of time. In order to renew a connection, click
> the **Reauthorize** button in the **Connections** section.

Therefore, I came to the conclusion, that there is no automatic way to refresh a connection's
authorisation token with the remote service. Hence, this tool can be used to login to the
Integromat website and *verify* the specific connection, which will trigger a refreshing
of authentication credentials stored with that connection.

**WARNING!!** However, this conclusion might be wrong and there might be better ways to do refresh expired
credentials of a connection. Especially, using a scheduled scenario within Integromat itself
would be very nice thing. Please file an issue in case you know of such a better way.

Usage
-----

First, you should check out the repository of course and call `npm install`.
Then call the script entry point with `node` and pass all required parameters

```bash
node packages/integromat-connector-refresher/dist/index.js \
    --username='YOUR LOGIN USERNAME' \
    --password='YOUR PASSWORD' \
    --connection-id='The numeric number of the connector'
```

You can call this helper tool from a scheduled (cron) job to refresh the connection's
credentials on a regular basis.

How it works
------------
* At first, the web session ID is read from a cookie file.
* If that file is missing or the session ID has expired, a headless
    webbrowser (Chromium) is used to log into
    the [Integromat dashboard](https://www.integromat.com/en/login) with the provided
    username and password.
    All the obtained cookies are stored into the cookie file for subsequent use.
* The session ID in the cookie file is used to call the API of Integromat
    to *verify* the connection.

Connection ID
-------------

The get the connection ID, you need to use the browser developer tools and *inspect*
the "verify" button of the connection. It has an HTML tag data attribute with the ID.

```html
<button class="btn btn-success btn-sm i-tester" data-id="2212801">Verify</button>
```
