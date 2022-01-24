---creating tables

CREATE users (
    id serial PRIMARY KEY,
    username varchar(255) NOT NULL,
    complete boolean DEFAULT false,
    score integer 
);

CREATE words (
    user_id integer NOT NULL,
    row integer NOT NULL,
    word varchar(255) NOT NULL,
    PRIMARY KEY (user_id, row)
    FOREIGN KEY user_id 
    REFERENCES users(id)
);

CREATE comments (
    comment_id serial PRIMARY KEY,
    commented_id integer NOT NULL,
    commenter_id integer NOT NULL,
    comment varchar(255) NOT NULL,
    date_added BIGINT NOT NULL DEFAULT date_part('epoch', now()),
    FOREIGN KEY commented_id
    REFERENCES users(id),
    FOREIGN KEY commenter_id
    REFERENCES users(id),
);

---table dummy data

INSERT INTO users (username, score)
VALUES ('grace1999'), 
('megzmcgrath', 4),
('tom', 2);

INSERT INTO words (user_id, row, word)
VALUES (1, 1, 'cheat'), 
(1, 2, 'blind'), 
(1, 3, 'nulls'), 
(2, 1, 'audio'),
(2, 2, 'vegan'),
(2, 3, 'march'),
(2, 4, 'debit'),
(3, 1, 'gives'),
(3, 2, 'debit');

INSERT INTO comments (commented_id, commenter_id, comment, date_added)
VALUES (2, 1, "Nice one megs", "1642070773"),
(2, 3, "I beat you!", "1642070740"),
(1, 2, "Common Grace, when you finishing?", "1642023912");

