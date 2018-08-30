<?php

namespace controllers;

class income {
	public function post ($id, $data) {
		if ($id > 0) {
			return $this->update($id, $data);
		} else {
			return $this->create($id, $data);
		}
	}

	public function create ($id, $data) {
		if (! array_key_exists('title', $data) 
			|| ! array_key_exists('income', $data) 
			|| ! array_key_exists('personId', $data)) {
			http_response_code(500);
			exit('not all parameters were sent'); 
		} 
		$income = new \model\income();
		try {
			$newIncome = $income->addIncome($data['personId'], $data['title'], $data['income']);
		} 
		catch(\Exception $e) {
			var_dump($e);
			http_response_code(500);
			exit;
		}
		echo json_encode($newIncome);
	}

	public function update ($id, $data) {
		if (! array_key_exists('income', $data)) {
			http_response_code(500);
			exit('not all parameters were sent dsads'); 
		} 
		$income = new \model\income();
		try {
			$updatedIncome = $income->updateIncome($id, $data['income']);
		} 
		catch(\Exception $e) {
			var_dump($e);
			http_response_code(500);
			exit;
		}
		echo json_encode($updatedIncome);
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