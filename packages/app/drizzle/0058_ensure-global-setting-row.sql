INSERT INTO "app_global_setting" ("id")
VALUES (1)
ON CONFLICT ("id") DO NOTHING;
