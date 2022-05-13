# Tadashi : Teams in Motion
### **University of Washington**
### _Information School Capstone 2022: Team Tadashi_
- [Server Repo and Database Structure](https://github.com/leonkansh/tadashi)
- [Client Repo and Design Documentation](https://github.com/leonkansh/TeamMotion)
- [Landing Page](https://speedguy00.github.io/tadashi-landing/)

### Authors
- Kevin Yip - Project Manager
  - UW Email: keviny12@uw.edu
  - Personal: kevin00.yip@gmail.com
  - LinkedIn: https://www.linkedin.com/in/kevintyip
- Nicole Fendi - UI/UX Designer
  - UW Email: nicolef8@uw.edu
  - Personal: nicoleadyafendi@gmail.com
  - LinkedIn: https://www.linkedin.com/in/nicolefendi
- Leon Kan - Software Engineer
  - UW Email: leonykan@uw.edu
  - Personal: leon.can@outlook.com
  - LinkedIn: https://www.linkedin.com/in/leon-kan/
- Collin Santos - Software Engineer
  - UW Email: csantos3@uw.edu
  - Personal: collinsantos21@gmail.com
  - LinkedIn: https://www.linkedin.com/in/collin-santos-2561b8214/

### Site Links
- Server : [Tadashi Client](https://tadashi-cli.herokuapp.com)
- Client : [Tadashi Server](https://tadashi-srv.herokuapp.com)

---
## About

Many college students have had a bad team experience.
According to an online survey we conducted consisting of 30 University of Washington students across various majors, approximately 30% of respondents noted that their biggest pain point was communication, and another 40% of respondents noted that their pain point in groupwork was equity of work among team members.
From our research, we found that there are currently no solutions that offer structured guidance for team collaboration, especially focused on classes.

After conducting concept validation with university students, we identified three core concepts behind what makes a great team: communication, accountability, and reflection.
Teams need to communicate from beginning, middle, and end of their project for effective problem-solving and conflict-resolution.
Additionally, teams need to explicitly delegate tasks to each member so that everyone knows their responsibility, which establishes a sense of ownership.
Lastly, teams need to reflect on milestones of a project to give them a way to gain insights and make improvements for future deliverables.

Tadashi: Teams in Motion is a mobile-first web application that aims to give the basic framework for how in-class teams can work together effectively to complete their projects.
The three core features of our web-app are: team base, task management, and reflection board. 

### Acknowledgments

This project has been guided under Professor Nam-ho, who has provided insightful feedback and monitored the progress throughout the project timeline.

### End of Life

We plan to transition our project into open source, effective May 22nd, 2022.
By the transition date, we will have shut down any systems that automatically collect user data.
We also will have notified all users that their data will be deleted by this transition date.
As for cloud infrastructure, we will shut down our infrastructure with MongoDB and all account associated with it.
The code repository on GitHub will also have been converted from a private repository to a public repository with our contact information so any groups can successfully transition our project.

---
## App

This outlines the general structure and runtime for the Tadashi API server.<br>
For info about deployment, see [Infrastructure](#infrastructure).<br>
For info about data structure, see [Data](#data).<br>
For info about building the application, see [Build](#build)<br>
For info about next steps, see [Continuation](#continuation)

### Runtime

Tadashi uses the node packet manager to handle the build and inclusion of packages.
- [node.js](https://nodejs.org/en/) Version 14.18.0

To handle API requests, ExpressJS is used to route and send data through the web. API requests are structured in a standard REST format.
- [ExpressJS](https://expressjs.com/)

### File Structure

Below is the general outline of file structure in the Tadashi repo:
```
root
├── database
│   └── database.js (schema)
│
├── routes
│   ├── (functions).js
│   └── api
│       └── (handlers).js
│
├── public
│   └── (api front-end unused)
│
├── app.js (entry)
└── package.json
```

---
## Infrastructure

Tadashi is hosted on two separate deployments, the API and the client. The general purpose is to make management of these services independent of one another, without requiring takedown of both services. This can be changed to a single deployment by merging the client and front end repos.

Our data is stored on a hosted NoSQL database. Any hosted cluster that supports standard MongoDB queries should be interchangable.

### Services

**Deployment**: Heroku
- Link to Server: [Tadashi Server](https://tadashi-srv.herokuapp.com)
- Link to Client: [Tadashi Client](https://tadashi-cli.herokuapp.com)

**NoSQL Database**: MongoDB Atlas - Free Tier

### Dataflow

Dataflow is a straight-forward request and serve structure, where the client requests data via the API routes and is served the related data. 
Most data is reliant on a session token maintained on the server through a cookie.
For security reasons, information regarding a organization and/or team requires the logged user to have membership within said org/team.

![Tadashi Data Flow Diagram](./diagrams/tadashi-dataflow.jpg?raw=true)

---
## Data

The goal of the database structure is to give support for the core functionality of Users, Organizations, and Teams while leaving room for additional services to be added at will. To accomplish this, Users and Organizations are the primary schemas, with reliance only on each other for functionality. Any additional schemas should not impose restrictions on Users or Organizations to allow flexibility and maintainability.

Additional features that need database support can use the fields present within Orgs and Users to tie them to specific subsets of users, orgs, or teams. For example, the messages schema implements `orgid` and `teamid` to uniquely identify a group conversation for a specific team that cannot be accessed unless a user a member.

Implementation strategy should consult schemas outlined within `database/database.js` for examples. Additional fields may be added to the Users or Organizations schemas, _however_ be wary of imposing restrictions from other schemas as this can have a cascading effect.

### Schema

Below is a diagram of our logical schema structure. Note that this is only logical and not the physical implementation. For example, Teams and ToDo are implemented as nested documents of Organization and Assignments respectively.

For a detailed list of available fields and connections, consult `database/database.js`.

![Tadashi Schmea Structure](./diagrams/tadashi-data-struct.jpg?raw=true)

### Sample Data

Sample data can be imported to a local instance of a NoSQL database using the included .json files within `database/tadashiSampleData_v3.zip`. Consult the included README for instructions on how to setup using MongoDBCompass.

Note that this data is fabricated and not representative of real people or the real world. DO NOT deploy Tadashi with this data included as it represents a security risk.

### API

The API is structured in a REST-like format, with GET, POST, PUT, DELETE entries for most endpoints. Endpoints have been tested, however, further testing is required and should be automated going forward. For additional information on payloads, type returns, and expected functionality, consult comments preceding routes.

API functionality is not extensive but sufficient for current implented client activities.

Domain: https://tadashi-srv.herokuapp.com

**Routes**

**/login**
- POST /signin : Signs in user and sets session
- POST /signup : Signs up new user and sets session
- POST /signout : Removes users credentials from session

**/api/users**
- GET /self : Returns current user information for session
- GET /:userid : Returns users information
- PUT /:userid : Edits users information
- DELETE /:userid : Deletes references to user

**/api/org**
- POST /create : Create new organization
- GET /:orgid : Return orgs information
- PUT /:orgid : Edits orgs information
- DELETE /:orgid : Deletes references to org
- POST /:orgid/join : Joins user in session to org
- POST /:orgid/leave : Removes user in session from org
- GET /:orgid/members : Returns members of org
- POST /:orgid/kick : Removes target user from org
- POST /:orgid/teams/random : Randomizes teams from current member list
  - WARNING : Currently only stable once per org, needs fix
- GET /:orgid/team/:teamid : Returns members of team within org
- PUT /:orgid/team/:teamid : Edits team information

**/api/charters** _(renamed into summary on client)_
- GET /:orgid/:teamid : Returns summary information about team
- GET /:orgid/:teamid/single?name="name" : Returns singlet piece of summary info
- PUT /:orgid/:teamid : Edit summary information about team
- POST,DELETE /:orgid/:teamid : DEPRECATED, irrelevant for new functionality

**/api/assignments**
- GET /:orgid : Returns assignments for org
- POST /:orgid : Add assignment to org
- GET /:orgid/:assignmentid : Retrieve single assignment in org
- PUT /:orgid/:assignmentid : Edit single assignment in org
- DELETE /:orgid/:assignmentid : Delete single assignment in org
- GET /:orgid/team/:teamid : Retrieve assignments tied to team in org
- GET /:orgid/:assignmentid/team/:teamid : Retrieve ToDo list for assignment of team
- GET /:orgid/team/:teamid/head : Retrieve next three ToDo's for session user
- POST /:orgid/:assignmentid/team/:teamid : Add ToDo for assignment in a team
- PUT /:orgid/:assignmentid/team/:teamid : Edit ToDo for assignment in a team
- DELETE /:orgid/:assignmentid/team/:teamid : Delete ToDo for assignment in a team

**/api/msg**
- GET /:orgid/:teamid : Retreive message history for team
- POST /:orgid/:teamid : Post new message for team

**/api/board**
- GET /:orgid/:teamid : Retreive board posts for a team
- POST /:orgid/:teamid : Add new board post for a team
- POST /:orgid/:teamid/react : Add or remove reaction to a post

### Postman

Install Postman [here](https://www.postman.com/).

A catalog of endpoints using the local deployment can be found in file: `./database/Tadashi_v3.postman_collection.json`. Import the file into Postman environment to load local (localhost:3000) endpoints.

Endpoints should work locally using Postman and login cookies can be saved by first calling endpoint `Login/Signin` before restricted endpoints.

---
## Build

Steps on how to build and deploy a working version of our application:

### Local

- **Database**
  - Install MongoDB Server
  - (Recommended) Install MongoDBCompass
    - Used to view data using GUI
  - Instance a local MongoDB Server
    - (**Windows**) `mongod.exe --dbpath="c:\code\mongodbData\testdb\"`
  - (Optional) Populate with sample data manually
- **Server**
  - Clone Server Repository `tadashi`
  - Install node packages using `npm install` from terminal
  - In tadashi root direcory, create file `.env`
    - File Content: `MONGODB_URI=mongodb://localhost/tadashi`
  - Start server with `npm start` from terminal
- **Client**
  - Clone Server Repository `TeamMotion`
  - Install node packages using `npm install` from terminal
  - Change fetch domain location to `http://localhost:3000`
  - Start client with `npm run start` from terminal

### Deployment

**Server**
- Setup MongoDB Atlas service
- Replace `.env` `MONGODB_URI` string to point your Atlas deployment
- Download the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) and sign up
- Add a remote to local repository
  - `heroku git:remote -a tadashi-srv`
- Merge dev branches to main and create production branch
- `git push heroku production:main`
- `git remote -v` to confirm deployment

**Client**
- Install heroku build utilities:
  - `heroku plugins:install buildpack-registry`
  - `heroku plugins:install buildpacks`
- Check build packs: `heroku buildpacks -a tadashi-cli`
  - Expecting `react-app`
  - If not, run: `heroku buildpacks:set mars/create-react-app -a tadashi-cli`
- Production branch from main
- Deploy: `git push heroku production:main`

---
## Continuation

Listed below is our suggestion on how this project may be continued forward. This includes items of varying urgency and/or complexity that have come up through ongoing development.

This section is not meant to be authoritative nor exhaustive. It is meant to guide future teams on what they might seek to investigate going forward.

### Next Steps

- Database Conversion: Nested Objects $\rightarrow$ Mongoose Subdocuments 
- Admin Support
  - Manual Team Formation Support
  - Assignment Repository
- Automated Testing
- Full implementation of API on client side
- Standardize error codes and payload returns

### Known Issues

- Team formation only supports once per organization
- Session memory leak (_see `express-sessions` documentation_)
- Assignments Schema is static
- Delete functionality is incomplete

### Suggestions

- User Profile Support
  - Abouts
  - Contacts
  - Account Services
  - Image support
  - Activity scoring
- Team Services (_e.g. notification frequency_)
- Private Messaging
- Notification System
- SSO Implementation (_e.g. Microsoft_)
- Automatic import assignments from remote API (_e.g. Canvas_)
- Reddis support for session storage
- Security/Penetration testing
  - String validation
- Schema support for new features
