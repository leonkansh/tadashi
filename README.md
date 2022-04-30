# Tadashi : Teams in Motion
### **University of Washington**
### _Information School Capstone 2022: Team Tadashi_
- [Server Repo and Database Structure](https://github.com/leonkansh/tadashi)
- [Client Repo and Design Documentation](https://github.com/leonkansh/TeamMotion)


### Authors
- Kevin Yip (insert contact)
- Nicole Fendi (insert contact)
- Leon Kan (insert contact)
- Collin Santos (insert contact)

---
## About

---
## App

### Runtime
- node.js
- express

### File Structure
---
## Infrastructure

### Services

### Dataflow

---
## Data

### Schema

### Sample Data

### API

### Postman

---
## Build
Steps on how to build and deploy a working version of our application.
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
- Setup MongoDB Atlas service
- Replace `.env` `MONGODB_URI` string to point your Atlas deployment

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
