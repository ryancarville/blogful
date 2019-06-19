CREATE TABLE blogful_users (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    fullname TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT,
    nickname TEXT,
    date_created TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE blogful_articles 
    ADD COLUMN 
        author INTEGER REFERENCES blogful_users(id) ON DELETE SET NULL;