const gulp = require('gulp');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');

// Task to minify admin-app JavaScript files
gulp.task('minify-admin-app', function() {
  return gulp.src(['public/admin-app/**/*.js', '!public/admin-app/**/*.min.js'])
    .pipe(uglify())
    .on('error', function(err) {
      console.error('Error in minify-admin-app task:', err.toString());
      this.emit('end'); // End the task to prevent Gulp from crashing
    })
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('public/admin-app/'));
});

// Task to minify website-app JavaScript files
gulp.task('minify-website-app', function() {
  return gulp.src(['public/website-app/**/*.js', '!public/website-app/**/*.min.js'])
    .pipe(uglify())
    .on('error', function(err) {
      console.error('Error in minify-website-app task:', err.toString());
      this.emit('end'); // End the task to prevent Gulp from crashing
    })
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('public/website-app/'));
});

// Default task that runs both minify-admin-app and minify-website-app tasks in parallel
gulp.task('default', gulp.parallel('minify-admin-app', 'minify-website-app'));
