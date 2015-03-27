var gulp = require('gulp'),
    sass = require('gulp-sass'),
    del = require('del');

gulp.task('clean', function(done) {
  cleanDirs = ['public', 'static'];
  del(cleanDirs, { force: true }, done);
});

gulp.task('scss', function() {
  gulp.src('src/scss/*')
    .pipe(sass())
    .pipe(gulp.dest('./static/css/'));
});

gulp.task('default', [ 'clean', 'scss']);
