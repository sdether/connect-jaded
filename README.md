jaded 0.1a
=========

jaded (pronounced jade-dee) provides connect middleware to generate static html on demand for infrequently
changing jade templates/data. When the template and render data changes infrequently, jaded provides the benefit
of responding with a file send rather than a template execute and it will properly handle handle cache headers to
respond with a `304 NOT MODIFIED` rather than a `200 OK`.

This code is alpha quality. Check TODO below to see what is missing before it should be considered for anything
but experimental use.

Features
--------
* Generate static html on demand from jade templates
* Match request path based on various patterns
* Provide data to jade templates (should be used for static configuration)
* Invalidate html based on template and dependent template changes
* Invalidate html based on data changes
* Generate different html caches based on request level information

Usage
-----

```javascript
app.use(jaded.middleware({
  templatepath: path.join(__dirname, 'templates'),
}));
```

Options
-------
* `templatepath` **required**
  * path to search for templates
* `cachepath`
  * path where generated output is stored
  * default: `templatepath` */.cache*
* `ext`
  * extension to identify a path as a file rather than a directory
  * default: *.html*
* `notrailingslash`
  * is a path ending without a / the canonical path
  * default: *false*
* `ignore`
  * list of path prefixes to ignore for jaded processing
* `wildcards`
  * consider a trailing underscore as a wildcard for sub-path matches
  * default: *false*
* `getData`
  * a function of the form

    `function(req, res, candidate, callback)`

    where:

    * req - request
    * res - response
    * candidate - the matched template fragment
    * callback - `function(err, data, key)`

Why: Use case
---------
In frameworks, such as Angular, the HTML is usually static with all dynamic content being loaded via services.
In order to retain the syntax of jade instead of HTML, the composition abilities of `extends` and `includes` and
site or path specific configuration data that is shared between templates, jaded hooks in connect to intercept requests
and, as appropriate, generate and serve static html. It is further possible to generate different static html based on
request specific information (such as html for logged-in vs. anonymous users).

Path Pattern matching
---------------------
jaded will match a path as either an html file or index file for a directory.

In the case of a filepath, no wildcards will considered, i.e. a request for `/foo/bar.html` will look only for
`foo/bar.jade`.

Directory paths first canonalize path to either requiring a trailing slash or not. If `options.notrailingslash` is set,
the canonical uri for `/foo/bar/` is `foo/bar` and jaded will redirect as appropriate, if not set the opposite is the
canonical uri.

Once on a canonical path, `foo/bar` will consider the following templates in the shown order:
* `/foo/bar`
* `/foo/bar/index`
* `/foo/bar_`
* `/foo_`
* `/_`
The first one to exist is used as the matching template and checked against an existing .html file to determine whether
the output needs to be generated or served from disk.

TODO
----
- ~~Staleness checking on templates and dependencies based on mtime~~
- ~~Matching paths based on index and wildcard patterns~~
- ~~Redirect behavior to canonalize either /foo/ or /foo~~
- ~~Get a callback for providing template locals && optional cache key~~
- ~~Add template data hashing to determine staleness for callback provided locals~~
- tests
- [Get jade modifications for tracking template dependencies accepted upstream](https://github.com/visionmedia/jade/pull/1252)
