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
	console.log('1) [client] Using redirect: Sending the resource owner to the authorization server starting the process');
	console.log();

	var authorizeUrl = buildUrl(authorizationServer.authorizationEndpoint, {
		response_type: 'code',
		client_id: client.client_id,
		redirect_uri: client.redirect_urls[0]
	});
	
	console.log("redirect", authorizeUrl);
	res.redirect(authorizeUrl);
});

app.get('/callback', function(req, res) {
	console.log("5) [client] Entered clients callback endpoint (redirected from approval)");
	console.log('5) [client] Read "code" parameter from authorizationServer redirect');

	let code = req.query.code;
	
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
	console.log();
	var tokenResponse = request('POST', authorizationServer.tokenEndpoint, {
		body: form_data,
		headers: headers
	});

	// console.log(tokenResponse);

	let body = JSON.parse(tokenResponse.getBody());
	var access_token = body.access_token;

	res.render('index', {access_token: body.access_token});
});

app.get('/fetch_resource', function(req, res) {});

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