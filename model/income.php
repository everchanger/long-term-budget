<?php

namespace model;

class income {
		public function add ($personId, $title, $income) {
			if(!isset($title) || !isset($income) || !isset($personId)) {
				throw new \Exception("One or more input parameters are not set", ERROR_CODE_INVALID_PARAMETERS);
			}
			try {
				$stmt = DB::pdo()->prepare("INSERT INTO incomes (title, income, person_id) VALUES (:title, :income, :personId)");
				$stmt->bindParam(":title", $title);
                $stmt->bindParam(":income", $income);
                $stmt->bindParam(":personId", $personId);
				$stmt->execute();
			}
			catch (\Exception $e) {
				throw $e;
			}
			$id = DB::pdo()->lastInsertId();

			return $this->get($id);
		}

		public function update ($id, $income) {
			if(!isset($id) || !isset($income)) {
				throw new \Exception("One or more input parameters are not set", ERROR_CODE_INVALID_PARAMETERS);
			}
			try {
				$stmt = DB::pdo()->prepare("UPDATE incomes SET income = :income WHERE id = :id");
				$stmt->bindParam(":id", $id);
                $stmt->bindParam(":income", $income);
				$stmt->execute();
			}
			catch (\Exception $e) {
				throw $e;
			}
			return $this->get($id);
		}

		public function get ($id) {
			if(!isset($id)) {
				throw new \Exception("One or more input parameters are not set", ERROR_CODE_INVALID_PARAMETERS);
			}
			try {
				$stmt = null;
				$stmt = DB::pdo()->prepare("SELECT id, title, income, person_id FROM incomes WHERE id = :id");
				$stmt->bindParam(":id", $id);
				$stmt->execute();
				if ($stmt->rowCount() <= 0){
					throw new \Exception("No income with id: " . $id . " found", ERROR_CODE_USER_NOT_FOUND);
				}
				return $stmt->fetch(\PDO::FETCH_ASSOC);
			} 
			catch (\Exception $e) {
				throw $e;
			}
		}

		public function getFromPerson ($personId) {
			if(!isset($personId)) {
				throw new \Exception("One or more input parameters are not set", ERROR_CODE_INVALID_PARAMETERS);
			}
			try {
				$stmt = null;
				$stmt = DB::pdo()->prepare("SELECT id, title, income, person_id FROM incomes WHERE person_id = :personId");
				$stmt->bindParam(":personId", $personId);
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

		public function getAll () {
			try {
				$stmt = null;
				$stmt = DB::pdo()->prepare("SELECT title, income, person_id FROM incomes");				
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

		public function delete ($id) {
			if(!isset($id)) {
				throw new \Exception("One or more input parameters are not set", ERROR_CODE_INVALID_PARAMETERS);
			}
			try {
				$stmt = null;
				$stmt = DB::pdo()->prepare("DELETE FROM incomes WHERE id = :id");				
				$stmt->bindParam(":id", $id);
				$stmt->execute();
				if ($stmt->rowCount() <= 0){
					throw new \Exception("Could not delete income with id: " . $id, ERROR_CODE_INVALID_PARAMETERS);
				}
				return $id;
			} 
			catch (\Exception $e) {
				throw $e;
			}
		}
}