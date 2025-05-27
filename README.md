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

### Build Process

This project uses Gulp to minify JavaScript assets for production. The minified files are used when the application is running in a production environment (`NODE_ENV=production`).

- **Install Dependencies**: If you haven't already, run `npm install` to install all dependencies, including the development dependencies required for the build process (Gulp and its plugins).
- **Run Minification**: To minify the JavaScript files, run the following command:
  ```bash
  npm run minify
  ```
  This command will process JavaScript files in `public/admin-app/` and `public/website-app/`, creating corresponding `.min.js` files in the same directories (e.g., `public/admin-app/example.js` will be minified to `public/admin-app/example.min.js`).

### Maintainers

@freyesdulib

## Releases
* v1.0.0 [release]() [notes]()
* v2.0.0 [release]() [notes]()

## Contact

Ways to get in touch:

* Fernando Reyes (University of Denver) - fernando.reyes@du.edu
* Create an issue in this repository
