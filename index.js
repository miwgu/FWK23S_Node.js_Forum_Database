let mysql = require("mysql2"); // "npm i mysql2"
//I use MySql workbench. It works with mysql2
let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Miwakodori23!",
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

let userSession = app.use(session({
  secret:generateKey(),
  resave:false,
  saveUninitialized:true
}));


app.get("/", function(req, res){
    res.sendFile(path.join(__dirname,'views','login.html'));
})

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
             "<h5>",
              "<h5>LOGIN FAILD! Please try it again!<br><hr>"
             );
                
                return res.send(output);
            }
        }

    )
})

});


/**
 * Get
 * Output username and heading list
 *
 */


app.get("/forum.html",function(req,res){
    if(!req.session.user){
      res.redirect("/")
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
        'SELECT heading.id, users.user as username, heading.name, heading.comment '+ 
        'FROM heading '+
        'JOIN users ON users.id = heading.user_id ',

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
    
  
    for(var i=heading.length-1; i>=0; i--){
      
        heading_html+=
        `
        <div class="container p-1" >
          <form class="row p-2" action="/readtopic.html" method="get"     style="background-color:rgb(246, 218, 235);">
            <div  style="display:flex;">
            
            <button id="goToThread" name="id"  value ="${heading[i].id}"  type="submit" class="btn btn-secondary p-2 m-2 col-md-2">Läs</button>
             <p class="p-2 m-2 col-md-4 ">${heading[i].name}</p>
             <p class="p-2 m-2 col-md-2 ">Skapad av ${heading[i].username}</p> 
             
            </div>
          </form>
        </div>
      `
      
    }
    return heading_html;
};

/**
 * GET
 * read topic
 */


app.get("/readtopic.html",function(req,res){
    if(!req.session.user){
      res.redirect("/")
    }
    let headerId = req.query.id;
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
            'SELECT * FROM heading',
    
            (error, headers, fields) =>{ 
    
                if(error){
                    console.error("Serching heading Error!: "+ error);
                    
                    return res.send("Searching heading error!")
                }

            console.log("Heading"+JSON.stringify(headers))

          let selectedHeader = headers.find(header=> header.id===parseInt(headerId))
          if(selectedHeader){
             output= output.replace('***Thread name***', selectedHeader.name)
          }
        
             
     //------------------Here show posts list--------------------
          //let posts= JSON.parse(fs.readFileSync(path.join(__dirname, 'data','posts.json')).toString());

          con.query(
            'SELECT * FROM posts',
    
            (error, posts, fields) =>{ 
    
                if(error){
                    console.error("Serching heading Error!: "+ error);
                    
                    return res.send("Searching heading error!")
                }

            console.log("Heading"+JSON.stringify(posts))

          let postsByselectedHeader = posts.filter(post => post.heading_id===parseInt(headerId)) //filter() return an array
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
            <td>Skrivet av ${selectedHeader.user_id}</td>
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
          output=output.replace(`<button id="submitPostBtn" type="submit" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#postsModal">`,
          `<button id="submitPostBtn" name ="id" value="${headerId}" type="submit" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#postsModal">`)
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
              <td>Skrivet av ${postsByselectedHeader[i].user_id}</td>
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
 *POST
 * addpost
 * write a post to database
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
    //let time= createFormatTimeStamp(new Date());
    let heading_id=parseInt(req.body.id);
    let user_id= req.session.user.id;
    console.log("HEADING QUERY PARAMS: "+ JSON.stringify(req.body))
    console.log("HEADING_ID"+ heading_id)
    let sql = `INSERT INTO posts (comment, heading_id, user_id) VALUES('${comment}','${heading_id}','${user_id}')`;
    console.log(sql);
    con.query(sql,

    (error, results) =>{ 

        if(error){
            console.error("Serching heading Error!: "+ error);
            
            return res.send("Searching heading error!")
        }

       return res.redirect("/forum.html");// Redirect to forum.html
      })
    })
});