# University of Denver | ICT4510 Advanced Website Design and Management

## Table of Contents

* [README](#readme)
* [Releases](#releases)
* [Contact](#contact)

## README

### Background

Final Project Example Application.  

### Contributing

Check out our [contributing guidelines](/CONTRIBUTING.md) for ways to offer feedback and contribute.

### Licenses

[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).


### Local Environment Setup

```
Have Node.js > 10.0 
Have MySql 5.5 - 5.7
git clone https://github.com/freyesdulib/ict4510-api-service.git
cd into ict4510-api-service
npm install (installs application dependencies)
Add .env file in root folder (see .env-example)
Create database in MySQL - "ict4510" (https://sequelpro.com/)
Change file extension from .txt to .sql ict4510-api-db.txt -> ict4510-api-db.sql
Import mysql schema "ict4510-api-db.sql" into newly created ict4510 database. (https://sequelpro.com/)
Create account via User API endpoint i.e. http://localhost:3000/api/users
run "node index.js"
http://localhost:3000/       (Public)
http://localhost:3000/login  (Admin)
```

### Maintainers

@freyesdulib

## Releases
* v1.0.0 [release]() [notes]()
* v2.0.0 [release]() [notes]()

## Contact

Ways to get in touch:

* Fernando Reyes (University of Denver) - fernando.reyes@du.edu
* Create an issue in this repository
