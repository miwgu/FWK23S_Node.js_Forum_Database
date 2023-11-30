let mysql = require("mysql2"); // "npm i mysql2"
//I use MySql workbench. It works with mysql2
let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",// Here I need to add my password
    database: "forum_db"
});

let express =require('express');
let app = express(); // create an express server-object
let crypto = require('crypto');
let session = require('express-session'); // Manage sessions
let port =8080;
let fs =require('fs');
let path = require('path');

let httpServer = app.listen(port,function(){
    console.log(`webbserver körs på port ${port}`);
});

app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')))

let generateKey =()=>{
    var key =crypto.randomBytes(32).toString('hex');
    return key;
}

//Express.js v4.16.0 and above includes the functionality of cookie-parser by default 
let userSession = app.use(session({
  secret:generateKey(),// The secret key is used to sign the session ID cookie, adding a layer of security to prevent tampering or unauthorized access.
  resave:false,//avoid unnecessary writes to the session store
  saveUninitialized:true,//create a session for every user
  cookie:{
    httpOnly: true,//prevent certain types of XSS attacks client side cannot accress the cookie
    secure: false,//false->the cookie will be sent over HTTP(not only HTTPS)
    maxage: 1000 * 60 * 60 *2// 2 hour
    }
}));


app.get("/", function(req, res){
    res.sendFile(path.join(__dirname,'views','login.html'));
})

/**
 * POST checklogin
 * If user and pass is match with data in database user can login
 */

app.post("/checklogin", function(req, res){
    let {user, pass}=req.body;
    console.log('Received user:', user);
    console.log('Received password:', pass);
    con.connect( (error)=>{
        if(error){
            return  console.error("Connection to database failed: "+ error);
        }
        console.log("Connection to database succeeded!")
    
    con.query(
        'SELECT * FROM users WHERE user =? AND pass =?',
        [user, pass], //put values into Array
        (error, results, fields) =>{ // This callback function handring the results of query 

            if(error){
                console.error("Serching user Error!: "+ error);
                
                return res.send("Searching user error!")
            }
            if(results.length>0){
                let loginedUser = results[0];// Each element in this arrey represents a row returned by the query

                
                console.log("User: "+ JSON.stringify(loginedUser))
                console.log("Username: "+ loginedUser.name)
                req.session.user = loginedUser;
                console.log('User authentidated');
                
                return res.redirect("/forum.html");
            } else {

                let output = fs.readFileSync(path.join(__dirname, 'views', 'login.html')).toString();
              output = output.replace(
             `<div class="mb-3" id="errorMessage"  style="display: none; color: rgb(236, 44, 44);">`,
             `<div class="mb-3" id="errorMessage"  style="display: block; color: rgb(236, 44, 44);">`
             );
                
                return res.send(output);
            }
        }

    )
})

});


/**
 * Get forum
 * Output heading(Rubrik), user, recent time and Läs button
 * Each Läs button has heading id as value 
 * Show heading(Rubrik) order by recent_time DESC
 * recenttime:  If there is just heading "comment" recenttime is the time when heding is added
 *              If there is other posts "comment" recenttime is the time when the newest post is added 
 * 
 */


app.get("/forum.html",function(req,res){
    if(!req.session.user){
      return res.redirect("/")
    }
    
    let loggedInUserName = req.session.user.name;// declare loggined username
    //------------------Here show logined user name--------------------
         let output = fs.readFileSync(path.join(__dirname, 'views','forum.html')).toString();
         output =output.replace("***NAMN***", loggedInUserName);// replase here tu username
    
    //------------------Here show heading list--------------------

    con.connect( (error)=>{
        if(error){
            return  console.error("Connection to database failed: "+ error);
        }
        console.log("Connection to database succeeded!")
    
    con.query(
        //'SELECT heading.id, users.user as username, heading.name, heading.comment '+ 
        //'FROM heading '+
        //'JOIN users ON users.id = heading.user_id ',
        'SELECT h.id AS id, h.name AS name, u.user AS username, ' +
        'CASE ' +
        'WHEN p.max_post_time IS NOT NULL THEN p.max_post_time ' +
        'ELSE h.time ' +
        'END AS recent_time ' +
        'FROM heading h ' +
        'JOIN users u ON u.id = h.user_id ' +
        'LEFT JOIN ( ' +
        'SELECT heading_id, MAX(time) AS max_post_time ' +
        'FROM posts ' +
        'GROUP BY heading_id ' +
        ') p ON p.heading_id = h.id ' +
        'ORDER BY recent_time DESC',

        (error, results, fields) =>{ 

            if(error){
                console.error("Serching heading Error!: "+ error);
                
                return res.send("Searching heading error!")
            }

            console.log("Heading"+JSON.stringify(results))
            let headingListHTML = createHeadingListHTML(results);// create HTML here
            console.log(headingListHTML)
            output=output.replace("<!-- ***Here printout all heading info*** -->",headingListHTML);


        /*  let heading = JSON.parse(fs.readFileSync(path.join(__dirname, 'data','heading.json')).toString());
          console.log(heading)
          let headingListHTML = createHeadingListHTML(heading);// create HTML here
          console.log(headingListHTML)
          
          output=output.replace("<!-- ***Here printout all heading info*** -->",headingListHTML);
          */
          return res.send(output);
        }
    )
    })
});


/**
 * function createHeadingListHTML
 * @param {*} heading
 * @returns 
 */

function createHeadingListHTML(heading) {

    let heading_html = '';
    
  
    for(var i=0; i<heading.length; i++){
      
        heading_html+=
        `
        <div class="container p-1" >
          <form class="row p-2" action="/readtopic.html" method="get"     style="background-color:rgb(246, 218, 235);">
            <div  style="display:flex;">
            
            <button id="goToThread" name="id"  value ="${heading[i].id}"  type="submit" class="btn btn-secondary p-2 m-2 col-md-2">Läs</button>
             <p class="p-2 m-2 col-md-4 ">${heading[i].name}</p>
             <p class="p-2 m-2 col-md-2 ">Skapad av ${heading[i].username}</p> 
             <p class="p-2 m-2 col-md-4 ">${heading[i].recent_time}</p> 
             
            </div>
          </form>
        </div>
      `
      
    }
    return heading_html;
};


/**
 * Post addtopic (Rubrik)
 * add a heading(Rubrik) to heading table when user click submit button
 * write a heading to database
 * redirect to the route forum.html 
 * 
 */
app.post("/addtopic", function(req,res){
  
    if(!req.session.user){
     return res.redirect("/")
    }


    con.connect( (error)=>{
        if(error){
            return  console.error("Connection to database failed: "+ error);
        }
        console.log("Connection to database succeeded!")
        
    
        let name=req.body.name;
        let comment= req.body.comment;
        let user_id= req.session.user.id;
      
        console.log("HEADING QUERY PARAMS: "+ JSON.stringify(req.body))

        con.query(
            `INSERT INTO heading ( name, comment, user_id) VALUES(?,?,?)`,
            [name, comment, user_id],
    
        (error, results) =>{ 
    
            if(error){
                console.error("Adding heading Error!: "+ error);
                
                return res.status(500).send("Error adding heading")
            }
  
    //let heading= fs.readFileSync(path.join(__dirname, 'data','heading.json')).toString();
    //heading= JSON.parse(heading);// from Json to Object
  
      return res.redirect("/forum.html");// Redirect to forum.html. 
      
    })
   })  
});



/**
 * GET readtopic
 * Output heading(Rubrik) and all posts with name and time
 * If there is just heading show heding and comment
 * If there is post hedding show heding comment and posts comment 
 */
app.get("/readtopic.html",function(req,res){
    if(!req.session.user){
     return res.redirect("/")
    }
    let headerId =  parseInt(req.query.id);
    console.log("QUERY PARAMS: "+ JSON.stringify(req.query))
    console.log("HEADER ID: "+ headerId)
    
    let loggedInUserName = req.session.user.name;// declare loggined username
    //------------------Here show logined user name--------------------
         let output = fs.readFileSync(path.join(__dirname, 'views', 'readtopic.html')).toString();
         output =output.replace("***NAMN***", loggedInUserName);// replase here tu username
    
    //------------------Here show heading comment list--------------------
          //let headers = JSON.parse(fs.readFileSync(path.join(__dirname, 'data','heading.json')).toString());
          //console.log(headers)

          con.connect( (error)=>{
            if(error){
                return  console.error("Connection to database failed: "+ error);
            }
            console.log("Connection to database succeeded!")
        
        con.query(
            'SELECT heading.id as id, users.user as username, heading.name as name, heading.comment as comment, heading.time as time '+ 
            'FROM heading '+
            'JOIN users ON users.id = heading.user_id ',
    
            (error, headers, fields) =>{ 
    
                if(error){
                    console.error("Display heading Error!: "+ error);
                    
                    return res.send("Display heading error!")
                }

            console.log("Heading"+JSON.stringify(headers))

          let selectedHeader = headers.find(header=> header.id===headerId)
          if(selectedHeader){
             output= output.replace('***Thread name***', selectedHeader.name)
          }
        
             
     //------------------Here show posts list--------------------
          //let posts= JSON.parse(fs.readFileSync(path.join(__dirname, 'data','posts.json')).toString());

          con.query(
            'SELECT posts.id as id, posts.heading_id, users.user as username, posts.comment as comment, posts.time as time '+ 
            'FROM posts '+
            'JOIN users ON users.id = posts.user_id ',
    
            (error, posts, fields) =>{ 
    
                if(error){
                    console.error("Display posts Error!: "+ error);
                    
                    return res.send("Display posts error!")
                }

            console.log("Posts"+JSON.stringify(posts))

          let postsByselectedHeader = posts.filter(post => post.heading_id===headerId) //filter() return an array
          console.log("POSTS: "+JSON.stringify(postsByselectedHeader))// To Json
          if(selectedHeader){
            output=output.replace('***Number***', postsByselectedHeader.length +1)// +1 because first comment is in heading.json
          }
  
      //------------------Here show first comment from heading and posts list--------------------
         console.log("selectedHeader: "+JSON.stringify(selectedHeader));
         
         let postsHTML=
         `<table  class="table table-striped">
         <tbody>`;
  
         if(selectedHeader){
          postsHTML+=`
          <tr>
            <th scope="row">1</th>
            <td>Skrivet av ${selectedHeader.username}</td>
            <td>${selectedHeader.comment}</td>
            <td>${selectedHeader.time}</td>
          </tr>
          `;
        }
  
          if(postsByselectedHeader.length===0){
            postsHTML+=`
            </tbody>
            </table>
            `  
            
          } else{
         
          postsHTML += createPostsListHTML(postsByselectedHeader);// create HTML here
          console.log(postsHTML)
          
          }
          output=output.replace('<!--***Here printout all posts***-->', postsHTML)
          output=output.replace(`<button id="submitPostBtn" type="submit" class="btn btn-primary" >`,
          `<button id="submitPostBtn" name ="id" value="${headerId}" type="submit" class="btn btn-primary" >`)
          console.log("Header_id: "+headerId)
          return res.send(output);
        }) //CON QUERY END
      }) //CON QUERY END

   })
  });

  /**
   * Function createPostsListHTML
   * @param {*} postsByselectedHeader 
   * @returns 
   */

  function createPostsListHTML(postsByselectedHeader) {

    let posts_html = '';
    
  
    for(var i=0 ; i<postsByselectedHeader.length; i++){
      
        posts_html+=
       `
          <tr>
              <th scope="row">${2+i}</th>
              <td>Skrivet av ${postsByselectedHeader[i].username}</td>
              <td>${postsByselectedHeader[i].comment}</td>
              <td>${postsByselectedHeader[i].time}</td>
            </tr>
      `
    }
  
    posts_html+= 
    `
    </tbody>
    </table>
    `
    return posts_html;
  
  }


/**
 * POST addpost
 * addpost to post table with heading id which buttan has id as value
 * write a post to database
 * redirect to postconfirmation.html
 */
app.post("/addpost", function(req,res){
  
  if(!req.session.user){
    res.redirect("/")
  }

  con.connect( (error)=>{
    if(error){
        return  console.error("Connection to database failed: "+ error);
    }
    console.log("Connection to database succeeded!")
    

    let comment= req.body.comment;
    let heading_id=parseInt(req.body.id)
    let user_id= req.session.user.id;
    console.log("HEADING QUERY PARAMS: "+ JSON.stringify(req.body))
    console.log("HEADING_ID"+ heading_id)


    con.query(
        `INSERT INTO posts (comment, heading_id, user_id) VALUES(?, ?, ?)`,
        [comment, heading_id, user_id],

    (error, results) =>{ 

        if(error){
            console.error("Adding post Error!: "+ error);
            
            return res.status(500).send("Adding post error!")
        }

        return res.redirect("/postconfirmation.html");// Redirect to postconfirmation.html
      })
    })
});

/**
 * Post Confirmation
 * When you add a post, /addtopi redirect to this page
 */
app.get ("/postconfirmation.html", function(req,res){
    if (!req.session.user){
       return res.redirect("/")
    }

    let loggedInUserName = req.session.user.name;// declare loggined username
    //------------------Here show logined user name--------------------
         let output = fs.readFileSync(path.join(__dirname, 'views','postconfirmation.html')).toString();
         output =output.replace("***NAMN***", loggedInUserName);// replase here tu username
    
    return res.send(output);
})