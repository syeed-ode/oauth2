const express = require("express");
const cons = require('consolidate');
const __ = require('underscore');
__.string = require('underscore.string');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', 'files/authorizationServer');
app.set('json spaces', 4);

const authServer = {
    authorizationEndpoint: 'http://localhost:9001/authorize',
    tokenEndpoint: 'http://localhost:9001/token'
};

var clients = [
    {
        "client_id": "oauth-client-1",
        "client_secret": "oauth-client-secret-1",
        "redirect_urls": ["http://localhost:9000/callback"],
        "scope": "foo bar"
    }
];

var codes = {};
var requests = {};

app.get('/', function(req, res){
    res.render('index', {clients: clients, authServer: authServer});
});
app.use('/', express.static('files/authorizationServer'));

var server = app.listen(9001, 'localhost', function(){
    const host = server.address().address;
    const port = server.address().port;

    console.log('OAuth Authorization Server is listening at http://%s:%s', host, port);
});