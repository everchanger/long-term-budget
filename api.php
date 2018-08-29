<?php

DEFINE('ERROR_CODE_USER_NOT_FOUND',       1000);
DEFINE('ERROR_CODE_INVALID_PARAMETERS',   1001);
DEFINE('ERROR_CODE_WRONG_PASSWORD',       1002);

spl_autoload_extensions(".php");
spl_autoload_register();

session_start();

// get the HTTP method, path and body of the request
$method = $_SERVER['REQUEST_METHOD'];
$request = explode('/', trim($_SERVER['PATH_INFO'], '/'));
$input = json_decode(file_get_contents('php://input'), true);



// retrieve the table and key from the path
$controller = preg_replace('/[^a-z0-9_]+/i','',array_shift($request));
$id = array_shift($request) + 0;
 
// redirect to the right controller
$filename 	= __DIR__.'/controllers/'.$controller.'.php';

if (! file_exists($filename)) {
	echo 'oops missing api path! ';
	echo 'path: ' . $filename;
	exit;
}

$classname 	= '\controllers\\'.$controller;

$instance = new $classname();	
$instance->$method($id, $input);