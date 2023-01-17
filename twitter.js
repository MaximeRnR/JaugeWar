const twitter =  require('twitter-api-v2');
const twitterClient = new twitter.TwitterApi({
      appKey: '',
      appSecret: '',
      accessToken: '',
      accessSecret: ''
   }
);

module.exports = {
   TwitterService: class TwitterService {

      constructor() {
      }


      tweetNewGame(nextColors){
// Tell typescript it's a readonly app
         twitterClient.v2.tweet(`(Test) Prochaine JaugeWar dans 1 minutes #JaugeWar https://jauge-war.herokuapp.com ${nextColors.bottomColorHex} VS ${nextColors.topColorHex}`)
            .then(() => console.log("new game tweet done"))
            .catch(err => console.log(err));
      }
   }
}
