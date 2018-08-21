<?php

namespace controllers;

class users {
	public function get ($id, $data) {
		$user = new \model\user();
		$userdata = null;
		try {
			$result = $user->get($id);
		} 
		catch(\Exception $e) {
			var_dump($e);
			http_response_code(500);
		}
		echo json_encode($result);
	}

	public function post ($id, $data) {
		if (! array_key_exists('email', $data) || ! array_key_exists('password', $data)) {
			var_dump($data);
			exit('not all parameters were sent'); 
		} 
		
		$user = new \model\User();
		try {
			$pwd_hash = sha1($data['password']);
			$userId = $user->addUser($data['email'], $pwd_hash);
		} 
		catch(\Exception $e) {
			var_dump($e);
			http_response_code(500);
		}
		echo $userId;
	}
}