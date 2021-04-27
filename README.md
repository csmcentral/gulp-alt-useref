# gulp-alt-useref

Parse build blocks in HTML files to replace script file references using [useref]. 
Alternative to [gulp-useref] that allows for asset files relevant to the document root as 
well as to the treated file.

This plugin returns a stream that:

  1. Consumes HTML files with [useref] build blocks,
  2. Passes them through [useref] to transform the HTML blocks and collect the list of 
     blocks and script references, 
  3. For each block, concatenates the script files, in the order encountered, to the 
     target file specified in the block, and
  4. Produces the transformed HTML files and the target files created.

## Install

Install with **npm**

```
npm install --save-dev gulp-alt-useref
```

## Usage

The following example will parse and the build blocks in the input HTML files. Script
assets inside build blocks will be concatenated to new files that is pushed downstream 
following the treated file.

```js
var gulp   = require('gulp');
var useref = require('gulp-alt-useref');

gulp.task('default', function () {
    return gulp.src('app/*.html')
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});
```

With options (see [useref]):

```js
var gulp = require('gulp'),
    useref = require('gulp-useref');

gulp.task('default', function () {
    return gulp.src('app/*.html')
        .pipe(useref({ searchPath: '.tmp' }))
        .pipe(gulp.dest('dist'));
});
```

If you want to minify your assets or perform some other modification, you can use 
[gulp-if] to conditionally handle specific types of assets.

```js
var gulp = require('gulp'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-clean-css');

gulp.task('html', function () {
    return gulp.src('app/*.html')
        .pipe(useref())
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulp.dest('dist'));
});
```
**Note**: Modifying and minifying the assets files after concatenation may create 
          problems. This is known to cause problems with CSS file that include 
          other CSS files. See transformAssets option, below.

See [useref] for examples of build blocks markup.

## Example

The fundamental difference between this plugin and [gulp-useref] is in how it handles
asset file paths. [gulp-useref] assumes all paths are relative to the treated file. This
plugin treats fully-qualified paths, those with a leading slash (/), as relative to the 
**base** path.

Given folder structure:
```
/home/user1/
    gulpfile.js
    dev/
        app/
            index.html
            dom/
                amountFieldGroup.js
                itemList.js
            services/
                Data.js
        client/
	    dom/
                dom.js
                styledRadio.js
            services/
                services.js
```  

HTML Block in `/home/user1/dev/app/index.html` expressed as:

```html
<!-- build:js inc/scripts.js -->
<script type="text/javascript" src="/client/dom/dom.js"></script>
<script type="text/javascript" src="/client/dom/styledRadio.js"></script>
<script type="text/javascript" src="/client/services/services.js"></script>
<script type="text/javascript" src="dom/amountFieldGroup.js"></script>
<script type="text/javascript" src="dom/itemList.js"></script>
<script type="text/javascript" src="services/Data.js"></script>
<!-- endbuild -->
```

**html** task in `/home/user1/gulpfile.js`:

```js
gulp.task('html', function () 
  {
  return gulp.src('app/*.html', { base:'dev' })
            .pipe(useref({ base:'dev' }))
            .pipe(gulp.dest('dist'));
});
```

The the above block in the HTML file at `dist/index.html` will be replaced with
```html
<script type="text/javascript" src="inc/scripts.js"></script>
```

Output file structure will be:
```
/home/user1/dist
    app/
        index.html
            inc/
                scripts.js
```
      
`/home/user1/dist/app/inc/scripts.js` will include the concatenation of these files.
```
/home/user1/dev/client/dom/dom.js
/home/user1/dev/client/dom/styledRadio.js
/home/user1/dev/client/services/services.js
/home/user1/dev/app/dom/amountFieldGroup.js
/home/user1/dev/app/dom/itemList.js
/home/user1/dev/app/services/Data.js
```

## API

### useref(options)

Returns a stream that consumes HTML file with [useref] markup and produces these files 
transformed by [useref] as well as the concatenate asset files created. Supports all 
options from [useref].

**Note:** This plugin does not support the options from [gulp-useref].

### base {string} [base='.']

Root folder of asset references in treated file.

### newLine {string} [newLine=*os.EOL*]

New line string for separation of concatenated. This option is passed to [gulp-concat].
Defaults to the new line value for the operating system.

### transform {function}

Function returning a stream that consumes, transforms, and produces asset files. All 
asset files are passed through this stream before concatenation. For example, to 
integrate source maps:

```js
var gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    useref = require('gulp-useref'),
    lazypipe = require('lazypipe');

gulp.task('default', function () {
    return gulp.src('index.html')
        .pipe(useref({}, lazypipe().pipe(sourcemaps.init, { loadMaps: true })))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest('dist'));
});
```

[useref]:      https://github.com/jonkemp/useref
[gulp-useref]: https://www.npmjs.com/package/gulp-useref
[gulp-if]:     https://github.com/robrich/gulp-if
[gulp-concat]: https://github.com/gulp-community/gulp-concat
