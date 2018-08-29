<?php

namespace controllers;

class users {
	public function get ($id, $data) {
		$result = null;
		if ($id < 0) {
			http_response_code(500);
			exit('id less than 0'); 
		}
		if ($id === 0) {
			$result = $this->getAll();
		} else {
			$result = $this->getOne($id);
		}
		echo json_encode($result);
	}

	public function post ($id, $data) {
		if (! array_key_exists('email', $data) || ! array_key_exists('password', $data)) {
			http_response_code(500);
			exit('not all parameters were sent'); 
		} 
		$user = new \model\user();
		try {
			$pwd_hash = sha1($data['password']);
			$userId = $user->addUser($data['email'], $pwd_hash);
		} 
		catch(\Exception $e) {
			var_dump($e);
			http_response_code(500);
			exit;
		}
		echo $userId;
	}

	protected function getOne ($id) {
		$user = new \model\user();
		try {
			$result = $user->get($id);
		} 
		catch(\Exception $e) {
			var_dump($e);
			http_response_code(500);
			exit;
		}
		return $result;
	}

	protected function getAll () {
		$user = new \model\user();
		try {
			$result = $user->getAll();
		} 
		catch(\Exception $e) {
			var_dump($e);
			http_response_code(500);
			exit;
		}
		return $result;
	}
}