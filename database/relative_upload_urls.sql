-- Optional: convert absolute media URLs stored in DB (e.g. http://localhost:5000/uploads/...)
-- into relative paths (/uploads/...). The backend already does this on-the-fly in responses,
-- so this is only for cleaning the data itself.

UPDATE `films`
SET `poster_url`   = REGEXP_REPLACE(`poster_url`,   '^https?://[^/]+/uploads/', '/uploads/')
WHERE `poster_url` REGEXP '^https?://[^/]+/uploads/';

UPDATE `films`
SET `backdrop_url` = REGEXP_REPLACE(`backdrop_url`, '^https?://[^/]+/uploads/', '/uploads/')
WHERE `backdrop_url` REGEXP '^https?://[^/]+/uploads/';

UPDATE `behind_the_scenes`
SET `thumbnail_url` = REGEXP_REPLACE(`thumbnail_url`, '^https?://[^/]+/uploads/', '/uploads/')
WHERE `thumbnail_url` REGEXP '^https?://[^/]+/uploads/';
