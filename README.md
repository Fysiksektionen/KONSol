# KONSol

En express-app för att manuellt styra skärmen i Konsulatet.

## Installation
Kör följande kommandon i den mappen du vill ha projektet.

    $ git clone https://github.com/Acksell/KONSol.git
    $ cd KONSol
    $ npm install

## Användning

För att använda Instagram-OAuth måste du först skapa en app på 
https://www.instagram.com/developer/clients/manage/. Som `redirect_uri` i registreringen måste 
du ange urlen där applikationen hostas med `/callback` tillagt. Per default vill du ha http://localhost:8888/callback.

Efter skapandet exporterar du det `CLIENT_ID` och `CLIENT_SECRET` som du ser på samma sida:

    $ export INSTAGRAM_CLIENT_ID=clientidgoeshere
    $ export INSTAGRAM_CLIENT_SECRET=makesureyoudontusequotes

Nu kan du starta servern med 

    $ npm start

