cd anonymousoverflow/
rm -fr templates/
rm -fr public/
rm -fr AnonymousOverflow/
git clone --depth 1 https://github.com/httpjamesm/AnonymousOverflow
cd AnonymousOverflow/
GOARCH=amd64 GOOS=linux go build
mv anonymousoverflow ../anonymousoverflow_linux_x86_64
GOARCH=amd64 GOOS=windows go build
mv anonymousoverflow.exe ../anonymousoverflow_windows_x86_64.exe
mv templates/ ../
mv public/ ../
cd ../
rm -fr AnonymousOverflow/