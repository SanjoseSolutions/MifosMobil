try:
	ionic serve --lab

resources:
	ionic resources

emulate:
	ionic emulate

build:
	ionic build android

install: platforms/android/build/outputs/apk/android-debug.apk
	scp platforms/android/build/outputs/apk/android-debug.apk mail:/usr/share/nginx/kmayra.org/targets/kmayra-v0.96-beta1.apk

upload: platforms/android/build/outputs/apk/android-debug.apk
	scp platforms/android/build/outputs/apk/android-debug.apk kmayra:/usr/share/nginx/kmayraApp/testing

deploy:
	rsync -a hooks plugins scss www .bowerrc .editorconfig .gitignore LICENSE Makefile README.md bower.json config.xml gulpfile.js ionic.project package.json kmayra:/usr/local/src/MifosMobil
