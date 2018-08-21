<?php

namespace model;

class user {
		public function addUser($email, $password_hash) {
			if(!isset($email) || !isset($password_hash)) {
				throw new \Exception("One or more input parameters are not set", ERROR_CODE_INVALID_PARAMETERS);
			}

			try {
				$stmt = DB::pdo()->prepare("INSERT INTO users (email, pwd_hash) VALUES (:email, :pwd_hash)");
				
				$stmt->bindParam(":email", $email);
				$stmt->bindParam(":pwd_hash", $password_hash);
				$stmt->execute();
			} 
			catch (\Exception $e) {
				throw $e;
			}

			return DB::pdo()->lastInsertId();
		}

		public function get($id) {
			if(!isset($id)) {
				throw new \Exception("One or more input parameters are not set", ERROR_CODE_INVALID_PARAMETERS);
			}
			try {
				$stmt = null;
				$stmt = DB::pdo()->prepare("SELECT id, email, alias FROM users WHERE id = :id");
				$stmt->bindParam(":id", $id);
				
				$stmt->execute();

				if ($stmt->rowCount() <= 0){
					throw new \Exception("No user with id: " . $id . " found", ERROR_CODE_USER_NOT_FOUND);
				}

				return $stmt->fetch(\PDO::FETCH_ASSOC);
			} 
			catch (\Exception $e) {
				throw $e;
			} 
		}
}