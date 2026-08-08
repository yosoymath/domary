-- Garante que a senha local possa voltar a ser obrigatória sem ocultar
-- qualquer conta OAuth que eventualmente tenha sido criada.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "users" WHERE "passwordHash" IS NULL) THEN
    RAISE EXCEPTION 'Não é possível remover OAuth enquanto houver usuários sem senha local.';
  END IF;
END $$;

DROP TABLE "auth_verification_tokens";
DROP TABLE "auth_sessions";
DROP TABLE "auth_accounts";

ALTER TABLE "users"
  ALTER COLUMN "passwordHash" SET NOT NULL,
  DROP COLUMN "emailVerified",
  DROP COLUMN "image";
