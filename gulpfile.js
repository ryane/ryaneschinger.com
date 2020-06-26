var gulp = require('gulp'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    source = require('vinyl-source-stream'),
    sass = require('gulp-sass'),
    minifyCss = require('gulp-minify-css'),
    concat = require('gulp-concat'),
    del = require('del'),
    cp = require('child_process'),
    util = require('gulp-util'),
    server = require('gulp-server-livereload');

var hugoImage = 'ryane/docker-hugo:0.18.1';

var path = {
  SCSS: './src/scss/*',
  JS: './src/js/**/*',
  IMAGES: './src/images/**/*',
  ICONS: './src/*',
  ENTRY_POINT: './src/js/main.js',
  DEST_CSS: './static/css/',
  DEST_JS: './static/js/',
  DEST_IMAGES: './static/images/',
  DEST_ICONS: './static/',
  PUBLIC: 'public',
  STATIC: 'static/**/*',
  CONTENT: 'content/**/*'
};

gulp.task('clean', function() {
  cleanDirs = [path.PUBLIC, path.STATIC];
  del(cleanDirs, { force: true });
});

gulp.task('scss', function() {
  gulp.src(path.SCSS)
    .pipe(sass())
    .pipe(minifyCss())
    .pipe(concat('site.css'))
    .pipe(gulp.dest(path.DEST_CSS));
});

gulp.task('build', function() {
  return browserify({
    entries: [path.ENTRY_POINT],
    transform: [babelify]
  })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(path.DEST_JS));
});

gulp.task('images', function() {
  gulp.src(path.IMAGES)
    .pipe(gulp.dest(path.DEST_IMAGES));
});

gulp.task('icons', function() {
  gulp.src(path.ICONS, { dot: true })
    .pipe(gulp.dest(path.DEST_ICONS));
});

gulp.task('server', function() {
  gulp.src('./public')
    .pipe(server({
      livereload: true,
      directoryListing: false,
      open: true
    }));
});

gulp.task('watch', ['scss', 'build', 'images', 'icons', 'server'], function(done) {
  var hugoArgs = [
    'run',
    '--rm',
    '-it',
    '-v',
    __dirname + ':/src',
    hugoImage,
    'hugo',
    '--buildDrafts'
  ];

  // run hugo once first
  cp.spawn('docker', hugoArgs, { stdio: 'inherit' });

  gulp.watch([path.SCSS], ['scss']);
  gulp.watch([path.JS], ['build']);
  gulp.watch([path.IMAGES], ['images']);
  gulp.watch([path.ICONS], ['icons']);
  gulp.watch([path.CONTENT, './config.toml'], function() {
    cp.spawn('docker', hugoArgs, { stdio: 'inherit' });
  });
});

gulp.task('prod', ['scss', 'build', 'images', 'icons'], function(done) {
  var hugoArgs = [
    'run',
    '--rm',
    '-it',
    '-v',
    __dirname + ':/src',
    hugoImage
  ];

  util.log('Building site with hugo...');
  return cp.spawn('docker', hugoArgs, { stdio: 'inherit' }).on('close', function() {
    util.log('Verifying site...');
    cp.spawn('docker', [
      'run',
      '--rm',
      '-it',
      '-v',
      __dirname + '/public:/public',
      '18fgsa/html-proofer',
      '/public',
      '--log-level',
      'debug',
      '--url-ignore',
      'http://d3nwzvnnqkgieg.cloudfront.net/assets/sample-0249fabde1c3a9dec561a00aa397b3ed.jpg,http://www.mamajamas.com/,http://mantl.io/,https://github.com/kubernetes/ingress/tree/master/examples/aws/nginx,http://practicalops.com/my-first-5-minutes-on-a-server-with-ansible.html,https://www.crunchbase.com/organization/open-places#/entity,https://blog.gruntwork.io/how-to-manage-terraform-state-28f5697e68fa#.8gpxip2yl,http://www.amazon.com/gp/product/184951030X/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=184951030X&linkCode=as2&tag=ryanesc-20&linkId=UPCPHBUE4JKOAP4G'
    ], { stdio: 'inherit' }).on('close', done);
  });
});

gulp.task('default', [ 'watch' ]);
