..\..\Public\Tools\node-v20.11.0-win-x64\node --max_old_space_size=8192 ..\..\Public\Tools\compile.js

copy /y .\bin\js\bundle.js ..\..\Public\webgame\js\bundle.js
copy /y .\bin\js\bundle.js ..\..\Public\wxgame\js\bundle.js
pause