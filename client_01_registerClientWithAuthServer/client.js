const express = require('express');
const request = require('sync-request');
const url = require('url');
const qs = require('qs');
const querystring = require('querystring');
const cons = require('consolidate');
const randomstring = require('randomstring');
const __ = require('underscore');
__.string = require('underscore.string');

const app = express();

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', 'files/client');

// Authorization server information
var authorizationServer = {
	authorizationEndpoint: 'http://127.0.0.1:9001/authorize',
	tokenEndpoint: 'http://127.0.0.1:9001/token'
};


// Client information 
var client = {
	"client_id": "oauth-client-1",
	"client_secret": "i-wont-tell-your-secret-no-no-no-no-no-no-no",
	"redirect_urls": ["http://localhost:9000/callback"]
};

var protectedResource = 'http://localhost:9002/resource';

var state = null;

var access_token = null;
var scope = null;

app.get('/', function(req, res){
	res.render('index', {access_token: access_token, scope: scope});
});

app.get('/authorize', function(req, res) {

	console.log("1) [client] Entered clients authorize endpoint");
	console.log('1) [client] Using redirect: Sending the resource owner to the authorizationServer\'s authorize endpoint starting the process');

	var authorizeUrl = buildUrl(authorizationServer.authorizationEndpoint, {
		response_type: 'code',
		client_id: client.client_id,
		redirect_uri: client.redirect_urls[0]
	});
	
	console.log("1) [client] redirect", authorizeUrl);
	console.log();
	res.redirect(authorizeUrl);
});

app.get('/callback', function(req, res) {
	console.log("5) [client] Entered clients callback endpoint (redirected from authorizationServer's approval)");

	let code = req.query.code;
	console.log('5) [client] Read "code" parameter from authorizationServer redirect:', code);
	
	let form_data = qs.stringify({
		grant_type: 'authorization_code',
		code: code,
		// redirect_urls is required for the token request 
		// if it was specified in the authorization request
		// this is part of the OAuth specification (see pg 49/76)
		redirect_uri: client.redirect_urls[0]
	});

	let headers = {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Authorization': 'Basic ' + encodeClientCredentials(client.client_id, client.client_secret)
	};

	console.log('5) [client] Issue token request to authorizationServer ');
	var tokenResponse = request('POST', authorizationServer.tokenEndpoint, {
		body: form_data,
		headers: headers
	});

	// console.log(tokenResponse);

	let body = JSON.parse(tokenResponse.getBody());
	access_token = body.access_token;
	console.log('5) [client] Received the following token from authorizatioinServer', access_token);
	console.log();

	res.render('index', {access_token: body.access_token});
});

app.get('/fetch_resource', function(req, res) {
	console.log('7) [client] Entered client\'s fetch_resouces endpoint');
	console.log('7) [client] client has the following access_token:', access_token);

	if(!access_token) {
		res.render('error', {error: 'Missing access token.'});
		console.log('7) [client] error: Missing access token.')
		console.log();
		return;
	}

	let headers = {
		'Authorization': 'Bearer ' + access_token
	};

	console.log('7) [client] Sending POST request to protected resource with access_token');
	let  resource  = request('POST', protectedResource, {headers:  headers});
	console.log('9) [client] Received resource response from protectedResource', resource);
	console.log('9) [client] Received resource.getBody() response from protectedResource', JSON.parse(resource.getBody()));
	if(resource.statusCode >= 200 & resource.statusCode < 300) {
		let body = JSON.parse(resource.getBody());
		res.render('data', {resource: body});
		return;
	} else {
		res.render('error', {});
		return;
	}
	console.log();
});

var buildUrl = function(base, options, hash) {
	let newUrl = url.parse(base, true);
	delete newUrl.search;

	if (!newUrl.query) {
		newUrl.query = {};
	}
	__.each(options, function(value, key, list) {
		newUrl.query[key] = value;
	});

	if(hash) {
		newUrl.hash = hash;
	}

	return url.format(newUrl);
};

var encodeClientCredentials = function(clientId, clientSecret) {
	return Buffer
		.from(querystring.escape(clientId) 
			+ ':' 
			+ querystring.escape(clientSecret)
		).toString('base64');
};

app.use('/', express.static('files/client'));

const server = app.listen(9000, 'localhost', function() {
	let host = server.address().address;
	let port = server.address().port;

	console.log('OAuth Client is listening at http://%s:%s', host, port);
});