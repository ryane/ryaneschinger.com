var gulp = require('gulp'),
    sass = require('gulp-sass'),
    minifyCss = require('gulp-minify-css'),
    concat = require('gulp-concat'),
    del = require('del'),
    cp = require('child_process');

gulp.task('clean', function() {
  cleanDirs = ['public', 'static/**/*'];
  del(cleanDirs, { force: true });
});

gulp.task('scss', function() {
  gulp.src('src/scss/*')
    .pipe(sass())
    .pipe(minifyCss())
    .pipe(concat('site.css'))
    .pipe(gulp.dest('./static/css/'));
});

gulp.task('build', function() {
  gulp.src('src/js/*')
    .pipe(gulp.dest('./static/js/'));
});

gulp.task('watch', ['scss', 'build'], function(done) {
  gulp.watch(['src/css/*'], ['scss']);
  var hugoArgs = [
    'server',
    '-w',
    '--buildDrafts'
  ];
  return cp
    .spawn('hugo', hugoArgs, { stdio: 'inherit' })
    .on('close', done);
});

gulp.task('default', [ 'watch' ]);
