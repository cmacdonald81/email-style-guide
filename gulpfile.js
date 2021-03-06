const gulp = require('gulp');
const del = require('del');
const concat = require('gulp-concat');
const merge = require('merge-stream');

const sass = require('gulp-sass');
const minify = require('gulp-clean-css');

const uglify = require('gulp-uglify');

const child = require('child_process');
const gulpUtil = require('gulp-util');

const inlineCss = require('gulp-inline-css');
const htmlmin = require('gulp-htmlmin');


const dir = {
  src: 'src/',
  dest: 'dist/',
  docs: 'docs/',
  docsSrc: 'docs/src/',
  siteRoot: 'docs/_site/'
};

gulp.task('css', (done) => {
  const src = dir.src + 'sass/email-style.sass';
  const dest = dir.dest + 'css/';
  const docsDest = dir.docs + 'assets/css/';

  const sassOpts = {
    outputStyle: 'expanded',
    includePaths: [
      'bower_components/project-leap/bourbon',
      'bower_components/project-leap/_sass'
    ],
    precision: 3
  };

  gulp.src(src)
    .pipe(sass(sassOpts)
    .on('error', sass.logError))
    .pipe(gulp.dest(dest))
    .pipe(gulp.dest(docsDest));
  done();
});

gulp.task('templates', () => {
  const src = dir.src + 'templates/**/*.html';
  const dest = dir.dest + 'templates/';
  const docsDest = dir.docs + 'templates/';

  return gulp.src(src)
    .pipe(inlineCss({removeStyleTags: false}))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(dest))
    .pipe(gulp.dest(docsDest));
});

gulp.task('docs:css', () => {
  const src = dir.docsSrc + 'css/*.css';
  const sassSrc = dir.docsSrc + 'sass/styleguide.sass';

  const dest = dir.docs + 'assets/css/';
  const sassOpts = {
    outputStyle: 'expanded',
    includePaths: [
      'bower_components/project-leap/bourbon',
      'bower_components/project-leap/_sass',
      'src/sass',
      'docs/src/sass'
    ],
    precision: 3
  };

  const sassStream = gulp.src(sassSrc)
    .pipe(sass(sassOpts).on('error', sass.logError))
    .pipe(concat('styleguide-files.sass'));

  const cssStream = gulp.src(src)
    .pipe(concat('styleguide-files.css'));

  return merge(sassStream, cssStream)
    .pipe(concat('styleguide.css'))
    .pipe(minify())
    .pipe(gulp.dest(dest));
});

gulp.task('docs:js', () => {
  const src = dir.docsSrc + 'js/*.js';
  const dest = dir.docs + 'assets/js/';

  return gulp.src(src)
    .pipe(concat('styleguide.js'))
    .pipe(uglify())
    .pipe(gulp.dest(dest));
});


gulp.task('clean:templates', () => {
  const destTemplates = dir.dest + '/templates/**/*';
  const docsSite = dir.siteRoot + '**/*';
  const docsTemplates = dir.docs + '/templates/**/*';
  const docsTemplatesIndex = dir.docs + '/templates/index.html';
  const excludeDocsTemplatesIndex = '!' + docsTemplatesIndex;

  return del([destTemplates, docsSite, docsTemplates, excludeDocsTemplatesIndex]);
});



const startJekyll = (command) => {
  const jekyll = child.spawn('./bin/jekyll',
    [
      command,
      '--source', dir.docs,
      '--destination', dir.siteRoot
    ]
  );

  const handleError = (message) => {
    logMessage(message);
    process.exit(1);
  }

  const logMessage = (message) => {
    message.toString()
      .split(/\n/)
      .forEach((message) => {
        if(message.length > 0) {
          gulpUtil.log('Jekyll: ' + message)
        }
      });
  };

  jekyll.stdout.on('data', logMessage);
  jekyll.stderr.on('data', handleError);
}

gulp.task('jekyll:serve', (done) => {
  startJekyll('serve');
  done();
});
gulp.task('jekyll:build', (done) => {
  startJekyll('build');
  done();
});

gulp.task('watch', () => {
  gulp.watch(dir.src + 'sass/**/*', gulp.series('css'))
  gulp.watch(dir.src + 'templates/**/*.html', gulp.series('templates'))
  gulp.watch(dir.docsSrc + 'sass/**/*', gulp.series('docs:css'))
  gulp.watch(dir.docsSrc + 'js/**/*', gulp.series('docs:js'))
});

gulp.task('src', gulp.series('css', 'templates'));
gulp.task('docs', gulp.series('docs:css', 'docs:js'));
gulp.task('default', gulp.series('src', 'docs', 'jekyll:build'));
gulp.task('serve', gulp.series('jekyll:serve', 'watch'));
