jaded
=====

Static html generator connect middleware for infrequently changing jade templates

This to in no way shape or form ready for use.

So what's left before it's even worth trying?

* ~~Get staleness checking based on mtime~~
* Get jade modifications for tracking template dependencies accepted upstream
* Add a callback for providing template locals
* Add template data hashing to determine staleness based on data changes
* remove all the local testing junk (i.e. node_modules, etc.)
