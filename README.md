# Browser_RTS
trying to build a browser rts game

reda log
old nodejs
fix
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc
nvm install 20
nvm use 20
nvm alias default 20

cd /home/mel-jira/goinfre/Browser_RTS
e1r10p12% npm create vite@latest rts-client -- --template react-ts

everytime i will clone the project again i will run
npm install
to add the node_mdules because they are ignored and not pushed


also for the backend
python3 -m venv venv

then active it
source venv/bin/activate

pip install django
pip install --upgrade pip
pip install channels channels_redis

then i create the project with

django-admin startproject backend .

then create the game app
python manage.py startapp game

and do the migration
python manage.py migrate

then start it with

python manage.py runserver

