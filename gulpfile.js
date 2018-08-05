var gulp = require('gulp');
var sass = require('gulp-sass');
var packageImporter = require('node-sass-package-importer');

gulp.task('build:sass', function () {
    return gulp.src('src/*.scss')
        .pipe(sass({
            importer: packageImporter({
                extensions: ['.scss', '.css']
            })
        }))
        .pipe(gulp.dest('src/'));
});