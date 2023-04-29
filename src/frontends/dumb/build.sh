cd dumb/
rm -fr dumb/
rm -fr views/
rm -fr static/
git clone --depth 1 https://github.com/rramiachraf/dumb
cd dumb/
GOARCH=amd64 GOOS=linux go build
mv dumb ../dumb_linux_x86_64
GOARCH=amd64 GOOS=windows go build
mv dumb.exe ../dumb_windows_x86_64.exe
mv views/ ../
mv static/ ../
cd ../
rm -fr dumb/