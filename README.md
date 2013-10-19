jaded
=====

Static html generator connect middleware for infrequently changing jade templates

TODO
----

- [x] ~~Staleness checking on templates and dependencies based on mtime~~
- [x] ~~Matching paths based on index and wildcard patterns~~
- [x] ~~Redirect behavior to canonalize either /foo/ or /foo~~
- [ ] [Get jade modifications for tracking template dependencies accepted upstream](https://github.com/visionmedia/jade/pull/1252)
- [ ] Add a callback for providing template locals w/ cache key
- [ ] Add template data hashing to determine staleness for callback provided locals

