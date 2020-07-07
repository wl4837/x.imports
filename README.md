# x.import-pro

1. 添加针对项目绝对路径支持
2. 添加 html 内支持 javascript css 样式文件引入
3. 修复 js css 正则表达式 匹配错误问题
4. 添加 文件未找到 提示错误显示

## 项目基于 x.import 修复部分问题 

`x.import-pro` exports a method for the `gulp`.

## Installation

```shell
$ npm install x.import-pro --save
```

## Usage

```javascript
var gulp = require('gulp');
gulp.import = require('x.import-pro');
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
