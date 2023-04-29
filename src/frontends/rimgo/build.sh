cd rimgo/
rm -fr rimgo/
git clone --depth 1 https://codeberg.org/video-prize-ranch/rimgo
cd rimgo/
go mod download
GOARCH=amd64 GOOS=linux go build
mv rimgo ../rimgo_linux_x86_64
GOARCH=amd64 GOOS=windows go build
mv rimgo.exe ../rimgo_windows_x86_64.exe
cd ../
rm -fr rimgo/