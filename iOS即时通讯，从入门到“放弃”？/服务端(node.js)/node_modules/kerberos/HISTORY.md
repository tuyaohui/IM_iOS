0.0.22 10-11-2016
-----------------
- Updated nan.h dependency to 2.4.x series for Node 6.8.x or higher.
- The length calculations are off by one meaning it impossible to not set the password (Issue #54, http://www.github.com/tlbdk).

0.0.21 04-28-2016
-----------------
- Updated nan.h dependency to 2.3.x series for Node 6.0.

0.0.20 04-26-2016
-----------------
- Updated nan.h dependency to 2.2.x series.
- Fixed minor compilation warnings due to v8 C++ ABI changes.

0.0.19 03-07-2016
-----------------
- Fix installation error (Issue #1).
- Allow passing down off CANONICALIZE_HOST_NAME and SERVICE_REALM options.

0.0.18 01-19-2016
-----------------
- remove builderror.log.

0.0.17 10-30-2015
-----------------
- Reverted changes in package.json from 0.0.16.

0.0.16 10-26-2015
-----------------
- Removed (exit 0) on build to let correct failure happen.
