/*****************************************************************************************
* $Id: index.js 17075 2018-04-13 15:51:10Z sthames $
/**
* Parse build blocks in HTML files to replace script file references using [useref]. 
* Alternative to the gulp plugin [gulp-useref] as a simpler, more streamlined process that 
* allows for asset files relevant to the document root as well as to the treated file.
* 
* @module lib/gulp-alt-useref
*****************************************************************************************/
module.exports = (function()
  {
  var concat  = require('gulp-concat');
  var os      = require('os');
  var path    = require('path');
  var Q       = require('q');
  var through = require('through2');
  var useref  = require('useref');
  var vfs     = require('vinyl-fs');

  return function(opts)
    {
    var options = Object.assign({base:'.', newLine:os.EOL}, opts);

    return through.obj(
      function(inputFile, enc, nextFile)
        {
        var self = this;

        /*--------------------------------------------------------*/
        /* Pass input file through useref and get new transformed */
        /* file contents and dictionary of types (js,css,etc)     */
        /* containing new asset files with old assets to combine. */
        /*--------------------------------------------------------*/
        var output    = useref(inputFile.contents.toString(enc), options);
        var contents  = output[0];
        var newAssets = output[1];

        /*---------------------------------------*/
        /* Push the transformed file downstream. */
        /*---------------------------------------*/
        inputFile.contents = new Buffer(contents);
        this.push(inputFile);

        /*----------------------------------------------------*/
        /* For each new asset file, combine the files that    */
        /* must be included and push the new file downstream. */
        /*----------------------------------------------------*/
        var promises = [];
        Object.keys(newAssets).forEach(function(type)
          {
          Object.keys(newAssets[type]).forEach(function(newAssetPath)
            {
            /*--------------------------------------------------------------*/
            /* Convert the old asset file paths such that absolute paths    */
            /* (with leading slash) are relative to the base path (docroot) */
            /* and relative paths are relative to the input file path.      */
            /*--------------------------------------------------------------*/
            var oldAssets = newAssets[type][newAssetPath].assets.map(function(oldAssetPath)
              {
              return (oldAssetPath[0] === '/' ? oldAssetPath.substring(1) : path.join(path.dirname(inputFile.relative), oldAssetPath));
              });

            /*--------------------------------------------------------*/
            /* Build the new asset file and push it downstream.       */
            /* Combine the old assets files in the order useref found */
            /* them. Pass asset files through transform if provided.  */
            /*--------------------------------------------------------*/
            promises.push(Q.Promise(function(done)
              {
              vfs.src(oldAssets, { base:options.base })
                .pipe(options.transform ? options.transform() : through.obj())
                .pipe(concat(newAssetPath, {newLine:options.newLine}))
                .pipe(through.obj(function(newAsset, enc, cb) { self.push(newAsset); cb(); }, done));
              }));
            });
          });

        /*------------------------------------------------------------*/
        /* Note: `then(nextFile)` will abort. Must be done like this. */
        /*------------------------------------------------------------*/
        Q.all(promises).then(function() { nextFile(); });
        },
      function() { this.emit('end'); }
      );
    };
  })();
