<?php

namespace model;

class person {
		public function addPerson ($name, $userId) {
			if(!isset($name) || !isset($userId)) {
				throw new \Exception("One or more input parameters are not set", ERROR_CODE_INVALID_PARAMETERS);
			}
			try {
				$stmt = DB::pdo()->prepare("INSERT INTO persons (name, user_id) VALUES (:name, :userId)");
				$stmt->bindParam(":name", $name);
				$stmt->bindParam(":userId", $userId);
				$stmt->execute();
			} 
			catch (\Exception $e) {
				throw $e;
			}
			return DB::pdo()->lastInsertId();
		}

		public function get ($id) {
			if(!isset($id)) {
				throw new \Exception("One or more input parameters are not set", ERROR_CODE_INVALID_PARAMETERS);
			}
			try {
				$stmt = null;
				$stmt = DB::pdo()->prepare("SELECT id, name FROM persons WHERE id = :id");
				$stmt->bindParam(":id", $id);
				$stmt->execute();
				if ($stmt->rowCount() <= 0){
					throw new \Exception("No person with id: " . $id . " found", ERROR_CODE_USER_NOT_FOUND);
				}
				return $stmt->fetch(\PDO::FETCH_ASSOC);
			} 
			catch (\Exception $e) {
				throw $e;
			} 
		}

		public function getFromUser ($userId) {
			try {
				$stmt = null;
				$stmt = DB::pdo()->prepare("SELECT id, name FROM persons WHERE user_id = :id");
				$stmt->bindParam(":id", $userId);
				$stmt->execute();

				if ($stmt->rowCount() <= 0) {
					return [];
				}
				$income = new \model\income();
				$persons = $stmt->fetchAll(\PDO::FETCH_ASSOC);
				foreach ($persons as $key => $person) {
					$persons[$key]['income'] = $income->getFromPerson($person['id']);
				}
				return $persons;
			} 
			catch (\Exception $e) {
				throw $e;
			}
		}

		public function getAll () {
			try {
				$stmt = null;
				$stmt = DB::pdo()->prepare("SELECT id, name, user_id FROM persons");				
				$stmt->execute();
				if ($stmt->rowCount() <= 0){
					return [];
				}
				return $stmt->fetchAll(\PDO::FETCH_ASSOC);
			} 
			catch (\Exception $e) {
				throw $e;
			} 
		}
}