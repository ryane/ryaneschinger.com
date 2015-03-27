var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('scss', function() {
  gulp.src('src/scss/*')
    .pipe(sass())
    .pipe(gulp.dest('./static/css/'));
});

gulp.task('default', ['scss']);
