/* eslint-env node */
/* eslint max-len: ["error", { "code": 100 }]*/
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "watch" }]*/

let gulp = require('gulp');
let sass = require('gulp-sass');
let autoprefixer = require('gulp-autoprefixer');
let browserSync = require('browser-sync').create();
let concat = require('gulp-concat');
let eslint = require('gulp-eslint');
// let uglify = require('gulp-uglify');
let babel = require('gulp-babel');
let watch = require('gulp-watch');
let sourcemaps = require('gulp-sourcemaps');
let imagemin = require('gulp-imagemin');
let pngquant = require('imagemin-pngquant');
let cleanCSS = require('gulp-clean-css');
let webp = require('gulp-webp');
let minifyHtml = require('gulp-htmlmin');
let minifyjs = require('gulp-minify');
// let gzip = require('gulp-gzip');

gulp.task('default', ['min-html', 'styles', 'min-css',
'min-index-scripts', 'min-restaurant-scripts', 'min-sw-idb-script',
 'copy-manifest', 'min-lazyload-script', 'webpconvert'], function() {
 gulp.watch('dist/css/*.css', ['min-css']);
 gulp.watch('dist/sass/*.scss', ['styles']);
 gulp.watch('dist/*.html', ['min-html']);
  browserSync.init({
    server: './dist',
    port: 8000,
  });
 gulp.watch('dist/*.html').on('change', browserSync.reload);
});

gulp.task('dist', [
 'min-html',
 'webpconvert',
 'styles',
 'min-css',
 'min-index-scripts',
 'min-restaurant-scripts',
 'copy-manifest',
 'min-sw-idb-script',
 'min-lazyload-script',
]);

gulp.task('imagemin', function() {
 return gulp.src('img/*')
 .pipe(imagemin({
  progressive: true,
  use: [pngquant()],
  }))
  .pipe(gulp.dest('dist/img'));
});

gulp.task('webpconvert', function() {
  return gulp.src('img/*.jpg')
        .pipe(webp())
        .pipe(gulp.dest('dist/img'));
});

gulp.task('styles', function() {
 gulp.src('sass/**/*.scss')
 .pipe(sass({
  outputStyle: 'compressed',
  }).on('error', sass.logError))
  .pipe(autoprefixer({
  browsers: ['last 2 versions'],
  }))
 .pipe(gulp.dest('./dist/sass'))
 .pipe(browserSync.stream());
});

gulp.task('min-css', function() {
  gulp.src('css/*.css')
    .pipe(sourcemaps.init())
    .pipe(cleanCSS())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/css/'));
});


// gulp.task('gzip', function() {
//  gulp.src('js/**/*.js')
//  .pipe(gzip())
//  .pipe(gulp.dest('dist/js'));
// });
gulp.task('copy-minjs', function() {
 gulp.src(['dist/js/restaurant.js', 'dist/js/restaurant-min.js',
  'dist/js/index.js', 'dist/js/index-min.js', 'dist/js/sw.js',
   'dist/js/sw-min.js', 'dist/js/idb.js', 'dist/js/idb-min.js',
    'dist/js/lazy-load-min.js'])
    .pipe(gulp.dest('./js'));
});

gulp.task('only-copy-html', function() {
 gulp.src('./*.html')
 .pipe(gulp.dest('./dist'));
});

gulp.task('only-copy-images', function() {
 gulp.src('img/*')
 .pipe(gulp.dest('dist/img'));
});

gulp.task('only-babel-scripts', function() {
 gulp.src('js/**/*.js')
 .pipe(babel())
 // .pipe(concat('all.js'))
 .pipe(gulp.dest('dist/js'));
});

gulp.task('min-index-scripts', function() {
  gulp.src(['js/dbhelper.js', 'js/main.js'])
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat('index.js'))
    .pipe(minifyjs())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/js'));
});

gulp.task('min-restaurant-scripts', function() {
  gulp.src(['js/dbhelper.js', 'js/restaurant_info.js'])
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat('restaurant.js'))
    .pipe(minifyjs())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/js'));
});

gulp.task('copy-manifest', function() {
 gulp.src('./manifest.json')
    .pipe(gulp.dest('./dist'));
});


gulp.task('min-sw-idb-script', function() {
  gulp.src(['./sw.js', './node_modules/idb/lib/idb.js'])
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(minifyjs())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dist/js'));
});

gulp.task('min-lazyload-script', function() {
  gulp.src('js/lazy-load.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(minifyjs())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dist/js'));
});

gulp.task('min-html', function() {
  gulp.src('./*.html')
    .pipe(minifyHtml({collapseWhitespace: true}))
    .pipe(gulp.dest('./dist'));
});

/*
gulp.task('scripts-dist', function() {
 gulp.src('js/*.js')
 .pipe(sourcemaps.init())
 .pipe(babel({presets: ['es2015']}))
 .pipe(concat('all.js'))
 .pipe(uglify())
 .pipe(sourcemaps.write())
 .pipe(gulp.dest('dist/js'));
});
*/

gulp.task('lint', function() {
 return gulp.src(['js/**/*.js'])
// eslint() attaches the lint output to the eslint property
// of the file object so it can be used by other modules.
 .pipe(eslint())
// eslint.format() outputs the lint results to the console.
// Alternatively use eslint.formatEach() (see Docs).
 .pipe(eslint.format())
// To have the process exit with an error code (1) on
// lint error, return the stream and pipe to failOnError last.
 .pipe(eslint.failOnError());
});

gulp.task('test', function() {
  console.log('Gulp testing message!');
});
