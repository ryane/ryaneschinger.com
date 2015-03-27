var gulp = require('gulp'),
    sass = require('gulp-sass'),
    minifyCss = require('gulp-minify-css'),
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
    .pipe(gulp.dest('./static/css/'));
});

gulp.task('watch', ['scss'], function(done) {
  gulp.watch(['src/css/*'], ['scss']);
  var hugoArgs = [
    'server',
    '-w',
    '--buildDrafts',
    '-t',
    'ryaneschinger.com'
  ];
  return cp
    .spawn('hugo', hugoArgs, { stdio: 'inherit' })
    .on('close', done);
});

gulp.task('default', [ 'watch' ]);
