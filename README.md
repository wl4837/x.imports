# x.import

`x.import` exports a method for the `gulp`.

## Installation

```shell
$ npm install x.import --save
```

## Usage

```javascript
var gulp = require('gulp');
gulp.import = require('x.import');
```


## Example
In your `gulpfile.js`:
```
var gulp = require('gulp'),
xImport = require('x.import');

gulp.task('defaults', function () {
   gulp.src('./src/**/*.{css,js,html}')
        .pipe(xImport())
        .pipe(gulp.dest('build'))
});

```

In your `*.css`

```css
/* import("path"); */
body{
}
```

In your `*.html`

```html
<body>
<!-- import("path"); -->
</body>
```

In your `*.js`

```javascript
// import("path");
...
```


## License
Apache License 2.0