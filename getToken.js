const { google } = require("googleapis");

const oAuth2Client = new google.auth.OAuth2(
  "342834305220-p2dnjfr30kg7ilffmcdjtaasm5fnul8e.apps.googleusercontent.com",
  "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",
  "http://localhost"
);

oAuth2Client.getToken(
  "4/0Aci98E_7Uxost_MpvW8b_WLYWOYrxrKZLJGK1KKZyLsvjx38H8baKca1bZSRzgQ47LA29A",
  (err, token) => {
    if (err) return console.error(err);
    console.log(token);
  }
);