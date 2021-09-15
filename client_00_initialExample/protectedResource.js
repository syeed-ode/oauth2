const experss = require('express');
const cons = require('consolidate');
const __ = require('underscore');
const cors = require('cors');

const app = experss();

app.use(experss.urlencoded({ extended: true })); // support form-ecoded bodies 
                                                 // (for bearer tokens)

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', 'files/protectedResource');
app.set('json spaces', 4);

app.use('/', experss.static('files/protectedResource'));
app.use(cors());

var resources = {
    "name": "Protected Resource",
    "description": "This data has been protected by OAuth 2.0"
};

var server = app.listen(9002, 'localhost', function(){
    let host = server.address().address;
    let port = server.address().port;

    console.log('OAuth Resource Server is listening at http://%s:%s', host, port);
});