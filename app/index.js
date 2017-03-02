/*
 
 Run from project root: node app/index.js <port> <pg_url>

*/
var restify = require('restify');
var fs = require("fs");

var pgUrl = process.argv[3];

var pgp = require('pg-promise')({
    // Initialization Options
});

var db = pgp(pgUrl);

var Promise = require("bluebird");




function handler(req, res, next)
{

	var toReturn = [];

	var query = null;
	if(!req.params.schema)
	{
		query = "select schemaname || '.' || tablename as table from pg_catalog.pg_tables where schemaname NOT IN ('pg_catalog', 'information_schema');";
	}
	else
	{
		query = "select tablename as table from pg_catalog.pg_tables where schemaname = $1;";
	}
	

	db.any(query, [ req.params.schema ])
	.then(function(tables){

        res.send({data: tables});
                next();
		
	})
	.catch(function(err){
		if(err){console.log("Error", err);
		res.send(500, err);
		next();
		}
	});
}







var server = restify.createServer();
server.pre(restify.pre.sanitizePath());
server.get('/tables', handler);
server.get('/tables/:schema', handler);

server.get('/schemas', function(req, res, next){
    db.any("select distinct(schemaname) as schema from pg_catalog.pg_tables")
	.then(function(schemas){
        res.send({data: schemas});
        next();
		
	})
	.catch(function(err){
		if(err){console.log("Error", err);
            res.send(500, err);
		}
        next();
	});
})

server.get(/.*/, restify.serveStatic({
    directory: 'web',
    default: 'index.html'
}));

server.listen(process.argv[2], 'localhost', function() {
  console.log('%s listening at %s', server.name, server.url);
});


var gracefulShutdown = function(){

  server.close(function(){
	console.log("closing");
  });
};

//process.on ('SIGTERM', gracefulShutdown);
//process.on ('SIGINT', gracefulShutdown);   
