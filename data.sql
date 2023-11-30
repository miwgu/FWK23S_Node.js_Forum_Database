-- skapas alla tabeller med främmande nycklar och används av de olika varianter av referens-integritet
drop database if exists forum_db;
create database forum_db;
use forum_db;

create table users(
id int not null auto_increment primary key,
name varchar(50) not null,
user varchar(50) not null, 
pass varchar(20) not null
 );
 
create table heading(
id int not null auto_increment primary key,
name varchar(255) ,
comment varchar(255) , 
user_id int not null ,
time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
foreign key (user_id) references users(id));

create table posts(
id int not null auto_increment primary key,
comment varchar(255) , 
heading_id int not null,
user_id int not null,
time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
foreign key (heading_id) references heading(id),
foreign key (user_id) references users(id));
 
insert into users (name,user,pass) values
("Miwa G","migu","m123"),
("Per G","Pegu","p123"),
("Oskar G","osk","o123"),
("Lotta G","loti","l123"),
("Ayako T","aya","a123"),
("Satomi H","sami","s123");


insert into heading (name,comment,user_id,time) values
("Ska vi inte äta ute","Jag tänker att jag ska äta lunch ute idag. Vill nogån hänga med?",2,"2020-11-23 10:41:05"),
("Leka","Ska vi spela tillsammans?",1,"2022-11-20 17:41:05");



insert into posts (comment, heading_id, user_id, time) values
("Jag vill!",1,1,"2020-11-20 10:45:17"),
("Ja!Jag spelar Minecraft nu",2,3,"2022-11-22 17:50:34");

SELECT heading.id, users.user as username, heading.name, heading.comment, heding.time
from heading
JOIN users ON users.id = heading.user_id;


SELECT 
    h.id AS heading_id,
    h.name AS heading_name,
    u.user AS username,
    CASE
        WHEN p.max_post_time IS NOT NULL THEN p.max_post_time
        ELSE h.time
    END AS recent_time
FROM heading h
JOIN users u ON u.id = h.user_id
LEFT JOIN (
    SELECT heading_id, MAX(time) AS max_post_time
    FROM posts
    GROUP BY heading_id
) p ON p.heading_id = h.id
ORDER BY recent_time DESC;

SELECT posts.id as id, users.user as username, posts.comment as comment, posts.time as time
FROM posts
JOIN users ON users.id = posts.user_id