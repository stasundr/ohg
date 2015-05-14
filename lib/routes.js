'use strict';

module.exports = function(app) {

    app.get('/', function(request, response) {
        response.render('index');
    });

    app.post('/addfile', function(request, response) {
        console.log(request.files);
        response.redirect('/test');
    });

    app.get('/logout', function(request, response) {
        request.session.destroy();
        response.redirect('/');
    });
};