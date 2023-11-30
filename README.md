# FWK23S_Node.js_Forum_Database

## Express.js express-session ##
Express session is middleware for Node.js web applications that enables session management.Cookie send sessionID and it allows to fetch the session data. 

### 1: MySQL connection
- My database is MySQL  Workbench 8.0
   -> install mysql2
- 3 tables: users, heading, posts

### 2: Express server
-  difined port:8080

### 3: Middleware
- express.urlencoded(),express.static()(scipt.js), session(secret resave save Uninitializes, cookie)

### 4: Session
- secret:A genareted key used to sign  the session ID cookie for security
- resave: false-> avoid unnecessary writes to the session store
- saveUninitialized: true-> create a session for every user
- httpOnly: true->prevent certain types of XSS attacks client side cannot accress the cookie
- secure: false->the cookie will be sent over HTTP(not only HTTPS)
- maxage: 2h ->determines the session expiration time

##  Endpoint 
- get: / -> login
- post: /checklogin -> Authenticate user
- get: /forum.html -> Output heading(Rubrik), user, recent time and Läs button
- post: /addtopic -> Add a heading(Rubrik) to heading table
- get: /readtopic.html-> Output heading(Rubrik) and all posts with name and time
- post: /addpost-> Add a post to posts table with heading id which buttan has id as value
- get: /postconfirmation.html ->When you add a post, /addpost redirects to this page

## How to start (Node.js)
npm install 
nodemon -g, express, session-express, mysql2 (mysql2: This is for MySQL workbench. If you use other database you need to check which you need to indtall.)
- nodemon index.js
- user: "root", password: "" ...//You need to change code, your user and password in index.js to log in your database 

## Database 
You can check data.sql

## Log in 
user: migu pass: m123
